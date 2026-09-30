import { Link } from 'react-router-dom';
import { GAME_MODES } from '../engine/Modes';

export default function Home() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center gap-6 p-6">
      <h1 className="mt-8 text-3xl font-bold">🥌 Sling Puck</h1>
      <p className="text-center text-sm opacity-70">Elegí un modo de juego para empezar</p>

      <nav className="flex w-full flex-col gap-3">
        {GAME_MODES.map((mode) => (
          <Link
            key={mode.id}
            to={`/${mode.id}`}
            className="rounded-xl bg-amber-700 px-4 py-3 text-center font-semibold text-white shadow transition hover:bg-amber-600 active:scale-[0.98]"
          >
            {mode.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
