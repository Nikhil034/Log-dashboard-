import { useState, useEffect } from 'react';

// Define TypeScript interfaces for the data
interface ProcessData {
  name: string;
  status: string;
  memory: string;
  cpu: string;
  uptime: string;
}

interface LogMessage {
  appName: string;
  status: string;
  memory: string;
  logFile: string;
  lastLines: string;
  timestamp: string;
  severity?: 'info' | 'warning' | 'error' | 'critical';
}

interface AppSummary {
  status: string;
  memory: string;
  count: number;
  lastUpdate: string;
}

const PM2Monitor = () => {
  const [processes, setProcesses] = useState<ProcessData[]>([]);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [apps, setApps] = useState<Map<string, AppSummary>>(new Map());
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');

  useEffect(() => {
    let socket: WebSocket;

    // Function to connect to WebSocket
    const connectWebSocket = () => {
      // Close existing socket if any
      if (socket) {
        socket.close();
      }

      // Create new WebSocket connection
      socket = new WebSocket("ws://localhost:8080");

      socket.onopen = () => {
        console.log("WebSocket connection established");
        setConnectionStatus('Connected');
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Received data:", data);

          // Handle process list data
          if (data.type === 'processList') {
            console.log("Process list received:", data.data);
            setProcesses(data.data);
          } 
          // Handle log update data
          else if (data.appName) {
            // This is a log message
            const logMessage = data as LogMessage;
            
            // Assign random severity if not provided
            if (!logMessage.severity) {
              const severities: LogMessage['severity'][] = ['info', 'warning', 'error', 'critical'];
              logMessage.severity = severities[Math.floor(Math.random() * severities.length)];
            }
            
            setLogs(prev => [...prev, logMessage]);
            
            // Update apps summary map
            setApps(prevApps => {
              const newApps = new Map(prevApps);
              const appName = logMessage.appName;
              
              newApps.set(appName, {
                status: logMessage.status,
                memory: logMessage.memory,
                count: (prevApps.get(appName)?.count || 0) + 1,
                lastUpdate: logMessage.timestamp
              });
              
              return newApps;
            });
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      socket.onclose = (event) => {
        console.log("WebSocket connection closed", event.code, event.reason);
        setConnectionStatus('Disconnected');
        
        // Try to reconnect after a delay
        setTimeout(connectWebSocket, 3000);
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        setConnectionStatus('Error');
      };
    };

    // Initial connection
    connectWebSocket();

    // Clean up the WebSocket connection on component unmount
    return () => {
      if (socket) {
        // Prevent reconnection attempts after unmounting
        socket.onclose = null;
        socket.close();
      }
    };
  }, []);

  return (
    <div className="pm2-monitor">
      <h2>PM2 Monitor</h2>
      <p>Connection Status: {connectionStatus}</p>
      
      <h3>Process List</h3>
      {processes.length > 0 ? (
        <table className="process-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Memory</th>
              <th>CPU</th>
              <th>Uptime</th>
            </tr>
          </thead>
          <tbody>
            {processes.map((process, index) => (
              <tr key={index}>
                <td>{process.name}</td>
                <td>{process.status}</td>
                <td>{process.memory}</td>
                <td>{process.cpu}</td>
                <td>{process.uptime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No process data available</p>
      )}

      <h3>Recent Logs</h3>
      {logs.length > 0 ? (
        <div className="log-container">
          {logs.slice(-10).map((log, index) => (
            <div key={index} className={`log-entry ${log.severity}`}>
              <p>
                <strong>{log.appName}</strong> - {new Date(log.timestamp).toLocaleTimeString()}
              </p>
              <pre>{log.lastLines}</pre>
            </div>
          ))}
        </div>
      ) : (
        <p>No logs available</p>
      )}

      <h3>Apps Summary</h3>
      {apps.size > 0 ? (
        <table className="apps-table">
          <thead>
            <tr>
              <th>App Name</th>
              <th>Status</th>
              <th>Memory</th>
              <th>Log Count</th>
              <th>Last Update</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(apps).map(([appName, summary], index) => (
              <tr key={index}>
                <td>{appName}</td>
                <td>{summary.status}</td>
                <td>{summary.memory}</td>
                <td>{summary.count}</td>
                <td>{new Date(summary.lastUpdate).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No apps summary available</p>
      )}
    </div>
  );
};

export default PM2Monitor;