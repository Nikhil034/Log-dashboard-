"use client";
import { useState, useEffect, useRef } from "react";
import { Check, Mail, Key, ChevronDown, X } from "lucide-react";
import crypto from "crypto";
import { PM2Process } from "../dashboard/types";
import { sendCredentialsMail } from "@/app/utils/Sendmail";

export default function AuthorizationForm() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [selectedServer, setSelectedServer] = useState("");
  const [selectedProcesses, setSelectedProcesses] = useState<string[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  const [processes, setProcesses] = useState<PM2Process[]>([]);
  const [isServerDropdownOpen, setIsServerDropdownOpen] = useState(false);
  const [isProcessDropdownOpen, setIsProcessDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingsave, setIsLoadingsave] = useState(false);
  const [isLoadingpassword, setIsLoadingpassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [toastMessage, setToastMessage] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: "success" | "error";
  }>({ show: false, title: "", message: "", type: "success" });
  const serverDropdownRef = useRef<HTMLDivElement>(null);
  const processDropdownRef = useRef<HTMLDivElement>(null);
  const [Isdisable, setIsDisable] = useState(false);
  const [userProcesses, setUserProcesses] = useState<PM2Process[]>([]);
  const hasPreselectedProcesses = useRef(false); // Track if pre-selection has occurred

  const servers = [
    { id: "1", name: "Racknerd_Server" },
    { id: "2", name: "Hostiger_server" },
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        serverDropdownRef.current &&
        !serverDropdownRef.current.contains(event.target as Node)
      ) {
        setIsServerDropdownOpen(false);
      }
      if (
        processDropdownRef.current &&
        !processDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProcessDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // WebSocket connection to receive process updates
  useEffect(() => {
    console.log(
      "Connecting to WebSocket...",
      process.env.NEXT_PUBLIC_WEBSOCKET_URL
    );
    const socket = new WebSocket(
      process.env.NEXT_PUBLIC_WEBSOCKET_URL || "wss://logwatcher.udonswap.org:3001"
    );
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("WebSocket connection established");
      if (selectedServer) {
        socket.send(JSON.stringify({
          type: "selectServer",
          serverId: selectedServer,
        }));
      }
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received WebSocket message:", data);

        if (data.type === "processUpdate" && data.serverId === selectedServer) {
          console.log(`Received processUpdate for ${data.serverId}:`, data.data);
          setProcesses(data.data || []);
        } else if (data.type === "error") {
          console.error(`Server error: ${data.message}`);
          setToastMessage({
            show: true,
            title: "Error",
            message: data.message,
            type: "error",
          });
        }
      } catch (error) {
        console.error("WebSocket message parsing error:", error);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setToastMessage({
        show: true,
        title: "Error",
        message: "Failed to connect to WebSocket server",
        type: "error",
      });
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
      setToastMessage({
        show: true,
        title: "Connection Lost",
        message: "WebSocket connection closed",
        type: "error",
      });
    };

    return () => socket.close();
  }, [selectedServer]);

  // Fetch user processes when email or server changes
  const Userexistencecheck = async (email: string) => {
    try {
      const response = await fetch("/api/user-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, flag: 1 }),
      });

      const data = await response.json();
      console.log("Userexistencecheck response:", data.message);
      setIsDisable(data.message);
      return data.message === "User exists";
    } catch (error) {
      console.error("Error checking user existence:", error);
      return false;
    }
  };

  const handleProcessSelection = async (selectedServer: string) => {
    try {
      const response = await fetch("/api/user-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, selectedServer, flag: 1 }),
      });

      const data = await response.json();
      console.log("handleProcessSelection response:", data);
      setUserProcesses(data.data || []);
    } catch (error) {
      console.error("Error fetching user processes:", error);
      setToastMessage({
        show: true,
        title: "Error",
        message: "Failed to fetch user processes",
        type: "error",
      });
    }
  };

  useEffect(() => {
    const validateAndCheckEmail = async () => {
      if (email) {
        if (!email.endsWith("@lampros.tech")) {
          setEmailError("Email must use the lampros.tech domain");
        } else if (!validateEmail(email)) {
          setEmailError("Please enter a valid email address");
        } else {
          setEmailError("");
          console.log("Valid email:", email);
          const isExist = await Userexistencecheck(email);
          // console.log("Line 178:",isExist);
          // setIsDisable(isExist);
          if (isExist && selectedServer) {
            await handleProcessSelection(selectedServer);
          }
        }
      }
    };

    validateAndCheckEmail();
  }, [email, selectedServer]);

  // Pre-select processes only once after userProcesses is fetched
  useEffect(() => {
    if (
      !hasPreselectedProcesses.current &&
      Array.isArray(processes) &&
      processes.length > 0 &&
      Array.isArray(userProcesses) &&
      userProcesses.length > 0
    ) {
      // Normalize process names for comparison (trim, lowercase)
      const userProcessNames = userProcesses.map((p) => p.name?.trim().toLowerCase());
      const matching = processes
        .filter((p) => userProcessNames.includes(p.name?.trim().toLowerCase()))
        .map((p) => p.name);

      console.log("Pre-selecting matching processes:", matching);
      setSelectedProcesses(matching);
      hasPreselectedProcesses.current = true; // Prevent future pre-selections
    }
  }, [processes, userProcesses]);

  // Reset pre-selection flag when server changes
  useEffect(() => {
    hasPreselectedProcesses.current = false;
  }, [selectedServer]);

  // Toast auto-hide
  useEffect(() => {
    if (toastMessage.show) {
      const timer = setTimeout(() => {
        setToastMessage({
          show: false,
          title: "",
          message: "",
          type: "success",
        });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const validateEmail = (email: string) => {
    const regex = /^[a-zA-Z0-9._%+-]+@lampros\.tech$/;
    return regex.test(email);
  };

  const generateAES256Password = () => {
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    const randomString = crypto.randomBytes(16).toString("hex");
    let encrypted = cipher.update(randomString, "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted.substring(0, 20);
  };

  const encryptPassword = (password: string) => {
    const SECRET = process.env.NEXT_PUBLIC_SECRET_KEY_USER;
    const ALGORITHM = "aes-256-cbc";
    const IV_LENGTH = 16;
    if (!SECRET) {
      throw new Error("SECRET_KEY environment variable is not set");
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET), iv);
    let encrypted = cipher.update(password, "utf-8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted;
  };

  const handleAuthorization = async () => {
    setIsLoading(true);
    const password = generateAES256Password();
    const encrypted = encryptPassword(password);

    // sendCredentialsMail(email,password);

    try {
      const response = await fetch("/api/user-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          selectedServer,
          selectedProcesses,
          encrypted,
          password,
        }),
      });

      console.log("Authorization response:", response);

      setGeneratedPassword(password);
      setToastMessage({
        show: true,
        title: "Authorization Granted",
        message: `Access granted to ${selectedProcesses.join(", ")} on ${selectedServer} for ${email}. Email sent!`,
        type: "success",
      });
    } catch (error) {
      setToastMessage({
        show: true,
        title: "Error",
        message: "Failed to send email. Password generated but not sent.",
        type: "error",
      });
      console.log("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsLoadingsave(true);
    try {
      const response = await fetch("/api/user-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          selectedServer,
          selectedProcesses,
        }),
      });

      console.log("Save response:", response);
      setToastMessage({
        show: true,
        title: "Access Saved",
        message: `Access to ${selectedProcesses.join(", ")} on ${selectedServer} saved for ${email}.`,
        type: "success",
      });
    } catch (error) {
      setToastMessage({
        show: true,
        title: "Error",
        message: "Failed to save access.",
        type: "error",
      });
      console.log("Error:", error);
    } finally {
      setIsLoadingsave(false);
    }
  };

  const handleRegeneratePassword = async () => {
    const newPassword = generateAES256Password();
    console.log("New password generated:", newPassword);
    const encrypted = encryptPassword(newPassword);
    try {
      const response = await fetch("/api/user-login", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          newPassword,
          encrypted,
        }),
      });
      setGeneratedPassword(newPassword);
      // sendCredentialsMail(email,newPassword);
      console.log("Regenerate password response:", response);
      setToastMessage({
        show: true,
        title: "Password Regenerated",
        message: `New password generated and updated for ${email}.`,
        type: "success",
      });
    } catch (error) {
      setToastMessage({
        show: true,
        title: "Error",
        message: "Failed to regenerate password.",
        type: "error",
      });
      console.log("Error:", error);
    } finally {
      setIsLoadingpassword(false);
    }
  };

  const toggleProcessSelection = (processName: string) => {
    setSelectedProcesses((prev) =>
      prev.includes(processName)
        ? prev.filter((p) => p !== processName)
        : [...prev, processName]
    );
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900 h-screen w-screen">
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-teal-600 to-teal-800 text-white">
          <h2 className="text-2xl font-bold">Process Authorization</h2>
          <p className="text-teal-100 mt-1 text-sm">
            Grant or manage access to PM2 processes
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Email Input */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-800"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                id="email"
                type="email"
                placeholder="name@lampros.tech"
                className={`pl-10 w-full h-12 px-4 py-3 bg-white border ${
                  emailError ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-200 text-gray-900`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {emailError && <p className="text-sm text-red-600">{emailError}</p>}
          </div>

          {/* Server Dropdown */}
          <div className="space-y-2">
            <label
              htmlFor="server"
              className="block text-sm font-medium text-gray-800"
            >
              Server
            </label>
            <div className="relative" ref={serverDropdownRef}>
              <button
                type="button"
                className="relative w-full bg-white border border-gray-300 rounded-lg pl-4 pr-10 py-3 text-left focus:outline-none focus:ring-2 focus:ring-teal-500 h-12"
                onClick={() => setIsServerDropdownOpen(!isServerDropdownOpen)}
              >
                <span className="block truncate text-gray-900">
                  {selectedServer || "Select a server"}
                </span>
                <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                </span>
              </button>
              {isServerDropdownOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-lg py-2 text-base ring-1 ring-black ring-opacity-5 overflow-auto max-h-60">
                  {servers.map((server) => (
                    <div
                      key={server.id}
                      className="py-2 px-4 hover:bg-teal-50 cursor-pointer flex justify-between items-center"
                      onClick={() => {
                        setSelectedServer(server.name);
                        setIsServerDropdownOpen(false);
                        handleProcessSelection(server.name);
                        setProcesses([]);
                        setSelectedProcesses([]);
                      }}
                    >
                      <span className="text-gray-900">{server.name}</span>
                      {selectedServer === server.name && (
                        <Check className="h-5 w-5 text-teal-600" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* PM2 Process Multi-Select Dropdown */}
          <div className="space-y-2">
            <label
              htmlFor="pm2-process"
              className="block text-sm font-medium text-gray-800"
            >
              PM2 Processes
            </label>
            <div className="relative" ref={processDropdownRef}>
              <button
                type="button"
                className="relative w-full bg-white border border-gray-300 rounded-lg pl-4 pr-10 py-3 text-left focus:outline-none focus:ring-2 focus:ring-teal-500 h-12"
                onClick={() => setIsProcessDropdownOpen(!isProcessDropdownOpen)}
              >
                <span className="block truncate text-gray-900">
                  {selectedProcesses.length > 0
                    ? `${selectedProcesses.length} process${selectedProcesses.length > 1 ? "es" : ""} selected`
                    : "Select processes"}
                </span>
                <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                </span>
              </button>
              {isProcessDropdownOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-lg py-2 text-base ring-1 ring-black ring-opacity-5 overflow-auto max-h-60">
                  {processes.length === 0 ? (
                    <div className="py-2 px-2 text-gray-500 text-center">
                      {selectedServer ? "Loading processes..." : "Select a server first"}
                    </div>
                  ) : (
                    processes.map((process) => (
                      <div
                        key={process.pid}
                        className="py-2 px-4 hover:bg-teal-50 cursor-pointer flex items-center"
                      >
                        <input
                          type="checkbox"
                          checked={selectedProcesses.includes(process.name)}
                          onChange={() => toggleProcessSelection(process.name)}
                          className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                        />
                        <span className="ml-3 text-gray-900">{process.name}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            {/* Selected Processes as Chips */}
            {selectedProcesses.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedProcesses.map((process) => (
                  <div
                    key={process}
                    className="flex items-center bg-teal-100 text-teal-800 text-sm font-medium px-3 py-1 rounded-full"
                  >
                    {process}
                    <button
                      onClick={() => toggleProcessSelection(process)}
                      className="ml-2 focus:outline-none"
                    >
                      <X className="h-4 w-4 text-teal-600" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 md:grid-cols-1 gap-4 mt-6">
            {/* Grant Authorization Button */}
            <div className="relative group">
              <button
                onClick={handleAuthorization}
                disabled={
                  !!emailError ||
                  !email ||
                  !selectedServer ||
                  selectedProcesses.length === 0 ||
                  isLoading ||
                  Isdisable
                }
                className={`w-full px-4 py-3 rounded-lg text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center ${
                  !!emailError ||
                  !email ||
                  !selectedServer ||
                  selectedProcesses.length === 0 ||
                  Isdisable
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-teal-600 hover:bg-teal-700 hover:scale-105 focus:ring-teal-500"
                }`}
              >
                {isLoading ? (
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : null}
                {isLoading ? "Processing..." : "Grant Authorization"}
              </button>
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                Activate selected process access
              </span>
            </div>

            {/* Save Access Button */}
            <div className="relative group">
              <button
                onClick={handleSave}
                disabled={
                  !!emailError ||
                  !email ||
                  !selectedServer ||
                  selectedProcesses.length === 0 ||
                  isLoadingsave
                }
                className={`w-full px-4 py-3 rounded-lg text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 cursor-pointer ${
                  !!emailError ||
                  !email ||
                  !selectedServer ||
                  selectedProcesses.length === 0 ||
                  isLoadingsave
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 hover:scale-105 focus:ring-blue-500"
                }`}
              >
                {isLoadingsave ? "Saving..." : "Save Access"}
              </button>
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                Save current access configuration
              </span>
            </div>

            {/* Regenerate Password Button */}
            {Isdisable && (
              <div className="relative group">
                <button
                  onClick={handleRegeneratePassword}
                  disabled={!!emailError || !email}
                  className={`w-full px-4 py-3 rounded-lg text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 cursor-pointer ${
                    !!emailError || !email
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-purple-600 hover:bg-purple-700 hover:scale-105 focus:ring-purple-500"
                  }`}
                >
                  {isLoadingpassword ? "Regenerating..." : "Regenerate Password"}
                </button>
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                  Generate a new password for the user
                </span>
              </div>
            )}
          </div>

          {/* Generated Password */}
          {generatedPassword && (
            <div className="mt-6 space-y-2">
              <label
                htmlFor="generated-password"
                className="block text-sm font-medium text-gray-800"
              >
                Generated Password (AES-256)
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  id="generated-password"
                  type="password"
                  value={generatedPassword}
                  className="pl-10 pr-20 w-full h-12 px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-200 text-gray-900"
                  readOnly
                />
              </div>
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mt-2">
                <p className="text-sm text-teal-800">
                  This password has been securely generated using AES-256
                  encryption. Save it securely.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Toast Notification */}
        {toastMessage.show && (
          <div
            className={`fixed bottom-4 right-4 w-full max-w-sm rounded-lg shadow-lg border overflow-hidden transition-all duration-300 ease-in-out animate-slideIn ${
              toastMessage.type === "success"
                ? "bg-white border-teal-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      toastMessage.type === "success"
                        ? "bg-teal-100"
                        : "bg-red-100"
                    }`}
                  >
                    <Check
                      className={`h-5 w-5 ${
                        toastMessage.type === "success"
                          ? "text-teal-600"
                          : "text-red-600"
                      }`}
                    />
                  </div>
                </div>
                <div className="ml-3 w-0 flex-1 pt-0.5">
                  <p
                    className={`text-sm font-medium ${
                      toastMessage.type === "success"
                        ? "text-teal-900"
                        : "text-red-900"
                    }`}
                  >
                    {toastMessage.title}
                  </p>
                  <p className="mt-1 text-sm text-gray-600 break-words leading-relaxed">
                    {toastMessage.message}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0 flex">
                  <button
                    className="ml-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                    onClick={() =>
                      setToastMessage({
                        show: false,
                        title: "",
                        message: "",
                        type: "success",
                      })
                    }
                  >
                    <span className="sr-only">Close</span>
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}