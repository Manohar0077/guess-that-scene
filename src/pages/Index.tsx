import React, { useState, useCallback } from "react";
import RoomLobby from "@/components/RoomLobby";
import OnlineGameBoard from "@/components/OnlineGameBoard";
import { useWebSocket, WSMessage } from "@/hooks/useWebSocket";

const Index = () => {
  const ws = useWebSocket();
  const [gameState, setGameState] = useState<{
    playerName: string;
    initialRoundData?: WSMessage;
  } | null>(null);

  const handleGameStart = useCallback((playerName: string, initialRoundData?: WSMessage) => {
    setGameState({ playerName, initialRoundData });
  }, []);

  if (!gameState) {
    return <RoomLobby ws={ws} onGameStart={handleGameStart} />;
  }

  return (
    <OnlineGameBoard
      ws={ws}
      playerName={gameState.playerName}
      initialRoundData={gameState.initialRoundData}
      onPlayAgain={() => {
        ws.disconnect();
        setGameState(null);
      }}
    />
  );
};

export default Index;
