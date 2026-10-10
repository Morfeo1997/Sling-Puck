import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import type { Side } from '../engine/types';
import { SIDE_LABEL } from '../engine/Sides';

interface WinBannerProps {
  winner: Side;
  /** Por qué ganó, lo define el modo (por ejemplo "Limpió su mitad del tablero"). */
  reason?: string;
  onRestart: () => void;
}

export default function WinBanner({ winner, reason, onRestart }: WinBannerProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Se anima cada vez que el componente se monta, es decir, cada vez que hay un
  // ganador nuevo — Board solo lo renderiza cuando la partida terminó.
  useEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, scale: 0.7, y: 12 },
      { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: 'back.out(2)' }
    );
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/55">
      <div
        ref={cardRef}
        className="flex flex-col items-center gap-4 rounded-2xl bg-white px-8 py-6 text-center shadow-2xl"
      >
        <p className="text-2xl font-bold text-neutral-900">{SIDE_LABEL[winner]} ganó 🏆</p>
        {reason && <p className="text-sm text-neutral-500">{reason}</p>}
        <button
          onClick={onRestart}
          className="rounded-full bg-amber-700 px-5 py-2 font-semibold text-white transition hover:bg-amber-600 active:scale-95"
        >
          Jugar de nuevo
        </button>
      </div>
    </div>
  );
}
