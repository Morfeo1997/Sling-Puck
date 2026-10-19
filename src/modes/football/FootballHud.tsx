import { useEffect, useRef, type MutableRefObject } from 'react';
import { gsap } from 'gsap';
import type { GameState } from '../../engine/types';
import { MATCH_SECONDS } from './Pitch';
import { footballState } from './State';

interface FootballHudProps {
  gameStateRef: MutableRefObject<GameState>;
}

/**
 * Barra de goles y cronómetro. Se actualiza sola leyendo el estado en cada cuadro del
 * gsap.ticker y escribiendo en el DOM solo cuando algo cambia — sin re-renders.
 */
export default function FootballHud({ gameStateRef }: FootballHudProps) {
  const bottomRef = useRef<HTMLSpanElement>(null);
  const topRef = useRef<HTMLSpanElement>(null);
  const clockRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const last = { bottom: '', top: '', clock: '', status: '', urgent: false };

    const tick = () => {
      const fs = footballState(gameStateRef.current);

      const bottom = String(fs.goals.bottom);
      const top = String(fs.goals.top);
      if (bottom !== last.bottom && bottomRef.current) {
        bottomRef.current.textContent = bottom;
        last.bottom = bottom;
      }
      if (top !== last.top && topRef.current) {
        topRef.current.textContent = top;
        last.top = top;
      }

      const secs = Math.ceil(Math.max(0, MATCH_SECONDS - fs.playTime));
      const clock = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
      if (clock !== last.clock && clockRef.current) {
        clockRef.current.textContent = clock;
        last.clock = clock;
      }
      const urgent = secs <= 10 && !fs.overtime;
      if (urgent !== last.urgent && clockRef.current) {
        clockRef.current.style.color = urgent ? '#f87171' : '';
        last.urgent = urgent;
      }

      const status = fs.phase === 'goal' ? '¡GOL!' : fs.overtime ? 'Gol de oro' : '';
      if (status !== last.status && statusRef.current) {
        statusRef.current.textContent = status;
        last.status = status;
      }
    };

    tick();
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
    };
  }, [gameStateRef]);

  return (
    <div className="flex w-full max-w-[420px] items-center justify-between rounded-xl bg-neutral-900 px-5 py-2 text-white shadow">
      <span className="flex items-center gap-2 text-2xl font-bold tabular-nums">
        <span className="inline-block h-3 w-3 rounded-full bg-neutral-50 ring-1 ring-neutral-400" />
        <span ref={bottomRef}>0</span>
      </span>
      <div className="text-center leading-tight">
        <div ref={clockRef} className="font-mono text-xl tabular-nums">
          2:00
        </div>
        <div ref={statusRef} className="h-3.5 text-[11px] font-semibold uppercase tracking-wide text-amber-300" />
      </div>
      <span className="flex items-center gap-2 text-2xl font-bold tabular-nums">
        <span ref={topRef}>0</span>
        <span className="inline-block h-3 w-3 rounded-full bg-neutral-900 ring-1 ring-neutral-500" />
      </span>
    </div>
  );
}
