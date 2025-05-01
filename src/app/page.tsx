"use client";
import { useState, useEffect, useRef } from "react";
import Chart from "chart.js/auto";

// Utility function to parse user agent strings
const parseUserAgent = (uaString: string) => {
  // const ua = navigator.userAgent; // Fallback to browser's navigator if needed
  const uaData = { browser: "Unknown", device: "Unknown" };

  // Basic parsing for common browsers and devices
  if (/chrome|chromium|crios/i.test(uaString)) {
    uaData.browser = "Chrome";
  } else if (/firefox|fxios/i.test(uaString)) {
    uaData.browser = "Firefox";
  } else if (/safari/i.test(uaString)) {
    uaData.browser = "Safari";
  } else if (/edg/i.test(uaString)) {
    uaData.browser = "Edge";
  }

  if (/mobile/i.test(uaString)) {
    uaData.device = "Mobile";
  } else if (/tablet/i.test(uaString)) {
    uaData.device = "Tablet";
  } else {
    uaData.device = "Desktop";
  }

  return uaData;
};

type PM2Process = {
  name: string;
  status: string;
  memory: string;
  cpu: string;
  uptime: string;
};

type LogMessage = {
  appName: string;
  status: string;
  memory: string;
  logFile: string;
  lastLines: string;
  timestamp: string;
  userAgent?: string; // Added userAgent field
  severity?: "info" | "warning" | "error" | "critical";
  type?: string;
  outData?: {
    appName: string;
    logFile: string;
    memory: string;
    status: string;
    timestamp: string;
    topLines: string;
    type: string;
  };
};

type UserAgentInsight = {
  browser: string;
  device: string;
  count: number;
};

export default function Home() {
  const [processes, setProcesses] = useState<PM2Process[]>([]);
  const [errorLogs, setErrorLogs] = useState<LogMessage[]>([]);
  const [outLogs, setOutLogs] = useState<LogMessage[]>([]);
  const [userAgentInsights, setUserAgentInsights] = useState<UserAgentInsight[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const errorBottomRef = useRef<HTMLDivElement | null>(null);
  const outBottomRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const [darkMode, setDarkMode] = useState(true);

  // Parse outlog message to extract formatted data
  const parseOutLogMessage = (message: string) => {
    try {
      const cleanedMessage = message.replace(/^\d+\|[\w-]+\s+\|\s+/gm, "");
      const timestampMatch = cleanedMessage.match(/timestamp[':]\s*['"]([^'"]+)['"]/);
      const timestamp = timestampMatch ? timestampMatch[1] : new Date().toISOString();

      const formattedMessage = cleanedMessage
        .replace(/\\n/g, "\n")
        .replace(/\\'/g, "'")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\");

      return {
        timestamp,
        message: formattedMessage,
      };
    } catch (error) {
      console.log("Error parsing outlog message:", error);
      return {
        timestamp: new Date().toISOString(),
        message: message,
      };
    }
  };

  // Update user agent insights
  const updateUserAgentInsights = (log: LogMessage) => {
    if (!log.userAgent) return;

    const uaData = parseUserAgent(log.userAgent);
    setUserAgentInsights((prev) => {
      const existing = prev.find(
        (insight) => insight.browser === uaData.browser && insight.device === uaData.device
      );
      if (existing) {
        return prev.map((insight) =>
          insight.browser === uaData.browser && insight.device === uaData.device
            ? { ...insight, count: insight.count + 1 }
            : insight
        );
      }
      return [...prev, { browser: uaData.browser, device: uaData.device, count: 1 }];
    });
  };


  // WebSocket for log updates
  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080");

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "client_info", userAgent: navigator.userAgent }));
    };
  

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "processList") {
        setProcesses(data.data);
        setIsLoading(false);
      } else if (data.type === "out_log_update") {
        data.severity = "info";
        setOutLogs((prev) => [...prev, data]);
        updateProcessStats(data);
        updateUserAgentInsights(data);
      } else if (data.type === "error_log_update") {
        data.severity = "error";
        setErrorLogs((prev) => [...prev, data]);
        updateProcessStats(data);
        updateUserAgentInsights(data);
      } else {
        const logData = data as LogMessage;
        logData.severity = logData.severity || "error";
        setErrorLogs((prev) => [...prev, logData]);
        updateProcessStats(logData);
        updateUserAgentInsights(logData);
      }
    };

    return () => socket.close();
  }, []);

  // Helper function to update process stats
  const updateProcessStats = (logData: LogMessage) => {
    setProcesses((prevProcesses) => {
      return prevProcesses.map((process) => {
        if (process.name === logData.appName) {
          return {
            ...process,
            status: logData.status,
            memory: logData.memory,
            lastUpdate: logData.timestamp,
          };
        }
        return process;
      });
    });
  };

  // Auto-scroll effect for error logs
  useEffect(() => {
    if (autoScroll && selectedApp && errorBottomRef.current) {
      errorBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [errorLogs, autoScroll, selectedApp]);

  // Auto-scroll effect for out logs
  // useEffect(() => {
  //   if (autoScroll && selectedApp && outBottomRef.current) {
  //     outBottomRef.current.scrollIntoView({ behavior: "smooth" });
  //   }
  // }, [outLogs, autoScroll, selectedApp]);

  // Update chart when user agent insights change
  useEffect(() => {
    if (chartRef.current && userAgentInsights.length > 0) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }

      const browsers = Array.from(new Set(userAgentInsights.map((insight) => insight.browser)));
      const data = browsers.map((browser) => {
        const browserInsights = userAgentInsights.filter((insight) => insight.browser === browser);
        return browserInsights.reduce((sum, insight) => sum + insight.count, 0);
      });

      chartInstanceRef.current = new Chart(chartRef.current, {
        type: "bar",
        data: {
          labels: browsers,
          datasets: [
            {
              label: "Number of Requests by Browser",
              data: data,
              backgroundColor: "rgba(54, 162, 235, 0.6)",
              borderColor: "rgba(54, 162, 235, 1)",
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "Number of Requests",
              },
            },
            x: {
              title: {
                display: true,
                text: "Browser",
              },
            },
          },
        },
      });
    }
  }, [userAgentInsights]);

  const toggleCollapse = (key: string) => {
    setCollapsed((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const clearLogs = () => {
    setErrorLogs([]);
    setOutLogs([]);
    setUserAgentInsights([]);
    setProcesses((prev) =>
      prev.map((process) => ({
        ...process,
        logEntries: 0,
      }))
    );
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "online":
        return "bg-green-100 text-green-800";
      case "error":
        return "bg-red-100 text-red-800";
      case "stopped":
        return "bg-gray-100 text-gray-800";
      case "restarting":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getStatusDot = (status: string) => {
    switch (status.toLowerCase()) {
      case "online":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      case "stopped":
        return "bg-gray-500";
      case "restarting":
        return "bg-yellow-500";
      default:
        return "bg-blue-500";
    }
  };

  const filteredErrorLogs = errorLogs.filter(
    (log) =>
      (!selectedApp || log.appName === selectedApp) &&
      (log.lastLines.toLowerCase().includes(filter.toLowerCase()) ||
        log.logFile.toLowerCase().includes(filter.toLowerCase()))
  );

  const filteredOutLogs = outLogs.filter(
    (log) =>
      (!selectedApp || log.appName === selectedApp) &&
      (log.lastLines.toLowerCase().includes(filter.toLowerCase()) ||
        log.logFile.toLowerCase().includes(filter.toLowerCase()))
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      fractionalSecondDigits: 2,
    }).replace(",", "");
  };

  const handleViewLogs = (processName: string) => {
    setSelectedApp(processName);
    setTimeout(() => {
      document.getElementById("logs-section")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <div
      className={`min-h-screen ${
        darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"
      } transition-colors duration-300`}
    >
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center">
            <span className="text-blue-500 mr-2">⚙️</span>
            PM2 Process Dashboard
          </h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full hover:bg-gray-700 transition-colors"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
            <button
              onClick={clearLogs}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
            >
              Clear Logs
            </button>
          </div>
        </div>

        {/* Process Manager Section */}
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
              <h2 className="font-semibold">Process List</h2>
            </div>
            <div className="text-xs">
              {processes.length} processes monitored
            </div>
          </div>

          <div className={`p-4 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : processes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                <p className="text-lg mb-2">No processes found</p>
                <p className="text-sm">
                  No PM2 processes are currently running
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr
                      className={`${
                        darkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Memory
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        CPU
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Uptime
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody
                    className={`divide-y ${
                      darkMode ? "divide-gray-700" : "divide-gray-200"
                    }`}
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
                          {process.memory}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-mono">
                          {process.cpu}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {process.uptime}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleViewLogs(process.name)}
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
{/* 
        {/* Log Viewer Section */}
        {selectedApp && (
          <div id="logs-section">
            {/* Controls */}
            <div
              className={`flex flex-col md:flex-row justify-between items-center mb-4 p-4 rounded-lg ${
                darkMode ? "bg-gray-800" : "bg-white"
              } shadow`}
            >
              <div className="mb-2 md:mb-0 w-full md:w-auto flex items-center space-x-4">
                <button
                  onClick={() => setSelectedApp(null)}
                  className="flex items-center text-sm px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  <span className="mr-1">←</span> Back to Process List
                </button>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={autoScroll}
                    onChange={() => setAutoScroll(!autoScroll)}
                    className="form-checkbox h-4 w-4 text-green-500"
                  />
                  <span>Auto-scroll</span>
                </label>
              </div>
              <div className="relative w-full md:w-64">
                <input
                  type="text"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filter logs..."
                  className={`w-full px-4 py-2 rounded-lg border ${
                    darkMode
                      ? "bg-gray-700 border-gray-600"
                      : "bg-gray-50 border-gray-300"
                  } focus:outline-none focus:ring-2 focus:ring-green-500`}
                />
                {filter && (
                  <button
                    onClick={() => setFilter("")}
                    className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Out Log Display */}
            <div
              className={`rounded-lg shadow-lg overflow-hidden ${
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
                  filteredOutLogs.map((log, idx) => {
                    const parsedLog = parseOutLogMessage(log.lastLines);
                    return (
                      <div
                        key={`out-${idx}`}
                        className={`mb-2 rounded-lg overflow-hidden border ${
                          darkMode ? "border-gray-700" : "border-gray-200"
                        } transition-all duration-200 hover:shadow-md`}
                      >
                        <div
                          className={`flex items-center p-2 cursor-pointer bg-blue-100 text-blue-800`}
                          onClick={() => toggleCollapse(`out-${log.appName}-${idx}`)}
                        >
                          <div className="flex items-center flex-1 truncate mr-2">
                            <span className="bg-blue-500 text-white px-2 py-0.5 rounded text-xs mr-2">
                              STDOUT
                            </span>
                            <span className="text-sm font-semibold">{log.appName}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs">
                            <span>{formatDate(log.timestamp)}</span>
                            <span
                              className="transform transition-transform duration-200"
                              style={{
                                transform: collapsed[`out-${log.appName}-${idx}`]
                                  ? "rotate(180deg)"
                                  : "rotate(0deg)",
                              }}
                            >
                              ▼
                            </span>
                          </div>
                        </div>

                        {!collapsed[`out-${log.appName}-${idx}`] && (
                          <div
                            className={`${
                              darkMode
                                ? "bg-gray-800 text-gray-300"
                                : "bg-white text-gray-800"
                            } p-3 font-mono text-sm`}
                          >
                            <div className="flex flex-wrap items-start">
                              <span className="text-blue-400 mr-2 min-w-[120px]">
                                {formatDate(parsedLog.timestamp)}
                              </span>
                              <span className="text-green-400 mr-2 min-w-[100px]">
                                [STDOUT]
                              </span>
                              <span className="text-yellow-400 mr-2 min-w-[150px]">
                                {log.appName}
                              </span>
                              <pre className="flex-1 overflow-x-auto whitespace-pre-wrap">
                                {parsedLog.message}
                              </pre>
                            </div>
                            {log.userAgent && (
                              <div className="mt-2 text-gray-500">
                                <span className="font-semibold">User Agent: </span>
                                {log.userAgent}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
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
                        className={`flex justify-between items-center p-2 cursor-pointer bg-red-100 text-red-800`}
                        onClick={() => toggleCollapse(`err-${log.appName}-${idx}`)}
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
                        <div className={`${
                          darkMode
                            ? "bg-gray-800 text-gray-300"
                            : "bg-white text-gray-800"
                        } p-3 font-mono text-sm`}>
                          <pre className="overflow-x-auto whitespace-pre-wrap">
                            {log.lastLines}
                          </pre>
                          {/* {log.userAgent && (
                            <div className="mt-2 text-gray-500">
                              <span className="font-semibold">User Agent: </span>
                              {log.userAgent}
                            </div>
                          )} */}
                        </div>
                      )}
                    </div>
                  ))
                )}
                <div ref={errorBottomRef} />
              </div>
            </div>

            {/* Controls footer */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  errorBottomRef.current?.scrollIntoView({ behavior: "smooth" });
                  outBottomRef.current?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`px-3 py-1 rounded ${
                  darkMode
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-gray-200 hover:bg-gray-300"
                } transition-colors`}
              >
                Scroll to Bottom
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}