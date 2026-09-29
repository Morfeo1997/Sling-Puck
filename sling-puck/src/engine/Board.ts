import type { BoardConfig, ElasticBand, GameState, Puck, PuckColor } from './types';

export const CLASSIC_BOARD: BoardConfig = {
  width: 480,
  height: 680,
  slotLeft: 160,
  slotRight: 320,
  wallThickness: 14,
};

const PUCK_RADIUS = 20;
const PUCKS_PER_SIDE = 6;

function makeRow(color: PuckColor, y: number, board: BoardConfig): Puck[] {
  return Array.from({ length: PUCKS_PER_SIDE }, (_, i) => ({
    id: `${color}-${i}`,
    pos: { x: (board.width / (PUCKS_PER_SIDE + 1)) * (i + 1), y },
    vel: { x: 0, y: 0 },
    color,
    radius: PUCK_RADIUS,
    flash: 0,
  }));
}

function makeElastic(color: PuckColor, side: 'top' | 'bottom', board: BoardConfig): ElasticBand {
  const restY = side === 'bottom' ? board.height - 20 : 20;
  const anchorY = side === 'bottom' ? board.height : 0;
  const cx = board.width / 2;
  return {
    id: `elastic-${color}`,
    color,
    restPos: { x: cx, y: restY },
    pouchPos: { x: cx, y: restY },
    anchorLeft: { x: cx - 40, y: anchorY },
    anchorRight: { x: cx + 40, y: anchorY },
    captureRadius: 45,
    maxStretch: 260,
    power: 9,
    loadedPuckId: null,
  };
}

/** Estado inicial del modo clásico: 6 discos por lado y un elástico por color, en su pared trasera. */
export function createClassicState(): GameState {
  const board = CLASSIC_BOARD;
  return {
    board,
    pucks: [...makeRow('white', board.height - 60, board), ...makeRow('black', 60, board)],
    elastics: [makeElastic('white', 'bottom', board), makeElastic('black', 'top', board)],
  };
}
