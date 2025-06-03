// "use client";
// import React, { useState, useEffect, useCallback, useRef } from "react";
// import { debounce } from "lodash"; // Add lodash for debouncing
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
// import {
//   parseMemory,
//   parsePercent,
//   validateMemoryValue,
// } from "./components/dashboard/utils";
// import RenderAccessLogs from "./components/accesslog/renderaccesslog";
// import AccesslogTerminal from "./components/accesslog/accesslogterminal";
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
//   const [accessLogInsights, setAccessLogInsights] = useState<
//     AccessLogInsight[]
//   >([]);
//   const [logFileInsights, setLogFileInsights] = useState<LogFileInsights>({});
//   const [isSocketError, setIsSocketError] = useState<boolean>(false);
//   const [userProcesses, setUserProcesses] = useState<UserProcess[]>([]);
//   const [DBprocess, setDBprocess] = useState<PM2Process[]>([]);
//   const [isRoot, setIsRoot] = useState<boolean>(false);
//   const [selectedServer, setSelectedServer] = useState<string | null>(null);
//   const [availableServers, setAvailableServers] = useState<
//     Array<{ id: string; lastUpdate: number; isActive: boolean }>
//   >([]);
//   const socketRef = useRef<WebSocket | null>(null);
//   const reconnectAttempts = useRef(0);
//   const maxReconnectAttempts = 3;
//   const reconnectInterval = 3000;

//   // First useEffect: Handle role and login
//   useEffect(() => {
//     const role = document.cookie
//       .split("; ")
//       .find((row) => row.startsWith("role="))
//       ?.split("=")[1];

//     if (role === "root") {
//       setIsRoot(true);
//     }

//     const email = document.cookie
//       .split("; ")
//       .find((row) => row.startsWith("user_email="))
//       ?.split("=")[1];

//     const decodedEmail = email ? decodeURIComponent(email) : null;

//     console.log("Decoded email:", decodedEmail);
//     if (email) {
//       const sendLoginInfo = async () => {
//         try {
//           const response = await fetch("/api/user-login", {
//             method: "POST",
//             headers: {
//               "Content-Type": "application/json",
//             },
//             body: JSON.stringify({
//               email: decodedEmail,
//               selectedServer: "Racknerd_server", // Corrected typo from "Rackend-server"
//               flag: 1,
//             }),
//           });

//           if (!response.ok) {
//             throw new Error(`Login API failed with status: ${response.status}`);
//           }

//           const data = await response.json();
//           setDBprocess(data.data || []);
//           console.log("Response data:", data);
//         } catch (error) {
//           console.error("Login API error:", error);
//           setDBprocess([]); // Ensure DBprocess is set to an empty array on error
//         }
//       };

//       sendLoginInfo();
//     }
//   }, []);

//   // Update process stats with memoized callback
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

//   // Debounced function to update log entries
//   const updateLogEntries = useCallback(
//     debounce((newEntries: LogEntry[]) => {
//       setLogEntries((prev) => {
//         const existingTimestamps = new Set(
//           prev.map((entry) => `${entry.logFile}:${entry.timestamp}`)
//         );
//         const filteredEntries = newEntries.filter(
//           (entry) => !existingTimestamps.has(`${entry.logFile}:${entry.timestamp}`)
//         );
//         return [...prev, ...filteredEntries]
//           .sort(
//             (a, b) =>
//               new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
//           )
//           .slice(-100);
//       });
//     }, 500),
//     []
//   );

//   // Second useEffect: WebSocket connection and message handling
//   useEffect(() => {
//     let reconnectTimeout: NodeJS.Timeout;

//     const connectWebSocket = () => {
//       console.log(
//         "Connecting to WebSocket...",
//         process.env.NEXT_PUBLIC_WEBSOCKET_URL
//       );
//       const socket = new WebSocket(
//         process.env.NEXT_PUBLIC_WEBSOCKET_URL || "wss://logwatcher.udonswap.org:3000"
//       );
//       socketRef.current = socket;

//       socket.onopen = () => {
//         console.log("WebSocket connected");
//         reconnectAttempts.current = 0;
//         setIsSocketError(false);
//         // Request server list immediately after connection
//         socket.send(JSON.stringify({ type: "requestServerList" }));
        
//         if (selectedServer) {
//           socket.send(
//             JSON.stringify({
//               type: "selectServer",
//               serverId: selectedServer,
//             })
//           );
//         }
//       };

//       socket.onmessage = (event) => {
//         try {
//           const data = JSON.parse(event.data);
          
//           // Validate serverId in incoming messages
//           if (!data.serverId && data.type !== "serverList" && data.type !== "serverStatus") {
//             console.warn("Received message without serverId:", data);
//             return;
//           }

//           // Handle server list updates
//           if (data.type === "serverList" || data.type === "serverStatus") {
//             setAvailableServers(data.servers || []);
//             return;
//           }

//           // Handle server selection confirmation
//           if (data.type === "serverSelected") {
//             console.log(`Selected server: ${data.serverId}`);
//             return;
//           }

//           // Only process messages for the currently selected server
//           if (data.serverId !== selectedServer) {
//             console.log(`Ignoring message for server ${data.serverId}, current selected server: ${selectedServer}`);
//             return;
//           }

//           console.log(`Processing message for server ${data.serverId}`);

//           if (data.type === "processList" || data.type === "processUpdate") {
//             setProcesses(data.data);
//             setIsLoading(false);
//             if (data.data.length > 0) {
//               const proc = data.data[0];
//               setSystemStats({
//                 systemMemoryTotal: validateMemoryValue(proc.systemMemoryTotal),
//                 systemFreeMemory: validateMemoryValue(proc.systemFreeMemory),
//                 systemUsedMemory: validateMemoryValue(proc.systemUsedMemory),
//                 systemBufferMemory: validateMemoryValue(proc.systemBufferMemory),
//               });
//               setStorageStats({
//                 storageTotal: proc.storageTotal,
//                 storageUsed: proc.storageUsed,
//                 storageAvailable: proc.storageAvailable,
//                 storageUsePercent: proc.storageUsePercent,
//               });
//               setUserProcesses(proc.userProcesses || []);

//               const processWithLogs = data.data.find((proc: PM2Process) =>
//                 Array.isArray(proc.accessLogs)
//               );
//               if (processWithLogs) {
//                 const logsWithIds = processWithLogs.accessLogs.map(
//                   (log: string, index: number) => ({
//                     id: (index + 1).toString(),
//                     name: log,
//                   })
//                 );
//                 setAccessLogs(logsWithIds);
//               }
//             }

//             if (data.type === "processUpdate") {
//               setTimeSeriesData((prev) => {
//                 const newData = { ...prev };
//                 data.data.forEach((process: PM2Process) => {
//                   if (!newData[process.name]) newData[process.name] = [];
//                   const metric: TimeSeriesMetric = {
//                     timestamp: process.lastUpdate || new Date().toISOString(),
//                     memory: parseMemory(process.memory),
//                     residentMemory: parseMemory(process.residentMemory),
//                     sharedMemory: parseMemory(process.sharedMemory),
//                     topMEM: parsePercent(process.topMEM),
//                   };
//                   newData[process.name] = [...newData[process.name], metric].slice(
//                     -5
//                   );
//                 });
//                 return newData;
//               });
//             }
//           } else if (data.type === "access_log_analysis") {
//             updateLogEntries(
//               data.analysis.map((entry: any) => ({
//                 timestamp: entry.timestamp,
//                 ip: entry.ip,
//                 method: entry.method,
//                 url: entry.url,
//                 statusCode: parseInt(entry.status),
//                 userAgent: entry.userAgent,
//                 logFile: data.logFile,
//               }))
//             );
//           } else if (
//             data.type === "out_log_update" ||
//             data.type === "error_log_update"
//           ) {
//             data.severity = data.type === "out_log_update" ? "info" : "error";
//             if (data.type === "out_log_update") {
//               setOutLogs((prev) => [...prev, data]);
//             } else {
//               setErrorLogs((prev) => [...prev, data]);
//             }
//             updateProcessStats(data);
//           } else if (data.type === "access_log_update") {
//             updateLogEntries([
//               {
//                 timestamp: data.accessLog.timestamp,
//                 ip: data.accessLog.ip,
//                 method: data.accessLog.method,
//                 url: data.accessLog.url,
//                 statusCode: parseInt(data.accessLog.status),
//                 userAgent: data.accessLog.userAgent,
//                 logFile: data.logFile,
//               },
//             ]);
//             const { browser, os, logFile } = data;
//             setAccessLogInsights((prev) => {
//               const existing = prev.find(
//                 (insight) =>
//                   insight.browser === browser && insight.os === os
//               );
//               if (existing) {
//                 return prev.map((insight) =>
//                   insight.browser === browser && insight.os === os
//                     ? { ...insight, count: insight.count + 1 }
//                     : insight
//                 );
//               }
//               return [...prev, { browser, os, count: 1 }];
//             });
//             setLogFileInsights((prev) => {
//               const insights = prev[logFile] || [];
//               const existing = insights.find(
//                 (i) => i.browser === browser && i.os === os
//               );
//               return {
//                 ...prev,
//                 [logFile]: existing
//                   ? insights.map((i) =>
//                       i === existing ? { ...i, count: i.count + 1 } : i
//                     )
//                   : [...insights, { browser, os, count: 1 }],
//               };
//             });
//           } else if (data.type === "access_log_history") {
//             updateLogEntries(
//               data.history.map((entry: any) => ({
//                 timestamp: entry.timestamp,
//                 ip: entry.ip,
//                 method: entry.method,
//                 url: entry.url,
//                 statusCode: parseInt(entry.status),
//                 userAgent: entry.userAgent,
//                 logFile: data.logFile,
//               }))
//             );
//             console.log(
//               `Received ${data.history.length} access log entries for ${data.logFile}`
//             );
//           }
//         } catch (error) {
//           console.error("WebSocket message parsing error:", error);
//         }
//       };

//       socket.onerror = () => {
//         console.error("WebSocket error occurred");
//         reconnectAttempts.current += 1;
//         if (reconnectAttempts.current >= maxReconnectAttempts) {
//           setIsSocketError(true);
//         } else {
//           const delay = reconnectInterval * Math.pow(2, reconnectAttempts.current);
//           reconnectTimeout = setTimeout(connectWebSocket, delay);
//         }
//       };

//       socket.onclose = () => {
//         console.log("WebSocket disconnected");
//         if (reconnectAttempts.current < maxReconnectAttempts) {
//           const delay = reconnectInterval * Math.pow(2, reconnectAttempts.current);
//           reconnectTimeout = setTimeout(connectWebSocket, delay);
//         } else {
//           setIsSocketError(true);
//         }
//       };
//     };

//     connectWebSocket();

//     return () => {
//       if (socketRef.current) {
//         socketRef.current.close();
//       }
//       clearTimeout(reconnectTimeout);
//     };
//   }, [selectedServer, updateProcessStats, updateLogEntries]);

//   const handleViewLogs = (processName: string) => {
//     setShowTerminal(false);
//     console.log("Selected process:", processName);
//     setSelectedApp(processName);
//     setTimeout(() => {
//       document
//         .getElementById("logs-section")
//         ?.scrollIntoView({ behavior: "smooth" });
//     }, 100);
//   };

//   const clearLogs = () => {
//     setErrorLogs([]);
//     setOutLogs([]);
//     setLogEntries([]);
//     setAccessLogInsights([]);
//     setLogFileInsights({});
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

//   const handleFetchPastRequests = () => {
//     if (
//       socketRef.current &&
//       socketRef.current.readyState === WebSocket.OPEN &&
//       selectedLogFile &&
//       selectedServer
//     ) {
//       console.log("Current selected log file:", selectedLogFile);
//       console.log("Current selected server:", selectedServer);
//       console.log("Select ref:", socketRef.current);
//       socketRef.current.send(
//         JSON.stringify({
//           type: "request_access_log_history",
//           logFile: selectedLogFile,
//           serverId: selectedServer,
//         })
//       );
//       console.log(`📜 Requested past 100 requests for ${selectedLogFile} on ${selectedServer}`);
//     } else {
//       console.error(
//         "Cannot fetch past requests: WebSocket not open, no log file, or no server selected"
//       );
//     }
//   };

//   const handleServerSelect = (serverId: string) => {
//     if (!serverId) {
//       console.log("No server selected");
//       return;
//     }

//     if (serverId !== selectedServer) {
//       console.log(`Switching from server ${selectedServer} to ${serverId}`);
//       setSelectedServer(serverId);
//       // Clear all state
//       setProcesses([]);
//       setLogEntries([]);
//       setAccessLogInsights([]);
//       setLogFileInsights({});
//       setErrorLogs([]);
//       setOutLogs([]);
//       setSystemStats({
//         systemMemoryTotal: "0 MB",
//         systemFreeMemory: "0 MB",
//         systemUsedMemory: "0 MB",
//         systemBufferMemory: "0 MB",
//       });
//       setStorageStats({
//         storageTotal: "0 MB",
//         storageUsed: "0 MB",
//         storageAvailable: "0 MB",
//         storageUsePercent: "0%",
//       });
//       setUserProcesses([]);
//       setAccessLogs([]);
//       setTimeSeriesData({});
//       setIsLoading(true);

//       // Send server selection message
//       if (socketRef.current?.readyState === WebSocket.OPEN) {
//         socketRef.current.send(
//           JSON.stringify({
//             type: "selectServer",
//             serverId,
//           })
//         );
//       } else {
//         console.error("WebSocket not connected when trying to select server");
//       }
//     }
//   };

//   return (
//     <div
//       className={`min-h-screen ${
//         darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"
//       } transition-colors duration-300`}
//     >
//       <div className="container mx-auto px-4 py-6">
//         <div className="mb-4">
//           <select
//             value={selectedServer || ""}
//             onChange={(e) => handleServerSelect(e.target.value)}
//             className={`p-2 rounded ${
//               darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
//             }`}
//           >
//             <option value="">Select a server</option>
//             {availableServers.map((server) => (
//               <option key={server.id} value={server.id}>
//                 {server.id} {server.isActive ? "🟢" : "🔴"}
//               </option>
//             ))}
//           </select>
//         </div>
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
//           isroot={isRoot}
//         />
//         <ProcessList
//           processes={processes}
//           DBprocess={DBprocess}
//           isLoading={isLoading}
//           onViewLogs={handleViewLogs}
//           darkMode={darkMode}
//           isroot={isRoot}
//         />
//         <SystemStats
//           systemStats={systemStats}
//           darkMode={darkMode}
//           selectedApp={selectedApp}
//         />
//         <StorageStats
//           storageStats={storageStats}
//           darkMode={darkMode}
//           selectedApp={selectedApp}
//         />
//         {!selectedApp && (
//           <UserList
//             userProcesses={userProcesses}
//             isLoading={isLoading}
//             darkMode={darkMode}
//           />
//         )}
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
//                   requests={logEntries.filter(
//                     (entry) => entry.logFile === selectedLogFile
//                   )}
//                 />
//                 <div className="mt-4 flex space-x-4">
//                   <button
//                     onClick={handleFetchPastRequests}
//                     className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
//                   >
//                     Past 100 Requests
//                   </button>
//                   <button
//                     onClick={() => {
//                       setShowTerminal(false);
//                       setSelectedLogFile(null);
//                     }}
//                     className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//                   >
//                     Close Terminal
//                   </button>
//                 </div>
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
//         <ErrorPopup
//           isOpen={isSocketError}
//           onClose={() => setIsSocketError(false)}
//         />
//       </div>
//     </div>
//   );
// }

"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { debounce } from "lodash";
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
  const [DBprocess, setDBprocess] = useState<PM2Process[]>([]);
  const [isRoot, setIsRoot] = useState<boolean>(false);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [availableServers, setAvailableServers] = useState<
    Array<{ id: string; lastUpdate: number; isActive: boolean }>
  >([]);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;
  const reconnectInterval = 3000;
  const lastProcessedServerRef = useRef<string | null>(null); // Track the last server for which messages were processed

  // First useEffect: Handle role and login
  useEffect(() => {
    const role = document.cookie
      .split("; ")
      .find((row) => row.startsWith("role="))
      ?.split("=")[1];

    if (role === "root") {
      setIsRoot(true);
    }

    const email = document.cookie
      .split("; ")
      .find((row) => row.startsWith("user_email="))
      ?.split("=")[1];

    const decodedEmail = email ? decodeURIComponent(email) : null;

    console.log("Decoded email:", decodedEmail);
    if (email) {
      const sendLoginInfo = async () => {
        try {
          const response = await fetch("/api/user-login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: decodedEmail,
              selectedServer: selectedServer || "Racknerd_server", // Use selectedServer if available
              flag: 1,
            }),
          });

          if (!response.ok) {
            throw new Error(`Login API failed with status: ${response.status}`);
          }

          const data = await response.json();
          setDBprocess(data.data || []);
          console.log("Response data:", data);
        } catch (error) {
          console.error("Login API error:", error);
          setDBprocess([]);
        }
      };

      sendLoginInfo();
    }
  }, [selectedServer]); // Re-run when selectedServer changes

  // Update process stats with memoized callback
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

  // Debounced function to update log entries
  const updateLogEntries = useCallback(
    debounce((newEntries: LogEntry[]) => {
      setLogEntries((prev) => {
        const existingTimestamps = new Set(
          prev.map((entry) => `${entry.logFile}:${entry.timestamp}`)
        );
        const filteredEntries = newEntries.filter(
          (entry) => !existingTimestamps.has(`${entry.logFile}:${entry.timestamp}`)
        );
        return [...prev, ...filteredEntries]
          .sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          )
          .slice(-100);
      });
    }, 500),
    []
  );

  // Second useEffect: WebSocket connection and message handling
  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout;

    const connectWebSocket = () => {
      console.log(
        "Connecting to WebSocket...",
        process.env.NEXT_PUBLIC_WEBSOCKET_URL
      );
      const socket = new WebSocket(
        process.env.NEXT_PUBLIC_WEBSOCKET_URL || "wss://logwatcher.udonswap.org:3000"
      );
      socketRef.current = socket;

      socket.onopen = () => {
        console.log("WebSocket connected at", new Date().toISOString());
        reconnectAttempts.current = 0;
        setIsSocketError(false);
        socket.send(JSON.stringify({ type: "requestServerList" }));

        if (selectedServer) {
          console.log(`Sending selectServer for ${selectedServer}`);
          socket.send(
            JSON.stringify({
              type: "selectServer",
              serverId: selectedServer,
            })
          );
        }
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Received WebSocket message:", data);

          // Handle server list updates
          if (data.type === "serverList" || data.type === "serverStatus") {
            setAvailableServers(data.servers || []);
            return;
          }

          // Handle server selection confirmation
          if (data.type === "serverSelected") {
            console.log(`Server selection confirmed: ${data.serverId}`);
            lastProcessedServerRef.current = data.serverId;
            return;
          }

          // Validate serverId in incoming messages
          if (!data.serverId && data.type !== "serverList" && data.type !== "serverStatus") {
            console.warn("Received message without serverId:", data);
            return;
          }

          // Only process messages for the currently selected server
          if (data.serverId !== selectedServer) {
            console.log(
              `Ignoring message for server ${data.serverId}, current selected server: ${selectedServer}`
            );
            return;
          }

          // Additional check: Ignore messages if they don't match the last confirmed server
          if (lastProcessedServerRef.current !== selectedServer) {
            console.log(
              `Ignoring message for server ${data.serverId}, last confirmed server: ${lastProcessedServerRef.current}`
            );
            return;
          }

          console.log(`Processing message for server ${data.serverId}`);

          if (data.type === "processList" || data.type === "processUpdate") {
            setProcesses(data.data);
            setIsLoading(false);
            if (data.data.length > 0) {
              const proc = data.data[0];
              setSystemStats({
                systemMemoryTotal: validateMemoryValue(proc.systemMemoryTotal),
                systemFreeMemory: validateMemoryValue(proc.systemFreeMemory),
                systemUsedMemory: validateMemoryValue(proc.systemUsedMemory),
                systemBufferMemory: validateMemoryValue(proc.systemBufferMemory),
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
                  newData[process.name] = [...newData[process.name], metric].slice(
                    -5
                  );
                });
                return newData;
              });
            }
          } else if (data.type === "access_log_analysis") {
            updateLogEntries(
              data.analysis.map((entry: any) => ({
                timestamp: entry.timestamp,
                ip: entry.ip,
                method: entry.method,
                url: entry.url,
                statusCode: parseInt(entry.status),
                userAgent: entry.userAgent,
                logFile: data.logFile,
              }))
            );
          } else if (
            data.type === "out_log_update" ||
            data.type === "error_log_update"
          ) {
            data.severity = data.type === "out_log_update" ? "info" : "error";
            if (data.type === "out_log_update") {
              setOutLogs((prev) => [...prev, data]);
            } else {
              setErrorLogs((prev) => [...prev, data]);
            }
            updateProcessStats(data);
          } else if (data.type === "access_log_update") {
            updateLogEntries([
              {
                timestamp: data.accessLog.timestamp,
                ip: data.accessLog.ip,
                method: data.accessLog.method,
                url: data.accessLog.url,
                statusCode: parseInt(data.accessLog.status),
                userAgent: data.accessLog.userAgent,
                logFile: data.logFile,
              },
            ]);
            const { browser, os, logFile } = data;
            setAccessLogInsights((prev) => {
              const existing = prev.find(
                (insight) =>
                  insight.browser === browser && insight.os === os
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
            updateLogEntries(
              data.history.map((entry: any) => ({
                timestamp: entry.timestamp,
                ip: entry.ip,
                method: entry.method,
                url: entry.url,
                statusCode: parseInt(entry.status),
                userAgent: entry.userAgent,
                logFile: data.logFile,
              }))
            );
            console.log(
              `Received ${data.history.length} access log entries for ${data.logFile}`
            );
          }
        } catch (error) {
          console.error("WebSocket message parsing error:", error);
        }
      };

      socket.onerror = () => {
        console.error("WebSocket error occurred");
        reconnectAttempts.current += 1;
        if (reconnectAttempts.current >= maxReconnectAttempts) {
          setIsSocketError(true);
        } else {
          const delay = reconnectInterval * Math.pow(2, reconnectAttempts.current);
          reconnectTimeout = setTimeout(connectWebSocket, delay);
        }
      };

      socket.onclose = () => {
        console.log("WebSocket disconnected");
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = reconnectInterval * Math.pow(2, reconnectAttempts.current);
          reconnectTimeout = setTimeout(connectWebSocket, delay);
        } else {
          setIsSocketError(true);
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
  }, [selectedServer, updateProcessStats, updateLogEntries]);

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
    setLogEntries([]);
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
      selectedLogFile &&
      selectedServer
    ) {
      console.log("Current selected log file:", selectedLogFile);
      console.log("Current selected server:", selectedServer);
      console.log("Select ref:", socketRef.current);
      socketRef.current.send(
        JSON.stringify({
          type: "request_access_log_history",
          logFile: selectedLogFile,
          serverId: selectedServer,
        })
      );
      console.log(`📜 Requested past 100 requests for ${selectedLogFile} on ${selectedServer}`);
    } else {
      console.error(
        "Cannot fetch past requests: WebSocket not open, no log file, or no server selected"
      );
    }
  };

  const handleServerSelect = (serverId: string) => {
    if (!serverId) {
      console.log("No server selected");
      return;
    }

    if (serverId !== selectedServer) {
      console.log(`Switching from server ${selectedServer} to ${serverId}`);
      setSelectedServer(serverId);
      lastProcessedServerRef.current = null; // Reset last processed server
      // Clear all state
      setProcesses([]);
      setLogEntries([]);
      setAccessLogInsights([]);
      setLogFileInsights({});
      setErrorLogs([]);
      setOutLogs([]);
      setSystemStats({
        systemMemoryTotal: "0 MB",
        systemFreeMemory: "0 MB",
        systemUsedMemory: "0 MB",
        systemBufferMemory: "0 MB",
      });
      setStorageStats({
        storageTotal: "0 MB",
        storageUsed: "0 MB",
        storageAvailable: "0 MB",
        storageUsePercent: "0%",
      });
      setUserProcesses([]);
      setAccessLogs([]);
      setTimeSeriesData({});
      setIsLoading(true);

      // Send server selection message
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: "selectServer",
            serverId,
          })
        );
      } else {
        console.error("WebSocket not connected when trying to select server");
      }
    }
  };

  return (
    <div
      className={`min-h-screen ${
        darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"
      } transition-colors duration-300`}
    >
      <div className="container mx-auto px-4 py-6">
        <div className="mb-4">
          <select
            value={selectedServer || ""}
            onChange={(e) => handleServerSelect(e.target.value)}
            className={`p-2 rounded ${
              darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
            }`}
          >
            <option value="">Select a server</option>
            {availableServers.map((server) => (
              <option key={server.id} value={server.id}>
                {server.id} {server.isActive ? "🟢" : "🔴"}
              </option>
            ))}
          </select>
        </div>
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