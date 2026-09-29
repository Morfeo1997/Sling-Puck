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
  board: BoardConfig;
}

export interface PhysicsConfig {
  /** Multiplicador de velocidad por frame (fricción). 1 = sin fricción. */
  friction: number;
  /** Por debajo de esta velocidad, el disco se considera detenido. */
  minVelocity: number;
  /** Restitución (0-1) al rebotar contra muros/bordes. */
  wallRestitution: number;
}
