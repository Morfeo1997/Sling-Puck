import type { BoardConfig, GameState, Side, Vec2 } from '../../engine/types';

/** Duración del partido, en segundos de juego (el reloj se detiene durante la celebración de un gol). */
export const MATCH_SECONDS = 120;

/** El arco es más ancho que lo que 3–4 fichas pueden tapar (4 fichas ≈ 160 de los 480 del ancho). */
export const GOAL_WIDTH = 200;
/** Profundidad del arco: la pelota cuenta como gol cuando su centro entra en esta franja. */
export const GOAL_DEPTH = 34;
export const BALL_RADIUS = 17;
/** Distancia a la línea media de la pelota en cada saque. */
export const KICKOFF_OFFSET = 90;
/** Distancia de la línea defensiva por defecto a la pared trasera. */
export const DEFENSE_ROW_MARGIN = 90;

type Dim = Pick<BoardConfig, 'width' | 'height'>;

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** El arco que defiende `side`: pegado a su pared trasera y centrado. */
export function goalRect(side: Side, board: Dim): Rect {
  return {
    x: (board.width - GOAL_WIDTH) / 2,
    y: side === 'bottom' ? board.height - GOAL_DEPTH : 0,
    width: GOAL_WIDTH,
    height: GOAL_DEPTH,
  };
}

/** ¿Está `pos` dentro del arco que defiende `side`? */
export function isInGoal(pos: Vec2, side: Side, board: Dim): boolean {
  const g = goalRect(side, board);
  return pos.x >= g.x && pos.x <= g.x + g.width && pos.y >= g.y && pos.y <= g.y + g.height;
}

/** Centro de la boca del arco de `side`, sobre su pared trasera. */
export function goalCenter(side: Side, board: Dim): Vec2 {
  return { x: board.width / 2, y: side === 'bottom' ? board.height : 0 };
}

/** Dónde se pone la pelota en el saque: en la mitad de `side`, a la altura de la línea media ± KICKOFF_OFFSET. */
export function kickoffSpot(side: Side, board: Dim): Vec2 {
  return { x: board.width / 2, y: board.height / 2 + (side === 'bottom' ? KICKOFF_OFFSET : -KICKOFF_OFFSET) };
}

/** Altura de la línea defensiva por defecto de `side`. */
export function defenseRowY(side: Side, board: Dim): number {
  return side === 'bottom' ? board.height - DEFENSE_ROW_MARGIN : DEFENSE_ROW_MARGIN;
}

/**
 * Un disco llevado a mano no se puede soltar dentro del arco propio ni pegado a él:
 * si no, tapar el arco con fichas sería la defensa perfecta.
 */
export function constrainFootballCarry(pos: Vec2, side: Side, state: GameState, radius: number): Vec2 {
  const g = goalRect(side, state.board);
  const insideX = pos.x > g.x - radius && pos.x < g.x + g.width + radius;
  if (!insideX) return pos;
  return side === 'bottom'
    ? { x: pos.x, y: Math.min(pos.y, g.y - radius) }
    : { x: pos.x, y: Math.max(pos.y, g.y + g.height + radius) };
}
