// Placeholder QR graphic generated deterministically from the pass code.
// It is not a scannable QR code; replace with a real encoder (e.g. `qrcode`) once passes are issued by the backend.

const SIZE = 25;

function isFinder(x: number, y: number) {
  const inBox = (bx: number, by: number) => x >= bx && x < bx + 7 && y >= by && y < by + 7;
  return inBox(0, 0) || inBox(SIZE - 7, 0) || inBox(0, SIZE - 7);
}

function finderCell(x: number, y: number) {
  const lx = x >= SIZE - 7 ? x - (SIZE - 7) : x;
  const ly = y >= SIZE - 7 ? y - (SIZE - 7) : y;
  const ring = lx === 0 || lx === 6 || ly === 0 || ly === 6;
  const core = lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4;
  return ring || core;
}

export default function FakeQr({ value, className }: { value: string; className?: string }) {
  let seed = 0;
  for (const char of value) seed = (seed * 31 + char.charCodeAt(0)) >>> 0;

  const cells: [number, number][] = [];
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      if (isFinder(x, y)) {
        if (finderCell(x, y)) cells.push([x, y]);
        continue;
      }
      seed = (seed * 1103515245 + 12345) >>> 0;
      if ((seed >>> 16) % 2 === 0) cells.push([x, y]);
    }
  }

  return (
    <svg viewBox={`-2 -2 ${SIZE + 4} ${SIZE + 4}`} className={className} role="img" aria-label={`QR code for pass ${value}`}>
      <rect x="-2" y="-2" width={SIZE + 4} height={SIZE + 4} fill="#fff" />
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1.02" height="1.02" fill="#1c1917" />
      ))}
    </svg>
  );
}
