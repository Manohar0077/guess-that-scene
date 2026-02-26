import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import RevealCanvas from "./RevealCanvas";
import { Eye, Trophy, RotateCcw, ArrowRight } from "lucide-react";

interface Player {
  name: string;
  score: number;
}

interface Circle {
  x: number;
  y: number;
  radius: number;
}

interface GameBoardProps {
  imageSrc: string;
  playerNames: string[];
  onPlayAgain: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({
  imageSrc,
  playerNames,
  onPlayAgain,
}) => {
  const [players, setPlayers] = useState<Player[]>(
    playerNames.map((name) => ({ name, score: 0 }))
  );
  const [circles, setCircles] = useState<Circle[]>([]);
  const [round, setRound] = useState(1);
  const [roundWinner, setRoundWinner] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const maxRounds = 7;

  const generateRandomCircle = useCallback((): Circle => {
    return {
      x: 0.15 + Math.random() * 0.7,
      y: 0.15 + Math.random() * 0.7,
      radius: 0.06 + Math.random() * 0.04,
    };
  }, []);

  const revealNext = () => {
    if (gameOver) return;
    const newCircle = generateRandomCircle();
    setCircles((prev) => [...prev, newCircle]);
  };

  const handleGuess = (playerName: string) => {
    setRoundWinner(playerName);
    setPlayers((prev) =>
      prev.map((p) =>
        p.name === playerName ? { ...p, score: p.score + Math.max(1, maxRounds - round + 1) } : p
      )
    );
  };

  const nextRound = () => {
    if (round >= maxRounds) {
      setGameOver(true);
      return;
    }
    setRound((r) => r + 1);
    setRoundWinner(null);
    revealNext();
  };

  const startFirstReveal = () => {
    if (circles.length === 0) {
      revealNext();
    }
  };

  // Sort players by score for leaderboard
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  if (gameOver) {
    const winner = sortedPlayers[0];
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="game-card max-w-md w-full text-center animate-scale-in">
          <Trophy className="w-16 h-16 text-secondary mx-auto mb-4" />
          <h2 className="text-3xl font-display font-bold text-foreground mb-2">
            Game Over!
          </h2>
          <p className="text-xl text-primary font-display font-semibold mb-6">
            🎉 {winner.name} wins with {winner.score} points!
          </p>
          
          {/* Final image reveal */}
          <div className="mb-6">
            <img src={imageSrc} alt="The answer" className="w-full rounded-xl" />
          </div>

          <div className="space-y-2 mb-6">
            {sortedPlayers.map((p, i) => (
              <div
                key={p.name}
                className={`flex items-center justify-between px-4 py-2 rounded-lg ${
                  i === 0 ? "bg-secondary/20 text-secondary" : "bg-muted"
                }`}
              >
                <span className="font-medium">
                  {i === 0 ? "👑" : `${i + 1}.`} {p.name}
                </span>
                <span className="score-badge">{p.score} pts</span>
              </div>
            ))}
          </div>

          <Button onClick={onPlayAgain} className="w-full" size="lg">
            <RotateCcw className="w-4 h-4 mr-2" /> Play Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-4 gap-6">
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-3xl animate-fade-in">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">
            Round {round}/{maxRounds}
          </h2>
          <p className="text-sm text-muted-foreground">
            {circles.length} area{circles.length !== 1 ? "s" : ""} revealed
          </p>
        </div>
        <div className="flex gap-2">
          {sortedPlayers.map((p) => (
            <div
              key={p.name}
              className="text-center px-3 py-1 rounded-lg bg-muted"
            >
              <div className="text-xs text-muted-foreground">{p.name}</div>
              <div className="text-sm font-bold text-foreground">{p.score}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div className="game-card p-4 animate-fade-in">
        {circles.length === 0 ? (
          <div className="flex flex-col items-center justify-center" style={{ width: 500, height: 400 }}>
            <Eye className="w-16 h-16 text-muted-foreground mb-4 animate-pulse-glow" />
            <p className="text-muted-foreground mb-4 font-display text-lg">
              Ready to start revealing?
            </p>
            <Button onClick={startFirstReveal} size="lg">
              <Eye className="w-4 h-4 mr-2" /> Reveal First Area
            </Button>
          </div>
        ) : (
          <RevealCanvas
            imageSrc={imageSrc}
            revealedCircles={circles}
            width={500}
            height={400}
          />
        )}
      </div>

      {/* Controls */}
      {circles.length > 0 && (
        <div className="w-full max-w-3xl animate-fade-in">
          {roundWinner ? (
            <div className="game-card text-center">
              <p className="text-lg font-display font-semibold text-success mb-3">
                🎉 {roundWinner} guessed correctly! +{Math.max(1, maxRounds - round + 1)} points
              </p>
              <Button onClick={nextRound} size="lg">
                {round >= maxRounds ? (
                  <>Finish Game <Trophy className="w-4 h-4 ml-2" /></>
                ) : (
                  <>Next Round <ArrowRight className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            </div>
          ) : (
            <div className="game-card">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground font-medium">
                  Who guessed it first?
                </p>
                <Button onClick={revealNext} variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-1" /> Reveal More
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {players.map((p) => (
                  <Button
                    key={p.name}
                    onClick={() => handleGuess(p.name)}
                    variant="outline"
                    className="text-base hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {p.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GameBoard;
