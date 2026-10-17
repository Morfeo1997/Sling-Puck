import type { MutableRefObject, ReactElement } from 'react';
import type { GameState, GrabRule, Puck, Side } from '../engine/types';
import type { AiShotPlan } from '../engine/Ai';

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
  /** Estrategia de la IA para el lado que controla (ver createPickAiShot en engine/ai.ts). */
  pickAiShot: (state: GameState, side: Side) => AiShotPlan | null;
  /**
   * Vista propia para ciertos discos (por ejemplo la bomba). Recibe el ref del estado para
   * poder animarse por su cuenta, sin re-renders. Devolver null usa el disco estándar.
   */
  renderPuck?: (puck: Puck, gameStateRef: MutableRefObject<GameState>) => ReactElement | null;
  /** Demora (ms) entre que termina la partida y aparece el banner: deja ver la animación final. */
  bannerDelayMs?: number;
}
