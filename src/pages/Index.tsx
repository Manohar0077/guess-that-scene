import React, { useState } from "react";
import GameSetup from "@/components/GameSetup";
import GameBoard from "@/components/GameBoard";
import { getRandomPhotos, PhotoEntry } from "@/data/photoLibrary";

const Index = () => {
  const [gameState, setGameState] = useState<{
    photos: PhotoEntry[];
    players: string[];
  } | null>(null);

  if (!gameState) {
    return (
      <GameSetup
        onStartGame={(players, roundCount) =>
          setGameState({ photos: getRandomPhotos(roundCount), players })
        }
      />
    );
  }

  return (
    <GameBoard
      photos={gameState.photos}
      playerNames={gameState.players}
      onPlayAgain={() => setGameState(null)}
    />
  );
};

export default Index;
