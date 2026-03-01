import React, { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import RoomLobby from "@/components/RoomLobby";
import OnlineGameBoard from "@/components/OnlineGameBoard";
import { useWebSocket, WSMessage } from "@/hooks/useWebSocket";

const Index = () => {
  const ws = useWebSocket();
  const [searchParams, setSearchParams] = useSearchParams();
  const [gameState, setGameState] = useState<{
    playerName: string;
    initialRoundData?: WSMessage;
  } | null>(null);

  const roomCodeFromUrl = searchParams.get("room") || "";

  const handleGameStart = useCallback((playerName: string, initialRoundData?: WSMessage) => {
    setGameState({ playerName, initialRoundData });
  }, []);

  if (!gameState) {
    return <RoomLobby ws={ws} onGameStart={handleGameStart} initialRoomCode={roomCodeFromUrl} />;
  }

  return (
    <OnlineGameBoard
      ws={ws}
      playerName={gameState.playerName}
      initialRoundData={gameState.initialRoundData}
      onPlayAgain={() => {
        ws.disconnect();
        setGameState(null);
        setSearchParams({});
      }}
    />
  );
};

export default Index;
