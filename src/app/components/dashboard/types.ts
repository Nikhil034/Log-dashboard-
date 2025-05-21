export interface PM2Process {
    name: string;
    user:string
    pid: string | number;
    status: string;
    memory: string;
    cpu: string;
    uptime: string;
    port?: string;
    residentMemory: string;
    sharedMemory: string;
    topCPU: string;
    topMEM: string;
    lastUpdate?: string;
    systemMemoryTotal?: string; // Corrected typo
    systemFreeMemory?: string;
    systemUsedMemory?: string;
    systemBufferMemory?: string;
    accessLogs?: string[];
    userProcesses?: UserProcess[];
  }

  export interface UserProcess {
    user: string;
    processCount: number;
    processes: { pid: string; command: string; cpu: string; mem: string }[];
  }
  export interface DBProcess {
  name: string;
  status: string; // Adjust the type of status if it's more specific (e.g., "running" | "stopped")
}
  
  
  export interface LogMessage {
    appName: string;
    status: string;
    memory: string;
    logFile: string;
    lastLines: string;
    timestamp: string;
    userAgent?: string;
    severity?: "info" | "warning" | "error" | "critical";
    type?: string;
  }
  
  export interface AccessLog {
    id: string | number;
    name: string;
    ip?: string;
    timestamp?: string;
    method?: string;
    url?: string;
    status?: string;
    userAgent?: string;
    browser?: string;
    os?: string;
  }
  
  export interface AccessLogInsight {
    browser: string;
    os: string;
    count: number;
  }
  
  export interface LogFileInsights {
    [logFile: string]: AccessLogInsight[];
  }
  
  export interface LogEntry {
    timestamp: string;
    ip: string;
    method: string;
    url: string;
    statusCode: number;
    userAgent: string;
    logFile: string;
  }
  
  export interface TimeSeriesMetric {
    timestamp: string;
    memory: number;
    residentMemory: number;
    sharedMemory: number;
    topMEM: number;
  }
  
  export interface SystemStats {
    systemMemoryTotal: string;
    systemFreeMemory: string;
    systemUsedMemory: string;
    systemBufferMemory: string;
  }

  export interface StorageStats {
    storageTotal: string
    storageUsed: string,
    storageAvailable: string,
    storageUsePercent: string
  }