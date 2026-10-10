import type { BoardConfig, PuckColor, Side, Vec2 } from './types';

export function oppositeSide(side: Side): Side {
  return side === 'bottom' ? 'top' : 'bottom';
}

/** Color con el que se dibujan los discos de cada lado. */
export const SIDE_COLOR: Record<Side, PuckColor> = { bottom: 'white', top: 'black' };

/** Nombre para mostrar en la UI. */
export const SIDE_LABEL: Record<Side, string> = { bottom: 'Blanco', top: 'Negro' };

/** true si `pos` está estrictamente dentro de la mitad de `side` (la línea media no cuenta para ninguno). */
export function isOnSide(pos: Vec2, side: Side, board: Pick<BoardConfig, 'height'>): boolean {
  const midY = board.height / 2;
  return side === 'bottom' ? pos.y > midY : pos.y < midY;
}
