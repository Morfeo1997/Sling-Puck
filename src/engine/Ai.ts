import type { GameState, Side, Vec2 } from './types';
import { clampToMaxStretch } from './Elastic';
import { clampToOwnHalf } from './Geometry';
import { isOnSide } from './Sides';

export interface AiShotPlan {
  puckId: string;
  pouchPos: Vec2;
}

/**
 * Estrategia de IA por defecto: elige uno de los discos propios (sueltos, quietos,
 * todavía en su mitad) y calcula una posición de bolsillo con margen de error en
 * potencia y en puntería lateral — así no dispara siempre perfecto al centro. Es pura:
 * no toca el estado, solo devuelve el plan; quien lo ejecuta (useAiOpponent) muta el
 * engine. Cada modo puede traer su propia estrategia con esta misma firma.
 */
export function pickAiShot(
  state: GameState,
  side: Side,
  random: () => number = Math.random
): AiShotPlan | null {
  const elastic = state.elastics.find((e) => e.side === side);
  if (!elastic || elastic.loadedPuckId !== null) return null;

  const candidates = state.pucks.filter(
    (p) =>
      p.owner === side &&
      !p.frozen &&
      p.vel.x === 0 &&
      p.vel.y === 0 &&
      isOnSide(p.pos, side, state.board)
  );
  if (candidates.length === 0) return null;

  const puck = candidates[Math.floor(random() * candidates.length)];

  // Tira mayormente fuerte hacia su propia pared (para cruzar el tablero), con algo
  // de error: ni siempre al máximo, ni siempre centrado.
  const pullStrength = elastic.maxStretch * (0.55 + random() * 0.4); // 55%–95% del máximo
  const lateralError = (random() - 0.5) * 70; // hasta ±35px de puntería lateral
  const pullSign = side === 'bottom' ? 1 : -1; // "atrás" es hacia la pared propia

  const desired: Vec2 = {
    x: elastic.restPos.x + lateralError,
    y: elastic.restPos.y + pullSign * pullStrength,
  };
  const stretched = clampToMaxStretch(elastic.restPos, desired, elastic.maxStretch);
  const pouchPos = clampToOwnHalf(stretched, side, state.board, puck.radius);

  return { puckId: puck.id, pouchPos };
}
