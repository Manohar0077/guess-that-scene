import { useRef, useState, useCallback, useEffect } from "react";

export type WSMessage = Record<string, any>;

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  const listenersRef = useRef<Map<string, Set<(msg: WSMessage) => void>>>(new Map());

  const connect = useCallback((url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          setConnected(true);
          resolve();
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            setLastMessage(msg);
            const handlers = listenersRef.current.get(msg.type);
            if (handlers) handlers.forEach((h) => h(msg));
          } catch {}
        };

        ws.onclose = () => {
          setConnected(false);
          wsRef.current = null;
        };

        ws.onerror = () => {
          reject(new Error("WebSocket connection failed"));
        };
      } catch (err) {
        reject(err);
      }
    });
  }, []);

  const send = useCallback((msg: WSMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const on = useCallback((type: string, handler: (msg: WSMessage) => void) => {
    if (!listenersRef.current.has(type)) {
      listenersRef.current.set(type, new Set());
    }
    listenersRef.current.get(type)!.add(handler);
    return () => {
      listenersRef.current.get(type)?.delete(handler);
    };
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setConnected(false);
  }, []);

  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  return { connect, send, on, disconnect, connected, lastMessage };
}
