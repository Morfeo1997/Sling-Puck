import { forwardRef, useImperativeHandle, useRef } from 'react';
import { gsap } from 'gsap';
import type { ElasticBand as ElasticBandData } from '../engine/types';

export interface ElasticBandHandle {
  /**
   * Sincroniza la banda visual con elastic.pouchPos al instante (sin animar).
   * Se llama en cada cuadro del game loop mientras no haya un snap() en curso.
   */
  update: () => void;
  /** Anima el chasquido de vuelta a reposo. Llamarlo justo cuando el engine dispara el disco. */
  snap: () => void;
}

interface ElasticBandProps {
  elastic: ElasticBandData;
  width: number;
  height: number;
}

/**
 * `elastic` llega como referencia estable (el engine la muta in place, nunca la reemplaza),
 * así que leer elastic.pouchPos/restPos dentro de update()/snap() siempre da el valor actual,
 * aunque este componente no vuelva a renderizar. Por eso no hace falta ningún useEffect atado
 * a props: todo el sincronismo por cuadro es imperativo, disparado desde useGameLoop.
 */
const ElasticBand = forwardRef<ElasticBandHandle, ElasticBandProps>(function ElasticBand(
  { elastic, width, height },
  ref
) {
  const leftLineRef = useRef<SVGLineElement>(null);
  const rightLineRef = useRef<SVGLineElement>(null);
  const visualPouch = useRef({ x: elastic.pouchPos.x, y: elastic.pouchPos.y });
  const animating = useRef(false);

  function applyToLines() {
    const { x, y } = visualPouch.current;
    leftLineRef.current?.setAttribute('x2', String(x));
    leftLineRef.current?.setAttribute('y2', String(y));
    rightLineRef.current?.setAttribute('x2', String(x));
    rightLineRef.current?.setAttribute('y2', String(y));
  }

  useImperativeHandle(ref, () => ({
    update: () => {
      if (animating.current) return;
      visualPouch.current.x = elastic.pouchPos.x;
      visualPouch.current.y = elastic.pouchPos.y;
      applyToLines();
    },
    snap: () => {
      animating.current = true;
      gsap.killTweensOf(visualPouch.current);
      gsap.to(visualPouch.current, {
        x: elastic.restPos.x,
        y: elastic.restPos.y,
        duration: 0.35,
        ease: 'elastic.out(1, 0.4)',
        onUpdate: applyToLines,
        onComplete: () => {
          animating.current = false;
        },
      });
    },
  }));

  return (
    <svg className="pointer-events-none absolute left-0 top-0" width={width} height={height}>
      <line
        ref={leftLineRef}
        x1={elastic.anchorLeft.x}
        y1={elastic.anchorLeft.y}
        x2={visualPouch.current.x}
        y2={visualPouch.current.y}
        stroke="#d97706"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <line
        ref={rightLineRef}
        x1={elastic.anchorRight.x}
        y1={elastic.anchorRight.y}
        x2={visualPouch.current.x}
        y2={visualPouch.current.y}
        stroke="#d97706"
        strokeWidth={3}
        strokeLinecap="round"
      />
    </svg>
  );
});

export default ElasticBand;
