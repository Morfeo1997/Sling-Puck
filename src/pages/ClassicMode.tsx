import { useState } from 'react';
import { Link } from 'react-router-dom';
import Board from '../components/Board';
import type { PuckColor } from '../engine/types';

export default function ClassicMode() {
  // Vive acá y no en Board: tiene que sobrevivir a cada "Jugar de nuevo",
  // que solo reinicia el estado de la partida, no el marcador de la sesión.
  const [score, setScore] = useState<Record<PuckColor, number>>({ white: 0, black: 0 });

  const handleWin = (winner: PuckColor) => {
    setScore((prev) => ({ ...prev, [winner]: prev[winner] + 1 }));
  };

  return (
    <div className="flex min-h-screen flex-col items-center gap-4 p-4">
      <div className="flex w-full max-w-[420px] items-center justify-between">
        <Link to="/" className="text-sm opacity-70 hover:opacity-100">
          ← Modos
        </Link>
        <h1 className="text-lg font-semibold">Clásico</h1>
        <div className="flex items-center gap-1.5 text-sm font-semibold tabular-nums">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-neutral-50 ring-1 ring-neutral-400" />
          <span>{score.white}</span>
          <span className="opacity-40">–</span>
          <span>{score.black}</span>
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-neutral-900" />
        </div>
      </div>
      <Board onWin={handleWin} />
    </div>
  );
}
