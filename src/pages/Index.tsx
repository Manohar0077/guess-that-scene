import React, { useState, useCallback } from "react";
import RoomLobby from "@/components/RoomLobby";
import OnlineGameBoard from "@/components/OnlineGameBoard";
import { useWebSocket, WSMessage } from "@/hooks/useWebSocket";

const Index = () => {
  const [gameState, setGameState] = useState<{
    ws: ReturnType<typeof useWebSocket>;
    playerName: string;
    initialRoundData?: WSMessage;
  } | null>(null);

  const handleGameStart = useCallback((ws: ReturnType<typeof useWebSocket>, playerName: string, initialRoundData?: WSMessage) => {
    setGameState({ ws, playerName, initialRoundData });
  }, []);

  if (!gameState) {
    return <RoomLobby onGameStart={handleGameStart} />;
  }

  return (
    <OnlineGameBoard
      ws={gameState.ws}
      playerName={gameState.playerName}
      initialRoundData={gameState.initialRoundData}
      onPlayAgain={() => {
        gameState.ws.disconnect();
        setGameState(null);
      }}
    />
  );
};

export default Index;
