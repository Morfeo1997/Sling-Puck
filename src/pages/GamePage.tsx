import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import Board from '../components/Board';
import type { Side } from '../engine/types';
import { getMode } from '../modes/Registry';
import type { FinishedOutcome, GameMode } from '../modes/Types';

/** El humano siempre juega abajo (blanco); la IA, arriba (negro). */
const HUMAN_SIDE: Side = 'bottom';

function GameScreen({ mode }: { mode: GameMode }) {
  // Vive acá y no en Board: tiene que sobrevivir a cada "Jugar de nuevo",
  // que solo reinicia el estado de la partida, no el marcador de la sesión.
  const [score, setScore] = useState<Record<Side, number>>({ bottom: 0, top: 0 });

  const handleFinish = (outcome: FinishedOutcome) => {
    setScore((prev) => ({ ...prev, [outcome.winner]: prev[outcome.winner] + 1 }));
  };

  return (
    <div className="flex min-h-screen flex-col items-center gap-4 p-4">
      <div className="flex w-full max-w-[420px] items-center justify-between">
        <Link to="/" className="text-sm opacity-70 hover:opacity-100">
          ← Modos
        </Link>
        <h1 className="text-lg font-semibold">{mode.label}</h1>
        <div className="flex items-center gap-1.5 text-sm font-semibold tabular-nums">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-neutral-50 ring-1 ring-neutral-400" />
          <span>{score.bottom}</span>
          <span className="opacity-40">–</span>
          <span>{score.top}</span>
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-neutral-900" />
        </div>
      </div>
      <Board mode={mode} humanSide={HUMAN_SIDE} onFinish={handleFinish} />
    </div>
  );
}

/** Ruta única /:modeId: busca el modo en el registro y, si no existe, vuelve al Home. */
export default function GamePage() {
  const { modeId } = useParams();
  const mode = modeId ? getMode(modeId) : undefined;
  if (!mode) return <Navigate to="/" replace />;
  // key: al cambiar de modo se remonta todo (estado de partida y marcador de la sesión).
  return <GameScreen key={mode.id} mode={mode} />;
}
