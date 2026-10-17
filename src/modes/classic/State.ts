import type { GameState } from '../../engine/types';
import { STANDARD_BOARD, makeElastic, makePuckRow } from '../../engine/Layout';

const PUCK_RADIUS = 20;
const PUCKS_PER_SIDE = 6;
/** Distancia de la fila de discos a la pared trasera. */
const ROW_MARGIN_FROM_WALL = 80;
/** Mayor que ROW_MARGIN_FROM_WALL: el elástico queda antes de la fila, con espacio para cargar tensión. */
const ELASTIC_MARGIN_FROM_WALL = 150;

// Valores de feel del elástico: es acá donde se ajusta la potencia del modo clásico.
const ELASTIC = {
  marginFromWall: ELASTIC_MARGIN_FROM_WALL,
  captureRadius: 50,
  maxStretch: 220,
  power: 10,
};

/** 6 discos por lado (cada uno es de su lado) y un elástico por lado, delante de la fila. */
export function createClassicState(): GameState {
  const board = STANDARD_BOARD;
  return {
    board,
    time: 0,
    pucks: [
      ...makePuckRow(board, {
        owner: 'bottom',
        color: 'white',
        count: PUCKS_PER_SIDE,
        y: board.height - ROW_MARGIN_FROM_WALL,
        radius: PUCK_RADIUS,
      }),
      ...makePuckRow(board, {
        owner: 'top',
        color: 'black',
        count: PUCKS_PER_SIDE,
        y: ROW_MARGIN_FROM_WALL,
        radius: PUCK_RADIUS,
      }),
    ],
    elastics: [makeElastic(board, 'bottom', ELASTIC), makeElastic(board, 'top', ELASTIC)],
  };
}
