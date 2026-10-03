import type { GameMode, GameState, PuckColor } from '../types';
import { createClassicState } from '../Board';

/**
 * Gana quien deja su propia mitad del tablero sin discos de su color — no importa
 * si hay discos del rival ahí. Se llama desde onSettle, cuando el engine confirma
 * que ya no queda nada en movimiento (ver useGameLoop).
 */
export function checkWin(state: GameState): PuckColor | null {
  const midY = state.board.height / 2;
  const whiteLeft = state.pucks.filter((p) => p.color === 'white' && p.pos.y > midY).length;
  const blackLeft = state.pucks.filter((p) => p.color === 'black' && p.pos.y < midY).length;

  if (whiteLeft === 0) return 'white';
  if (blackLeft === 0) return 'black';
  return null;
}

export const classicMode: GameMode = {
  id: 'classic',
  label: 'Clásico',
  initialState: createClassicState,
  checkWin,
};
