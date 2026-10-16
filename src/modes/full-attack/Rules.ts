import type { GameState, Puck, Side } from '../../engine/types';
import { isOnSide } from '../../engine/Sides';
import { PLAYING, type Outcome } from '../Types';

/**
 * Gana quien deja su mitad completamente vacía: cuentan TODOS los discos, de cualquier
 * color, así que también hay que devolver los que mande el rival. Es por posición, no
 * por velocidad: se evalúa en cada cuadro, igual que en el clásico.
 */
export function evaluateFullAttack(state: GameState): Outcome {
  let bottom = 0;
  let top = 0;
  for (const puck of state.pucks) {
    if (isOnSide(puck.pos, 'bottom', state.board)) bottom++;
    else if (isOnSide(puck.pos, 'top', state.board)) top++;
  }

  if (bottom === 0) return { status: 'finished', winner: 'bottom', reason: 'Dejó su mitad completamente vacía' };
  if (top === 0) return { status: 'finished', winner: 'top', reason: 'Dejó su mitad completamente vacía' };
  return PLAYING;
}

/** La propiedad es por posición: cada lado puede mover cualquier disco que esté en su mitad. */
export function canGrabFullAttack(puck: Puck, side: Side, state: GameState): boolean {
  return isOnSide(puck.pos, side, state.board);
}
