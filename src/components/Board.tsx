import { useEffect, useMemo, useRef, useState } from 'react';
import { oppositeSide } from '../engine/Sides';
import type { GameState, Side, Vec2 } from '../engine/types';
import type { FinishedOutcome, GameMode } from '../modes/Types';
import { useDragLaunch } from '../hooks/UseDragLaunch';
import { useGameLoop } from '../hooks/UseGameLoop';
import { useAiOpponent } from '../hooks/UseAiOpponent';
import { useSoundEffects } from '../hooks/UseSoundEffects';
import ElasticBand, { type ElasticBandHandle } from './ElasticBand';
import WinBanner from './WinBanner';

const PHYSICS_DT = 1 / 60;
// Dos discos apenas rozándose (en reposo, uno contra otro) siguen generando eventos
// de colisión cuadro a cuadro con velocidad de impacto casi nula — este umbral evita
// que eso dispare sonido en bucle.
const MIN_IMPACT_FOR_SOUND = 25;

interface BoardProps {
  /** Modo que se juega: define el estado inicial, la condición de victoria, la propiedad y la IA. */
  mode: GameMode;
  /** Lado que controla el jugador humano; la IA toma el opuesto. */
  humanSide: Side;
  /** Se llama una sola vez por partida, cuando se decide el ganador — para llevar el marcador. */
  onFinish?: (outcome: FinishedOutcome) => void;
}

export default function Board({ mode, humanSide, onFinish }: BoardProps) {
  const aiSide = oppositeSide(humanSide);

  // Init perezosa: el estado inicial debe crearse una sola vez, no en cada render.
  const gameStateRef = useRef<GameState>(null!);
  if (gameStateRef.current === null) {
    gameStateRef.current = mode.createInitialState();
  }
  const board = gameStateRef.current.board;

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [outcome, setOutcome] = useState<FinishedOutcome | null>(null);
  // mode.evaluate se llama en cada cuadro (ver onFrame) y seguiría dando "terminada"
  // varios cuadros seguidos hasta que `paused` corte el loop — este ref evita repetir
  // el sonido y el onFinish() de más.
  const announcedRef = useRef(false);

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

  const { playHit, playGrab, playRelease, playVictory, playDefeat } = useSoundEffects();

  // Mismos callbacks para el jugador y para la IA: ambos animan el mismo chasquido
  // y suenan igual, estén controlados por un dedo o por useAiOpponent.
  const handleLoad = () => {
    playGrab();
  };
  const handleFire = (elasticId: string) => {
    elasticRefs.current[elasticId]?.snap();
    playRelease();
  };

  const { onPointerDown, onPointerMove, onPointerUp } = useDragLaunch({
    gameStateRef,
    playerSide: humanSide,
    canGrab: mode.canGrab,
    toBoardCoords,
    onLoad: handleLoad,
    onFire: handleFire,
  });

  useAiOpponent({
    gameStateRef,
    side: aiSide,
    pickShot: mode.pickAiShot,
    enabled: outcome === null,
    onLoad: handleLoad,
    onFire: handleFire,
  });

  useGameLoop({
    gameStateRef,
    dt: PHYSICS_DT,
    paused: outcome !== null,
    onFrame: (state, frame) => {
      for (const puck of state.pucks) {
        const el = puckRefs.current[puck.id];
        if (!el) continue;
        el.style.transform = `translate(${puck.pos.x - puck.radius}px, ${puck.pos.y - puck.radius}px)`;
        el.style.boxShadow = puck.flash > 0 ? `0 0 0 4px rgba(217,119,6,${puck.flash})` : 'none';
      }
      for (const elastic of state.elastics) {
        elasticRefs.current[elastic.id]?.update();
      }
      for (const collision of frame.collisions) {
        if (collision.impactSpeed > MIN_IMPACT_FOR_SOUND) playHit();
      }
      // El modo decide cuándo terminó la partida. Se evalúa en cada cuadro (no solo
      // cuando todo queda quieto) para cortar apenas se cumple la condición.
      const result = mode.evaluate(state);
      if (result.status === 'finished' && !announcedRef.current) {
        announcedRef.current = true;
        if (result.winner === humanSide) playVictory();
        else playDefeat();
        onFinish?.(result);
        setOutcome(result);
      }
    },
  });

  const handleRestart = () => {
    gameStateRef.current = mode.createInitialState();
    announcedRef.current = false;
    setOutcome(null);
  };

  const { pucks, elastics } = gameStateRef.current;
  const { slotLeft, slotRight, wallThickness, width, height } = board;
  const midY = height / 2;

  return (
    <div
      ref={wrapperRef}
      className="relative mx-auto w-full max-w-[420px] touch-none select-none rounded-xl bg-amber-800 shadow-xl"
      style={{ aspectRatio: `${width} / ${height}` }}
      onPointerDown={(e) => {
        // Con la partida ya terminada, el WinBanner (su botón "Jugar de nuevo" incluido)
        // vive dentro de este mismo <div>. Si igual capturáramos el puntero acá, el
        // navegador no llega a sintetizar el "click" sobre el botón — por eso cortamos
        // antes de hacer nada cuando ya hay resultado.
        if (outcome) return;
        // Capturamos el puntero: así seguimos recibiendo move/up aunque el dedo o el
        // mouse salgan del <div> (el tablero es chico, 420px) — antes, salir del área
        // disparaba onPointerLeave y soltaba el disco de golpe, cortando en seco el
        // estiramiento posible del elástico.
        e.currentTarget.setPointerCapture(e.pointerId);
        onPointerDown(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => onPointerMove(e.clientX, e.clientY)}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
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

      {outcome && <WinBanner winner={outcome.winner} reason={outcome.reason} onRestart={handleRestart} />}
    </div>
  );
}
