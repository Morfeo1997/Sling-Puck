/**
 * La pelota: una esfera clara con un parche oscuro al medio. Es estática: la posición y el
 * destello de choque los maneja Board en el contenedor que la envuelve.
 */
export default function BallView() {
  return (
    <div
      className="relative h-full w-full rounded-full border-2 border-neutral-700"
      style={{ background: 'radial-gradient(circle at 35% 30%, #ffffff, #e5e7eb 55%, #9ca3af)' }}
    >
      <span
        className="absolute bg-neutral-900"
        style={{
          left: '50%',
          top: '50%',
          width: '46%',
          height: '46%',
          transform: 'translate(-50%, -50%)',
          clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
        }}
      />
    </div>
  );
}
