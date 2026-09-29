import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { gsap } from 'gsap';
import type { ElasticBand as ElasticBandData } from '../engine/types';

export interface ElasticBandHandle {
  /** Anima el chasquido de vuelta a reposo. Llamarlo justo cuando el engine dispara el disco. */
  snap: () => void;
}

interface ElasticBandProps {
  elastic: ElasticBandData;
  width: number;
  height: number;
}

/**
 * La posición del bolsillo mientras se arrastra viene 1:1 del engine (elastic.pouchPos).
 * Al soltar, el engine resetea esa posición al instante — así que el "chasquido" que se
 * ve acá es puramente visual: un tween de GSAP sobre un punto propio del componente,
 * aplicado a mano a los <line> vía refs (no vía props) para no depender del ciclo de
 * render de React en una animación de 60fps.
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

  // Mientras se arrastra (no hay animación de chasquido en curso), la banda sigue
  // 1:1 la posición real que calcula el engine.
  useEffect(() => {
    if (animating.current) return;
    visualPouch.current = { x: elastic.pouchPos.x, y: elastic.pouchPos.y };
    applyToLines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elastic.pouchPos.x, elastic.pouchPos.y]);

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
