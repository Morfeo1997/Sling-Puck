import type { GameMode } from './types';
import { classicMode } from './Classic';

/**
 * Un modo nuevo se agrega acá y listo: Home arma su tarjeta y la ruta /:modeId
 * lo encuentra por id, sin tocar el router ni ninguna página.
 */
export const GAME_MODES: GameMode[] = [classicMode];

export function getMode(id: string): GameMode | undefined {
  return GAME_MODES.find((mode) => mode.id === id);
}
