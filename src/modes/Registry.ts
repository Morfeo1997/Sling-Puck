import type { GameMode } from './Types';
import { classicMode } from './classic';
import { fullAttackMode } from './full-attack';
import { bombMode } from './bomb';

/**
 * Un modo nuevo se agrega acá y listo: Home arma su tarjeta y la ruta /:modeId
 * lo encuentra por id, sin tocar el router ni ninguna página.
 */
export const GAME_MODES: GameMode[] = [classicMode, fullAttackMode, bombMode];

export function getMode(id: string): GameMode | undefined {
  return GAME_MODES.find((mode) => mode.id === id);
}
