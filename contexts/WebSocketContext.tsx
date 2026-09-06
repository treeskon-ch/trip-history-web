"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";

type WSMessage = any;
type Listener = (data: WSMessage) => void;

interface WebSocketContextType {
  subscribe: (listener: Listener) => () => void;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const listenersRef = useRef<Set<Listener>>(new Set());

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;
    let isIntentionalClose = false;

    const connectWS = () => {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "wss://trip-history-api.onrender.com/ws/tracking/all";
      console.log("Global WebSocket connecting to:", wsUrl);
      
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("Global WebSocket connected");
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          listenersRef.current.forEach((listener) => listener(data));
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };

      ws.onerror = (error) => {
        if (isIntentionalClose) return; // Ignore errors from React Strict Mode cleanup
        console.error("Global WebSocket error:", error);
      };

      ws.onclose = () => {
        console.log("Global WebSocket closed");
        setIsConnected(false);
        if (!isIntentionalClose) {
          console.log("Reconnecting in 3s...");
          reconnectTimeout = setTimeout(connectWS, 3000);
        }
      };
    };

    connectWS();

    return () => {
      isIntentionalClose = true;
      clearTimeout(reconnectTimeout);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, []);

  const subscribe = (listener: Listener) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  };

  return (
    <WebSocketContext.Provider value={{ subscribe, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};
