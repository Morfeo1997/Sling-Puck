import type { GameMode } from './types';
import { classicMode } from './rules/Classic';

/**
 * Un modo nuevo se agrega acá (y en su propia página en pages/) — Home.tsx
 * y router.tsx no necesitan tocarse para que aparezca en la navegación.
 */
export const GAME_MODES: GameMode[] = [classicMode];
