import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useLyricsMood, MoodPoint } from "../hooks/useLyricsMood";

function formatWeekLabel(week: string) {
  // "2025-07-07" → "07 Jul 2025"
  const [y, m, d] = week.split("-");
  return `${d} ${new Date(`${y}-${m}-01`).toLocaleString("default", {
    month: "short",
  })} ${y}`;
}

const TimelineChart: React.FC = () => {
  const { data, isLoading, error } = useLyricsMood();

  if (isLoading) return <p>Loading mood timeline…</p>;
  if (error) return <p className="text-red-500">{`${error}`}</p>;
  if (!data?.timeline.length) return <p>No mood data yet.</p>;

  // 1️⃣ Sort by week ascending
  const series: MoodPoint[] = [...data.timeline].sort((a, b) =>
    a.week.localeCompare(b.week)
  );

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={series} margin={{ top: 40, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="week"
          tickFormatter={formatWeekLabel}
          tick={{ fontSize: 12 }}
        />
        <YAxis
          domain={[-1, 1]}
          tick={{ fontSize: 12 }}
          label={{ value: "Mood score", angle: -90, position: "insideLeft" }}
        />
        <Tooltip
          formatter={(v: number) => v.toFixed(2)}
          labelFormatter={formatWeekLabel}
        />
        <Legend verticalAlign="top" height={36} />
        <Line
          type="monotone"
          dataKey="valence"
          name="Valence (happy ↔ sad)"
          stroke="#34d399"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="energy"
          name="Energy"
          stroke="#60a5fa"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default TimelineChart;
