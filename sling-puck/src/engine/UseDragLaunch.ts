import { useCallback, useRef, type MutableRefObject } from 'react';
import type { GameState, Puck, Vec2 } from '../engine/types';
import {
  isWithinCaptureRadius,
  clampToMaxStretch,
  computeLaunchVelocity,
  stretchDistance,
  MIN_STRETCH_TO_FIRE,
} from '../engine/elastic';

/**
 * Fase 1: el jugador lleva el disco de la mano por el tablero, todavía sin tocar
 * ningún elástico — se mueve libre, siguiendo al puntero.
 *
 * Fase 2: el disco entró al radio de captura de un elástico de su mismo color y
 * quedó enganchado — a partir de acá, arrastrar estira el elástico (con tope
 * máximo) en vez de mover el disco libremente.
 */
type DragPhase =
  | { kind: 'carrying'; puckId: string }
  | { kind: 'loaded'; puckId: string; elasticId: string };

interface UseDragLaunchOptions {
  /** Ref mutable al estado del juego (el mismo que muta stepPhysics cada frame). */
  gameStateRef: MutableRefObject<GameState>;
  /** Convierte coordenadas de puntero (pantalla) a coordenadas lógicas del tablero. */
  toBoardCoords: (clientX: number, clientY: number) => Vec2;
  /** Se dispara cuando un disco sale de la honda — para animar el chasquido del elástico en la UI. */
  onFire?: (elasticId: string, puckId: string) => void;
  /** Se dispara cuando un disco queda enganchado — para una animación de "click" en la UI. */
  onLoad?: (elasticId: string, puckId: string) => void;
}

function findLoosePuckAt(pucks: Puck[], pos: Vec2): Puck | undefined {
  return pucks.find(
    (p) =>
      !p.frozen &&
      p.vel.x === 0 &&
      p.vel.y === 0 &&
      Math.hypot(p.pos.x - pos.x, p.pos.y - pos.y) < p.radius + 8
  );
}

export function useDragLaunch({
  gameStateRef,
  toBoardCoords,
  onFire,
  onLoad,
}: UseDragLaunchOptions) {
  const dragRef = useRef<DragPhase | null>(null);

  const onPointerDown = useCallback(
    (clientX: number, clientY: number) => {
      const pos = toBoardCoords(clientX, clientY);
      const puck = findLoosePuckAt(gameStateRef.current.pucks, pos);
      if (!puck) return;
      puck.frozen = true;
      dragRef.current = { kind: 'carrying', puckId: puck.id };
    },
    [gameStateRef, toBoardCoords]
  );

  const onPointerMove = useCallback(
    (clientX: number, clientY: number) => {
      const drag = dragRef.current;
      if (!drag) return;

      const state = gameStateRef.current;
      const puck = state.pucks.find((p) => p.id === drag.puckId);
      if (!puck) return;

      const pos = toBoardCoords(clientX, clientY);

      if (drag.kind === 'carrying') {
        puck.pos.x = pos.x;
        puck.pos.y = pos.y;

        const elastic = state.elastics.find(
          (e) => e.color === puck.color && e.loadedPuckId === null && isWithinCaptureRadius(pos, e)
        );
        if (elastic) {
          elastic.loadedPuckId = puck.id;
          elastic.pouchPos = { ...elastic.restPos };
          dragRef.current = { kind: 'loaded', puckId: puck.id, elasticId: elastic.id };
          onLoad?.(elastic.id, puck.id);
        }
        return;
      }

      // drag.kind === 'loaded': ahora movemos el bolsillo del elástico, con tope.
      const elastic = state.elastics.find((e) => e.id === drag.elasticId);
      if (!elastic) return;
      const clamped = clampToMaxStretch(elastic.restPos, pos, elastic.maxStretch);
      elastic.pouchPos = clamped;
      puck.pos.x = clamped.x;
      puck.pos.y = clamped.y;
    },
    [gameStateRef, toBoardCoords, onLoad]
  );

  const onPointerUp = useCallback(() => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag) return;

    const state = gameStateRef.current;
    const puck = state.pucks.find((p) => p.id === drag.puckId);
    if (!puck) return;

    puck.frozen = false;

    if (drag.kind === 'carrying') {
      // Nunca llegó a engancharse: queda parado donde se soltó, sin disparar.
      return;
    }

    const elastic = state.elastics.find((e) => e.id === drag.elasticId);
    if (!elastic) return;

    if (stretchDistance(elastic) >= MIN_STRETCH_TO_FIRE) {
      const vel = computeLaunchVelocity(elastic);
      puck.vel.x = vel.x;
      puck.vel.y = vel.y;
      onFire?.(elastic.id, puck.id);
    }
    // Se suelta del elástico y el bolsillo vuelve a su posición de reposo
    // (la UI puede animar este "chasquido" escuchando onFire, acá el estado
    // vuelve instantáneo porque la física del elástico en sí no se simula).
    elastic.loadedPuckId = null;
    elastic.pouchPos = { ...elastic.restPos };
  }, [gameStateRef, onFire]);

  return { onPointerDown, onPointerMove, onPointerUp };
}
