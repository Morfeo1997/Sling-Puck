import type { BoardConfig, GameState, Puck, Side, Vec2 } from '../../engine/types';
import { STANDARD_BOARD, makeElastic, makePuckRow } from '../../engine/Layout';
import { BALL_RADIUS, defenseRowY, kickoffSpot } from './Pitch';

export const BALL_ID = 'ball';

/** Mismo tamaño que el tablero estándar, pero sin muro central: la pelota tiene que poder cruzar. */
const FOOTBALL_BOARD: BoardConfig = { ...STANDARD_BOARD, centerWall: null };

const PUCK_RADIUS = 20;
/** Pocas fichas (3–4): hay que decidir cuáles defienden y cuáles atacan. */
const PUCKS_PER_SIDE = 4;

const ELASTIC = {
  marginFromWall: 150,
  captureRadius: 50,
  maxStretch: 220,
  power: 10,
};

/** Un movimiento suave de un disco entre dos puntos (reinicio tras un gol, recuperación de fichas). */
export interface Glide {
  from: Vec2;
  to: Vec2;
  /** GameState.time en que empezó. */
  startedAt: number;
  duration: number;
}

/** Estado propio del Fútbol, guardado en GameState.modeState. */
export interface FootballState {
  /**
   * playing: se juega y corre el reloj. goal: celebración, todo congelado. resetting: los
   * discos y la pelota vuelven a su lugar (el reloj sigue detenido).
   */
  phase: 'playing' | 'goal' | 'resetting';
  /** Goles que metió cada lado. */
  goals: Record<Side, number>;
  /** Segundos efectivamente jugados: solo avanza en la fase 'playing'. */
  playTime: number;
  /** Empate al terminar el tiempo: sigue hasta el primer gol (gol de oro). */
  overtime: boolean;
  phaseStartedAt: number;
  /** Quién recibió el último gol: la pelota arranca de su lado. */
  conceder: Side | null;
  glides: Record<string, Glide>;
  /** Desde cuándo (GameState.time) cada disco está quieto en la mitad rival. */
  restSince: Record<string, number>;
  /** Posición por defecto de cada disco (línea defensiva frente al propio arco). */
  home: Record<string, Vec2>;
}

export function footballState(state: GameState): FootballState {
  if (!state.modeState) throw new Error('footballState: este GameState no es de un partido de Fútbol');
  return state.modeState as FootballState;
}

/** 4 discos por lado en línea frente a su arco, y la pelota en el saque, del lado de uno al azar. */
export function createFootballState(): GameState {
  const board = FOOTBALL_BOARD;
  const pucks: Puck[] = [
    ...makePuckRow(board, {
      owner: 'bottom',
      color: 'white',
      count: PUCKS_PER_SIDE,
      y: defenseRowY('bottom', board),
      radius: PUCK_RADIUS,
    }),
    ...makePuckRow(board, {
      owner: 'top',
      color: 'black',
      count: PUCKS_PER_SIDE,
      y: defenseRowY('top', board),
      radius: PUCK_RADIUS,
    }),
  ];

  const home: Record<string, Vec2> = {};
  for (const puck of pucks) home[puck.id] = { ...puck.pos };

  const kickoffSide: Side = Math.random() < 0.5 ? 'bottom' : 'top';
  pucks.push({
    id: BALL_ID,
    kind: 'ball',
    pos: kickoffSpot(kickoffSide, board),
    vel: { x: 0, y: 0 },
    color: 'white', // solo visual; la dibuja BallView
    owner: null,
    radius: BALL_RADIUS,
    flash: 0,
  });

  const modeState: FootballState = {
    phase: 'playing',
    goals: { bottom: 0, top: 0 },
    playTime: 0,
    overtime: false,
    phaseStartedAt: 0,
    conceder: null,
    glides: {},
    restSince: {},
    home,
  };

  return {
    board,
    time: 0,
    pucks,
    elastics: [makeElastic(board, 'bottom', ELASTIC), makeElastic(board, 'top', ELASTIC)],
    modeState,
  };
}
