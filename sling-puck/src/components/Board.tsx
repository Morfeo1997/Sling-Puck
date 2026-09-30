import { useEffect, useMemo, useRef, useState } from 'react';
import { createClassicState } from '../engine/Board';
import { checkWin } from '../engine/rules/Classic';
import type { GameState, PuckColor, Vec2 } from '../engine/Types';
import { useDragLaunch } from '../hooks/UseDragLaunch';
import { useGameLoop } from '../hooks/UseGameLoop';
import ElasticBand, { type ElasticBandHandle } from './ElasticBand';
import WinBanner from './WinBanner';

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
  const [winner, setWinner] = useState<PuckColor | null>(null);

  // Refs a los nodos reales: el game loop los mueve a mano, sin pasar por setState.
  const puckRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const elasticRefs = useRef<Record<string, ElasticBandHandle | null>>({});

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / board.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [board.width]);

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

  const { onPointerDown, onPointerMove, onPointerUp } = useDragLaunch({
    gameStateRef,
    toBoardCoords,
    onFire: (elasticId) => {
      elasticRefs.current[elasticId]?.snap();
    },
  });

  useGameLoop({
    gameStateRef,
    dt: PHYSICS_DT,
    paused: winner !== null,
    onFrame: (state) => {
      for (const puck of state.pucks) {
        const el = puckRefs.current[puck.id];
        if (!el) continue;
        el.style.transform = `translate(${puck.pos.x - puck.radius}px, ${puck.pos.y - puck.radius}px)`;
        el.style.boxShadow = puck.flash > 0 ? `0 0 0 4px rgba(217,119,6,${puck.flash})` : 'none';
      }
      for (const elastic of state.elastics) {
        elasticRefs.current[elastic.id]?.update();
      }
    },
    onSettle: (state) => {
      const winnerColor = checkWin(state);
      if (winnerColor) setWinner(winnerColor);
    },
  });

  const handleRestart = () => {
    gameStateRef.current = createClassicState();
    setWinner(null);
  };

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

        {/* Discos: posición inicial vía style, después el game loop la actualiza por ref */}
        {pucks.map((puck) => (
          <div
            key={puck.id}
            ref={(el) => {
              puckRefs.current[puck.id] = el;
            }}
            className={`absolute left-0 top-0 rounded-full border-2 ${
              puck.color === 'white' ? 'border-neutral-400 bg-neutral-50' : 'border-black bg-neutral-900'
            }`}
            style={{
              width: puck.radius * 2,
              height: puck.radius * 2,
              transform: `translate(${puck.pos.x - puck.radius}px, ${puck.pos.y - puck.radius}px)`,
            }}
          />
        ))}
      </div>

      {winner && <WinBanner winner={winner} onRestart={handleRestart} />}
    </div>
  );
}
