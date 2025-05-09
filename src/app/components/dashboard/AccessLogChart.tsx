import React from "react";
import dynamic from "next/dynamic";
import Chart from "chart.js/auto";
import type { ChartOptions } from "chart.js";
import { AccessLogInsight, LogFileInsights } from "./types";

Chart.register();

const PieChartComponent = dynamic(
  () => import("react-chartjs-2").then((mod) => mod.Pie),
  { ssr: false }
);

interface AccessLogChartProps {
  selectedApp: string | null;
  selectedLogFile: string | null;
  accessLogInsights: AccessLogInsight[];
  logFileInsights: LogFileInsights;
  darkMode: boolean;
  onClearSelection: () => void;
}

export const AccessLogChart: React.FC<AccessLogChartProps> = ({
  selectedApp,
  selectedLogFile,
  accessLogInsights,
  logFileInsights,
  darkMode,
  onClearSelection,
}) => {
  if (selectedApp) return null;

  const insights = selectedLogFile
    ? logFileInsights[selectedLogFile] || []
    : accessLogInsights;

  const title = selectedLogFile
    ? `Access Log Analytics for ${selectedLogFile}`
    : "Overall Access Log Analytics";

  const count = insights.length;
  const isEmpty = insights.length === 0;

  const data = {
    labels: insights.map((insight) => `${insight.browser} on ${insight.os}`),
    datasets: [
      {
        label: "Access Log Distribution",
        data: insights.map((insight) => insight.count),
        backgroundColor: [
          "rgba(75, 192, 192, 0.6)",
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(153, 102, 255, 0.6)",
        ],
        borderColor: [
          "rgba(75, 192, 192, 1)",
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(153, 102, 255, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const options: ChartOptions<"pie"> = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: title,
        color: darkMode ? "#fff" : "#333",
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ${context.parsed} requests`,
        },
      },
    },
  };

  return (
    <div
      className={`mb-6 p-4 rounded-lg shadow-md ${
        darkMode ? "bg-gray-800" : "bg-white"
      }`}
    >
      <div className="px-4 py-3 border-b border-gray-700 font-mono text-sm flex justify-between items-center">
        <div className="flex items-center">
          <div className="flex space-x-2 mr-4">
            <div className="h-3 w-3 rounded-full bg-red-500"></div>
            <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
          </div>
          <h2 className="font-semibold">{title}</h2>
        </div>
        <div className="text-xs">
          {count} unique browser/OS combinations
          {selectedLogFile && (
            <button
              onClick={onClearSelection}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              [Clear Selection]
            </button>
          )}
        </div>
      </div>
      <div className={`p-4 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        {isEmpty ? (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-2">{selectedLogFile ? "📭" : "📊"}</div>
            <h3 className="font-medium mb-1">
              {selectedLogFile
                ? "No data for selected log file"
                : "No access log data available"}
            </h3>
            <p className="text-sm text-gray-500">
              {selectedLogFile
                ? "The selected log file contains no browser/OS data"
                : "Access log data will appear here once traffic is detected"}
            </p>
          </div>
        ) : (
          <div className="max-w-md mx-auto">
            <PieChartComponent data={data} options={options} />
          </div>
        )}
      </div>
    </div>
  );
};