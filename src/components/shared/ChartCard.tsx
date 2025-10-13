"use client";

import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";

interface ChartCardProps {
  title: string;
  labels: string[];
  data: number[];
  color?: string;
}

export const ChartCard = ({
  title,
  labels,
  data,
  color = "#2563eb",
}: ChartCardProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: title,
            data,
            backgroundColor: color + "80",
            borderColor: color,
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: { beginAtZero: true },
        },
      },
    });

    return () => chart.destroy();
  }, [labels, data, color, title]);

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold mb-2">{title}</h3>
      <canvas ref={canvasRef} height={200} />
    </div>
  );
};
