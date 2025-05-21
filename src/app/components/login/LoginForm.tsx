"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const LoginForm: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [popup, setPopup] = useState<{
    message: string;
    type: "success" | "error" | null;
  }>({
    message: "",
    type: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const router = useRouter();

  // Trigger shake animation on error
  useEffect(() => {
    if (popup.type === "error") {
      setShake(true);
      const timer = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [popup.type]);

  const handleLogin = async () => {
    setIsLoading(true);
    console.log("Logging in with:", { username, password });

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      console.log("Response data:", data);

      if (response.status === 200) {
        setPopup({ message: "Login successful!", type: "success" });
        setTimeout(() => {
          router.push("/");
        }, 2000);
      } else if (response.status === 404) {
        setPopup({
          message: "No admin exists with these credentials.",
          type: "error",
        });
      } else if (response.status === 401) {
        setPopup({
          message: "Unauthorized access. Invalid credentials.",
          type: "error",
        });
      } else {
        setPopup({
          message: data.message || "An error occurred.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("API error:", error);
      setPopup({ message: "Network error. Please try again.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const closePopup = () => {
    setPopup({ message: "", type: null });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center dark:bg-gray-900 bg-gray-100 h-screen w-screen">
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
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-10px);
          }
          50% {
            transform: translateX(10px);
          }
          75% {
            transform: translateX(-10px);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
        .animate-button-press:active {
          transform: scale(0.95);
        }
      `}</style>
      <div
        className={`bg-white p-8 rounded-2xl shadow-md w-full max-w-sm animate-fadeIn ${
          shake ? "animate-shake" : ""
        }`}
      >
        <h2 className="text-2xl font-semibold text-center mb-6 text-gray-800">
          Login
        </h2>
        <div className="mb-4">
          <label htmlFor="username" className="block text-gray-700 mb-2">
            Username
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 text-black"
            placeholder="Enter your Username"
            required
          />
        </div>
        <div className="mb-6">
          <label htmlFor="password" className="block text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-200 text-black"
            placeholder="Enter your password"
            required
          />
        </div>
        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 hover:scale-105 transition-all duration-200 animate-button-press flex items-center justify-center"
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
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </div>

      {popup.type && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className={`p-6 rounded-lg shadow-lg max-w-sm w-full animate-slideIn ${
              popup.type === "success" ? "bg-green-100" : "bg-red-100"
            }`}
          >
            <p
              className={`text-lg text-center ${
                popup.type === "success" ? "text-green-800" : "text-red-800"
              }`}
            >
              {popup.message}
            </p>
            <button
              onClick={closePopup}
              className="mt-4 w-full bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 hover:scale-105 transition-all duration-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginForm;
