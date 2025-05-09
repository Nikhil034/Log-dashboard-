import React from "react";
import { SystemStats as SystemStatsType } from "./types";

interface SystemStatsProps {
  systemStats: SystemStatsType;
  darkMode: boolean;
  selectedApp: string | null;
}

export const SystemStats: React.FC<SystemStatsProps> = ({
  systemStats,
  darkMode,
  selectedApp,
}) => {
  if (selectedApp) return null;

  return (
    <div
      className={`mb-6 rounded-lg ${
        darkMode ? "bg-gray-800" : "bg-white"
      } shadow-lg overflow-hidden`}
    >
      <div className="px-4 py-3 border-b border-gray-700 font-mono text-sm flex justify-between items-center">
        <div className="flex items-center">
          <div className="flex space-x-2 mr-4">
            <div className="h-3 w-3 rounded-full bg-red-500"></div>
            <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
          </div>
          <h2 className="font-semibold">System Stats</h2>
        </div>
        <div className="text-xs">Server Memory Overview</div>
      </div>
      <div className={`p-4 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-500">Total Memory</span>
            <span className="text-lg font-mono">{systemStats.systemMemoryTotal}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-500">Free Memory</span>
            <span className="text-lg font-mono">{systemStats.systemFreeMemory}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-500">Used Memory</span>
            <span className="text-lg font-mono">{systemStats.systemUsedMemory}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-500">Buffer Memory</span>
            <span className="text-lg font-mono">{systemStats.systemBufferMemory}</span>
          </div>
        </div>
      </div>
    </div>
  );
};