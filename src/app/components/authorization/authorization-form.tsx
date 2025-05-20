"use client";
import { useState, useEffect, useRef } from "react";
import {
  Check,
  Mail,
  Key,
  ChevronDown,
  X,
} from "lucide-react";
import crypto from "crypto";
import { PM2Process } from "../dashboard/types";

export default function AuthorizationForm() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [selectedServer, setSelectedServer] = useState("");
  const [selectedProcesses, setSelectedProcesses] = useState<string[]>([]);
  const socketRef = useRef<WebSocket | null>(null); // Added to store WebSocket
  const [processes, setProcesses] = useState<PM2Process[]>([]);
  const [isServerDropdownOpen, setIsServerDropdownOpen] = useState(false);
  const [isProcessDropdownOpen, setIsProcessDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [toastMessage, setToastMessage] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: "success" | "error";
  }>({ show: false, title: "", message: "", type: "success" });
  const serverDropdownRef = useRef<HTMLDivElement>(null);
  const processDropdownRef = useRef<HTMLDivElement>(null);
  const processListRef = useRef<PM2Process[]>([]);
  const [Isdisable, setIsDisable] = useState(false);
  const [userProcesses, setUserProcesses] = useState<PM2Process[]>([]);
  // const [selectedProcesses, setSelectedProcesses] = useState<string[]>([]);

  const servers = [
    { id: "1", name: "Rackend-server" },
    { id: "2", name: "Hostinger-server-1" },
    { id: "3", name: "Hostinger-server-2" },
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

  useEffect(() => {
    console.log(
      "Connecting to WebSocket...",
      process.env.NEXT_PUBLIC_WEBSOCKET_URL
    );
    const socket = new WebSocket(
      process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:8080"
    );
    // const socket = new WebSocket("ws://localhost:8080");
    socketRef.current = socket;

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "processList") {
          console.log("Process list received:", data.data);
          processListRef.current = data.data;
          setProcesses(data.data);
        }
      } catch (error) {
        console.error("WebSocket message parsing error:", error);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => socket.close();
  }, []);

  const Userexistencecheck = async (email: string) => {
    const response = await fetch("/api/user-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, flag: 1 }),
    });

    const data = await response.json();
    console.log("Response data:", data);
    return data.message; // Adjust based on your backend response
  };

  const handleProcessSelection = async (selectedServer: string) => {
    const response = await fetch("/api/user-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, selectedServer, flag: 1 }),
    });

    const data = await response.json();
    console.log("Response data:", data);
    setUserProcesses(data.data);
    return data.message; // Adjust based on your backend response
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
          if (isExist) {
            setIsDisable(true); //This is for if user already exist then disable the button grant authorization
          }
        }
      }
    };

    validateAndCheckEmail();
  }, [email]);

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

  // Generate AES-256 password
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
    const SECRET = process.env.NEXT_PUBLIC_SECRET_KEY_USER; // 32 characters
    const ALGORITHM = "aes-256-cbc";
    const IV_LENGTH = 16; // Initialization vector length
    if (!SECRET) {
      throw new Error("SECRET_KEY environment variable is not set");
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(SECRET), iv);
    let encrypted = cipher.update(password, "utf-8", "hex");
    encrypted += cipher.final("hex"); //this to be store in database
    return iv.toString('hex') + ':' + encrypted;
  };

  const handleAuthorization = async () => {
    // setIsLoading(true);
    const password = generateAES256Password(); //this is the password to be sent
    const encrypted = encryptPassword(password); //this is the password to be stored in database

    try {
      // Placeholder for sendAuthorizationEmail
      // await sendAuthorizationEmail({
      //   email,
      //   server: selectedServer,
      //   processes: selectedProcesses,
      //   password,
      // });

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

      console.log("Response data:", response);

      setGeneratedPassword(password);
      setToastMessage({
        show: true,
        title: "Authorization Granted",
        message: `Access granted to ${selectedProcesses.join(
          ", "
        )} on ${selectedServer} for ${email}. Email sent!`,
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
    setIsLoading(true);
    try {
      // Placeholder for saving process access
      console.log("Saving access for:", {
        email,
        selectedServer,
        selectedProcesses,
      });
      console.log("Selected processes:", selectedProcesses);

      const response = await fetch("/api/user-login", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          selectedServer,
          selectedProcesses,
        }),
      });

      console.log("Response data:", response);

      setToastMessage({
        show: true,
        title: "Access Saved",
        message: `Access to ${selectedProcesses.join(
          ", "
        )} on ${selectedServer} saved for ${email}.`,
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
      setIsLoading(false);
    }
  };

  const handleRegeneratePassword = async () => {
    setIsLoading(true);
    const newPassword = generateAES256Password(); //this is the new password to be sent
    console.log("New password generated:", newPassword);
    const encrypted = encryptPassword(newPassword); //this is the password to be stored in database
    try {
      // Placeholder for updating password in database
      console.log("Regenerating password for:", { email, newPassword });
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
      console.log("Response data:", response);  
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
      setIsLoading(false);
    }
  };

  const toggleProcessSelection = (processName: string) => {
    setSelectedProcesses((prev) =>
      prev.includes(processName)
        ? prev.filter((p) => p !== processName)
        : [...prev, processName]
    );
  };

  useEffect(() => {
    if (processes.length > 0 && userProcesses.length > 0) {
      const userProcessNames = userProcesses.map((p) => p.name);
      const matching = processes
        .filter((p) => userProcessNames.includes(p.name))
        .map((p) => p.name);

      console.log("Matching processes:", matching);

      setSelectedProcesses(matching);
    }
  }, [processes, userProcesses]);

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
                        handleProcessSelection(server.name);
                        setSelectedServer(server.name);
                        setIsServerDropdownOpen(false);
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
                    ? `${selectedProcesses.length} process${
                        selectedProcesses.length > 1 ? "es" : ""
                      } selected`
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
                      Loading processes...
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
                        <span className="ml-3 text-gray-900">
                          {process.name}
                        </span>
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

          {/* Action Buttons */}
          {/* <div className="grid grid-cols-2 gap-4 mt-6">
            <button
              onClick={handleAuthorization}
              disabled={
                !!emailError ||
                !email ||
                !selectedServer ||
                selectedProcesses.length === 0 ||
                isLoading || Isdisable
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
            <button
              onClick={handleSave}
              disabled={
                !!emailError ||
                !email ||
                !selectedServer ||
                selectedProcesses.length === 0 ||
                isLoading
              }
              className={`w-full px-4 py-3 rounded-lg text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ${
                !!emailError ||
                !email ||
                !selectedServer ||
                selectedProcesses.length === 0 ||
                isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 hover:scale-105 focus:ring-blue-500"
              }`}
            >
              Save Access
            </button>
            <button
              onClick={handleRevoke}
              disabled={
                !!emailError ||
                !email ||
                !selectedServer ||
                selectedProcesses.length === 0 ||
                isLoading
              }
              className={`w-full px-4 py-3 rounded-lg text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ${
                !!emailError ||
                !email ||
                !selectedServer ||
                selectedProcesses.length === 0 ||
                isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700 hover:scale-105 focus:ring-red-500"
              }`}
            >
              Revoke Access
            </button>
            <button
              onClick={handleRegeneratePassword}
              disabled={!!emailError || !email || isLoading}
              className={`w-full px-4 py-3 rounded-lg text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ${
                !!emailError || !email || isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-700 hover:scale-105 focus:ring-purple-500"
              }`}
            >
              Regenerate Password
            </button>
          </div> */}

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
                  isLoading
                }
                className={`w-full px-4 py-3 rounded-lg text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 cursor-pointer ${
                  !!emailError ||
                  !email ||
                  !selectedServer ||
                  selectedProcesses.length === 0 ||
                  isLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 hover:scale-105 focus:ring-blue-500"
                }`}
              >
                Save Access
              </button>
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                Save current access configuration
              </span>
            </div>

            {/* Regenerate Password Button */}
            <div className="relative group">
              <button
                onClick={handleRegeneratePassword}
                disabled={!!emailError || !email || isLoading}
                className={`w-full px-4 py-3 rounded-lg text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 cursor-pointer ${
                  !!emailError || !email || isLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-700 hover:scale-105 focus:ring-purple-500"
                }`}
              >
                Regenerate Password
              </button>
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                Generate a new password for the user
              </span>
            </div>
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
                  type={"password"}
                  value="thankstoinspect"
                  className="pl-10 pr-20 w-full h-12 px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-200 text-gray-900"
                  readOnly
                />
                {/* <div className="absolute right-2 top-2 flex space-x-2">
                  <button
                    className="p-2 rounded-lg hover:bg-gray-100"
                    // onClick={() => setShowPassword(!showPassword)}
                  >
                    <EyeOff className="h-5 w-5 text-gray-500" />
                  </button>
                </div> */}
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
                      className={`h-5 wuler: string;5 ${
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
