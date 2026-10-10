import type { Vec2, BoardConfig, Side } from './types';

/** Evita que una posición salga del rectángulo del tablero, respetando el radio del disco. */
export function clampToBoard(pos: Vec2, board: Pick<BoardConfig, 'width' | 'height'>, radius: number): Vec2 {
  return {
    x: Math.min(Math.max(pos.x, radius), board.width - radius),
    y: Math.min(Math.max(pos.y, radius), board.height - radius),
  };
}

/**
 * Igual que clampToBoard, pero además no deja que la posición cruce la línea media:
 * lo que controla el lado de abajo nunca puede quedar (ni de paso, mientras se lo
 * arrastra o se carga el elástico) del lado de arriba, y viceversa. La única forma
 * real de cruzar la ranura pasa a ser disparar.
 */
export function clampToOwnHalf(
  pos: Vec2,
  side: Side,
  board: Pick<BoardConfig, 'width' | 'height'>,
  radius: number
): Vec2 {
  const midY = board.height / 2;
  const x = Math.min(Math.max(pos.x, radius), board.width - radius);
  const y =
    side === 'bottom'
      ? Math.min(Math.max(pos.y, midY + radius), board.height - radius)
      : Math.min(Math.max(pos.y, radius), midY - radius);
  return { x, y };
}
