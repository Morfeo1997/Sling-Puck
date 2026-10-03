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
/** Distancia de la fila de discos a la pared trasera. */
const ROW_MARGIN_FROM_WALL = 80;
/**
 * Distancia del reposo del elástico a la pared trasera. Tiene que ser mayor que
 * ROW_MARGIN_FROM_WALL: así el elástico queda ANTES de la fila de discos (más
 * cerca del centro), dejando espacio real detrás para cargar tensión al tirar
 * hacia la pared, en vez de quedar pegado al borde sin margen.
 */
const ELASTIC_MARGIN_FROM_WALL = 150;
const ANCHOR_SLACK = 24; // cuánto más cerca del centro quedan los anclajes respecto al reposo

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
  const restY = side === 'bottom' ? board.height - ELASTIC_MARGIN_FROM_WALL : ELASTIC_MARGIN_FROM_WALL;
  const anchorY = side === 'bottom' ? restY - ANCHOR_SLACK : restY + ANCHOR_SLACK;
  const cx = board.width / 2;
  return {
    id: `elastic-${color}`,
    color,
    restPos: { x: cx, y: restY },
    pouchPos: { x: cx, y: restY },
    anchorLeft: { x: cx - 40, y: anchorY },
    anchorRight: { x: cx + 40, y: anchorY },
    captureRadius: 50,
    maxStretch: 220,
    power: 10,
    loadedPuckId: null,
  };
}

/** Estado inicial del modo clásico: 6 discos por lado y un elástico por color, delante de la fila. */
export function createClassicState(): GameState {
  const board = CLASSIC_BOARD;
  return {
    board,
    pucks: [
      ...makeRow('white', board.height - ROW_MARGIN_FROM_WALL, board),
      ...makeRow('black', ROW_MARGIN_FROM_WALL, board),
    ],
    elastics: [makeElastic('white', 'bottom', board), makeElastic('black', 'top', board)],
  };
}
