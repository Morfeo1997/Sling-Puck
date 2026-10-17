import type { GameState } from '../../engine/types';
import { STANDARD_BOARD, makeElastic, makePuckRow } from '../../engine/Layout';

const PUCK_RADIUS = 20;
/** Perilla principal del ritmo: más discos por lado = partidas más largas. */
const PUCKS_PER_SIDE = 6;
const ROW_MARGIN_FROM_WALL = 80;
const ELASTIC_MARGIN_FROM_WALL = 150;

const ELASTIC = {
  marginFromWall: ELASTIC_MARGIN_FROM_WALL,
  captureRadius: 50,
  maxStretch: 220,
  power: 10,
};

/**
 * Mismo tablero y disposición que el clásico, pero los discos son neutrales
 * (owner: null): los mueve quien los tenga en su mitad, sea del color que sea.
 */
export function createFullAttackState(): GameState {
  const board = STANDARD_BOARD;
  return {
    board,
    time: 0,
    pucks: [
      ...makePuckRow(board, {
        owner: null,
        color: 'white',
        count: PUCKS_PER_SIDE,
        y: board.height - ROW_MARGIN_FROM_WALL,
        radius: PUCK_RADIUS,
      }),
      ...makePuckRow(board, {
        owner: null,
        color: 'black',
        count: PUCKS_PER_SIDE,
        y: ROW_MARGIN_FROM_WALL,
        radius: PUCK_RADIUS,
      }),
    ],
    elastics: [makeElastic(board, 'bottom', ELASTIC), makeElastic(board, 'top', ELASTIC)],
  };
}
