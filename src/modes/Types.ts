import type { GameState, Puck, Side } from '../engine/types';
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
  canGrab: (puck: Puck, side: Side, state: GameState) => boolean;
  /** Estrategia de la IA para el lado que controla (misma firma que engine/ai.ts). */
  pickAiShot: (state: GameState, side: Side) => AiShotPlan | null;
}
