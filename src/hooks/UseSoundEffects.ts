import { useMemo } from 'react';
import { createSoundPool } from '../lib/Audio';

// Archivos en /public/sounds/ — Vite los sirve tal cual, sin pasar por el bundler.
const HIT_SOUNDS = ['/sounds/hits/hit-1.wav', '/sounds/hits/hit-2.wav', '/sounds/hits/hit-3.wav'];
const ELASTIC_SOUNDS = [
  '/sounds/elastic/elastic-1.wav',
  '/sounds/elastic/elastic-2.wav',
  '/sounds/elastic/elastic-3.wav',
];
// Un solo archivo cada uno — no hace falta variedad para algo que suena una vez por partida.
const VICTORY_SOUNDS = ['/sounds/victory.wav'];
const DEFEAT_SOUNDS = ['/sounds/defeat.wav'];

/**
 * playGrab y playRelease hoy tocan el mismo pool (asumimos que los 3 wav del elástico
 * son variantes genéricas para ambas acciones). Si en realidad querés sonidos
 * distintos para agarrar y para soltar, acá es donde se separarían en dos
 * createSoundPool() con sus propias URLs — los call-sites no cambian.
 */
export function useSoundEffects() {
  const hitPool = useMemo(() => createSoundPool(HIT_SOUNDS, 0.7), []);
  const elasticPool = useMemo(() => createSoundPool(ELASTIC_SOUNDS, 0.8), []);
  const victoryPool = useMemo(() => createSoundPool(VICTORY_SOUNDS, 0.9), []);
  const defeatPool = useMemo(() => createSoundPool(DEFEAT_SOUNDS, 0.9), []);

  return {
    playHit: hitPool.play,
    playGrab: elasticPool.play,
    playRelease: elasticPool.play,
    playVictory: victoryPool.play,
    playDefeat: defeatPool.play,
  };
}
