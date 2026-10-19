import { useEffect, useRef, type MutableRefObject } from 'react';
import { gsap } from 'gsap';
import type { GameState, Side } from '../../engine/types';
import { goalRect } from './Pitch';
import { footballState } from './State';

interface GoalsViewProps {
  gameStateRef: MutableRefObject<GameState>;
}

const SIDES: Side[] = ['bottom', 'top'];

/**
 * Marcas de la cancha (línea media y círculo central) y los dos arcos, dibujados en las
 * coordenadas del tablero, debajo de los discos. Durante la celebración de un gol, el arco
 * que recibió el gol parpadea (lo hace solo, leyendo el estado en cada cuadro, sin re-renders).
 */
export default function GoalsView({ gameStateRef }: GoalsViewProps) {
  const boxRefs = useRef<Record<Side, HTMLDivElement | null>>({ bottom: null, top: null });
  const { width, height } = gameStateRef.current.board;

  useEffect(() => {
    const tick = () => {
      const state = gameStateRef.current;
      const fs = footballState(state);
      for (const side of SIDES) {
        const box = boxRefs.current[side];
        if (!box) continue;
        if (fs.phase === 'goal' && fs.conceder === side) {
          const pulse = 0.5 + 0.5 * Math.sin((state.time - fs.phaseStartedAt) * Math.PI * 6);
          box.style.backgroundColor = `rgba(250, 204, 21, ${0.25 + 0.5 * pulse})`;
        } else {
          box.style.backgroundColor = '';
        }
      }
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
    };
  }, [gameStateRef]);

  return (
    <>
      {/* línea media y círculo central */}
      <div className="absolute bg-white/40" style={{ left: 0, top: height / 2 - 1, width, height: 2 }} />
      <div
        className="absolute rounded-full border-2 border-white/40"
        style={{ left: width / 2 - 60, top: height / 2 - 60, width: 120, height: 120 }}
      />

      {/* arcos, con red */}
      {SIDES.map((side) => {
        const g = goalRect(side, { width, height });
        return (
          <div
            key={side}
            ref={(el) => {
              boxRefs.current[side] = el;
            }}
            className="absolute border-4 border-white/80"
            style={{
              left: g.x,
              top: g.y,
              width: g.width,
              height: g.height,
              backgroundImage:
                'repeating-linear-gradient(45deg, rgba(255,255,255,0.35) 0 2px, transparent 2px 9px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.35) 0 2px, transparent 2px 9px)',
            }}
          />
        );
      })}
    </>
  );
}
