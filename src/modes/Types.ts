import type { MutableRefObject, ReactElement } from 'react';
import type { GameState, GrabRule, Puck, Side, Vec2 } from '../engine/types';
import type { AiPlan } from '../engine/Ai';

export type Outcome =
  | { status: 'playing' }
  | {
      status: 'finished';
      winner: Side;
      /** Texto corto para el banner de victoria (por qué ganó). */
      reason?: string;
    };

export type FinishedOutcome = Extract<Outcome, { status: 'finished' }>;

/** Instancia compartida para no crear un objeto nuevo en cada cuadro mientras la partida sigue. */
export const PLAYING: Outcome = { status: 'playing' };

/**
 * Cosas que un modo le avisa a la pantalla en un cuadro. Es el embrión de la capa de
 * eventos: más adelante es donde se enganchan los sonidos (gol, explosión…).
 */
export type GameEvent =
  /**
   * El modo congeló o reinició el tablero por su cuenta: hay que soltar lo que el jugador
   * tenía agarrado y cancelar lo que la IA estaba haciendo. El modo deja los discos y
   * elásticos en su estado final.
   */
  | { type: 'cancel-interactions' }
  | { type: 'goal'; scorer: Side };

/** Instancia compartida para "no pasó nada en este cuadro". */
export const NO_EVENTS: readonly GameEvent[] = [];

/**
 * Contrato de un modo de juego. Home, el router y Board solo conocen esta interfaz:
 * agregar un modo es crear su carpeta en modes/ y registrarlo en registry.ts.
 */
export interface GameMode {
  id: string;
  label: string;
  /** Una línea para la tarjeta del Home. */
  description: string;
  /** Estado inicial de una partida (se vuelve a llamar en cada "Jugar de nuevo"). */
  createInitialState: () => GameState;
  /** Se evalúa en cada cuadro. Devolver PLAYING mientras la partida sigue. */
  evaluate: (state: GameState) => Outcome;
  /** Propiedad: ¿puede este lado cargar y disparar este disco? */
  canGrab: GrabRule;
  /**
   * Qué hace la IA del lado que controla en cada ciclo: disparar un disco o reubicarlo
   * (ver createPickAiShot y planAimedShot en engine/ai.ts). null = no hace nada este ciclo.
   */
  pickAiAction: (state: GameState, side: Side) => AiPlan | null;
  /** Cada cuánto actúa la IA, en ms. Por defecto 2000. */
  aiIntervalMs?: number;
  /**
   * Lógica por cuadro del modo (fases, reloj propio, goles…), después de la física y antes
   * de evaluate. Recibe los segundos reales del cuadro. Puede mutar el estado.
   */
  update?: (state: GameState, dt: number) => readonly GameEvent[];
  /**
   * Restricción extra sobre dónde se puede soltar un disco llevado a mano, además de la
   * mitad propia (por ejemplo, que no se pueda tapar el arco).
   */
  constrainCarry?: (pos: Vec2, side: Side, state: GameState, radius: number) => Vec2;
  /**
   * Vista propia para ciertos discos (la bomba, la pelota). Recibe el ref del estado para
   * poder animarse por su cuenta, sin re-renders. Devolver null usa el disco estándar.
   */
  renderPuck?: (puck: Puck, gameStateRef: MutableRefObject<GameState>) => ReactElement | null;
  /** Capa dibujada sobre el tablero y debajo de los discos (el arco, las marcas de la cancha). */
  renderBoardLayer?: (gameStateRef: MutableRefObject<GameState>) => ReactElement | null;
  /** Barra propia del modo sobre el tablero (por ejemplo, goles y cronómetro). */
  renderHud?: (gameStateRef: MutableRefObject<GameState>) => ReactElement | null;
  /** Demora (ms) entre que termina la partida y aparece el banner: deja ver la animación final. */
  bannerDelayMs?: number;
}
