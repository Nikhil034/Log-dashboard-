import React, { useState } from "react";
import { UserProcess } from "./types";
import { X } from "lucide-react";

interface UserListProps {
  userProcesses: UserProcess[];
  isLoading: boolean;
  darkMode: boolean;
}

export const UserList: React.FC<UserListProps> = ({
  userProcesses,
  isLoading,
  darkMode,
}) => {
  const [selectedUser, setSelectedUser] = useState<UserProcess | null>(null);

  const toggleUserProcesses = (userProcess: UserProcess) => {
    setSelectedUser(selectedUser?.user === userProcess.user ? null : userProcess);
  };

  return (
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
          <h2 className="font-semibold">User List</h2>
        </div>
        <div className="text-xs">{userProcesses.length} users monitored</div>
      </div>
      <div className={`p-4 ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : userProcesses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500">
            <p className="text-lg mb-2">No users found</p>
            <p className="text-sm">No non-system users are currently detected.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Process Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${darkMode ? "divide-gray-700" : "divide-gray-200"}`}
              >
                {userProcesses.map((userProcess) => (
                  <tr
                    key={userProcess.user}
                    className={`${
                      darkMode ? "hover:bg-gray-800" : "hover:bg-gray-50"
                    } transition-colors`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap font-semibold">
                      {userProcess.user}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono">
                      {userProcess.processCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleUserProcesses(userProcess)}
                        className="text-blue-500 hover:text-blue-700 transition-colors cursor-pointer"
                      >
                        {selectedUser?.user === userProcess.user
                          ? "Hide Processes"
                          : "View Processes"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {selectedUser && (
        <div
          className={`p-4 border-t border-gray-700 ${
            darkMode ? "bg-gray-900" : "bg-gray-50"
          } transition-all duration-300`}
        >
          <div className="flex justify-between items-center mb-4">
            <h3
              className={`text-lg font-semibold ${
                darkMode ? "text-gray-100" : "text-gray-900"
              }`}
            >
              Processes for {selectedUser.user}
            </h3>
            <button
              onClick={() => setSelectedUser(null)}
              className="text-blue-500 hover:text-blue-700 transition-colors flex items-center gap-1"
              aria-label="Close process list"
            >
              <X className="h-5 w-5" />
              Close
            </button>
          </div>
          {selectedUser.processes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg mb-2">No processes found</p>
              <p className="text-sm">This user has no running processes.</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead>
                  <tr className={`${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider sticky top-0 bg-gray-900">
                      PID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider sticky top-0 bg-gray-900">
                      Command
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider sticky top-0 bg-gray-900">
                      CPU (%)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider sticky top-0 bg-gray-900">
                      Memory (%)
                    </th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${darkMode ? "divide-gray-700" : "divide-gray-200"}`}
                >
                  {selectedUser.processes.map((process, index) => (
                    <tr
                      key={`${selectedUser.user}-${process.pid}-${index}`}
                      className={`${
                        darkMode ? "hover:bg-gray-800" : "hover:bg-gray-50"
                      } transition-colors`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap font-mono">
                        {process.pid}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono">
                        {process.command}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono">
                        {process.cpu}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono">
                        {process.mem}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};