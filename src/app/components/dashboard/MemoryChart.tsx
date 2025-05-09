import React from "react";
import dynamic from "next/dynamic";
import Chart from "chart.js/auto";
import annotationPlugin from "chartjs-plugin-annotation";
import type { ChartOptions } from "chart.js";
import type { AnnotationOptions } from "chartjs-plugin-annotation";
import { TimeSeriesMetric } from "./types";


Chart.register(annotationPlugin);

const LineChartComponent = dynamic(
  () => import("react-chartjs-2").then((mod) => mod.Line),
  { ssr: false }
);

interface MemoryChartProps {
  selectedApp: string | null;
  timeSeriesData: Record<string, TimeSeriesMetric[]>;
  darkMode: boolean;
}

export const MemoryChart: React.FC<MemoryChartProps> = ({
  selectedApp,
  timeSeriesData,
  darkMode,
}) => {
  if (!selectedApp || !timeSeriesData[selectedApp]) return null;

  const appData = timeSeriesData[selectedApp];

  const data = {
    labels: appData.map((item) => new Date(item.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: "Memory (MB)",
        data: appData.map((item) => item.memory),
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Resident Memory (MB)",
        data: appData.map((item) => item.residentMemory),
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Shared Memory (MB)",
        data: appData.map((item) => item.sharedMemory),
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Top %MEM",
        data: appData.map((item) => item.topMEM),
        borderColor: "rgba(255, 206, 86, 1)",
        backgroundColor: "rgba(255, 206, 86, 0.2)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // const options: ChartOptions<"line"> = {
  //   responsive: true,
  //   scales: {
  //     y: {
  //       beginAtZero: true,
  //       title: { display: true, text: "Memory (MB or %)" },
  //     },
  //     x: {
  //       title: { display: true, text: "Time" },
  //     },
  //   },
  //   plugins: {
  //     legend: { position: "top" },
  //     title: { display: true, text: `Memory Analytics for ${selectedApp}` },
  //     tooltip: {
  //       callbacks: {
  //         label: (context) =>
  //           `${context.dataset.label ?? ""}: ${context.parsed.y} ${
  //             context.dataset.label && context.dataset.label.includes("%") ? "%" : "MB"
  //           }`,
  //       },
  //     },
  //     annotation: {
  //       annotations: {
  //         line1: {
  //           type: "line" as const,
  //           yMin: 0.5,
  //           yMax: 0.5,
  //           borderColor: "red",
  //           borderWidth: 2,
  //           label: {
  //             content: "High %MEM Threshold",
  //             enabled: true,
  //             position: "end" as const,
  //           },
  //         } as AnnotationOptions<"line">,
  //       },
  //     },
  //   },
  // };

  const options: ChartOptions<"line"> = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "Memory (MB or %)" },
      },
      x: {
        title: { display: true, text: "Time" },
      },
    },
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: `Memory Analytics for ${selectedApp}` },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label ?? "";
            const value = context.parsed.y;
  
            switch (label) {
              case "Memory (MB)":
                return `Used Memory: ${value} MB — Total memory used by the application`;
              case "Resident Memory (MB)":
                return `RES: ${value} MB — Non-swappable memory in RAM`;
              case "Shared Memory (MB)":
                return `SHR: ${value} MB — Memory shared with other processes`;
              case "Top %MEM":
                return `%MEM: ${value}% — Percentage of physical RAM used by this process`;
              default:
                return `${label}: ${value}`;
            }
          },
        },
      },
      annotation: {
        annotations: {
          line1: {
            type: "line" as const,
            yMin: 0.5,
            yMax: 0.5,
            borderColor: "red",
            borderWidth: 2,
            label: {
              content: "High %MEM Threshold",
              enabled: true,
              position: "end" as const,
            },
          } as AnnotationOptions<"line">,
        },
      },
    },
  };
  

  return (
    <div
      className={`mb-4 p-4 rounded-lg shadow-md ${
        darkMode ? "bg-gray-800" : "bg-white"
      }`}
    >
      <LineChartComponent data={data} options={options} />
    </div>
  );
};