"use client";

import { useState, useEffect } from "react";

interface LogEntry {
  timestamp: string;
  ip: string;
  method: string;
  url: string;
  statusCode: number;
  userAgent: string;
}

interface AccesslogTerminalProps {
  logFile: string;
  darkMode: boolean;
  requests: LogEntry[];
}

const AccesslogTerminal: React.FC<AccesslogTerminalProps> = ({ logFile, darkMode, requests }) => {
  const [cursorVisible, setCursorVisible] = useState<boolean>(true);

  // Blinking cursor effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 500);

    return () => clearInterval(interval);
  }, []);


  // Get status code color based on the code
  const getStatusCodeColor = (code: number): string => {
    if (code >= 200 && code < 300) return "text-green-400";
    if (code >= 300 && code < 400) return "text-blue-400";
    if (code >= 400 && code < 500) return "text-yellow-400";
    if (code >= 500) return "text-red-400";
    return "text-gray-400";
  };

  // Get method color
  const getMethodColor = (method: string): string => {
    switch (method) {
      case "GET":
        return "text-blue-400";
      case "POST":
        return "text-green-400";
      case "PUT":
        return "text-yellow-400";
      case "DELETE":
        return "text-red-400";
      default:
        return "text-purple-400";
    }
  };

  return (
    <div className={`bg-black border border-gray-700 rounded-md overflow-hidden shadow-lg ${darkMode ? "bg-gray-900" : "bg-gray-800"}`}>
      <div className="bg-gray-800 px-4 py-2 flex items-center border-b border-gray-700">
        <div className="mr-auto flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <div className="text-gray-300 font-mono text-sm">tail -f /var/log/nginx/{logFile}</div>
      </div>
      <div className="p-4 font-mono text-sm text-gray-300 overflow-auto max-h-[600px]">
        <div className="text-green-400 mb-4">$ tail -f /var/log/nginx/{logFile}</div>
        {requests.length === 0 ? (
          <div className="text-gray-500">No log entries yet...</div>
        ) : (
          requests.map((request, index) => (
            <div key={index} className="mb-6 border-b border-gray-800 pb-4">
              <div className="grid grid-cols-[120px_1fr] gap-1">
                <span className="text-gray-500">Timestamp:</span>
                <span className="text-blue-300">{request.timestamp}</span>
                <span className="text-gray-500">IP Address:</span>
                <span className="text-purple-300">{request.ip}</span>
                <span className="text-gray-500">Method:</span>
                <span className={getMethodColor(request.method)}>{request.method}</span>
                <span className="text-gray-500">URL:</span>
                <span className="text-cyan-300 break-all">{request.url}</span>
                <span className="text-gray-500">Status Code:</span>
                <span className={getStatusCodeColor(request.statusCode)}>{request.statusCode}</span>
                <span className="text-gray-500">User-Agent:</span>
                <span className="text-gray-300 break-all">{request.userAgent}</span>
              </div>
            </div>
          ))
        )}
        <div className="flex items-center">
          <span className="text-green-400 mr-2">$</span>
          <span
            className={`h-4 w-2 bg-gray-300 ${cursorVisible ? "opacity-100" : "opacity-0"} transition-opacity duration-100`}
          ></span>
        </div>
      </div>
    </div>
  );
};

export default AccesslogTerminal;