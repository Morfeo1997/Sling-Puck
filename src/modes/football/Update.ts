import type { GameState, Side } from '../../engine/types';
import { isOnSide, oppositeSide } from '../../engine/Sides';
import { NO_EVENTS, type GameEvent } from '../Types';
import { MATCH_SECONDS, isInGoal, kickoffSpot } from './Pitch';
import { findBall } from './Rules';
import { footballState, type FootballState } from './State';

/** Cuánto dura la celebración de un gol (todo congelado). */
export const GOAL_PAUSE_SECONDS = 1.6;
/** Cuánto tardan los discos y la pelota en volver a su lugar después de la celebración. */
export const RESET_GLIDE_SECONDS = 0.8;

/**
 * Con 4 fichas por lado, las que cruzan al otro lado y quedan ahí (el rival no las puede
 * mover) te dejarían sin juego en medio minuto. Si está activo, una ficha propia que queda
 * quieta en la mitad rival vuelve sola a su lugar. Ponelo en false si preferís que queden
 * como obstáculos hasta el próximo gol.
 */
const RECALL_STRAY_PUCKS = true;
const RECALL_DELAY_SECONDS = 1.2;
const RECALL_GLIDE_SECONDS = 0.6;
const RECALL_MAX_SPEED = 25;

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/** Avanza todos los movimientos suaves en curso; al terminar uno, suelta el disco. */
function processGlides(state: GameState, fs: FootballState): void {
  for (const id of Object.keys(fs.glides)) {
    const glide = fs.glides[id];
    const puck = state.pucks.find((p) => p.id === id);
    if (!puck) {
      delete fs.glides[id];
      continue;
    }
    const t = Math.min(1, (state.time - glide.startedAt) / glide.duration);
    const k = easeInOut(t);
    puck.pos.x = glide.from.x + (glide.to.x - glide.from.x) * k;
    puck.pos.y = glide.from.y + (glide.to.y - glide.from.y) * k;
    puck.vel.x = 0;
    puck.vel.y = 0;
    puck.frozen = true;
    if (t >= 1) {
      puck.frozen = false;
      delete fs.glides[id];
    }
  }
}

function scoreGoal(state: GameState, fs: FootballState, defender: Side): GameEvent[] {
  const scorer = oppositeSide(defender);
  fs.phase = 'goal';
  fs.phaseStartedAt = state.time;
  fs.goals[scorer] += 1;
  fs.conceder = defender;
  fs.glides = {};
  fs.restSince = {};

  // Se congela todo: nadie puede agarrar ni mover nada durante la celebración.
  for (const puck of state.pucks) {
    puck.vel.x = 0;
    puck.vel.y = 0;
    puck.frozen = true;
  }
  // Lo que alguien tenía cargado en un elástico queda suelto.
  for (const elastic of state.elastics) {
    elastic.loadedPuckId = null;
    elastic.pouchPos = { ...elastic.restPos };
  }

  return [{ type: 'cancel-interactions' }, { type: 'goal', scorer }];
}

/** Fin de la celebración: cada disco vuelve a su lugar y la pelota al lado de quien recibió el gol. */
function startReset(state: GameState, fs: FootballState): void {
  fs.phase = 'resetting';
  fs.glides = {};
  for (const puck of state.pucks) {
    const to =
      puck.kind === 'ball' && fs.conceder ? kickoffSpot(fs.conceder, state.board) : fs.home[puck.id];
    if (!to) continue;
    fs.glides[puck.id] = {
      from: { ...puck.pos },
      to: { ...to },
      startedAt: state.time,
      duration: RESET_GLIDE_SECONDS,
    };
  }
}

/** Las fichas propias que quedan quietas en la mitad rival vuelven solas a su lugar. */
function recallStrayPucks(state: GameState, fs: FootballState): void {
  if (!RECALL_STRAY_PUCKS) return;
  for (const puck of state.pucks) {
    if (puck.kind !== 'standard' || puck.owner === null || puck.frozen) {
      delete fs.restSince[puck.id];
      continue;
    }
    const strayed = isOnSide(puck.pos, oppositeSide(puck.owner), state.board);
    const slow = Math.hypot(puck.vel.x, puck.vel.y) < RECALL_MAX_SPEED;
    if (!strayed || !slow) {
      delete fs.restSince[puck.id];
      continue;
    }
    if (fs.restSince[puck.id] === undefined) fs.restSince[puck.id] = state.time;
    if (state.time - fs.restSince[puck.id] < RECALL_DELAY_SECONDS) continue;

    delete fs.restSince[puck.id];
    const home = fs.home[puck.id];
    if (!home) continue;
    puck.vel.x = 0;
    puck.vel.y = 0;
    puck.frozen = true;
    fs.glides[puck.id] = {
      from: { ...puck.pos },
      to: { ...home },
      startedAt: state.time,
      duration: RECALL_GLIDE_SECONDS,
    };
  }
}

/**
 * Lógica por cuadro del Fútbol: reloj, detección de goles, celebración y reinicio, y
 * recuperación de fichas. Se llama después de la física (la pelota ya se movió) y antes de
 * evaluateFootball.
 */
export function updateFootball(state: GameState, dt: number): readonly GameEvent[] {
  const fs = footballState(state);

  processGlides(state, fs);

  if (fs.phase === 'goal') {
    if (state.time - fs.phaseStartedAt >= GOAL_PAUSE_SECONDS) startReset(state, fs);
    return NO_EVENTS;
  }

  if (fs.phase === 'resetting') {
    if (Object.keys(fs.glides).length === 0) fs.phase = 'playing';
    return NO_EVENTS;
  }

  // phase === 'playing'
  fs.playTime += dt;
  if (!fs.overtime && fs.playTime >= MATCH_SECONDS && fs.goals.bottom === fs.goals.top) {
    fs.overtime = true;
  }

  const ball = findBall(state);
  if (ball) {
    const sides: Side[] = ['bottom', 'top'];
    for (const defender of sides) {
      if (isInGoal(ball.pos, defender, state.board)) return scoreGoal(state, fs, defender);
    }
  }

  recallStrayPucks(state, fs);
  return NO_EVENTS;
}
