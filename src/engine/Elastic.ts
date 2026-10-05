import type { Vec2, ElasticBand } from './types';

/** Distancia mínima de estiramiento para que soltar dispare el disco (si es menor, se considera "no tirar"). */
export const MIN_STRETCH_TO_FIRE = 12;

function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** true si `pos` (la posición de un disco) está dentro del radio de captura del elástico. */
export function isWithinCaptureRadius(pos: Vec2, elastic: ElasticBand): boolean {
  return distance(pos, elastic.restPos) <= elastic.captureRadius;
}

/**
 * Limita `desired` (donde el jugador quiere llevar el bolsillo) a como máximo
 * `maxStretch` de distancia desde `restPos`, conservando la dirección.
 */
export function clampToMaxStretch(restPos: Vec2, desired: Vec2, maxStretch: number): Vec2 {
  const dx = desired.x - restPos.x;
  const dy = desired.y - restPos.y;
  const dist = Math.hypot(dx, dy);
  if (dist <= maxStretch || dist === 0) {
    return { x: desired.x, y: desired.y };
  }
  const scale = maxStretch / dist;
  return { x: restPos.x + dx * scale, y: restPos.y + dy * scale };
}

/** Qué tan estirado está el elástico ahora mismo, en unidades lógicas del tablero. */
export function stretchDistance(elastic: ElasticBand): number {
  return distance(elastic.pouchPos, elastic.restPos);
}

/**
 * Velocidad de disparo: apunta desde la posición estirada hacia el reposo
 * (como una honda real, el disco sale para el lado contrario de donde tiraste),
 * escalada por `power`.
 */
export function computeLaunchVelocity(elastic: ElasticBand): Vec2 {
  return {
    x: (elastic.restPos.x - elastic.pouchPos.x) * elastic.power,
    y: (elastic.restPos.y - elastic.pouchPos.y) * elastic.power,
  };
}

/**
 * Regla de "soltar": si el estiramiento supera el umbral, devuelve la velocidad de
 * disparo; si no, null (se soltó sin tirar). En los dos casos resetea el elástico a
 * reposo. La comparten useDragLaunch (jugador humano) y la IA para no duplicarla.
 */
export function releaseElastic(elastic: ElasticBand): Vec2 | null {
  const velocity = stretchDistance(elastic) >= MIN_STRETCH_TO_FIRE ? computeLaunchVelocity(elastic) : null;
  elastic.loadedPuckId = null;
  elastic.pouchPos = { ...elastic.restPos };
  return velocity;
}
