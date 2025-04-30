// // "use client";
// // import { useEffect, useRef, useState } from 'react';
// // import PM2Monitor from './process';

// // type LogMessage = {
// //   appName: string;
// //   status: string;
// //   memory: string;
// //   logFile: string;
// //   lastLines: string;
// //   timestamp: string;
// //   severity?: 'info' | 'warning' | 'error' | 'critical';
// // };

// // export default function Home() {
// //   const [logs, setLogs] = useState<LogMessage[]>([]);
// //   const [filter, setFilter] = useState<string>('');
// //   const [autoScroll, setAutoScroll] = useState(true);
// //   const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
// //   const [selectedApp, setSelectedApp] = useState<string | null>(null);
// //   const bottomRef = useRef<HTMLDivElement | null>(null);
// //   const [darkMode, setDarkMode] = useState(true);
// //   const [apps, setApps] = useState<Map<string, {
// //     status: string;
// //     memory: string;
// //     count: number;
// //     lastUpdate: string;
// //   }>>(new Map());

// //   useEffect(() => {
// //     // Simulate WebSocket for demo
// //     const socket = new WebSocket("ws://localhost:8080");

// //     socket.onopen = () => {
// //       console.log("WebSocket connection established");
// //     };

// //     socket.onmessage = (event) => {
// //       const data =JSON.parse(event.data);
// //       // console.log(event.data);

// //       if (data.type === 'processList') {
// //         console.log("Process list received:", event.data);
// //         // setProcesses(data.data);
// //       }
// //       else
// //       {
// //         const data: LogMessage = JSON.parse(event.data);
// //         console.log("Received data:", data);

// //         // Assign random severity if not provided
// //         if (!data.severity) {
// //           const severities: LogMessage['severity'][] = ['info', 'warning', 'error', 'critical'];
// //           data.severity = severities[Math.floor(Math.random() * severities.length)];
// //         }

// //         setLogs(prev => [...prev, data]);

// //         // Update apps summary map
// //         setApps(prevApps => {
// //           const newApps = new Map(prevApps);
// //           const appName = data.appName;

// //           newApps.set(appName, {
// //             status: data.status,
// //             memory: data.memory,
// //             count: (prevApps.get(appName)?.count || 0) + 1,
// //             lastUpdate: data.timestamp
// //           });

// //           return newApps;
// //         });
// //       };

// //       }

// //     return () => socket.close();
// //   }, []);

// //   useEffect(() => {
// //     if (autoScroll && selectedApp) {
// //       bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
// //     }
// //   }, [logs, autoScroll, selectedApp]);

// //   const toggleCollapse = (appName: string) => {
// //     setCollapsed(prev => ({
// //       ...prev,
// //       [appName]: !prev[appName]
// //     }));
// //   };

// //   const clearLogs = () => {
// //     setLogs([]);
// //     setApps(new Map());
// //   };

// //   const getStatusColor = (status: string) => {
// //     switch(status.toLowerCase()) {
// //       case 'online': return 'bg-green-100 text-green-800';
// //       case 'error': return 'bg-red-100 text-red-800';
// //       case 'stopped': return 'bg-gray-100 text-gray-800';
// //       case 'restarting': return 'bg-yellow-100 text-yellow-800';
// //       default: return 'bg-blue-100 text-blue-800';
// //     }
// //   };

// //   const getStatusDot = (status: string) => {
// //     switch(status.toLowerCase()) {
// //       case 'online': return 'bg-green-500';
// //       case 'error': return 'bg-red-500';
// //       case 'stopped': return 'bg-gray-500';
// //       case 'restarting': return 'bg-yellow-500';
// //       default: return 'bg-blue-500';
// //     }
// //   };

// //   const getSeverityColor = (severity: LogMessage['severity']) => {
// //     switch(severity) {
// //       case 'info': return 'bg-blue-200 text-blue-800';
// //       case 'warning': return 'bg-yellow-200 text-yellow-800';
// //       case 'error': return 'bg-red-200 text-red-800';
// //       case 'critical': return 'bg-purple-200 text-purple-800';
// //       default: return 'bg-gray-200 text-gray-800';
// //     }
// //   };

// //   const filteredLogs = logs.filter(log =>
// //     (!selectedApp || log.appName === selectedApp) &&
// //     (log.lastLines.toLowerCase().includes(filter.toLowerCase()) ||
// //      log.logFile.toLowerCase().includes(filter.toLowerCase()))
// //   );

// //   const formatDate = (dateString: string) => {
// //     const date = new Date(dateString);
// //     return date.toLocaleString();
// //   };

// //   return (
// //     <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'} transition-colors duration-300`}>
// //       <div className="container mx-auto px-4 py-6">
// //         <div className="flex items-center justify-between mb-6">
// //           <h1 className="text-2xl font-bold flex items-center">
// //             <span className="text-blue-500 mr-2">⚙️</span>
// //             PM2 Process Monitor
// //           </h1>
// //           <div className="flex space-x-2">
// //             <button
// //               onClick={() => setDarkMode(!darkMode)}
// //               className="p-2 rounded-full hover:bg-gray-700 transition-colors"
// //             >
// //               {darkMode ? '☀️' : '🌙'}
// //             </button>
// //             <button
// //               onClick={clearLogs}
// //               className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
// //             >
// //               Clear Data
// //             </button>
// //           </div>
// //         </div>

// //         {/* Controls */}
// //         <div className={`flex flex-col md:flex-row justify-between items-center mb-4 p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
// //           <div className="mb-2 md:mb-0 w-full md:w-auto flex items-center space-x-4">
// //             <label className="flex items-center space-x-2">
// //               <input
// //                 type="checkbox"
// //                 checked={autoScroll}
// //                 onChange={() => setAutoScroll(!autoScroll)}
// //                 className="form-checkbox h-4 w-4 text-green-500"
// //               />
// //               <span>Auto-scroll</span>
// //             </label>

// //             {selectedApp && (
// //               <button
// //                 onClick={() => setSelectedApp(null)}
// //                 className="flex items-center text-sm px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors"
// //               >
// //                 <span className="mr-1">←</span> Back to Process List
// //               </button>
// //             )}
// //           </div>
// //           <div className="relative w-full md:w-64">
// //             <input
// //               type="text"
// //               value={filter}
// //               onChange={(e) => setFilter(e.target.value)}
// //               placeholder="Filter logs..."
// //               className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'} focus:outline-none focus:ring-2 focus:ring-green-500`}
// //             />
// //             {filter && (
// //               <button
// //                 onClick={() => setFilter('')}
// //                 className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
// //               >
// //                 ×
// //               </button>
// //             )}
// //           </div>
// //         </div>

// //         {/* Apps Summary or Selected App Details */}
// //         {!selectedApp ? (
// //           // PM2 Process List
// //           <div className={`rounded-lg shadow-lg overflow-hidden ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
// //             <div className="px-4 py-3 border-b border-gray-700 bg-opacity-50 font-mono text-sm flex justify-between items-center">
// //               <div className="flex space-x-2">
// //                 <div className="h-3 w-3 rounded-full bg-red-500"></div>
// //                 <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
// //                 <div className="h-3 w-3 rounded-full bg-green-500"></div>
// //               </div>
// //               <div className="text-xs">
// //                 {Array.from(apps.keys()).length} processes monitored
// //               </div>
// //             </div>

// //             <div className={`p-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
// //               {Array.from(apps.keys()).length === 0 ? (
// //                 <div className="flex flex-col items-center justify-center h-40 text-gray-500">
// //                   <p className="text-lg mb-2">No processes to display</p>
// //                   <p className="text-sm">Waiting for PM2 data...</p>
// //                 </div>
// //               ) : (
// //                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
// //                   {Array.from(apps).map(([appName, appData]) => (
// //                     <div
// //                       key={appName}
// //                       onClick={() => setSelectedApp(appName)}
// //                       className={`relative overflow-hidden rounded-lg ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} p-4 shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'} cursor-pointer transition-all duration-200 hover:shadow-md`}
// //                     >
// //                       <div className={`absolute top-0 left-0 w-1 h-full ${getStatusDot(appData.status)}`}></div>
// //                       <div className="flex justify-between items-start mb-3">
// //                         <h3 className="font-bold text-lg truncate">{appName}</h3>
// //                         <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appData.status)}`}>
// //                           {appData.status}
// //                         </span>
// //                       </div>
// //                       <div className="flex justify-between text-sm">
// //                         <div>
// //                           <div className="text-gray-500 mb-1">Memory Usage</div>
// //                           <div className="font-mono">{appData.memory}</div>
// //                         </div>
// //                         <div>
// //                           <div className="text-gray-500 mb-1">Log Entries</div>
// //                           <div className="font-mono text-center">{appData.count}</div>
// //                         </div>
// //                       </div>
// //                       <div className="mt-3 pt-3 text-xs text-gray-500 border-t border-gray-200 dark:border-gray-700">
// //                         Last update: {formatDate(appData.lastUpdate)}
// //                       </div>
// //                     </div>
// //                   ))}
// //                 </div>
// //               )}
// //             </div>
// //           </div>
// //         ) : (
// //           // Selected App Logs
// //           <>
// //             {/* App Stats */}
// //             <div className={`mb-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} p-4 shadow-sm flex flex-col`}>
// //               <div className="flex justify-between items-center mb-4">
// //                 <div className="flex items-center">
// //                   <span className={`w-3 h-3 mr-2 rounded-full ${getStatusDot(apps.get(selectedApp)?.status || 'unknown')}`}></span>
// //                   <h2 className="text-xl font-bold">{selectedApp}</h2>
// //                 </div>
// //                 <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(apps.get(selectedApp)?.status || 'unknown')}`}>
// //                   {apps.get(selectedApp)?.status || 'unknown'}
// //                 </div>
// //               </div>
// //               <div className="grid grid-cols-3 gap-4 text-center">
// //                 <div className={`p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
// //                   <div className="text-xs text-gray-500 mb-1">Memory</div>
// //                   <div className="font-mono font-bold">{apps.get(selectedApp)?.memory || '0 MB'}</div>
// //                 </div>
// //                 <div className={`p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
// //                   <div className="text-xs text-gray-500 mb-1">Log Entries</div>
// //                   <div className="font-mono font-bold">{apps.get(selectedApp)?.count || 0}</div>
// //                 </div>
// //                 <div className={`p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
// //                   <div className="text-xs text-gray-500 mb-1">Last Update</div>
// //                   <div className="font-mono text-xs">{formatDate(apps.get(selectedApp)?.lastUpdate || '')}</div>
// //                 </div>
// //               </div>
// //             </div>

// //             {/* Log display */}
// //             <div className={`rounded-lg shadow-lg overflow-hidden ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
// //               <div className="px-4 py-3 border-b border-gray-700 bg-opacity-50 font-mono text-sm flex justify-between items-center">
// //                 <div className="flex space-x-2">
// //                   <div className="h-3 w-3 rounded-full bg-red-500"></div>
// //                   <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
// //                   <div className="h-3 w-3 rounded-full bg-green-500"></div>
// //                 </div>
// //                 <div className="text-xs">
// //                   {filteredLogs.length} log entries for {selectedApp}
// //                 </div>
// //               </div>

// //               <div className={`p-4 font-mono text-sm ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} h-96 overflow-y-auto`}>
// //                 {filteredLogs.length === 0 ? (
// //                   <div className="flex flex-col items-center justify-center h-full text-gray-500">
// //                     <p className="text-lg mb-2">No logs to display</p>
// //                     <p className="text-sm">Waiting for new log entries...</p>
// //                   </div>
// //                 ) : (
// //                   filteredLogs.map((log, idx) => (
// //                     <div
// //                       key={idx}
// //                       className={`mb-4 rounded-lg overflow-hidden border ${darkMode ? 'border-gray-700' : 'border-gray-200'} transition-all duration-200 hover:shadow-md`}
// //                     >
// //                       <div
// //                         className={`flex justify-between items-center p-2 cursor-pointer ${getSeverityColor(log.severity)}`}
// //                         onClick={() => toggleCollapse(log.appName + idx)}
// //                       >
// //                         <div className="font-bold truncate mr-2">{log.logFile}</div>
// //                         <div className="flex items-center space-x-2 text-xs">
// //                           <span>{formatDate(log.timestamp)}</span>
// //                           <span className="transform transition-transform duration-200" style={{ transform: collapsed[log.appName + idx] ? 'rotate(180deg)' : 'rotate(0deg)' }}>
// //                             ▼
// //                           </span>
// //                         </div>
// //                       </div>

// //                       {!collapsed[log.appName + idx] && (
// //                         <pre className={`p-3 overflow-x-auto whitespace-pre-wrap ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-800'}`}>
// //                           {log.lastLines}
// //                         </pre>
// //                       )}
// //                     </div>
// //                   ))
// //                 )}
// //                 <div ref={bottomRef} />
// //               </div>
// //             </div>

// //             {/* Controls footer */}
// //             <div className="mt-4 flex justify-end">
// //               <button
// //                 onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
// //                 className={`px-3 py-1 rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
// //               >
// //                 Scroll to Bottom
// //               </button>
// //             </div>
// //           </>
// //         )}
// //       </div>
// //       {/* <PM2Monitor/> */}
// //     </div>
// //   );
// // }

// "use client";
// import { useEffect, useRef, useState } from "react";

"use client";
import { useState, useEffect, useRef } from "react";

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
  severity?: "info" | "warning" | "error" | "critical";
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

export default function Home() {
  const [processes, setProcesses] = useState<PM2Process[]>([]);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [outlog, setOutlog] = useState<LogMessage[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [darkMode, setDarkMode] = useState(true);

  // WebSocket for log updates
  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080");

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "processList") {
        console.log("Process list received:", data.data);
        setProcesses(data.data);
        setIsLoading(false);
      } else if (data.type === "out_log_update") {
        console.log("Outlog preview received:", data);
        const outlogData: LogMessage = data;
        setOutlog((prev) => [...prev, outlogData]);
        setProcesses((prevProcesses) => {
          return prevProcesses.map((process) => {
            if (process.name === outlogData.appName) {
              return {
                ...process,
                status: outlogData.status,
                memory: outlogData.memory,
                lastUpdate: outlogData.timestamp,
              };
            }
            return process;
          });
        });
      }
      else 
      {
        const logData: LogMessage = data;
        console.log("Received data:", logData);

        // Assign random severity if not provided
        logData.severity = "error"

        setLogs((prev) => [...prev, logData]);

        // Update process stats based on the log
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
      }
    };

    return () => socket.close();
  }, []);

  useEffect(() => {
    if (autoScroll && selectedApp) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll, selectedApp]);

  const toggleCollapse = (key: string) => {
    setCollapsed((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };
  const clearLogs = () => {
    setLogs([]);
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

  const getSeverityColor = (severity: LogMessage["severity"]) => {
    switch (severity) {
      case "info":
        return "bg-blue-200 text-blue-800";
      case "warning":
        return "bg-yellow-200 text-yellow-800";
      case "error":
        return "bg-red-200 text-red-800";
      case "critical":
        return "bg-purple-200 text-purple-800";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  const filteredLogs = logs.filter(
    (log) =>
      (!selectedApp || log.appName === selectedApp) &&
      (log.lastLines.toLowerCase().includes(filter.toLowerCase()) ||
        log.logFile.toLowerCase().includes(filter.toLowerCase()))
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
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
                  outlog entries for {selectedApp}
                </div>
              </div>

              <div
                className={`p-4 font-mono text-sm ${
                  darkMode ? "bg-gray-900" : "bg-gray-50"
                } h-96 overflow-y-auto`}
              >
                {outlog.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <p className="text-lg mb-2">No outlog to display</p>
                    <p className="text-sm">Waiting for outlog entries...</p>
                  </div>
                ) : (
                  outlog.map((log, idx) => (
                    <div
                      key={idx}
                      className={`mb-4 rounded-lg overflow-hidden border ${
                        darkMode ? "border-gray-700" : "border-gray-200"
                      } transition-all duration-200 hover:shadow-md`}
                    >
                      <div
                        className={`flex justify-between items-center p-2 cursor-pointer ${getSeverityColor(
                          log.severity
                        )}`}
                        onClick={() => toggleCollapse(log.appName + idx)}
                      >
                        <div className="font-bold truncate mr-2">
                          {log.logFile}
                        </div>
                        <div className="flex items-center space-x-2 text-xs">
                          <span>{formatDate(log.timestamp)}</span>
                          <span
                            className="transform transition-transform duration-200"
                            style={{
                              transform: collapsed[log.appName + idx]
                                ? "rotate(180deg)"
                                : "rotate(0deg)",
                            }}
                          >
                            ▼
                          </span>
                        </div>
                      </div>

                      {!collapsed[log.appName + idx] && (
                        <pre
                          className={`p-3 overflow-x-auto whitespace-pre-wrap ${
                            darkMode
                              ? "bg-gray-800 text-gray-300"
                              : "bg-white text-gray-800"
                          }`}
                        >
                          {log.lastLines}
                        </pre>
                      )}
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>
            </div>

        

            {/* Log Display */}
            <div
              className={`rounded-lg shadow-lg overflow-hidden mt-1.5 ${
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
                  {filteredLogs.length} log entries for {selectedApp}
                </div>
              </div>

              <div
                className={`p-4 font-mono text-sm ${
                  darkMode ? "bg-gray-900" : "bg-gray-50"
                } h-96 overflow-y-auto`}
              >
                {outlog.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <p className="text-lg mb-2">No logs to display</p>
                    <p className="text-sm">Waiting for new log entries...</p>
                  </div>
                ) : (
                  filteredLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={`mb-4 rounded-lg overflow-hidden border ${
                        darkMode ? "border-gray-700" : "border-gray-200"
                      } transition-all duration-200 hover:shadow-md`}
                    >
                      <div
                        className={`flex justify-between items-center p-2 cursor-pointer ${getSeverityColor(
                          log.severity
                        )}`}
                        onClick={() => toggleCollapse(log.appName + idx)}
                      >
                        <div className="font-bold truncate mr-2">
                          {log.logFile}
                        </div>
                        <div className="flex items-center space-x-2 text-xs">
                          <span>{formatDate(log.timestamp)}</span>
                          <span
                            className="transform transition-transform duration-200"
                            style={{
                              transform: collapsed[log.appName + idx]
                                ? "rotate(180deg)"
                                : "rotate(0deg)",
                            }}
                          >
                            ▼
                          </span>
                        </div>
                      </div>

                      {!collapsed[log.appName + idx] && (
                        <pre
                          className={`p-3 overflow-x-auto whitespace-pre-wrap ${
                            darkMode
                              ? "bg-gray-800 text-gray-300"
                              : "bg-white text-gray-800"
                          }`}
                        >
                          {log.lastLines}
                        </pre>
                      )}
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>
            </div>

            {/* Controls footer */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() =>
                  bottomRef.current?.scrollIntoView({ behavior: "smooth" })
                }
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