export interface SoundPool {
  /** Elige una variante al azar del pool y la reproduce. */
  play: () => void;
}

/**
 * Crea un pool de variantes de un mismo efecto: en cada play() elige una al azar
 * (evita que suene idéntico siempre) y reproduce una instancia clonada, así dos
 * golpes casi simultáneos no se cortan entre sí ni comparten posición de reproducción.
 */
export function createSoundPool(urls: string[], volume = 1): SoundPool {
  if (urls.length === 0) {
    return { play: () => {} };
  }

  const templates = urls.map((url) => {
    const audio = new Audio(url);
    audio.preload = 'auto';
    audio.volume = volume;
    return audio;
  });

  return {
    play: () => {
      const template = templates[Math.floor(Math.random() * templates.length)];
      const instance = template.cloneNode(true) as HTMLAudioElement;
      instance.volume = template.volume;
      // Los navegadores bloquean el audio hasta la primera interacción del usuario;
      // en esta app todo disparo de sonido ya ocurre después de un pointerdown o un
      // disparo, así que el bloqueo inicial no debería notarse — igual, atajamos la
      // promesa rechazada para que un fallo de reproducción no rompa nada más.
      instance.play().catch(() => {});
    },
  };
}
