import React, { useEffect, useRef } from "react";
import { LogMessage } from "./types";
import { formatDate, parseOutLogMessage } from "./utils";

interface LogViewerProps {
  errorLogs: LogMessage[];
  outLogs: LogMessage[];
  selectedApp: string;
  filter: string;
  autoScroll: boolean;
  darkMode: boolean;
  onToggleCollapse: (key: string) => void;
  collapsed: Record<string, boolean>;
}

export const LogViewer: React.FC<LogViewerProps> = ({
  errorLogs,
  outLogs,
  selectedApp,
  filter,
  autoScroll,
  darkMode,
  onToggleCollapse,
  collapsed,
}) => {
  const errorBottomRef = useRef<HTMLDivElement | null>(null);
  const outBottomRef = useRef<HTMLDivElement | null>(null);

  const filteredErrorLogs = errorLogs.filter(
    (log) =>
      log.appName === selectedApp &&
      (log.lastLines.toLowerCase().includes(filter.toLowerCase()) ||
        log.logFile.toLowerCase().includes(filter.toLowerCase()))
  );

  const filteredOutLogs = outLogs.filter(
    (log) =>
      log.appName === selectedApp &&
      (log.lastLines.toLowerCase().includes(filter.toLowerCase()) ||
        log.logFile.toLowerCase().includes(filter.toLowerCase()))
  );

  useEffect(() => {
    if (autoScroll && errorBottomRef.current) {
      errorBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
    // if (autoScroll && outBottomRef.current) {
    //   outBottomRef.current.scrollIntoView({ behavior: "smooth" });
    // }
  }, [errorLogs,autoScroll]);

  return (
    <div id="logs-section">
      {/* Out Log Display */}
      <div
        className={`rounded-lg shadow-lg overflow-hidden ${
          darkMode ? "bg-gray-800 border border-gray-700" : "bg-white"
        } mt-4`}
      >
        <div className="px-4 py-3 border-b border-gray-700 bg-opacity-50 font-mono text-sm flex justify-between items-center">
          <div className="flex space-x-2">
            <div className="h-3 w-3 rounded-full bg-red-500"></div>
            <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
          </div>
          <div className="text-xs">
            <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs font-bold mr-2">
              STDOUT
            </span>
            {filteredOutLogs.length} out log entries for {selectedApp}
          </div>
        </div>
        <div
          className={`p-4 font-mono text-sm ${
            darkMode ? "bg-gray-900" : "bg-gray-50"
          } h-64 overflow-y-auto`}
        >
          {filteredOutLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p className="text-lg mb-2">No standard output logs</p>
              <p className="text-sm">Waiting for out.log entries...</p>
            </div>
          ) : (
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr
                  className={`${
                    darkMode ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-700"
                  }`}
                >
                  <th className="px-4 py-2 text-left font-semibold w-1/4">Time</th>
                  <th className="px-4 py-2 text-left font-semibold">Message</th>
                </tr>
              </thead>
              <tbody>
                {filteredOutLogs.map((log, idx) => {
                  const parsedLog = parseOutLogMessage(log.lastLines, log.timestamp);
                  return (
                    <tr
                      key={`out-${idx}`}
                      className={`border-t ${
                        darkMode ? "border-gray-700" : "border-gray-200"
                      } hover:bg-opacity-50 ${
                        darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"
                      }`}
                    >
                      <td className="px-4 py-2 w-1/4 whitespace-nowrap">
                        {formatDate(parsedLog.timestamp)}
                      </td>
                      <td className="px-4 py-2">
                        <pre className="whitespace-pre-wrap break-words">
                          {parsedLog.message}
                        </pre>
                        {log.userAgent && (
                          <div className="mt-1 text-gray-500 text-xs">
                            <span className="font-semibold">User Agent: </span>
                            {log.userAgent}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <div ref={outBottomRef} />
        </div>
      </div>

      {/* Error Log Display */}
      <div
        className={`rounded-lg shadow-lg overflow-hidden mt-4 ${
          darkMode ? "bg-gray-800 border border-gray-700" : "bg-white"
        }`}
      >
        <div className="px-4 py-3 border-b border-gray-700 bg-opacity-50 font-mono text-sm flex justify-between items-center">
          <div className="flex space-x-2">
            <div className="h-3 w-3 rounded-full bg-red-500"></div>
            <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
          </div>
          <div className="text-xs">
            <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold mr-2">
              STDERR
            </span>
            {filteredErrorLogs.length} error log entries for {selectedApp}
          </div>
        </div>
        <div
          className={`p-4 font-mono text-sm ${
            darkMode ? "bg-gray-900" : "bg-gray-50"
          } h-64 overflow-y-auto`}
        >
          {filteredErrorLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p className="text-lg mb-2">No error logs to display</p>
              <p className="text-sm">No errors reported yet</p>
            </div>
          ) : (
            filteredErrorLogs.map((log, idx) => (
              <div
                key={`err-${idx}`}
                className={`mb-4 rounded-lg overflow-hidden border ${
                  darkMode ? "border-gray-700" : "border-gray-200"
                } transition-all duration-200 hover:shadow-md`}
              >
                <div
                  className="flex justify-between items-center p-2 cursor-pointer bg-red-100 text-red-800"
                  onClick={() => onToggleCollapse(`err-${log.appName}-${idx}`)}
                >
                  <div className="font-bold truncate mr-2 flex items-center">
                    <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs mr-2">
                      STDERR
                    </span>
                    {log.logFile}
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <span>{formatDate(log.timestamp)}</span>
                    <span
                      className="transform transition-transform duration-200"
                      style={{
                        transform: collapsed[`err-${log.appName}-${idx}`]
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                      }}
                    >
                      ▼
                    </span>
                  </div>
                </div>
                {!collapsed[`err-${log.appName}-${idx}`] && (
                  <div
                    className={`${
                      darkMode ? "bg-gray-800 text-gray-300" : "bg-white text-gray-800"
                    } p-3 font-mono text-sm`}
                  >
                    <pre className="overflow-x-auto whitespace-pre-wrap">
                      {log.lastLines}
                    </pre>
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={errorBottomRef} />
        </div>
      </div>
    </div>
  );
};