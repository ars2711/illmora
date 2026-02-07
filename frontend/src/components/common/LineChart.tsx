"use client";

type LineChartPoint = {
  label: string;
  value: number;
};

export default function LineChart({
  data,
  height = 140,
  stroke = "#0f172a",
  unit,
}: {
  data: LineChartPoint[];
  height?: number;
  stroke?: string;
  unit?: string;
}) {
  if (data.length < 2) return null;

  const width = 360;
  const padding = 24;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = chartWidth / (data.length - 1);

  const points = data
    .map((point, index) => {
      const x = padding + index * stepX;
      const y =
        padding + chartHeight - ((point.value - min) / range) * chartHeight;
      return `${x},${y}`;
    })
    .join(" ");

  const axisLabel = (value: number) => (unit ? `${value}${unit}` : `${value}`);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="line chart"
    >
      <line
        x1={padding}
        y1={padding}
        x2={padding}
        y2={height - padding}
        stroke="currentColor"
        opacity={0.2}
      />
      <line
        x1={padding}
        y1={height - padding}
        x2={width - padding}
        y2={height - padding}
        stroke="currentColor"
        opacity={0.2}
      />
      <text
        x={padding}
        y={padding - 8}
        fontSize="10"
        fill="currentColor"
        opacity={0.5}
      >
        {axisLabel(max)}
      </text>
      <text
        x={padding}
        y={height - 6}
        fontSize="10"
        fill="currentColor"
        opacity={0.5}
      >
        {axisLabel(min)}
      </text>
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      {data.map((point, index) => {
        const x = padding + index * stepX;
        return (
          <text
            key={point.label}
            x={x}
            y={height - 6}
            fontSize="9"
            fill="currentColor"
            opacity={0.5}
            textAnchor="middle"
          >
            {point.label}
          </text>
        );
      })}
    </svg>
  );
}
