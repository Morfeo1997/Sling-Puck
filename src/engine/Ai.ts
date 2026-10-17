import type { GameState, GrabRule, Puck, Side, Vec2 } from './types';
import { clampToMaxStretch } from './Elastic';
import { clampToOwnHalf } from './Geometry';
import { isOnSide } from './Sides';

export interface AiShotPlan {
  puckId: string;
  pouchPos: Vec2;
}

/** Qué tan bien apunta y cuánta fuerza usa la IA. Un modo puede ajustarlo por tipo de disparo. */
export interface AiTuning {
  /** Rango de potencia, como fracción del estiramiento máximo del elástico. */
  powerMin: number;
  powerMax: number;
  /** Ancho total (en px) del error lateral de puntería: ±lateralSpread/2. */
  lateralSpread: number;
}

export const DEFAULT_AI_TUNING: AiTuning = { powerMin: 0.55, powerMax: 0.95, lateralSpread: 70 };

/**
 * Calcula un tiro de `puck` desde el elástico de `side`, con margen de error en potencia y
 * en puntería lateral. Es pura: no toca el estado, solo devuelve el plan; quien lo ejecuta
 * (useAiOpponent) muta el engine.
 */
export function planShot(
  state: GameState,
  side: Side,
  puck: Puck,
  tuning: AiTuning = DEFAULT_AI_TUNING,
  random: () => number = Math.random
): AiShotPlan | null {
  const elastic = state.elastics.find((e) => e.side === side);
  if (!elastic) return null;

  const pullStrength = elastic.maxStretch * (tuning.powerMin + random() * (tuning.powerMax - tuning.powerMin));
  const lateralError = (random() - 0.5) * tuning.lateralSpread;
  const pullSign = side === 'bottom' ? 1 : -1; // "atrás" es hacia la pared propia

  const desired: Vec2 = {
    x: elastic.restPos.x + lateralError,
    y: elastic.restPos.y + pullSign * pullStrength,
  };
  const stretched = clampToMaxStretch(elastic.restPos, desired, elastic.maxStretch);
  const pouchPos = clampToOwnHalf(stretched, side, state.board, puck.radius);

  return { puckId: puck.id, pouchPos };
}

/**
 * Arma la estrategia de IA estándar para un modo, a partir de SU regla de propiedad
 * (la misma que usa el jugador humano — así IA y jugador nunca discrepan sobre qué se
 * puede mover). Elige al azar uno de los discos que puede mover (sueltos, quietos, en su
 * mitad) y lo tira con planShot. Un modo con necesidades especiales (como la bomba)
 * escribe su propia estrategia con la misma firma, reutilizando planShot.
 */
export function createPickAiShot(canGrab: GrabRule, tuning: AiTuning = DEFAULT_AI_TUNING) {
  return function pickAiShot(
    state: GameState,
    side: Side,
    random: () => number = Math.random
  ): AiShotPlan | null {
    const elastic = state.elastics.find((e) => e.side === side);
    if (!elastic || elastic.loadedPuckId !== null) return null;

    const candidates = state.pucks.filter(
      (p) =>
        canGrab(p, side, state) &&
        !p.frozen &&
        p.vel.x === 0 &&
        p.vel.y === 0 &&
        isOnSide(p.pos, side, state.board)
    );
    if (candidates.length === 0) return null;

    const puck = candidates[Math.floor(random() * candidates.length)];
    return planShot(state, side, puck, tuning, random);
  };
}
