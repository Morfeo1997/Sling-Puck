import { useCallback, useEffect, type MutableRefObject } from 'react';
import { gsap } from 'gsap';
import type { GameState } from '../engine/types';
import { pickAiShot } from '../engine/Ai';
import { releaseElastic } from '../engine/Elastic';

interface UseAiOpponentOptions {
  gameStateRef: MutableRefObject<GameState>;
  elasticId: string;
  /** En false frena a la IA por completo (por ejemplo, con la partida ya terminada). */
  enabled: boolean;
  /** Cada cuánto intenta tirar, en ms. No espera a que el tablero esté quieto. */
  intervalMs?: number;
  /** Se llama cuando la IA "engancha" un disco, justo antes de empezar el amague. */
  onLoad?: (elasticId: string, puckId: string) => void;
  /** Mismo callback que useDragLaunch: dispara la animación de chasquido del elástico. */
  onFire?: (elasticId: string, puckId: string) => void;
}

/**
 * Oponente agresivo: intenta un tiro cada `intervalMs`, sin esperar a que el tablero
 * quede quieto (eso es justamente lo que lo hace sentir más difícil/activo). Si en
 * ese momento no hay ningún disco propio suelto y quieto, pickAiShot devuelve null y
 * ese intento no hace nada — no hace falta avisarle desde afuera, se maneja solo con
 * su propio temporizador.
 */
export function useAiOpponent({
  gameStateRef,
  elasticId,
  enabled,
  intervalMs = 2000,
  onLoad,
  onFire,
}: UseAiOpponentOptions) {
  const takeShot = useCallback(() => {
    const state = gameStateRef.current;
    const plan = pickAiShot(state, elasticId);
    if (!plan) return;

    const elastic = state.elastics.find((e) => e.id === elasticId);
    const puck = state.pucks.find((p) => p.id === plan.puckId);
    if (!elastic || !puck) return;

    // Igual que al arrastrar: mientras dura el amague, el disco no se mueve por
    // física (queda "frozen"), solo lo mueve el tween.
    puck.frozen = true;
    elastic.loadedPuckId = puck.id;
    onLoad?.(elastic.id, puck.id);

    gsap.to(puck.pos, {
      x: plan.pouchPos.x,
      y: plan.pouchPos.y,
      duration: 0.45,
      ease: 'power2.inOut',
      onUpdate: () => {
        elastic.pouchPos.x = puck.pos.x;
        elastic.pouchPos.y = puck.pos.y;
      },
      onComplete: () => {
        const velocity = releaseElastic(elastic);
        puck.frozen = false;
        if (velocity) {
          puck.vel.x = velocity.x;
          puck.vel.y = velocity.y;
          onFire?.(elastic.id, puck.id);
        }
      },
    });
  }, [gameStateRef, elasticId, onLoad, onFire]);

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(takeShot, intervalMs);
    return () => clearInterval(id);
  }, [enabled, intervalMs, takeShot]);
}
