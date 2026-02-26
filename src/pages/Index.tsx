import React, { useState } from "react";
import GameSetup from "@/components/GameSetup";
import GameBoard from "@/components/GameBoard";

const Index = () => {
  const [gameState, setGameState] = useState<{
    imageSrc: string;
    players: string[];
  } | null>(null);

  if (!gameState) {
    return (
      <GameSetup
        onStartGame={(imageSrc, players) =>
          setGameState({ imageSrc, players })
        }
      />
    );
  }

  return (
    <GameBoard
      imageSrc={gameState.imageSrc}
      playerNames={gameState.players}
      onPlayAgain={() => setGameState(null)}
    />
  );
};

export default Index;
