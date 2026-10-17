import type { GameMode } from '../Types';
import { createPickAiShot } from '../../engine/Ai';
import { createFullAttackState } from './State';
import { evaluateFullAttack, canGrabFullAttack } from './Rules';

export const fullAttackMode: GameMode = {
  id: 'full-attack',
  label: 'Ataque completo',
  description: 'Vaciá tu mitad: también tenés que devolver los discos que te manden.',
  createInitialState: createFullAttackState,
  evaluate: evaluateFullAttack,
  canGrab: canGrabFullAttack,
  pickAiShot: createPickAiShot(canGrabFullAttack),
};
