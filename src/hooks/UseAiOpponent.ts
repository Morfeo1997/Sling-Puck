import { useCallback, useEffect, useRef, type MutableRefObject } from 'react';
import { gsap } from 'gsap';
import type { GameState, Side } from '../engine/types';
import type { AiPlan } from '../engine/Ai';
import { releaseElastic } from '../engine/Elastic';

interface UseAiOpponentOptions {
  gameStateRef: MutableRefObject<GameState>;
  /** Lado que controla la IA: su elástico y sus discos. */
  side: Side;
  /** Qué hace la IA en cada ciclo (ver GameMode.pickAiAction). null = nada. */
  pickAction: (state: GameState, side: Side) => AiPlan | null;
  /** En false frena a la IA por completo (por ejemplo, con la partida ya terminada). */
  enabled: boolean;
  /** Cada cuánto actúa, en ms. No espera a que el tablero esté quieto. */
  intervalMs?: number;
  /** Se llama cuando la IA "engancha" un disco, justo antes de empezar el amague. */
  onLoad?: (elasticId: string, puckId: string) => void;
  /** Mismo callback que useDragLaunch: dispara la animación de chasquido del elástico. */
  onFire?: (elasticId: string, puckId: string) => void;
}

/**
 * Oponente agresivo: intenta una acción cada `intervalMs`, sin esperar a que el tablero
 * quede quieto (eso es justamente lo que lo hace sentir más difícil/activo). Si la
 * estrategia no encuentra nada que hacer (devuelve null), ese ciclo no hace nada.
 *
 * Una acción puede ser disparar (llevar el disco al bolsillo estirado y soltarlo) o
 * reubicar (llevar el disco a otro lugar y dejarlo). En los dos casos el disco queda
 * "frozen" mientras lo mueve el tween. `cancel()` mata los tweens en curso: quien cancela
 * se encarga de dejar los discos y el elástico en su estado final.
 */
export function useAiOpponent({
  gameStateRef,
  side,
  pickAction,
  enabled,
  intervalMs = 2000,
  onLoad,
  onFire,
}: UseAiOpponentOptions) {
  const activeTweens = useRef(new Set<gsap.core.Tween>());

  const takeAction = useCallback(() => {
    const state = gameStateRef.current;
    const plan = pickAction(state, side);
    if (!plan) return;

    const puck = state.pucks.find((p) => p.id === plan.puckId);
    if (!puck) return;

    if (plan.kind === 'move') {
      puck.frozen = true;
      const tween = gsap.to(puck.pos, {
        x: plan.to.x,
        y: plan.to.y,
        duration: 0.5,
        ease: 'power2.inOut',
        onComplete: () => {
          activeTweens.current.delete(tween);
          puck.vel.x = 0;
          puck.vel.y = 0;
          puck.frozen = false;
        },
      });
      activeTweens.current.add(tween);
      return;
    }

    const elastic = state.elastics.find((e) => e.side === side);
    if (!elastic) return;

    // Igual que al arrastrar: mientras dura el amague, el disco no se mueve por
    // física (queda "frozen"), solo lo mueve el tween.
    puck.frozen = true;
    elastic.loadedPuckId = puck.id;
    onLoad?.(elastic.id, puck.id);

    const tween = gsap.to(puck.pos, {
      x: plan.pouchPos.x,
      y: plan.pouchPos.y,
      duration: 0.45,
      ease: 'power2.inOut',
      onUpdate: () => {
        elastic.pouchPos.x = puck.pos.x;
        elastic.pouchPos.y = puck.pos.y;
      },
      onComplete: () => {
        activeTweens.current.delete(tween);
        const velocity = releaseElastic(elastic);
        puck.frozen = false;
        if (velocity) {
          puck.vel.x = velocity.x;
          puck.vel.y = velocity.y;
          onFire?.(elastic.id, puck.id);
        }
      },
    });
    activeTweens.current.add(tween);
  }, [gameStateRef, side, pickAction, onLoad, onFire]);

  const cancel = useCallback(() => {
    activeTweens.current.forEach((tween) => tween.kill());
    activeTweens.current.clear();
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(takeAction, intervalMs);
    return () => clearInterval(id);
  }, [enabled, intervalMs, takeAction]);

  // Al desmontar, que no queden tweens vivos moviendo discos de una partida que ya no existe.
  useEffect(() => cancel, [cancel]);

  return { cancel };
}
