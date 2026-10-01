import { useCallback, useEffect, useRef, type MutableRefObject } from 'react';
import { gsap } from 'gsap';
import type { GameState } from '../engine/Types';
import { pickAiShot } from '../engine/Ai';
import { releaseElastic } from '../engine/Elastic';

interface UseAiOpponentOptions {
  gameStateRef: MutableRefObject<GameState>;
  elasticId: string;
  /** En false cancela cualquier tiro programado (por ejemplo, con la partida ya terminada). */
  enabled: boolean;
  minDelayMs?: number;
  maxDelayMs?: number;
  /** Mismo callback que useDragLaunch: dispara la animación de chasquido del elástico. */
  onFire?: (elasticId: string, puckId: string) => void;
}

/**
 * Oponente simple. No reacciona solo: hay que llamar a scheduleShot() (típicamente
 * desde onSettle del game loop, y una vez al montar) para que programe un tiro tras
 * un retraso al azar. El "amague" — llevar el disco hasta el bolsillo estirado — es
 * un tween de GSAP sobre puck.pos; como ElasticBand ya lee elastic.pouchPos en cada
 * cuadro (ver su método update()), no hace falta tocar ese componente para que la
 * honda se vea estirándose sola.
 */
export function useAiOpponent({
  gameStateRef,
  elasticId,
  enabled,
  minDelayMs = 500,
  maxDelayMs = 1300,
  onFire,
}: UseAiOpponentOptions) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

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
  }, [gameStateRef, elasticId, onFire]);

  const scheduleShot = useCallback(() => {
    if (!enabled) return;
    clearTimeout(timeoutRef.current);
    const delay = minDelayMs + Math.random() * (maxDelayMs - minDelayMs);
    timeoutRef.current = setTimeout(takeShot, delay);
  }, [enabled, minDelayMs, maxDelayMs, takeShot]);

  // Primer tiro al montar (o al reactivarse); el resto se programa desde afuera
  // (onSettle) cada vez que el tablero vuelve a quedar quieto.
  useEffect(() => {
    if (enabled) scheduleShot();
    return () => clearTimeout(timeoutRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { scheduleShot };
}
