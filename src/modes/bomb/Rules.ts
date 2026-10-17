import type { GameState, Puck, Side } from '../../engine/types';
import { isOnSide, oppositeSide } from '../../engine/Sides';
import { PLAYING, type Outcome } from '../Types';
import { evaluateClassic, canGrabClassic } from '../classic/Rules';

export function findBomb(state: GameState): Puck | undefined {
  return state.pucks.find((p) => p.kind === 'bomb');
}

/**
 * Las reglas del clásico siguen valiendo (la bomba es neutral y no cuenta ahí) y se les
 * suma una segunda forma de perder: si la mecha se agota, pierde quien tenga la bomba en
 * su mitad en ese instante.
 */
export function evaluateBomb(state: GameState): Outcome {
  const classic = evaluateClassic(state);
  if (classic.status === 'finished') return classic;

  const bomb = findBomb(state);
  if (bomb && bomb.fuseEndsAt !== undefined && state.time >= bomb.fuseEndsAt) {
    const holder: Side = bomb.pos.y > state.board.height / 2 ? 'bottom' : 'top';
    return {
      status: 'finished',
      winner: oppositeSide(holder),
      reason: 'La bomba explotó en la mitad del rival',
    };
  }
  return PLAYING;
}

/**
 * Cada lado mueve sus propios discos, y además la bomba cuando está en su mitad: es la
 * única forma de quitársela de encima.
 */
export function canGrabBomb(puck: Puck, side: Side, state: GameState): boolean {
  if (puck.kind === 'bomb') return isOnSide(puck.pos, side, state.board);
  return canGrabClassic(puck, side);
}
