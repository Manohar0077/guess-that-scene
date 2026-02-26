import React, { useState, useCallback } from "react";
import RoomLobby from "@/components/RoomLobby";
import OnlineGameBoard from "@/components/OnlineGameBoard";
import { useWebSocket } from "@/hooks/useWebSocket";

const Index = () => {
  const [gameState, setGameState] = useState<{
    ws: ReturnType<typeof useWebSocket>;
    playerName: string;
  } | null>(null);

  const handleGameStart = useCallback((ws: ReturnType<typeof useWebSocket>, playerName: string) => {
    setGameState({ ws, playerName });
  }, []);

  if (!gameState) {
    return <RoomLobby onGameStart={handleGameStart} />;
  }

  return (
    <OnlineGameBoard
      ws={gameState.ws}
      playerName={gameState.playerName}
      onPlayAgain={() => {
        gameState.ws.disconnect();
        setGameState(null);
      }}
    />
  );
};

export default Index;
