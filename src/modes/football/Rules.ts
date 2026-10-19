import type { GameState, Puck, Side } from '../../engine/types';
import { PLAYING, type Outcome } from '../Types';
import { MATCH_SECONDS } from './Pitch';
import { footballState } from './State';

export function findBall(state: GameState): Puck | undefined {
  return state.pucks.find((p) => p.kind === 'ball');
}

/**
 * Gana quien tenga más goles cuando se agota el tiempo de juego. Si hay empate, sigue hasta
 * el primer gol (gol de oro), así que nunca termina en empate. El reloj (playTime) y la bandera
 * de tiempo extra los lleva updateFootball.
 */
export function evaluateFootball(state: GameState): Outcome {
  const fs = footballState(state);
  if (fs.playTime < MATCH_SECONDS) return PLAYING;

  const { bottom, top } = fs.goals;
  if (bottom === top) return PLAYING;

  return {
    status: 'finished',
    winner: bottom > top ? 'bottom' : 'top',
    reason: fs.overtime ? '¡Gol de oro en el tiempo extra!' : `${bottom}–${top} al final del tiempo`,
  };
}

/** Cada lado mueve solo sus propias fichas; la pelota no se puede agarrar, solo golpear. */
export function canGrabFootball(puck: Puck, side: Side): boolean {
  return puck.kind === 'standard' && puck.owner === side;
}
