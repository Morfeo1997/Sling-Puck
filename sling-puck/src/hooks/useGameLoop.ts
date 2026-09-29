import { useEffect, useRef, type MutableRefObject } from 'react';
import { gsap } from 'gsap';
import type { GameState } from '../engine/types';
import { stepPhysics } from '../engine/physics';

interface UseGameLoopOptions {
  /** Ref mutable al estado del juego; el mismo que usan useDragLaunch y los componentes visuales. */
  gameStateRef: MutableRefObject<GameState>;
  /**
   * Se llama en cada cuadro (~60/s) después de avanzar la física, para que el consumidor
   * actualice el DOM a mano (vía refs) en vez de pasar por setState — evita re-renderizar
   * todo el árbol de discos 60 veces por segundo.
   */
  onFrame: (state: GameState) => void;
  /**
   * Se llama una única vez por cada vez que todos los discos pasan de "en movimiento" a
   * "quietos" — el momento correcto para evaluar la condición de victoria de un modo.
   */
  onSettle?: (state: GameState) => void;
  /** Paso de física fijo, en segundos. Por defecto 1/60. */
  dt?: number;
  /** Si es true, desconecta el loop (por ejemplo, con la partida ya terminada) sin desmontar nada. */
  paused?: boolean;
}

/**
 * Conecta stepPhysics al gsap.ticker. Los callbacks (onFrame/onSettle) se guardan en refs
 * y se leen desde ahí en cada tick, así que podés pasar funciones inline sin que el loop se
 * reinicie en cada render — solo se vuelve a suscribir si cambia gameStateRef, dt o paused.
 */
export function useGameLoop({ gameStateRef, onFrame, onSettle, dt = 1 / 60, paused = false }: UseGameLoopOptions) {
  const onFrameRef = useRef(onFrame);
  const onSettleRef = useRef(onSettle);
  const wasMovingRef = useRef(false);

  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  useEffect(() => {
    onSettleRef.current = onSettle;
  }, [onSettle]);

  useEffect(() => {
    if (paused) return;

    const tick = () => {
      const state = gameStateRef.current;
      const moving = stepPhysics(state, dt);
      onFrameRef.current(state);
      if (wasMovingRef.current && !moving) {
        onSettleRef.current?.(state);
      }
      wasMovingRef.current = moving;
    };

    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
    };
  }, [gameStateRef, dt, paused]);
}
