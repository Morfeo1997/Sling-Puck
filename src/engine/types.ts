export type Vec2 = { x: number; y: number };

/** Color visual de un disco. Ya no define de quién es: eso lo decide `owner`. */
export type PuckColor = 'white' | 'black';

/** Lado del tablero. 'bottom' es el del jugador humano y 'top' el del rival. */
export type Side = 'top' | 'bottom';

export interface Puck {
  id: string;
  pos: Vec2;
  vel: Vec2;
  /** Solo visual (blanco / negro). */
  color: PuckColor;
  /** Lado que puede cargarlo y dispararlo. null = neutral (lo definirá cada modo). */
  owner: Side | null;
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
  /** Lado al que pertenece: carga y dispara los discos que ese lado pueda agarrar. */
  side: Side;
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
