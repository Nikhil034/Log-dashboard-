"use client";
import React, { useState, useEffect, useCallback } from "react";
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
} from "./components/dashboard/types";
import { parseMemory, parsePercent, validateMemoryValue } from "./components/dashboard/utils";
import RenderAccessLogs from "./components/renderaccesslog";
import AccesslogTerminal from "./components/accesslogterminal";

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
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [selectedLogFile, setSelectedLogFile] = useState<string | null>(null);
  const [showTerminal, setShowTerminal] = useState<boolean>(false);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [accessLogInsights, setAccessLogInsights] = useState<AccessLogInsight[]>([]);
  const [logFileInsights, setLogFileInsights] = useState<LogFileInsights>({});

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
    console.log("Connecting to WebSocket...",process.env.NEXT_PUBLIC_WEBSOCKET_URL);
    const socket = new WebSocket(process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:8080");

    // socket.onopen = () => {
    //   socket.send(
    //     JSON.stringify({ type: "client_info", userAgent: navigator.userAgent })
    //   );
    // };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "processList" || data.type === "processUpdate") {
          setProcesses(data.data);
          if (data.data.length > 0) {
            const proc = data.data[0];
            setSystemStats({
              systemMemoryTotal: validateMemoryValue(
                proc.systemMemoryTotal || proc.sysytemMemoryTotal // Handle typo
              ),
              systemFreeMemory: validateMemoryValue(proc.systemFreeMemory),
              systemUsedMemory: validateMemoryValue(proc.systemUsedMemory),
              systemBufferMemory: validateMemoryValue(proc.systemBufferMemory),
            });

            const processWithLogs = data.data.find(
              (proc: PM2Process) => Array.isArray(proc.accessLogs)
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
                newData[process.name] = [...newData[process.name], metric].slice(-5);
              });
              return newData;
            });
          }
        } else if (data.type === "out_log_update") {
          data.severity = "info";
          setOutLogs((prev) => [...prev, data]);
          updateProcessStats(data);
        } else if (data.type === "error_log_update") {
          data.severity = "error";
          setErrorLogs((prev) => [...prev, data]);
          updateProcessStats(data);
        } else if (data.type === "access_log_update") {
          setLogEntries((prev) =>
            [
              ...prev,
              {
                timestamp: data.accessLog.timestamp,
                ip: data.accessLog.ip,
                method: data.accessLog.method,
                url: data.accessLog.url,
                statusCode: parseInt(data.accessLog.status),
                userAgent: data.accessLog.userAgent,
                logFile: data.logFile,
              },
            ].slice(-100)
          );
          const { browser, os } = data;
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
            const logFile = data.logFile;
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

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => socket.close();
  }, [updateProcessStats]);

  const handleViewLogs = (processName: string) => {
    setShowTerminal(false);
    setSelectedApp(processName);
    setTimeout(() => {
      document.getElementById("logs-section")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const clearLogs = () => {
    setErrorLogs([]);
    setOutLogs([]);
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
        />
        <ProcessList
          processes={processes}
          isLoading={isLoading}
          onViewLogs={handleViewLogs}
          darkMode={darkMode}
        />
        <SystemStats systemStats={systemStats} darkMode={darkMode} selectedApp={selectedApp} />
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
                  requests={logEntries.filter((entry) => entry.logFile === selectedLogFile)}
                />
                <button
                  onClick={() => setShowTerminal(false)}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Close Terminal
                </button>
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
      </div>
    </div>
  );
}