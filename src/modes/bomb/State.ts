import type { GameState, Puck, Side } from '../../engine/types';
import { STANDARD_BOARD, makeElastic, makePuckRow } from '../../engine/Layout';

export const BOMB_ID = 'bomb';

const PUCK_RADIUS = 20;
const PUCKS_PER_SIDE = 6;
const ROW_MARGIN_FROM_WALL = 80;
const ELASTIC_MARGIN_FROM_WALL = 150;

const BOMB_RADIUS = 24;
/** A cuánto de la línea media arranca la bomba, ya dentro de la mitad de alguien. */
const BOMB_START_OFFSET = 80;
/** La mecha dura un tiempo al azar en este rango, así no se sabe exactamente cuándo explota. */
const FUSE_MIN_SECONDS = 20;
const FUSE_MAX_SECONDS = 30;

const ELASTIC = {
  marginFromWall: ELASTIC_MARGIN_FROM_WALL,
  captureRadius: 50,
  maxStretch: 220,
  power: 10,
};

/** La bomba es neutral (owner: null) y arranca en una mitad elegida al azar. */
function createBomb(boardWidth: number, boardHeight: number): Puck {
  const startSide: Side = Math.random() < 0.5 ? 'bottom' : 'top';
  const offset = startSide === 'bottom' ? BOMB_START_OFFSET : -BOMB_START_OFFSET;
  return {
    id: BOMB_ID,
    kind: 'bomb',
    pos: { x: boardWidth / 2, y: boardHeight / 2 + offset },
    vel: { x: 0, y: 0 },
    color: 'black', // solo visual; la dibuja BombView
    owner: null,
    radius: BOMB_RADIUS,
    flash: 0,
    // GameState.time arranca en 0, así que esto es "segundos desde que empieza la partida".
    fuseEndsAt: FUSE_MIN_SECONDS + Math.random() * (FUSE_MAX_SECONDS - FUSE_MIN_SECONDS),
  };
}

/** Como el clásico (6 discos por lado), más la bomba en el medio. */
export function createBombState(): GameState {
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
      createBomb(board.width, board.height),
    ],
    elastics: [makeElastic(board, 'bottom', ELASTIC), makeElastic(board, 'top', ELASTIC)],
  };
}
