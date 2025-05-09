
// Parse memory strings to numbers
export const parseMemory = (mem: string): number => {
  if (!mem || mem === "N/A") return 0;
  return parseFloat(mem.replace(" MB", ""));
};

// Parse percentage strings
export const parsePercent = (percent: string): number => {
  if (!percent || percent === "N/A%") return 0;
  return parseFloat(percent.replace("%", ""));
};

// Validate memory values
export const validateMemoryValue = (value: string | undefined): string => {
  if (!value || value === "N/A" || !value.includes(" MB")) return "0 MB";
  const num = parseFloat(value.replace(" MB", ""));
  return isNaN(num) ? "0 MB" : `${num.toFixed(2)} MB`;
};

// Parse outlog messages
export const parseOutLogMessage = (
  message: string,
  fallbackTimestamp: string
): { timestamp: string; message: string } => {
  try {
    const cleanedMessage = message.replace(/^\d+\|[\w-]+\s+\|\s+/gm, "").trim();

    try {
      const json = JSON.parse(cleanedMessage);
      return {
        timestamp: json.timestamp || fallbackTimestamp,
        message: json.message || JSON.stringify(json, null, 2),
      };
    } catch (e) {
      console.info("Error parsing JSON:", e);
    }

    const timestampRegex =
      /(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)/i;
    const timestampMatch = cleanedMessage.match(timestampRegex);
    let timestamp = fallbackTimestamp;
    let logMessage = cleanedMessage;

    if (timestampMatch) {
      timestamp = timestampMatch[1];
      logMessage = cleanedMessage.replace(timestampRegex, "").trim();
    }

    logMessage = logMessage
      .replace(/\\n/g, "\n")
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\")
      .trim();

    return {
      timestamp,
      message: logMessage || "No message content",
    };
  } catch (error) {
    console.error("Error parsing outlog message:", error);
    return {
      timestamp: fallbackTimestamp,
      message: message || "Unparseable log entry",
    };
  }
};

// Format date for display
export const formatDate = (dateString?: string): string => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date
    .toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      fractionalSecondDigits: 2,
    })
    .replace(",", "");
};

// Get status color for process
export const getStatusColor = (status: string): string => {
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

// Get status dot color
export const getStatusDot = (status: string): string => {
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