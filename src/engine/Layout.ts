import type { BoardConfig, ElasticBand, Puck, PuckColor, Side } from './types';

interface PuckRowOptions {
  side: Side;
  color: PuckColor;
  count: number;
  /** Altura (y) de la fila. */
  y: number;
  radius: number;
}

/** Fila de discos repartidos a lo ancho del tablero. Los ids son `${color}-${n}`. */
export function makePuckRow(board: BoardConfig, { side, color, count, y, radius }: PuckRowOptions): Puck[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${color}-${i}`,
    pos: { x: (board.width / (count + 1)) * (i + 1), y },
    vel: { x: 0, y: 0 },
    color,
    owner: side,
    radius,
    flash: 0,
  }));
}

interface ElasticOptions {
  /**
   * Distancia del reposo del bolsillo a la pared trasera de su lado. Conviene que sea
   * mayor que la de la fila de discos: así el elástico queda antes de la fila y hay
   * espacio real detrás para cargar tensión.
   */
  marginFromWall: number;
  captureRadius: number;
  maxStretch: number;
  power: number;
  /** Cuánto más cerca del centro que el reposo quedan los anclajes. */
  anchorSlack?: number;
}

const ANCHOR_HALF_WIDTH = 40;
const DEFAULT_ANCHOR_SLACK = 24;

/** Elástico centrado en el ancho del tablero, en la mitad de `side`. Su id es `elastic-${side}`. */
export function makeElastic(
  board: BoardConfig,
  side: Side,
  { marginFromWall, captureRadius, maxStretch, power, anchorSlack = DEFAULT_ANCHOR_SLACK }: ElasticOptions
): ElasticBand {
  const restY = side === 'bottom' ? board.height - marginFromWall : marginFromWall;
  // Los anclajes quedan más cerca del centro que el reposo: al tirar hacia la pared el
  // bolsillo se aleja de ellos y la banda se estira, en vez de aflojarse.
  const anchorY = side === 'bottom' ? restY - anchorSlack : restY + anchorSlack;
  const cx = board.width / 2;
  return {
    id: `elastic-${side}`,
    side,
    restPos: { x: cx, y: restY },
    pouchPos: { x: cx, y: restY },
    anchorLeft: { x: cx - ANCHOR_HALF_WIDTH, y: anchorY },
    anchorRight: { x: cx + ANCHOR_HALF_WIDTH, y: anchorY },
    captureRadius,
    maxStretch,
    power,
    loadedPuckId: null,
  };
}
