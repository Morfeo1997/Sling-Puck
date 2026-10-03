export type Vec2 = { x: number; y: number };

export type PuckColor = 'white' | 'black';

export interface Puck {
  id: string;
  pos: Vec2;
  vel: Vec2;
  color: PuckColor;
  radius: number;
  /** 0..1, usado por la UI para el destello al chocar. Lo decrementa el motor, lo dibuja React. */
  flash: number;
  /** true mientras el jugador lo está arrastrando: el motor no lo integra ni lo desplaza. */
  frozen?: boolean;
}

export interface BoardConfig {
  width: number;
  height: number;
  /** Los muros centrales van de x=0 a slotLeft y de x=slotRight a width. Entre medio, el hueco por donde pasan los discos. */
  slotLeft: number;
  slotRight: number;
  wallThickness: number;
}

export interface GameState {
  pucks: Puck[];
  elastics: ElasticBand[];
  board: BoardConfig;
}

export interface ElasticBand {
  id: string;
  /** El elástico de un color solo puede cargar/disparar discos de ese mismo color. */
  color: PuckColor;
  /** Posición de reposo del bolsillo (sin estirar). */
  restPos: Vec2;
  /** Posición actual del bolsillo: igual a restPos salvo mientras está cargado y se estira. */
  pouchPos: Vec2;
  anchorLeft: Vec2;
  anchorRight: Vec2;
  /** Distancia máxima desde restPos a la que se puede acercar un disco para engancharlo. */
  captureRadius: number;
  /** Distancia máxima de estiramiento desde restPos. */
  maxStretch: number;
  /** Multiplicador que convierte el vector de estiramiento en velocidad de disparo. */
  power: number;
  /** id del disco actualmente enganchado, o null si está libre. */
  loadedPuckId: string | null;
}

export interface PhysicsConfig {
  /** Multiplicador de velocidad por frame (fricción). 1 = sin fricción. */
  friction: number;
  /** Por debajo de esta velocidad, el disco se considera detenido. */
  minVelocity: number;
  /** Restitución (0-1) al rebotar contra muros/bordes. */
  wallRestitution: number;
}

/**
 * Contrato que implementa cada modo de juego (clásico, puntos, etc.). Home.tsx puede
 * mapear una lista de GameMode a rutas/cards sin conocer las reglas de cada uno.
 */
export interface GameMode {
  id: string;
  label: string;
  initialState: () => GameState;
  /** Devuelve el color ganador, o null si la partida sigue en curso. */
  checkWin: (state: GameState) => PuckColor | null;
}
