import type { GameState, GrabRule, Puck, Side, Vec2 } from './types';
import { clampToMaxStretch } from './Elastic';
import { clampToOwnHalf } from './Geometry';
import { isOnSide } from './Sides';
import { DEFAULT_PHYSICS } from './Physics';

/** Disparar un disco: se lo lleva al bolsillo estirado en `pouchPos` y se lo suelta. */
export interface AiShotPlan {
  kind: 'shot';
  puckId: string;
  pouchPos: Vec2;
}

/** Reubicar un disco sin dispararlo (por ejemplo, para armar una defensa). */
export interface AiMovePlan {
  kind: 'move';
  puckId: string;
  to: Vec2;
}

export type AiPlan = AiShotPlan | AiMovePlan;

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

  return { kind: 'shot', puckId: puck.id, pouchPos };
}

/** Estiramiento mínimo para que valga la pena disparar (por debajo, el tiro sale sin fuerza). */
const MIN_AIMED_PULL = 25;

/**
 * Tiro apuntado a un punto del tablero (por ejemplo, la pelota). El disco sale del bolsillo
 * en línea recta hacia donde apunta (reposo − bolsillo), así que para pegarle a `target`
 * el bolsillo tiene que quedar sobre la recta que une el objetivo con el reposo, del lado
 * de atrás. `tuning.lateralSpread` es el error de puntería (en px) en el punto de impacto,
 * perpendicular a la línea de tiro. La potencia se ajusta para que el disco llegue (según
 * la fricción del motor) sin pasarse del estiramiento máximo, y siempre se mantiene el
 * bolsillo dentro de la mitad propia sin deformar la línea de tiro.
 */
export function planAimedShot(
  state: GameState,
  side: Side,
  puck: Puck,
  target: Vec2,
  tuning: AiTuning = DEFAULT_AI_TUNING,
  random: () => number = Math.random
): AiShotPlan | null {
  const elastic = state.elastics.find((e) => e.side === side);
  if (!elastic) return null;
  const { restPos, maxStretch, power } = elastic;

  const dx0 = target.x - restPos.x;
  const dy0 = target.y - restPos.y;
  const dist = Math.hypot(dx0, dy0);
  if (dist < 1) return null;

  // Error de puntería: se corre el objetivo perpendicularmente a la línea de tiro.
  const noise = (random() - 0.5) * tuning.lateralSpread;
  const tx = target.x + (-dy0 / dist) * noise;
  const ty = target.y + (dx0 / dist) * noise;
  const dx = tx - restPos.x;
  const dy = ty - restPos.y;
  const aimDist = Math.hypot(dx, dy);
  if (aimDist < 1) return null;
  const ux = dx / aimDist;
  const uy = dy / aimDist;

  // Distancia que recorre un disco por cada unidad de estiramiento (fricción geométrica por cuadro).
  const reachPerStretch = power / (60 * (1 - DEFAULT_PHYSICS.friction));
  const needed = (dist / reachPerStretch) * 1.3;
  let s = Math.max(maxStretch * (tuning.powerMin + random() * (tuning.powerMax - tuning.powerMin)), needed);
  s = Math.min(s, maxStretch);

  // El bolsillo (reposo − s·u) tiene que quedar dentro de la mitad propia.
  const r = puck.radius;
  const midY = state.board.height / 2;
  const xMin = r;
  const xMax = state.board.width - r;
  const yMin = side === 'bottom' ? midY + r : r;
  const yMax = side === 'bottom' ? state.board.height - r : midY - r;
  const maxS = (pos: number, u: number, lo: number, hi: number) =>
    u > 1e-9 ? (pos - lo) / u : u < -1e-9 ? (hi - pos) / -u : Infinity;
  s = Math.min(s, maxS(restPos.x, ux, xMin, xMax), maxS(restPos.y, uy, yMin, yMax));
  if (s < MIN_AIMED_PULL) return null;

  return { kind: 'shot', puckId: puck.id, pouchPos: { x: restPos.x - s * ux, y: restPos.y - s * uy } };
}

/**
 * Arma la estrategia de IA estándar para un modo, a partir de SU regla de propiedad
 * (la misma que usa el jugador humano — así IA y jugador nunca discrepan sobre qué se
 * puede mover). Elige al azar uno de los discos que puede mover (sueltos, quietos, en su
 * mitad) y lo tira con planShot. Un modo con necesidades especiales (la bomba, el fútbol)
 * escribe su propia estrategia con la misma firma, reutilizando planShot / planAimedShot.
 */
export function createPickAiShot(canGrab: GrabRule, tuning: AiTuning = DEFAULT_AI_TUNING) {
  return function pickAiShot(
    state: GameState,
    side: Side,
    random: () => number = Math.random
  ): AiPlan | null {
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
