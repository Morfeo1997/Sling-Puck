import type { GameState, Puck, Side, Vec2 } from '../../engine/types';
import { planAimedShot, type AiPlan, type AiTuning } from '../../engine/ai';
import { clampToOwnHalf } from '../../engine/geometry';
import { isOnSide } from '../../engine/sides';
import { constrainFootballCarry, goalCenter } from './pitch';
import { findBall } from './rules';
import { footballState } from './state';

/** Tiros a la pelota: potencia media y puntería con margen de error (acierta ~3 de cada 4). */
const ATTACK_TUNING: AiTuning = { powerMin: 0.45, powerMax: 0.8, lateralSpread: 100 };
/** Velocidad por debajo de la cual un disco propio se considera disponible. */
const IDLE_SPEED = 30;
/** A qué distancia del arco arma la defensa, sobre la línea entre el arco y la pelota. */
const DEFENSE_DISTANCE = 130;
/** Ancho total de dispersión lateral de los defensores. */
const DEFENSE_SPREAD = 140;
/** Si el disco más cercano ya está a esta distancia del punto de defensa, no hace falta moverlo. */
const DEFENSE_TOLERANCE = 35;

/**
 * IA del Fútbol, con dos roles que alterna en cada ciclo:
 *  - defender: reubica un disco sobre la línea entre su arco y la pelota (con algo de azar
 *    lateral, así los defensores se reparten), sin pisar el arco.
 *  - atacar: tira un disco apuntado a la pelota, con margen de error.
 * Defiende más seguido cuando la pelota está de su lado. Durante la celebración de un gol
 * y el reinicio no hace nada. Si el rol elegido no tiene nada útil que hacer, prueba el otro.
 */
export function pickFootballAiAction(
  state: GameState,
  side: Side,
  random: () => number = Math.random
): AiPlan | null {
  const fs = footballState(state);
  if (fs.phase !== 'playing') return null;

  const elastic = state.elastics.find((e) => e.side === side);
  if (!elastic || elastic.loadedPuckId !== null) return null;

  const ball = findBall(state);
  if (!ball) return null;

  const idle = state.pucks.filter(
    (p) =>
      p.kind === 'standard' &&
      p.owner === side &&
      !p.frozen &&
      Math.hypot(p.vel.x, p.vel.y) <= IDLE_SPEED &&
      isOnSide(p.pos, side, state.board)
  );
  if (idle.length === 0) return null;

  const defend = (): AiPlan | null => {
    const goal = goalCenter(side, state.board);
    const dx = ball.pos.x - goal.x;
    const dy = ball.pos.y - goal.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const lateral = (random() - 0.5) * DEFENSE_SPREAD;
    const raw: Vec2 = {
      x: goal.x + ux * DEFENSE_DISTANCE - uy * lateral,
      y: goal.y + uy * DEFENSE_DISTANCE + ux * lateral,
    };
    const radius = idle[0].radius;
    const spot = constrainFootballCarry(clampToOwnHalf(raw, side, state.board, radius), side, state, radius);

    // El disco disponible más cercano al punto: es el que menos camino tiene que hacer.
    let best: Puck = idle[0];
    let bestDist = Infinity;
    for (const puck of idle) {
      const d = Math.hypot(puck.pos.x - spot.x, puck.pos.y - spot.y);
      if (d < bestDist) {
        best = puck;
        bestDist = d;
      }
    }
    if (bestDist < DEFENSE_TOLERANCE) return null; // ese punto ya está cubierto
    return { kind: 'move', puckId: best.id, to: spot };
  };

  const attack = (): AiPlan | null => {
    const puck = idle[Math.floor(random() * idle.length)];
    return planAimedShot(state, side, puck, ball.pos, ATTACK_TUNING, random);
  };

  const ballOnMySide = isOnSide(ball.pos, side, state.board);
  const defendFirst = random() < (ballOnMySide ? 0.6 : 0.25);
  const order = defendFirst ? [defend, attack] : [attack, defend];
  for (const plan of order) {
    const result = plan();
    if (result) return result;
  }
  return null;
}
