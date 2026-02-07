"use client";

type BarPoint = {
  label: string;
  value: number;
};

export default function MiniBarChart({
  data,
  height = 80,
}: {
  data: BarPoint[];
  height?: number;
}) {
  if (data.length === 0) return null;

  const max = Math.max(...data.map((d) => d.value), 1);
  const width = 240;
  const barWidth = width / data.length;

  return (
    <svg
      width={width}
      height={height + 22}
      viewBox={`0 0 ${width} ${height + 22}`}
      role="img"
      aria-label="bar chart"
    >
      {data.map((point, index) => {
        const barHeight = (point.value / max) * height;
        const x = index * barWidth + 6;
        const y = height - barHeight + 6;
        return (
          <g key={point.label}>
            <rect
              x={x}
              y={y}
              width={barWidth - 12}
              height={barHeight}
              rx={4}
              fill="currentColor"
              opacity={0.8}
            />
            <text
              x={x + (barWidth - 12) / 2}
              y={height + 18}
              textAnchor="middle"
              fontSize="9"
              fill="currentColor"
              opacity={0.6}
            >
              {point.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
