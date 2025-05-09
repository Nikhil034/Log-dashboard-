"use client"

import { useState, useEffect } from "react"
import { AlertCircle, X, WifiOff } from "lucide-react"

interface ErrorPopupProps {
  isOpen: boolean
  onClose: () => void
}

export function ErrorPopup({ isOpen, onClose }: ErrorPopupProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  if (!isVisible && !isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur effect */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Popup container */}
      <div
        className={`relative bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden transition-all duration-300 ${
          isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        {/* Red error header */}
        <div className="bg-red-500 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <AlertCircle className="h-6 w-6" />
            <h2 className="text-lg font-semibold">Connection Error</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-red-600 rounded-full p-1 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error content */}
        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2 text-gray-600">Socket Server Disconnected</h3>
            <p className="text-gray-600">
              The connection to the socket server has been lost. This may be due to network issues or the server may
              have stopped responding.
            </p>
          </div>

          {/* Connection Loss Animation */}
          <div className="flex justify-center py-6">
            <div className="flex flex-col items-center">
              {/* Server icon */}
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                <div className="w-10 h-10 bg-gray-400 rounded-md"></div>
              </div>

              {/* Connection line */}
              <div className="w-1 h-12 bg-gray-200 relative mb-2 overflow-hidden">
                <div className="absolute w-full bg-red-500 h-4 -top-4 animate-[ping_1.5s_ease-in-out_infinite]"></div>
              </div>

              {/* Disconnected icon with animation */}
              <div className="relative">
                <WifiOff className="h-8 w-8 text-red-500" />
                <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></span>
              </div>
            </div>
          </div>

          {/* Error details */}
          <div className="bg-red-50 border border-red-100 rounded-md p-3">
            <p className="text-sm text-red-800 font-mono">
              Error: Unable to establish WebSocket connection. Server not responding properly.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
