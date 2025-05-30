// "use client";
// import React, { useState, useEffect, useCallback } from "react";
// import { ProcessList } from "./components/dashboard/ProcessList";
// import { SystemStats } from "./components/dashboard/SystemStats";
// import { LogViewer } from "./components/dashboard/LogViewer";
// import { MemoryChart } from "./components/dashboard/MemoryChart";
// import { AccessLogChart } from "./components/dashboard/AccessLogChart";
// import { DashboardControls } from "./components/dashboard/DashboardControls";
// import {
//   PM2Process,
//   LogMessage,
//   AccessLog,
//   AccessLogInsight,
//   LogFileInsights,
//   LogEntry,
//   TimeSeriesMetric,
//   SystemStats as SystemStatsType,
//   StorageStats as StorageStatsType,
//   UserProcess,
// } from "./components/dashboard/types";
// import { parseMemory, parsePercent, validateMemoryValue } from "./components/dashboard/utils";
// import RenderAccessLogs from "./components/renderaccesslog";
// import AccesslogTerminal from "./components/accesslogterminal";
// import { ErrorPopup } from "./components/dashboard/error-popup";
// import { StorageStats } from "./components/dashboard/StorageStats";
// import { UserList } from "./components/dashboard/Userlist";

// export default function Home() {
//   const [processes, setProcesses] = useState<PM2Process[]>([]);
//   const [errorLogs, setErrorLogs] = useState<LogMessage[]>([]);
//   const [outLogs, setOutLogs] = useState<LogMessage[]>([]);
//   const [filter, setFilter] = useState<string>("");
//   const [autoScroll, setAutoScroll] = useState(true);
//   const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
//   const [selectedApp, setSelectedApp] = useState<string | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [timeSeriesData, setTimeSeriesData] = useState<
//     Record<string, TimeSeriesMetric[]>
//   >({});
//   const [systemStats, setSystemStats] = useState<SystemStatsType>({
//     systemMemoryTotal: "0 MB",
//     systemFreeMemory: "0 MB",
//     systemUsedMemory: "0 MB",
//     systemBufferMemory: "0 MB",
//   });
//   const [storageStats, setStorageStats] = useState<StorageStatsType>({
//     storageTotal: "0 MB",
//     storageUsed: "0 MB",
//     storageAvailable: "0 MB",
//     storageUsePercent: "0%",
//   });
//   const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
//   const [darkMode, setDarkMode] = useState<boolean>(true);
//   const [selectedLogFile, setSelectedLogFile] = useState<string | null>(null);
//   const [showTerminal, setShowTerminal] = useState<boolean>(false);
//   const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
//   const [accessLogInsights, setAccessLogInsights] = useState<AccessLogInsight[]>([]);
//   const [logFileInsights, setLogFileInsights] = useState<LogFileInsights>({});
//   const [isSocketError, setIsSocketError] = useState<boolean>(false);
//   const [userProcesses, setUserProcesses] = useState<UserProcess[]>([]);

//   const updateProcessStats = useCallback((logData: LogMessage) => {
//     setProcesses((prevProcesses) =>
//       prevProcesses.map((process) =>
//         process.name === logData.appName
//           ? {
//               ...process,
//               status: logData.status,
//               memory: logData.memory,
//               lastUpdate: logData.timestamp,
//             }
//           : process
//       )
//     );
//   }, []);

//   useEffect(() => {
//     console.log("Connecting to WebSocket...",process.env.NEXT_PUBLIC_WEBSOCKET_URL);
//     // const socket = new WebSocket(process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:8080");

//     const socket = new WebSocket("ws://localhost:8080");

//     // socket.onopen = () => {
//     //   socket.send(
//     //     JSON.stringify({ type: "client_info", userAgent: navigator.userAgent })
//     //   );
//     // };

//     socket.onmessage = (event) => {
//       try {
//         const data = JSON.parse(event.data);

//         if (data.type === "processList" || data.type === "processUpdate") {
//           setProcesses(data.data);
//           if (data.data.length > 0) {
//             const proc = data.data[0];
//             setSystemStats({
//               systemMemoryTotal: validateMemoryValue(
//                 proc.systemMemoryTotal || proc.sysytemMemoryTotal // Handle typo
//               ),
//               systemFreeMemory: validateMemoryValue(proc.systemFreeMemory),
//               systemUsedMemory: validateMemoryValue(proc.systemUsedMemory),
//               systemBufferMemory: validateMemoryValue(proc.systemBufferMemory),
//             });
//             setStorageStats({
//               storageTotal: data.data[0].storageTotal,
//               storageUsed: data.data[0].storageUsed,
//               storageAvailable: data.data[0].storageAvailable,
//               storageUsePercent: data.data[0].storageUsePercent,
//             })
//             setUserProcesses(proc.userProcesses || []);

//             const processWithLogs = data.data.find(
//               (proc: PM2Process) => Array.isArray(proc.accessLogs)
//             );
//             if (processWithLogs) {
//               const logsWithIds = processWithLogs.accessLogs.map(
//                 (log: string, index: number) => ({
//                   id: (index + 1).toString(),
//                   name: log,
//                 })
//               );
//               setAccessLogs(logsWithIds);
//             }
//           }
//           setIsLoading(false);

//           if (data.type === "processUpdate") {
//             setTimeSeriesData((prev) => {
//               const newData = { ...prev };
//               data.data.forEach((process: PM2Process) => {
//                 if (!newData[process.name]) newData[process.name] = [];
//                 const metric: TimeSeriesMetric = {
//                   timestamp: process.lastUpdate || new Date().toISOString(),
//                   memory: parseMemory(process.memory),
//                   residentMemory: parseMemory(process.residentMemory),
//                   sharedMemory: parseMemory(process.sharedMemory),
//                   topMEM: parsePercent(process.topMEM),
//                 };
//                 newData[process.name] = [...newData[process.name], metric].slice(-5);
//               });
//               return newData;
//             });
//           }
//         } else if (data.type === "out_log_update") {
//           data.severity = "info";
//           setOutLogs((prev) => [...prev, data]);
//           updateProcessStats(data);
//         } else if (data.type === "error_log_update") {
//           data.severity = "error";
//           setErrorLogs((prev) => [...prev, data]);
//           updateProcessStats(data);
//         } else if (data.type === "access_log_update") {
//           setLogEntries((prev) =>
//             [
//               ...prev,
//               {
//                 timestamp: data.accessLog.timestamp,
//                 ip: data.accessLog.ip,
//                 method: data.accessLog.method,
//                 url: data.accessLog.url,
//                 statusCode: parseInt(data.accessLog.status),
//                 userAgent: data.accessLog.userAgent,
//                 logFile: data.logFile,
//               },
//             ].slice(-100)
//           );
//           const { browser, os } = data;
//           setAccessLogInsights((prev) => {
//             const existing = prev.find(
//               (insight) => insight.browser === browser && insight.os === os
//             );
//             if (existing) {
//               return prev.map((insight) =>
//                 insight.browser === browser && insight.os === os
//                   ? { ...insight, count: insight.count + 1 }
//                   : insight
//               );
//             }
//             return [...prev, { browser, os, count: 1 }];
//           });
//           setLogFileInsights((prev) => {
//             const logFile = data.logFile;
//             const insights = prev[logFile] || [];
//             const existing = insights.find(
//               (i) => i.browser === browser && i.os === os
//             );
//             return {
//               ...prev,
//               [logFile]: existing
//                 ? insights.map((i) =>
//                     i === existing ? { ...i, count: i.count + 1 } : i
//                   )
//                 : [...insights, { browser, os, count: 1 }],
//             };
//           });
//         } else {
//           const logData = data as LogMessage;
//           logData.severity = logData.severity || "error";
//           setErrorLogs((prev) => [...prev, logData]);
//           updateProcessStats(logData);
//         }
//       } catch (error) {
//         console.error("WebSocket message parsing error:", error);
//       }
//     };

//     socket.onerror = (error) => {
//       console.error("WebSocket error:", error.currentTarget);
//       setIsSocketError(true);
//     };

//     socket.onclose = () => {
//       console.log("WebSocket disconnected");
//       setIsSocketError(true);
//     };

//     return () => socket.close();
//   }, [updateProcessStats]);

//   const handleViewLogs = (processName: string) => {
//     setShowTerminal(false);
//     setSelectedApp(processName);
//     setTimeout(() => {
//       document.getElementById("logs-section")?.scrollIntoView({ behavior: "smooth" });
//     }, 100);
//   };

//   const clearLogs = () => {
//     setErrorLogs([]);
//     setOutLogs([]);
//     setProcesses((prev) =>
//       prev.map((process) => ({
//         ...process,
//         logEntries: 0,
//       }))
//     );
//   };

//   const toggleCollapse = (key: string) => {
//     setCollapsed((prev) => ({
//       ...prev,
//       [key]: !prev[key],
//     }));
//   };

//   return (
//     <div
//       className={`min-h-screen ${
//         darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"
//       } transition-colors duration-300`}
//     >
//       <div className="container mx-auto px-4 py-6">
//         <DashboardControls
//           darkMode={darkMode}
//           filter={filter}
//           autoScroll={autoScroll}
//           selectedApp={selectedApp}
//           onToggleDarkMode={() => setDarkMode(!darkMode)}
//           onClearLogs={clearLogs}
//           onSetFilter={setFilter}
//           onToggleAutoScroll={() => setAutoScroll(!autoScroll)}
//           onBackToProcessList={() => setSelectedApp(null)}
//         />
//         <ProcessList
//           processes={processes}
//           isLoading={isLoading}
//           onViewLogs={handleViewLogs}
//           darkMode={darkMode}
//         />
//         <SystemStats systemStats={systemStats} darkMode={darkMode} selectedApp={selectedApp} />
//         <StorageStats storageStats={storageStats} darkMode={darkMode} selectedApp={selectedApp} />
//         <UserList
//           userProcesses={userProcesses}
//           isLoading={isLoading}
//           darkMode={darkMode}
//         />
//         {!selectedApp && (
//           <div className={`${darkMode ? "bg-gray-900" : "bg-gray-100"} p-6`}>
//             <RenderAccessLogs
//               darkMode={darkMode}
//               accessLogs={accessLogs}
//               setSelectedLogFile={(logFile) => {
//                 setSelectedLogFile(logFile);
//                 setShowTerminal(true);
//               }}
//             />
//             {showTerminal && selectedLogFile && (
//               <div className="mt-6">
//                 <AccesslogTerminal
//                   logFile={selectedLogFile}
//                   darkMode={darkMode}
//                   requests={logEntries.filter((entry) => entry.logFile === selectedLogFile)}
//                 />
//                 <button
//                   onClick={() => setShowTerminal(false)}
//                   className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//                 >
//                   Close Terminal
//                 </button>
//               </div>
//             )}
//           </div>
//         )}
//         <AccessLogChart
//           selectedApp={selectedApp}
//           selectedLogFile={selectedLogFile}
//           accessLogInsights={accessLogInsights}
//           logFileInsights={logFileInsights}
//           darkMode={darkMode}
//           onClearSelection={() => setSelectedLogFile(null)}
//         />
//         {selectedApp && (
//           <>
//             <MemoryChart
//               selectedApp={selectedApp}
//               timeSeriesData={timeSeriesData}
//               darkMode={darkMode}
//             />
//             <LogViewer
//               errorLogs={errorLogs}
//               outLogs={outLogs}
//               selectedApp={selectedApp}
//               filter={filter}
//               autoScroll={autoScroll}
//               darkMode={darkMode}
//               onToggleCollapse={toggleCollapse}
//               collapsed={collapsed}
//             />
//           </>
//         )}
//           <ErrorPopup isOpen={isSocketError} onClose={() => setIsSocketError(false)} />
//       </div>
//     </div>
//   );
// }

"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { ProcessList } from "./components/dashboard/ProcessList";
import { SystemStats } from "./components/dashboard/SystemStats";
import { LogViewer } from "./components/dashboard/LogViewer";
import { MemoryChart } from "./components/dashboard/MemoryChart";
import { AccessLogChart } from "./components/dashboard/AccessLogChart";
import { DashboardControls } from "./components/dashboard/DashboardControls";
import {
  PM2Process,
  LogMessage,
  AccessLog,
  AccessLogInsight,
  LogFileInsights,
  LogEntry,
  TimeSeriesMetric,
  SystemStats as SystemStatsType,
  StorageStats as StorageStatsType,
  UserProcess,
} from "./components/dashboard/types";
import {
  parseMemory,
  parsePercent,
  validateMemoryValue,
} from "./components/dashboard/utils";
import RenderAccessLogs from "./components/accesslog/renderaccesslog";
import AccesslogTerminal from "./components/accesslog/accesslogterminal";
import { ErrorPopup } from "./components/dashboard/error-popup";
import { StorageStats } from "./components/dashboard/StorageStats";
import { UserList } from "./components/dashboard/Userlist";

export default function Home() {
  const [processes, setProcesses] = useState<PM2Process[]>([]);
  const [errorLogs, setErrorLogs] = useState<LogMessage[]>([]);
  const [outLogs, setOutLogs] = useState<LogMessage[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeSeriesData, setTimeSeriesData] = useState<
    Record<string, TimeSeriesMetric[]>
  >({});
  const [systemStats, setSystemStats] = useState<SystemStatsType>({
    systemMemoryTotal: "0 MB",
    systemFreeMemory: "0 MB",
    systemUsedMemory: "0 MB",
    systemBufferMemory: "0 MB",
  });
  const [storageStats, setStorageStats] = useState<StorageStatsType>({
    storageTotal: "0 MB",
    storageUsed: "0 MB",
    storageAvailable: "0 MB",
    storageUsePercent: "0%",
  });
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [selectedLogFile, setSelectedLogFile] = useState<string | null>(null);
  const [showTerminal, setShowTerminal] = useState<boolean>(false);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [accessLogInsights, setAccessLogInsights] = useState<
    AccessLogInsight[]
  >([]);
  const [logFileInsights, setLogFileInsights] = useState<LogFileInsights>({});
  const [isSocketError, setIsSocketError] = useState<boolean>(false);
  const [userProcesses, setUserProcesses] = useState<UserProcess[]>([]);
  const [DBprocess, setDBprocess] = useState<PM2Process[]>([]); // Added to store DB processes
  const [isRoot, setIsRoot] = useState<boolean>(false); // Added to store root status
  const socketRef = useRef<WebSocket | null>(null); // Added to store WebSocket
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;
  const reconnectInterval = 3000;

  useEffect(() => {
    const role = document.cookie
      .split("; ")
      .find((row) => row.startsWith("role="))
      ?.split("=")[1];

    if (role == "root") {
      setIsRoot(true);
    }

    const email = document.cookie
      .split("; ")
      .find((row) => row.startsWith("user_email="))
      ?.split("=")[1];

    const decodedEmail = email ? decodeURIComponent(email) : null;

    console.log("Decoded email:", decodedEmail);
    if (email) {
      // ✅ Define an async function inside useEffect
      const sendLoginInfo = async () => {
        try {
          const response = await fetch("/api/user-login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: decodedEmail,
              selectedServer: "Rackend-server", // corrected key name
              flag: 1,
            }),
          });

          const data = await response.json();
          setDBprocess(data.data);
          console.log("Response data:", data);
        } catch (error) {
          console.error("Login API error:", error);
        }
      };

      // ✅ Call the function
      sendLoginInfo();
    }
  }, []);

  const updateProcessStats = useCallback((logData: LogMessage) => {
    setProcesses((prevProcesses) =>
      prevProcesses.map((process) =>
        process.name === logData.appName
          ? {
              ...process,
              status: logData.status,
              memory: logData.memory,
              lastUpdate: logData.timestamp,
            }
          : process
      )
    );
  }, []);
  
  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout;

    const connectWebSocket = () => {
      console.log(
        "Connecting to WebSocket...",
        process.env.NEXT_PUBLIC_WEBSOCKET_URL
      );
      const socket = new WebSocket(
        process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:8080"
      );
      socketRef.current = socket;

      socket.onopen = () => {
        console.log("WebSocket connected");
        socket.send(
          JSON.stringify({
            type: "client_info",
            userAgent: navigator.userAgent,
          })
        );
        setIsSocketError(false); // Reset error state on successful connection
        reconnectAttempts.current = 0; // Reset reconnect attempts
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "processList" || data.type === "processUpdate") {
            setProcesses(data.data);
            if (data.data.length > 0) {
              const proc = data.data[0];
              setSystemStats({
                systemMemoryTotal: validateMemoryValue(
                  proc.systemMemoryTotal || proc.sysytemMemoryTotal
                ),
                systemFreeMemory: validateMemoryValue(proc.systemFreeMemory),
                systemUsedMemory: validateMemoryValue(proc.systemUsedMemory),
                systemBufferMemory: validateMemoryValue(
                  proc.systemBufferMemory
                ),
              });
              setStorageStats({
                storageTotal: proc.storageTotal,
                storageUsed: proc.storageUsed,
                storageAvailable: proc.storageAvailable,
                storageUsePercent: proc.storageUsePercent,
              });
              setUserProcesses(proc.userProcesses || []);

              const processWithLogs = data.data.find((proc: PM2Process) =>
                Array.isArray(proc.accessLogs)
              );
              if (processWithLogs) {
                const logsWithIds = processWithLogs.accessLogs.map(
                  (log: string, index: number) => ({
                    id: (index + 1).toString(),
                    name: log,
                  })
                );
                setAccessLogs(logsWithIds);
              }
            }
            setIsLoading(false);

            if (data.type === "processUpdate") {
              setTimeSeriesData((prev) => {
                const newData = { ...prev };
                data.data.forEach((process: PM2Process) => {
                  if (!newData[process.name]) newData[process.name] = [];
                  const metric: TimeSeriesMetric = {
                    timestamp: process.lastUpdate || new Date().toISOString(),
                    memory: parseMemory(process.memory),
                    residentMemory: parseMemory(process.residentMemory),
                    sharedMemory: parseMemory(process.sharedMemory),
                    topMEM: parsePercent(process.topMEM),
                  };
                  newData[process.name] = [
                    ...newData[process.name],
                    metric,
                  ].slice(-5);
                });
                return newData;
              });
            }
          } else if (data.type === "access_log_list") {
            setAccessLogs(
              data.logFiles.map((name: string, index: number) => ({
                id: (index + 1).toString(),
                name,
              }))
            );
          } else if (data.type === "out_log_update") {
            data.severity = "info";
            setOutLogs((prev) => [...prev, data]);
            updateProcessStats(data);
          } else if (data.type === "error_log_update") {
            data.severity = "error";
            setErrorLogs((prev) => [...prev, data]);
            updateProcessStats(data);
          } else if (data.type === "access_log_update") {
            setLogEntries((prev) => {
              const newEntry = {
                timestamp: data.accessLog.timestamp,
                ip: data.accessLog.ip,
                method: data.accessLog.method,
                url: data.accessLog.url,
                statusCode: parseInt(data.accessLog.status),
                userAgent: data.accessLog.userAgent,
                logFile: data.logFile,
              };
              const updated = [...prev, newEntry]
                .sort(
                  (a, b) =>
                    new Date(a.timestamp).getTime() -
                    new Date(b.timestamp).getTime()
                )
                .slice(-100);
              return updated;
            });
            const { browser, os, logFile } = data;
            setAccessLogInsights((prev) => {
              const existing = prev.find(
                (insight) => insight.browser === browser && insight.os === os
              );
              if (existing) {
                return prev.map((insight) =>
                  insight.browser === browser && insight.os === os
                    ? { ...insight, count: insight.count + 1 }
                    : insight
                );
              }
              return [...prev, { browser, os, count: 1 }];
            });
            setLogFileInsights((prev) => {
              const insights = prev[logFile] || [];
              const existing = insights.find(
                (i) => i.browser === browser && i.os === os
              );
              return {
                ...prev,
                [logFile]: existing
                  ? insights.map((i) =>
                      i === existing ? { ...i, count: i.count + 1 } : i
                    )
                  : [...insights, { browser, os, count: 1 }],
              };
            });
          } else if (data.type === "access_log_history") {
            setLogEntries((prev) => {
              const existingTimestamps = new Set(
                prev.map((entry) => `${entry.logFile}:${entry.timestamp}`)
              );
              const newEntries = data.history
                .filter(
                  (entry: {
                    logFile: string;
                    accessLog: { timestamp: string };
                  }) =>
                    !existingTimestamps.has(
                      `${entry.logFile}:${entry.accessLog.timestamp}`
                    )
                )
                .map(
                  (entry: {
                    accessLog: {
                      timestamp: string;
                      ip: string;
                      method: string;
                      url: string;
                      status: string;
                      userAgent: string;
                    };
                    logFile: string;
                  }) => ({
                    timestamp: entry.accessLog.timestamp,
                    ip: entry.accessLog.ip,
                    method: entry.accessLog.method,
                    url: entry.accessLog.url,
                    statusCode: parseInt(entry.accessLog.status),
                    userAgent: entry.accessLog.userAgent,
                    logFile: entry.logFile,
                  })
                );
              const updated = [...prev, ...newEntries]
                .sort(
                  (a, b) =>
                    new Date(a.timestamp).getTime() -
                    new Date(b.timestamp).getTime()
                )
                .slice(-100);
              return updated;
            });
            setAccessLogInsights((prev) => {
              const updatedInsights = [...prev];
              data.history.forEach((entry: { browser: string; os: string }) => {
                const { browser, os } = entry;
                const existing = updatedInsights.find(
                  (insight) => insight.browser === browser && insight.os === os
                );
                if (existing) {
                  existing.count += 1;
                } else {
                  updatedInsights.push({ browser, os, count: 1 });
                }
              });
              return updatedInsights;
            });
            setLogFileInsights((prev) => {
              const { logFile, history } = data;
              const insightsForLog = prev[logFile] || [];
              const updatedInsights = [...insightsForLog];
              history.forEach((entry: { browser: string; os: string }) => {
                const { browser, os } = entry;
                const existing = updatedInsights.find(
                  (insight) => insight.browser === browser && insight.os === os
                );
                if (existing) {
                  existing.count += 1;
                } else {
                  updatedInsights.push({ browser, os, count: 1 });
                }
              });
              return { ...prev, [logFile]: updatedInsights };
            });
          } else {
            const logData = data as LogMessage;
            logData.severity = logData.severity || "error";
            setErrorLogs((prev) => [...prev, logData]);
            updateProcessStats(logData);
          }
        } catch (error) {
          console.error("WebSocket message parsing error:", error);
        }
      };

      socket.onerror = () => {
        console.error("WebSocket error occurred");
        reconnectAttempts.current += 1;
        if (reconnectAttempts.current >= maxReconnectAttempts) {
          setIsSocketError(true); // Show error popup only after max attempts
        } else {
          // Schedule reconnect attempt
          reconnectTimeout = setTimeout(connectWebSocket, reconnectInterval);
        }
      };

      socket.onclose = () => {
        console.log("WebSocket disconnected");
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectTimeout = setTimeout(connectWebSocket, reconnectInterval);
        } else {
          setIsSocketError(true); // Show error popup if max attempts reached
        }
      };
    };

    connectWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      clearTimeout(reconnectTimeout);
    };
  }, [updateProcessStats]);

  const handleViewLogs = (processName: string) => {
    setShowTerminal(false);
    console.log("Selected process:", processName);
    setSelectedApp(processName);
    setTimeout(() => {
      document
        .getElementById("logs-section")
        ?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const clearLogs = () => {
    setErrorLogs([]);
    setOutLogs([]);
    setLogEntries([]); // Clear log entries as well
    setAccessLogInsights([]);
    setLogFileInsights({});
    setProcesses((prev) =>
      prev.map((process) => ({
        ...process,
        logEntries: 0,
      }))
    );
  };

  const toggleCollapse = (key: string) => {
    setCollapsed((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleFetchPastRequests = () => {
    if (
      socketRef.current &&
      socketRef.current.readyState === WebSocket.OPEN &&
      selectedLogFile
    ) {
      socketRef.current.send(
        JSON.stringify({
          type: "request_access_log_history",
          logFile: selectedLogFile,
        })
      );
      console.log(`📜 Requested past 100 requests for ${selectedLogFile}`);
    }
  };

  return (
    <div
      className={`min-h-screen ${
        darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"
      } transition-colors duration-300`}
    >
      <div className="container mx-auto px-4 py-6">
        <DashboardControls
          darkMode={darkMode}
          filter={filter}
          autoScroll={autoScroll}
          selectedApp={selectedApp}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          onClearLogs={clearLogs}
          onSetFilter={setFilter}
          onToggleAutoScroll={() => setAutoScroll(!autoScroll)}
          onBackToProcessList={() => setSelectedApp(null)}
          isroot={isRoot}
        />
        <ProcessList
          processes={processes}
          DBprocess={DBprocess}
          isLoading={isLoading}
          onViewLogs={handleViewLogs}
          darkMode={darkMode}
          isroot={isRoot}
        />
        <SystemStats
          systemStats={systemStats}
          darkMode={darkMode}
          selectedApp={selectedApp}
        />
        <StorageStats
          storageStats={storageStats}
          darkMode={darkMode}
          selectedApp={selectedApp}
        />
        {!selectedApp && (
          <UserList
            userProcesses={userProcesses}
            isLoading={isLoading}
            darkMode={darkMode}
          />
        )}
        {!selectedApp && (
          <div className={`${darkMode ? "bg-gray-900" : "bg-gray-100"} p-6`}>
            <RenderAccessLogs
              darkMode={darkMode}
              accessLogs={accessLogs}
              setSelectedLogFile={(logFile) => {
                setSelectedLogFile(logFile);
                setShowTerminal(true);
              }}
            />
            {showTerminal && selectedLogFile && (
              <div className="mt-6">
                <AccesslogTerminal
                  logFile={selectedLogFile}
                  darkMode={darkMode}
                  requests={logEntries.filter(
                    (entry) => entry.logFile === selectedLogFile
                  )}
                />
                <div className="mt-4 flex space-x-4">
                  <button
                    onClick={handleFetchPastRequests}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Past 100 Requests
                  </button>
                  <button
                    onClick={() => {
                      setShowTerminal(false);
                      setSelectedLogFile(null);
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Close Terminal
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        <AccessLogChart
          selectedApp={selectedApp}
          selectedLogFile={selectedLogFile}
          accessLogInsights={accessLogInsights}
          logFileInsights={logFileInsights}
          darkMode={darkMode}
          onClearSelection={() => setSelectedLogFile(null)}
        />
        {selectedApp && (
          <>
            <MemoryChart
              selectedApp={selectedApp}
              timeSeriesData={timeSeriesData}
              darkMode={darkMode}
            />
            <LogViewer
              errorLogs={errorLogs}
              outLogs={outLogs}
              selectedApp={selectedApp}
              filter={filter}
              autoScroll={autoScroll}
              darkMode={darkMode}
              onToggleCollapse={toggleCollapse}
              collapsed={collapsed}
            />
          </>
        )}
        <ErrorPopup
          isOpen={isSocketError}
          onClose={() => setIsSocketError(false)}
        />
      </div>
    </div>
  );
}
