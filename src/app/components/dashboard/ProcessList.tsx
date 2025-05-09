import React from "react";
import { PM2Process } from "./types";
import { getStatusColor, getStatusDot } from "./utils";

interface ProcessListProps {
  processes: PM2Process[];
  isLoading: boolean;
  onViewLogs: (processName: string) => void;
  darkMode: boolean;
}

export const ProcessList: React.FC<ProcessListProps> = ({
  processes,
  isLoading,
  onViewLogs,
  darkMode,
}) => {
  return (
    <div
      className={`mb-6 rounded-lg ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg overflow-hidden`}
    >
      <div className="px-4 py-3 border-b border-gray-700 font-mono text-sm flex justify-between items-center">
        <div className="flex items-center">
          <div className="flex space-x-2 mr-4">
            <div className="h-3 w-3 rounded-full bg-red-500"></div>
            <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
          </div>
          <h2 className="font-semibold">Process List</h2>
        </div>
        <div className="text-xs">{processes.length} processes monitored</div>
      </div>
      <div className={`p-4 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : processes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500">
            <p className="text-lg mb-2">No processes found</p>
            <p className="text-sm">No PM2 processes are currently running</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" title="Port number the app is running on">
                    Port
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" title="Current memory usage of the app">
                    Memory
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" title="Current CPU usage by the app">
                    CPU
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" title="Time since the app was last restarted">
                    Uptime
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${darkMode ? "divide-gray-700" : "divide-gray-200"}`}
              >
                {processes.map((process) => (
                  <tr
                    key={process.name}
                    className={`${
                      darkMode ? "hover:bg-gray-800" : "hover:bg-gray-50"
                    } transition-colors`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span
                          className={`h-3 w-3 rounded-full ${getStatusDot(
                            process.status
                          )} mr-2`}
                        ></span>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                            process.status
                          )}`}
                        >
                          {process.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold">
                      {process.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono">
                      {process.port || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono">
                      {process.memory}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono">
                      {process.cpu}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{process.uptime}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => onViewLogs(process.name)}
                        className="text-blue-500 hover:text-blue-700 transition-colors cursor-pointer"
                      >
                        View Logs
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};