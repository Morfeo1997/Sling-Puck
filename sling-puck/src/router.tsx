import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ClassicMode from './pages/ClassicMode';
import { classicMode } from './engine/rules/Classic';

/**
 * Se monta dentro de <BrowserRouter> en App.tsx. Cada modo nuevo suma una <Route> acá
 * y su entrada correspondiente en engine/modes.ts — Home.tsx no necesita tocarse.
 */
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path={`/${classicMode.id}`} element={<ClassicMode />} />
    </Routes>
  );
}
