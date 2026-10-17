import { useEffect, useRef, type MutableRefObject } from 'react';
import { gsap } from 'gsap';
import type { GameState } from '../../engine/types';

interface BombViewProps {
  gameStateRef: MutableRefObject<GameState>;
  puckId: string;
}

/** En los últimos segundos la bomba se vuelve cada vez más urgente (pulsa más rápido y brilla). */
const URGENT_WINDOW = 10;
/** En los últimos segundos, además, tiembla. */
const SHAKE_WINDOW = 3;

/**
 * Dibuja la bomba dentro del contenedor que Board posiciona (que ya mueve el disco y
 * le pone el destello de choque). Se anima sola leyendo GameState.time en cada cuadro del
 * gsap.ticker — sin props que cambien ni re-renders — y se detiene sola cuando el reloj de
 * la partida se detiene (partida terminada).
 *
 * Capas, para que GSAP y el ticker no pisen el mismo `transform`:
 *  - popRef:   aparición y explosión (tweens de GSAP)
 *  - bodyRef:  pulso y temblor (lo escribe el ticker cada cuadro)
 */
export default function BombView({ gameStateRef, puckId }: BombViewProps) {
  const popRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const sparkRef = useRef<HTMLSpanElement>(null);
  const blastRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pop = popRef.current;
    const body = bodyRef.current;
    const glow = glowRef.current;
    const spark = sparkRef.current;
    const blast = blastRef.current;
    if (!pop || !body || !glow || !spark || !blast) return;

    let phase = 0; // fase del pulso, acumulada para que cambiar la frecuencia no genere saltos
    let lastTime = gameStateRef.current.time;
    let exploded = false;

    const popIn = () => {
      gsap.killTweensOf(pop);
      gsap.fromTo(pop, { scale: 0, opacity: 1 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2.5)' });
    };

    const resetVisuals = () => {
      gsap.killTweensOf([pop, blast]);
      gsap.set(pop, { scale: 1, opacity: 1 });
      gsap.set(blast, { opacity: 0, scale: 1 });
      body.style.transform = '';
      body.style.boxShadow = '';
      glow.style.opacity = '0';
    };

    const explode = () => {
      glow.style.opacity = '0';
      gsap.to(pop, { scale: 2.2, opacity: 0, duration: 0.35, ease: 'power2.out' });
      gsap.fromTo(blast, { scale: 0.6, opacity: 1 }, { scale: 3.5, opacity: 0, duration: 0.6, ease: 'power2.out' });
    };

    const tick = () => {
      const state = gameStateRef.current;
      const bomb = state.pucks.find((p) => p.id === puckId);
      if (!bomb || bomb.fuseEndsAt === undefined) return;

      const delta = state.time - lastTime;
      lastTime = state.time;
      const remaining = bomb.fuseEndsAt - state.time;

      // El reloj volvió atrás o la bomba "revivió": empezó una partida nueva.
      if (delta < 0 || (exploded && remaining > 0)) {
        exploded = false;
        phase = 0;
        resetVisuals();
        popIn();
        return;
      }

      if (remaining <= 0) {
        if (!exploded) {
          exploded = true;
          explode();
        }
        return;
      }

      // Reloj detenido (la partida terminó por otro motivo): la bomba se queda quieta.
      if (delta === 0) return;

      const urgency = 1 - Math.min(remaining, URGENT_WINDOW) / URGENT_WINDOW; // 0 → 1
      phase += delta * (1.2 + urgency * 4.8); // de ~1 pulso/s a ~6 pulsos/s
      const pulse = 0.5 + 0.5 * Math.sin(phase * Math.PI * 2);

      let shakeX = 0;
      let shakeY = 0;
      if (remaining < SHAKE_WINDOW) {
        const amplitude = 0.5 + 2.5 * (1 - remaining / SHAKE_WINDOW);
        shakeX = (Math.random() - 0.5) * 2 * amplitude;
        shakeY = (Math.random() - 0.5) * 2 * amplitude;
      }

      body.style.transform = `translate(${shakeX}px, ${shakeY}px) scale(${1 + 0.07 * pulse * (0.4 + urgency)})`;
      body.style.boxShadow = `0 0 ${4 + 12 * urgency * pulse}px rgba(239, 68, 68, ${0.9 * urgency})`;
      glow.style.opacity = String(urgency * (0.2 + 0.6 * pulse));
      spark.style.opacity = String(0.55 + 0.45 * pulse);
      spark.style.transform = `scale(${0.8 + 0.7 * pulse})`;
    };

    popIn();
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      gsap.killTweensOf([pop, blast]);
    };
  }, [gameStateRef, puckId]);

  return (
    <div ref={popRef} className="relative h-full w-full">
      {/* resplandor rojo que crece con la urgencia */}
      <div ref={glowRef} className="absolute -inset-3 rounded-full bg-red-500 opacity-0 blur-md" />

      {/* cuerpo de la bomba */}
      <div
        ref={bodyRef}
        className="relative h-full w-full rounded-full border-2 border-neutral-950"
        style={{ background: 'radial-gradient(circle at 32% 30%, #6b7280, #111827 72%)' }}
      >
        {/* mecha y chispa */}
        <span
          className="absolute h-3 w-0.5 rounded bg-amber-700"
          style={{ top: -8, left: '50%', transformOrigin: 'bottom', transform: 'rotate(25deg)' }}
        />
        <span
          ref={sparkRef}
          className="absolute h-2 w-2 rounded-full bg-orange-400"
          style={{ top: -14, left: 'calc(50% + 4px)', boxShadow: '0 0 6px 2px rgba(251, 146, 60, 0.9)' }}
        />
      </div>

      {/* onda expansiva de la explosión */}
      <div
        ref={blastRef}
        className="pointer-events-none absolute inset-0 rounded-full border-4 border-orange-400 opacity-0"
      />
    </div>
  );
}
