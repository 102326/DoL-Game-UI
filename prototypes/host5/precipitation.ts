/** Two painters of the same field. The layer owner decides when to paint or stop. */
export type PrecipitationBackend = 'canvas' | 'svg';
type Weights = Readonly<{rain: number; snow: number}>;
const ns = 'http://www.w3.org/2000/svg';
const count = 36;
const colors = {rain: '#def2ff', snow: '#ffffff'};
type Kind = keyof Weights;

/** Immutable to its users: both painters read the same packed seed geometry. */
export function createParticleField() {
  const seeds = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) seeds.set([i * 89, i * 47, 2 + i % 3], i * 3);
  return (kind: Kind, width: number, height: number, time: number,
    visit: (index: number, x: number, y: number, size: number) => void) => {
    const snow = kind === 'snow';
    for (let i = 0; i < count; i++) {
      const x = (seeds[3*i]! + time * (snow ? 0.012 : 0.060)) % width;
      const y = (seeds[3*i+1]! + time * (snow ? 0.025 : 0.190)) % height;
      visit(i, x, y, snow ? seeds[3*i+2]! : 2);
    }
  };
}
type Field = ReturnType<typeof createParticleField>;

function canvasLayer(doc: Document, positions: Field) {
  const element = doc.createElement('canvas');
  const context = element.getContext('2d');
  if (!context) throw new Error('Canvas 2D unavailable');
  const ctx = context;
  function paint(width: number, height: number, time: number, weights: Weights) {
    if (element.width !== width) element.width = width;
    if (element.height !== height) element.height = height;
    ctx.clearRect(0, 0, width, height);
    for (const kind of ['rain', 'snow'] as const) {
      if (weights[kind] <= 0) continue;
      ctx.fillStyle = colors[kind];
      ctx.globalAlpha = weights[kind] * (kind === 'rain' ? 0.75 : 0.85);
      positions(kind, width, height, time, (_, x, y, size) => {
        if (kind === 'rain') ctx.fillRect(x, y, size, 13);
        else {
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }
  }
  return {element, paint};
}

function svgLayer(doc: Document, positions: Field) {
  const element = doc.createElementNS(ns, 'svg');
  const layers = (['rain', 'snow'] as const).map(kind => {
    const group = doc.createElementNS(ns, 'g');
    group.setAttribute('fill', colors[kind]);
    group.setAttribute('fill-opacity', '0');
    element.append(group);
    const shapes = Array.from({length: count}, (_, i) => {
      const shape = doc.createElementNS(ns, kind === 'rain' ? 'rect' : 'circle');
      if (kind === 'rain') {
        shape.setAttribute('width', '2');
        shape.setAttribute('height', '13');
      } else shape.setAttribute('r', String(2 + i % 3));
      group.append(shape);
      return shape;
    });
    return {kind, group, shapes};
  });
  function paint(width: number, height: number, time: number, weights: Weights) {
    for (const {kind, group, shapes} of layers) {
      const opacity = String(weights[kind] * (kind === 'rain' ? 0.75 : 0.85));
      if (group.getAttribute('fill-opacity') !== opacity) group.setAttribute('fill-opacity', opacity);
      if (weights[kind] <= 0) continue;
      positions(kind, width, height, time, (i, x, y) => {
        const shape = shapes[i]!;
        shape.setAttribute(kind === 'rain' ? 'x' : 'cx', String(x));
        shape.setAttribute(kind === 'rain' ? 'y' : 'cy', String(y));
      });
    }
  }
  return {element, paint};
}

export function createPrecipitation(root: HTMLElement, backend: PrecipitationBackend, field = createParticleField()) {
  const layer = backend === 'svg' ? svgLayer(root.ownerDocument, field) : canvasLayer(root.ownerDocument, field);
  layer.element.classList.add('host5-precipitation');
  layer.element.setAttribute('aria-hidden', 'true');
  layer.element.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
  root.prepend(layer.element);
  return {
    paint(timeMs: number, weights: Weights) {
      const width = root.clientWidth, height = root.clientHeight;
      if (width && height) layer.paint(width, height, timeMs, weights);
    },
    dispose() {layer.element.remove()}
  };
}
