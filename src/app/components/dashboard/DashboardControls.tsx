import React from "react";

interface DashboardControlsProps {
  darkMode: boolean;
  filter: string;
  autoScroll: boolean;
  selectedApp: string | null;
  onToggleDarkMode: () => void;
  onClearLogs: () => void;
  onSetFilter: (filter: string) => void;
  onToggleAutoScroll: () => void;
  onBackToProcessList: () => void;
}

export const DashboardControls: React.FC<DashboardControlsProps> = ({
  darkMode,
  filter,
  autoScroll,
  selectedApp,
  onToggleDarkMode,
  onClearLogs,
  onSetFilter,
  onToggleAutoScroll,
  onBackToProcessList,
}) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between mb-6">
      <div className="flex items-center space-x-4 mb-2 md:mb-0">
        <h1 className="text-2xl font-bold flex items-center">
          <span className="text-blue-500 mr-2">⚙️</span>
          PM2 Process Dashboard
        </h1>
        {selectedApp && (
          <button
            onClick={onBackToProcessList}
            className="flex items-center text-sm px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            <span className="mr-1">←</span> Back to Process List
          </button>
        )}
      </div>
      <div className="flex items-center space-x-4">
        {selectedApp && (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={onToggleAutoScroll}
              className="form-checkbox h-4 w-4 text-green-500"
            />
            <span>Auto-scroll</span>
          </label>
        )}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            value={filter}
            onChange={(e) => onSetFilter(e.target.value)}
            placeholder="Filter logs..."
            className={`w-full px-4 py-2 rounded-lg border ${
              darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-300"
            } focus:outline-none focus:ring-2 focus:ring-green-500`}
          />
          {filter && (
            <button
              onClick={() => onSetFilter("")}
              className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          )}
        </div>
        <button
          onClick={onToggleDarkMode}
          className="p-2 rounded-full hover:bg-gray-700 transition-colors"
        >
          {darkMode ? "☀️" : "🌙"}
        </button>
        <button
          onClick={onClearLogs}
          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
        >
          Clear Logs
        </button>
      </div>
    </div>
  );
};