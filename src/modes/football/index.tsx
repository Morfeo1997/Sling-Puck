import type { GameMode } from '../Types';
import { createFootballState } from './State';
import { evaluateFootball, canGrabFootball } from './Rules';
import { updateFootball } from './Update';
import { pickFootballAiAction } from './Ai';
import { constrainFootballCarry } from './Pitch';
import BallView from './BallView';
import GoalsView from './GoalsView';
import FootballHud from './FootballHud';

export const footballMode: GameMode = {
  id: 'football',
  label: 'Fútbol',
  description: 'Meté la pelota en el arco rival: gana quien tenga más goles en 2 minutos.',
  createInitialState: createFootballState,
  evaluate: evaluateFootball,
  canGrab: canGrabFootball,
  pickAiAction: pickFootballAiAction,
  // Más ágil que el resto: en el fútbol hay que reubicar fichas todo el tiempo.
  aiIntervalMs: 1500,
  update: updateFootball,
  constrainCarry: constrainFootballCarry,
  renderPuck: (puck) => (puck.kind === 'ball' ? <BallView /> : null),
  renderBoardLayer: (gameStateRef) => <GoalsView gameStateRef={gameStateRef} />,
  renderHud: (gameStateRef) => <FootballHud gameStateRef={gameStateRef} />,
};
