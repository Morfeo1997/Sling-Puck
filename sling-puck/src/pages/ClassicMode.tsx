import { Link } from 'react-router-dom';
import Board from '../components/Board';

export default function ClassicMode() {
  return (
    <div className="flex min-h-screen flex-col items-center gap-4 p-4">
      <div className="flex w-full max-w-[420px] items-center justify-between">
        <Link to="/" className="text-sm opacity-70 hover:opacity-100">
          ← Modos
        </Link>
        <h1 className="text-lg font-semibold">Clásico</h1>
        <span className="w-10" />
      </div>
      <Board />
    </div>
  );
}
