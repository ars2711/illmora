"use client";

type SparklinePoint = number;

export default function Sparkline({
  points,
  stroke = "#0f172a",
}: {
  points: SparklinePoint[];
  stroke?: string;
}) {
  if (points.length < 2) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const width = 120;
  const height = 32;
  const step = width / (points.length - 1);

  const coords = points
    .map((value, index) => {
      const x = index * step;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="trend"
      className="overflow-visible"
    >
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coords}
      />
    </svg>
  );
}
