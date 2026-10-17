import type { GameState, Side } from '../../engine/types';
import { createPickAiShot, planShot, type AiShotPlan, type AiTuning } from '../../engine/Ai';
import { isOnSide } from '../../engine/Sides';
import { canGrabBomb, findBomb } from './Rules';

/**
 * Con la bomba en juego tira más fuerte que con un disco común. El error lateral está
 * medido: con lateralSpread 100 apunta dentro de la ranura ~74 % de las veces (con 40 o 70
 * no fallaba nunca, y la IA se volvía imbatible con la bomba). Es la perilla de dificultad
 * del modo: más ancho = falla más.
 */
const BOMB_TUNING: AiTuning = { powerMin: 0.8, powerMax: 1, lateralSpread: 100 };
/** Velocidad máxima a la que se anima a agarrar la bomba (más tolerante que el "quieto del todo" estándar). */
const MAX_BOMB_GRAB_SPEED = 60;

const pickStandardShot = createPickAiShot(canGrabBomb);

/**
 * IA del modo Bomba. Si la bomba está en su mitad, es la única prioridad: espera a que se
 * calme lo justo y la tira con más cuidado que a un disco común. Mientras tanto no gasta
 * tiros en otras fichas. Si la bomba está del lado del humano, juega como siempre.
 * Sigue siendo vencible: ~1 de cada 4 tiros no pasa por la ranura, y la IA recién
 * reintenta en su próximo ciclo.
 */
export function pickBombAiShot(
  state: GameState,
  side: Side,
  random: () => number = Math.random
): AiShotPlan | null {
  const elastic = state.elastics.find((e) => e.side === side);
  if (!elastic || elastic.loadedPuckId !== null) return null;

  const bomb = findBomb(state);
  if (bomb && isOnSide(bomb.pos, side, state.board)) {
    if (bomb.frozen || Math.hypot(bomb.vel.x, bomb.vel.y) > MAX_BOMB_GRAB_SPEED) return null;
    return planShot(state, side, bomb, BOMB_TUNING, random);
  }

  return pickStandardShot(state, side, random);
}
