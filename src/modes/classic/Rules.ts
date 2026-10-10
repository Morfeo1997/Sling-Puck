import type { GameState, Puck, Side } from '../../engine/types';
import { isOnSide } from '../../engine/Sides';
import { PLAYING, type Outcome } from '../Types';

/**
 * Gana quien deja su propia mitad sin discos de los suyos — no importa si hay discos
 * del rival ahí. Es por posición, no por velocidad: se evalúa en cada cuadro.
 */
export function evaluateClassic(state: GameState): Outcome {
  const bottomLeft = state.pucks.filter((p) => p.owner === 'bottom' && isOnSide(p.pos, 'bottom', state.board)).length;
  const topLeft = state.pucks.filter((p) => p.owner === 'top' && isOnSide(p.pos, 'top', state.board)).length;

  if (bottomLeft === 0) return { status: 'finished', winner: 'bottom', reason: 'Limpió su mitad del tablero' };
  if (topLeft === 0) return { status: 'finished', winner: 'top', reason: 'Limpió su mitad del tablero' };
  return PLAYING;
}

/** En el clásico cada lado solo puede mover sus propios discos. */
export function canGrabClassic(puck: Puck, side: Side): boolean {
  return puck.owner === side;
}
