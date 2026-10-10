import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import GamePage from './pages/GamePage';

/**
 * Se monta dentro de <BrowserRouter> en App.tsx. Ya no hace falta tocarlo al sumar
 * un modo: /:modeId resuelve el modo por id contra modes/registry.ts.
 */
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/:modeId" element={<GamePage />} />
    </Routes>
  );
}
