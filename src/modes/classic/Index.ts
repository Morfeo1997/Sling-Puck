import type { GameMode } from '../types';
import { pickAiShot } from '../../engine/ai';
import { createClassicState } from './state';
import { evaluateClassic, canGrabClassic } from './rules';

export const classicMode: GameMode = {
  id: 'classic',
  label: 'Clásico',
  description: 'Mandá todos tus discos al lado rival antes que él.',
  createInitialState: createClassicState,
  evaluate: evaluateClassic,
  canGrab: canGrabClassic,
  pickAiShot,
};
