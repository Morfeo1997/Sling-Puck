import { useMemo } from 'react';
import { createSoundPool } from '../lib/Audio';

// Archivos en /public/sounds/ — Vite los sirve tal cual, sin pasar por el bundler.
const HIT_SOUNDS = ['/sounds/hits/hit-1.wav', '/sounds/hits/hit-2.wav', '/sounds/hits/hit-3.wav'];
const ELASTIC_SOUNDS = [
  '/sounds/elastic/elastic-1.wav',
  '/sounds/elastic/elastic-2.wav',
  '/sounds/elastic/elastic-3.wav',
];

/**
 * playGrab y playRelease hoy tocan el mismo pool (asumimos que los 3 wav del elástico
 * son variantes genéricas para ambas acciones). Si en realidad querés sonidos
 * distintos para agarrar y para soltar, acá es donde se separarían en dos
 * createSoundPool() con sus propias URLs — los call-sites no cambian.
 */
export function useSoundEffects() {
  const hitPool = useMemo(() => createSoundPool(HIT_SOUNDS, 0.7), []);
  const elasticPool = useMemo(() => createSoundPool(ELASTIC_SOUNDS, 0.8), []);

  return {
    playHit: hitPool.play,
    playGrab: elasticPool.play,
    playRelease: elasticPool.play,
  };
}
