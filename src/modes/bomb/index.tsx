import type { GameMode } from '../Types';
import { createBombState } from './State';
import { evaluateBomb, canGrabBomb } from './Rules';
import { pickBombAiShot } from './Ai';
import BombView from './BombView';

export const bombMode: GameMode = {
  id: 'bomb',
  label: 'Bomba',
  description: 'Una bomba explota en 20–30 s: pierde quien la tenga en su mitad.',
  createInitialState: createBombState,
  evaluate: evaluateBomb,
  canGrab: canGrabBomb,
  pickAiAction: pickBombAiShot,
  renderPuck: (puck, gameStateRef) =>
    puck.kind === 'bomb' ? <BombView gameStateRef={gameStateRef} puckId={puck.id} /> : null,
  // Deja ver la explosión antes de tapar el tablero con el banner.
  bannerDelayMs: 900,
};
