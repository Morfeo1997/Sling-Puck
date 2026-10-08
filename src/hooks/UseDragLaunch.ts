import { useCallback, useRef, type MutableRefObject } from 'react';
import type { GameState, Puck, PuckColor, Vec2 } from '../engine/types';
import { isWithinCaptureRadius, clampToMaxStretch, releaseElastic } from '../engine/Elastic';
import { clampToOwnHalf } from '../engine/Geometry';

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
  /** Solo se pueden agarrar discos de este color — el jugador no puede mover los del rival. */
  playerColor: PuckColor;
  /** Convierte coordenadas de puntero (pantalla) a coordenadas lógicas del tablero. */
  toBoardCoords: (clientX: number, clientY: number) => Vec2;
  /** Se dispara cuando un disco sale de la honda — para animar el chasquido del elástico en la UI. */
  onFire?: (elasticId: string, puckId: string) => void;
  /** Se dispara cuando un disco queda enganchado — para una animación de "click" en la UI. */
  onLoad?: (elasticId: string, puckId: string) => void;
}

/**
 * Velocidad máxima (unidades/s) a la que todavía se puede agarrar un disco. Antes se
 * exigía velocidad exactamente 0, pero la física solo la clava en 0 al bajar de
 * minVelocity, así que un disco rebotando casi imperceptiblemente tardaba segundos en
 * poder agarrarse. Subilo si lo querés aún más permisivo (Infinity = agarrar siempre).
 */
const MAX_GRAB_SPEED = 150;

function findLoosePuckAt(
  pucks: Puck[],
  pos: Vec2,
  color: PuckColor,
  board: GameState['board']
): Puck | undefined {
  const midY = board.height / 2;
  return pucks.find(
    (p) =>
      p.color === color &&
      !p.frozen &&
      Math.hypot(p.vel.x, p.vel.y) <= MAX_GRAB_SPEED &&
      // Solo los que siguen en la mitad propia: con la regla relajada, un disco que
      // acaba de cruzar y aún se desliza podría agarrarse y "teletransportarse" de
      // vuelta por clampToOwnHalf.
      (color === 'white' ? p.pos.y > midY : p.pos.y < midY) &&
      Math.hypot(p.pos.x - pos.x, p.pos.y - pos.y) < p.radius + 8
  );
}

export function useDragLaunch({
  gameStateRef,
  playerColor,
  toBoardCoords,
  onFire,
  onLoad,
}: UseDragLaunchOptions) {
  const dragRef = useRef<DragPhase | null>(null);

  const onPointerDown = useCallback(
    (clientX: number, clientY: number) => {
      const pos = toBoardCoords(clientX, clientY);
      const state = gameStateRef.current;
      const puck = findLoosePuckAt(state.pucks, pos, playerColor, state.board);
      if (!puck) return;
      // Si todavía se estaba deslizando, lo frenamos al agarrarlo: mientras está
      // "frozen" la física no lo integra, pero su velocidad vieja seguiría contando
      // en las colisiones y lo haría salir disparado al soltarlo sin usar el elástico.
      puck.vel.x = 0;
      puck.vel.y = 0;
      puck.frozen = true;
      dragRef.current = { kind: 'carrying', puckId: puck.id };
    },
    [gameStateRef, playerColor, toBoardCoords]
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
        // Nunca deja cruzar la línea media de la mano — la única forma de pasar un
        // disco al otro lado es disparándolo, no arrastrándolo hasta ahí.
        const clamped = clampToOwnHalf(pos, puck.color, state.board, puck.radius);
        puck.pos.x = clamped.x;
        puck.pos.y = clamped.y;

        const elastic = state.elastics.find(
          (e) => e.color === puck.color && e.loadedPuckId === null && isWithinCaptureRadius(clamped, e)
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
      const stretched = clampToMaxStretch(elastic.restPos, pos, elastic.maxStretch);
      // Mismo límite que en 'carrying': estirar hacia el centro en vez de hacia la
      // pared propia tampoco puede empujar al disco más allá de la línea media
      // mientras todavía no se disparó.
      const clamped = clampToOwnHalf(stretched, puck.color, state.board, puck.radius);
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

    const velocity = releaseElastic(elastic);
    if (velocity) {
      puck.vel.x = velocity.x;
      puck.vel.y = velocity.y;
      onFire?.(elastic.id, puck.id);
    }
    // El reseteo del elástico a reposo ya lo hizo releaseElastic; la UI puede
    // animar el "chasquido" de vuelta escuchando onFire (ver ElasticBand.snap()).
  }, [gameStateRef, onFire]);

  return { onPointerDown, onPointerMove, onPointerUp };
}
