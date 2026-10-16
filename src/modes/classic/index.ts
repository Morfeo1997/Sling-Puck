import type { GameMode } from '../Types';
import { pickAiShot } from '../../engine/Ai';
import { createClassicState } from './State';
import { evaluateClassic, canGrabClassic } from './Rules';

export const classicMode: GameMode = {
  id: 'classic',
  label: 'Clásico',
  description: 'Mandá todos tus discos al lado rival antes que él.',
  createInitialState: createClassicState,
  evaluate: evaluateClassic,
  canGrab: canGrabClassic,
  pickAiShot,
};
