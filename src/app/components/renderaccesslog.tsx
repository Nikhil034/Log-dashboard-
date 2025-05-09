
interface AccessLog {
  id: number | string;
  name: string;
}

interface RenderAccessLogsProps {
  darkMode: boolean;
  accessLogs: AccessLog[];
  setSelectedLogFile: React.Dispatch<React.SetStateAction<string | null>>;
}

const RenderAccessLogs: React.FC<RenderAccessLogsProps> = ({ darkMode, accessLogs, setSelectedLogFile }) => {

  if (!accessLogs) return null;

  return (
    <div
      className={`mb-6 rounded-lg ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg overflow-hidden`}
    >
      <div className="px-4 py-3 border-b border-gray-700 font-mono text-sm flex justify-between items-center">
        <div className="flex items-center">
          <div className="flex space-x-2 mr-4">
            <div className="h-3 w-3 rounded-full bg-red-500"></div>
            <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
          </div>
          <h2 className="font-semibold">Access Logs</h2>
        </div>
        <div className="text-xs">{accessLogs.length} access log files</div>
      </div>
      <div className={`p-4 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        {accessLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500">
            <p className="text-lg mb-2">No access logs found</p>
            <p className="text-sm">No access log files available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    #No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Name of Access Log
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                {accessLogs.map((log) => (
                  <tr
                    key={log.id}
                    className={`${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-50"} transition-colors`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap font-mono">{log.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono">{log.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedLogFile(log.name);
                        }}
                        className="text-blue-500 hover:text-blue-700 transition-colors cursor-pointer"
                      >
                        View
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
  );
};

export default RenderAccessLogs;