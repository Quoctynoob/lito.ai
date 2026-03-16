'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// Generate normal distribution data points
function generateBellCurve(mean: number, stdDev: number, points = 100) {
  const data = [];
  const start = 0;
  const end = 100;
  const step = (end - start) / points;

  for (let x = start; x <= end; x += step) {
    const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2));
    const y = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
    data.push({ x: Math.round(x * 10) / 10, y });
  }

  return data;
}

// Custom tooltip component
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
        <p className="text-xs font-medium text-slate-700">
          Performance Index: <span className="font-semibold">{payload[0].payload.x}</span>
        </p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: <span className="font-semibold">{(entry.value * 100).toFixed(2)}%</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Custom legend component
const CustomLegend = ({ payload }: any) => {
  return (
    <div className="flex justify-end gap-4 pr-4">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs font-medium text-slate-600">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export function BellCurveChart() {
  const chartData = useMemo(() => {
    // 2026 batch: lower mean (around 50)
    const batch2026 = generateBellCurve(50, 15);

    // Current lito batch: higher mean (around 66), showing 32% better performance
    const currentBatch = generateBellCurve(66, 12);

    // Combine data for both curves
    const combined = batch2026.map((point, index) => ({
      x: point.x,
      '2026 Batch': point.y,
      'Current Lito Batch': currentBatch[index]?.y || 0,
    }));

    return combined;
  }, []);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex flex-col">
          <h3 className="text-base font-semibold text-slate-800">
            Comparative Bell Curve Analysis
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Your current stack is outperforming the 2026 benchmark averages by 32%.
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="color2026" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#301399" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#301399" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34D399" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#34D399" stopOpacity={0.1} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />

            <XAxis
              dataKey="x"
              stroke="#64748b"
              style={{ fontSize: '12px' }}
              label={{
                value: 'Performance Index',
                position: 'insideBottom',
                offset: -5,
                style: { fontSize: '12px', fill: '#475569', fontWeight: 600 }
              }}
            />

            <YAxis
              stroke="#64748b"
              style={{ fontSize: '12px' }}
              label={{
                value: 'Concentration',
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: '12px', fill: '#475569', fontWeight: 600 }
              }}
              tickFormatter={(value) => `${(value * 100).toFixed(1)}%`}
            />

            <Tooltip content={<CustomTooltip />} />

            <Legend
              content={<CustomLegend />}
              wrapperStyle={{ paddingTop: '10px' }}
            />

            <Area
              type="monotone"
              dataKey="2026 Batch"
              stroke="#ABA6C6"
              strokeWidth={1.5}
              fill="url(#color2026)"
              activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
              animationDuration={800}
            />

            <Area
              type="monotone"
              dataKey="Current Lito Batch"
              stroke="#4FA49F"
              strokeWidth={1.5}
              fill="url(#colorCurrent)"
              activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
