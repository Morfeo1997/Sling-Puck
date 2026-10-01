import type { GameState, Puck, PhysicsConfig, BoardConfig } from './types';

export const DEFAULT_PHYSICS: PhysicsConfig = {
  friction: 0.985,
  minVelocity: 6,
  wallRestitution: 0.7,
};

function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Colisión círculo-rectángulo (AABB), usada para los dos bloques del muro central. */
function circleIntersectsRect(
  puck: Puck,
  rx: number,
  ry: number,
  rw: number,
  rh: number
): boolean {
  const closestX = Math.max(rx, Math.min(puck.pos.x, rx + rw));
  const closestY = Math.max(ry, Math.min(puck.pos.y, ry + rh));
  const dx = puck.pos.x - closestX;
  const dy = puck.pos.y - closestY;
  return dx * dx + dy * dy < puck.radius * puck.radius;
}

function centerWallBlocks(board: BoardConfig) {
  const midY = board.height / 2 - board.wallThickness / 2;
  return [
    { rx: 0, ry: midY, rw: board.slotLeft, rh: board.wallThickness },
    { rx: board.slotRight, ry: midY, rw: board.width - board.slotRight, rh: board.wallThickness },
  ];
}

/** Integra una posición, aplica fricción y corta la velocidad por debajo del umbral. */
function integratePuck(puck: Puck, dt: number, cfg: PhysicsConfig): void {
  const speed = Math.hypot(puck.vel.x, puck.vel.y);
  if (speed <= 1) {
    puck.vel.x = 0;
    puck.vel.y = 0;
    return;
  }
  puck.pos.x += puck.vel.x * dt;
  puck.pos.y += puck.vel.y * dt;
  puck.vel.x *= cfg.friction;
  puck.vel.y *= cfg.friction;
  if (Math.hypot(puck.vel.x, puck.vel.y) < cfg.minVelocity) {
    puck.vel.x = 0;
    puck.vel.y = 0;
  }
}

/** Rebote contra los cuatro bordes del tablero. */
function resolveOuterWalls(puck: Puck, board: BoardConfig, cfg: PhysicsConfig): void {
  const r = puck.radius;
  if (puck.pos.x - r < 0) {
    puck.pos.x = r;
    puck.vel.x = Math.abs(puck.vel.x) * cfg.wallRestitution;
  }
  if (puck.pos.x + r > board.width) {
    puck.pos.x = board.width - r;
    puck.vel.x = -Math.abs(puck.vel.x) * cfg.wallRestitution;
  }
  if (puck.pos.y - r < 0) {
    puck.pos.y = r;
    puck.vel.y = Math.abs(puck.vel.y) * cfg.wallRestitution;
  }
  if (puck.pos.y + r > board.height) {
    puck.pos.y = board.height - r;
    puck.vel.y = -Math.abs(puck.vel.y) * cfg.wallRestitution;
  }
}

/** Rebote contra los dos bloques del muro central (todo lo que no sea la ranura). */
function resolveCenterWall(puck: Puck, board: BoardConfig, cfg: PhysicsConfig): void {
  for (const block of centerWallBlocks(board)) {
    if (circleIntersectsRect(puck, block.rx, block.ry, block.rw, block.rh)) {
      puck.vel.y = -puck.vel.y * cfg.wallRestitution;
      puck.pos.y += puck.pos.y < board.height / 2 ? -4 : 4;
      puck.flash = Math.max(puck.flash, 0.6);
    }
  }
}

/**
 * Colisión elástica (masas iguales) entre dos discos, con separación de solapamiento.
 * Si alguno está `frozen` (lo está arrastrando el jugador), no se desplaza ni cambia su
 * velocidad — actúa como un obstáculo fijo para el otro disco.
 */
function resolvePuckCollisions(pucks: Puck[]): void {
  for (let i = 0; i < pucks.length; i++) {
    for (let j = i + 1; j < pucks.length; j++) {
      const a = pucks[i];
      const b = pucks[j];
      const d = distance(a.pos, b.pos);
      const minDist = a.radius + b.radius;
      if (d >= minDist || d === 0) continue;

      const nx = (b.pos.x - a.pos.x) / d;
      const ny = (b.pos.y - a.pos.y) / d;
      const overlap = (minDist - d) / 2;

      if (!a.frozen) {
        a.pos.x -= nx * overlap;
        a.pos.y -= ny * overlap;
      }
      if (!b.frozen) {
        b.pos.x += nx * overlap;
        b.pos.y += ny * overlap;
      }

      const avn = a.vel.x * nx + a.vel.y * ny;
      const bvn = b.vel.x * nx + b.vel.y * ny;

      if (!a.frozen) {
        a.vel.x += (bvn - avn) * nx;
        a.vel.y += (bvn - avn) * ny;
      }
      if (!b.frozen) {
        b.vel.x += (avn - bvn) * nx;
        b.vel.y += (avn - bvn) * ny;
      }

      a.flash = 1;
      b.flash = 1;
    }
  }
}

/**
 * Avanza el estado del juego un paso de tiempo `dt` (segundos). Muta `state.pucks` in place
 * por performance (pensado para llamarse ~60 veces por segundo desde el game loop) y devuelve
 * `true` si algún disco sigue en movimiento (útil para saber cuándo evaluar la condición de victoria).
 */
export function stepPhysics(
  state: GameState,
  dt: number,
  cfg: PhysicsConfig = DEFAULT_PHYSICS
): boolean {
  for (const puck of state.pucks) {
    if (puck.frozen) continue;
    integratePuck(puck, dt, cfg);
    resolveOuterWalls(puck, state.board, cfg);
    resolveCenterWall(puck, state.board, cfg);
    if (puck.flash > 0) puck.flash = Math.max(0, puck.flash - 0.04);
  }

  resolvePuckCollisions(state.pucks);

  // Las colisiones pueden haber puesto en movimiento un disco que estaba
  // quieto, así que "moving" se evalúa recién acá, con el estado ya resuelto.
  return state.pucks.some((p) => !p.frozen && Math.hypot(p.vel.x, p.vel.y) > 0.5);
}

/** true cuando ningún disco (que no esté siendo arrastrado) se está moviendo. */
export function isSettled(state: GameState): boolean {
  return state.pucks.every((p) => p.frozen || Math.hypot(p.vel.x, p.vel.y) === 0);
}
