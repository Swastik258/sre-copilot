const VIEWBOX = { width: 900, height: 760 } as const;

type Point = readonly [number, number];

function closedSmoothPath(points: readonly Point[]): string {
  if (points.length < 3) return "";
  const n = points.length;
  let path = `M ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}`;
  for (let i = 0; i < n; i += 1) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    path += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return `${path} Z`;
}

function contourPath(index: number, rings: number): string {
  const progress = index / Math.max(1, rings - 1);
  const radiusX = 48 + progress * 560;
  const radiusY = 36 + progress * 470;
  const points: Point[] = [];
  const count = 14;
  for (let point = 0; point < count; point += 1) {
    const angle = (point / count) * Math.PI * 2;
    const wobble =
      1 +
      Math.sin(angle * 3 + index * 0.62) * 0.028 +
      Math.cos(angle * 5 - index * 0.38) * 0.014;
    const driftX = Math.sin(index * 0.8) * 6;
    const driftY = Math.cos(index * 0.54) * 8;
    points.push([
      VIEWBOX.width * 0.57 + Math.cos(angle) * radiusX * wobble + driftX,
      VIEWBOX.height * 0.48 + Math.sin(angle) * radiusY * wobble + driftY,
    ]);
  }
  return closedSmoothPath(points);
}

export function ContourField({
  className = "",
  rings = 11,
}: {
  className?: string;
  rings?: number;
}) {
  const paths = Array.from({ length: rings }, (_, index) => contourPath(index, rings));

  return (
    <svg
      className={`contour-field ${className}`.trim()}
      viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="0.8"
        vectorEffect="non-scaling-stroke"
      >
        {paths.map((path, index) => (
          <path
            key={path}
            d={path}
            opacity={0.22 + (index / Math.max(1, rings - 1)) * 0.34}
          />
        ))}
      </g>
    </svg>
  );
}
