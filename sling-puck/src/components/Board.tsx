import { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { createClassicState } from '../engine/board';
import type { GameState, Vec2 } from '../engine/types';
import { stepPhysics } from '../engine/physics';
import { useDragLaunch } from '../hooks/useDragLaunch';
import ElasticBand, { type ElasticBandHandle } from './ElasticBand';

const PHYSICS_DT = 1 / 60;

export default function Board() {
  // Init perezosa: createClassicState() debe correr una sola vez, no en cada render.
  const gameStateRef = useRef<GameState>(null!);
  if (gameStateRef.current === null) {
    gameStateRef.current = createClassicState();
  }
  const board = gameStateRef.current.board;

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  // No leemos este valor: solo lo usamos para forzar un re-render en cada frame de física.
  const [, forceRender] = useState(0);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / board.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [board.width]);

  useEffect(() => {
    const tick = () => {
      stepPhysics(gameStateRef.current, PHYSICS_DT);
      forceRender((n) => n + 1);
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
    };
  }, []);

  const toBoardCoords = useMemo(
    () =>
      (clientX: number, clientY: number): Vec2 => {
        const el = wrapperRef.current;
        if (!el) return { x: 0, y: 0 };
        const rect = el.getBoundingClientRect();
        return {
          x: ((clientX - rect.left) / rect.width) * board.width,
          y: ((clientY - rect.top) / rect.height) * board.height,
        };
      },
    [board.width, board.height]
  );

  const elasticRefs = useRef<Record<string, ElasticBandHandle | null>>({});

  const { onPointerDown, onPointerMove, onPointerUp } = useDragLaunch({
    gameStateRef,
    toBoardCoords,
    onFire: (elasticId) => {
      elasticRefs.current[elasticId]?.snap();
    },
  });

  const { pucks, elastics } = gameStateRef.current;
  const { slotLeft, slotRight, wallThickness, width, height } = board;
  const midY = height / 2;

  return (
    <div
      ref={wrapperRef}
      className="relative mx-auto w-full max-w-[420px] touch-none select-none rounded-xl bg-amber-800 shadow-xl"
      style={{ aspectRatio: `${width} / ${height}` }}
      onPointerDown={(e) => onPointerDown(e.clientX, e.clientY)}
      onPointerMove={(e) => onPointerMove(e.clientX, e.clientY)}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <div className="absolute left-0 top-0 origin-top-left" style={{ width, height, transform: `scale(${scale})` }}>
        {/* Muro central: todo lo que no sea la ranura del medio */}
        <div
          className="absolute bg-amber-950"
          style={{ left: 0, top: midY - wallThickness / 2, width: slotLeft, height: wallThickness }}
        />
        <div
          className="absolute bg-amber-950"
          style={{
            left: slotRight,
            top: midY - wallThickness / 2,
            width: width - slotRight,
            height: wallThickness,
          }}
        />

        {/* Bandas elásticas */}
        {elastics.map((elastic) => (
          <ElasticBand
            key={elastic.id}
            ref={(handle) => {
              elasticRefs.current[elastic.id] = handle;
            }}
            elastic={elastic}
            width={width}
            height={height}
          />
        ))}

        {/* Discos */}
        {pucks.map((puck) => (
          <div
            key={puck.id}
            className={`absolute rounded-full border-2 ${
              puck.color === 'white' ? 'border-neutral-400 bg-neutral-50' : 'border-black bg-neutral-900'
            }`}
            style={{
              left: puck.pos.x - puck.radius,
              top: puck.pos.y - puck.radius,
              width: puck.radius * 2,
              height: puck.radius * 2,
              boxShadow: puck.flash > 0 ? `0 0 0 4px rgba(217,119,6,${puck.flash})` : undefined,
            }}
          />
        ))}
      </div>
    </div>
  );
}
