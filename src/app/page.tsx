"use client";
import { useEffect, useRef, useState } from 'react';

type LogMessage = {
  logFile: string;
  lastLines: string;
  timestamp: string;
  severity?: 'info' | 'warning' | 'error' | 'critical';
};

export default function Home() {
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    // Simulate WebSocket for demo
    const socket = new WebSocket("ws://localhost:8080");
    
    socket.onmessage = (event) => {
      const data: LogMessage = JSON.parse(event.data);
      console.log("line number 25",data);
      // Assign random severity if not provided
      if (!data.severity) {
        const severities: LogMessage['severity'][] = ['info', 'warning', 'error', 'critical'];
        data.severity = severities[Math.floor(Math.random() * severities.length)];
      }
      setLogs(prev => [...prev, data]);
    };

    return () => socket.close();
  }, []);

  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const toggleCollapse = (idx: number) => {
    setCollapsed(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const filteredLogs = logs.filter(log => 
    log.logFile.toLowerCase().includes(filter.toLowerCase()) || 
    log.lastLines.toLowerCase().includes(filter.toLowerCase())
  );

  const getSeverityColor = (severity: LogMessage['severity']) => {
    switch(severity) {
      case 'info': return 'bg-blue-200 text-blue-800';
      case 'warning': return 'bg-yellow-200 text-yellow-800';
      case 'error': return 'bg-red-200 text-red-800';
      case 'critical': return 'bg-purple-200 text-purple-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'} transition-colors duration-300`}>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center">
            <span className="text-red-500 mr-2">🚨</span>
            Server Error Logs Monitor
          </h1>
          <div className="flex space-x-2">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full hover:bg-gray-700 transition-colors"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button 
              onClick={clearLogs}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
            >
              Clear Logs
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className={`flex flex-col md:flex-row justify-between items-center mb-4 p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
          <div className="mb-2 md:mb-0 w-full md:w-auto">
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
              className={`w-full px-4 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'} focus:outline-none focus:ring-2 focus:ring-green-500`}
            />
            {filter && (
              <button 
                onClick={() => setFilter('')}
                className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 mb-6`}>
          {['info', 'warning', 'error', 'critical'].map((sev) => {
            const count = logs.filter(log => log.severity === sev).length;
            return (
              <div key={sev} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-4 rounded-lg shadow-sm flex justify-between items-center`}>
                <div>
                  <div className="text-xs uppercase tracking-wide text-gray-500">
                    {sev}
                  </div>
                  <div className="text-2xl font-bold">
                    {count}
                  </div>
                </div>
                <div className={`h-12 w-12 rounded-full ${getSeverityColor(sev as LogMessage['severity'])} flex items-center justify-center text-lg`}>
                  {sev === 'info' && 'ℹ️'}
                  {sev === 'warning' && '⚠️'}
                  {sev === 'error' && '❌'}
                  {sev === 'critical' && '🔥'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Log display */}
        <div className={`rounded-lg shadow-lg overflow-hidden ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
          <div className="px-4 py-3 border-b border-gray-700 bg-opacity-50 font-mono text-sm flex justify-between items-center">
            <div className="flex space-x-2">
              <div className="h-3 w-3 rounded-full bg-red-500"></div>
              <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
            </div>
            <div className="text-xs">
              {filteredLogs.length} log entries
            </div>
          </div>

          <div className={`p-4 font-mono text-sm ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} h-96 overflow-y-auto`}>
            {filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <p className="text-lg mb-2">No logs to display</p>
                <p className="text-sm">Waiting for new log entries...</p>
              </div>
            ) : (
              filteredLogs.map((log, idx) => (
                <div 
                  key={idx} 
                  className={`mb-4 rounded-lg overflow-hidden border ${darkMode ? 'border-gray-700' : 'border-gray-200'} transition-all duration-200 hover:shadow-md`}
                >
                  <div 
                    className={`flex justify-between items-center p-2 cursor-pointer ${getSeverityColor(log.severity)}`}
                    onClick={() => toggleCollapse(idx)}
                  >
                    <div className="font-bold truncate mr-2">{log.logFile}</div>
                    <div className="flex items-center space-x-2 text-xs">
                      <span>{log.timestamp}</span>
                      <span className="transform transition-transform duration-200" style={{ transform: collapsed[idx] ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        ▼
                      </span>
                    </div>
                  </div>
                  
                  {!collapsed[idx] && (
                    <pre className={`p-3 overflow-x-auto whitespace-pre-wrap ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-800'}`}>
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
            onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className={`px-3 py-1 rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
          >
            Scroll to Bottom
          </button>
        </div>
      </div>
    </div>
  );
}