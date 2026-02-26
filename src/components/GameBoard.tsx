import React, { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import RevealCanvas from "./RevealCanvas";
import ChatBox, { ChatMessage } from "./ChatBox";
import Scoreboard from "./Scoreboard";
import { Eye, Trophy, RotateCcw, ArrowRight } from "lucide-react";
import { PhotoEntry } from "@/data/photoLibrary";

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
  photos: PhotoEntry[];
  playerNames: string[];
  onPlayAgain: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ photos, playerNames, onPlayAgain }) => {
  const [players, setPlayers] = useState<Player[]>(
    playerNames.map((name) => ({ name, score: 0 }))
  );
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [roundWinner, setRoundWinner] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [roundStartTime, setRoundStartTime] = useState(Date.now());
  const revealIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentPhoto = photos[currentPhotoIndex];
  const totalRounds = photos.length;

  const generateRandomCircle = useCallback((): Circle => {
    return {
      x: 0.12 + Math.random() * 0.76,
      y: 0.12 + Math.random() * 0.76,
      radius: 0.03 + Math.random() * 0.025,
    };
  }, []);

  // Auto-reveal circles every 3 seconds
  useEffect(() => {
    if (roundWinner || gameOver) {
      if (revealIntervalRef.current) clearInterval(revealIntervalRef.current);
      return;
    }

    if (circles.length > 0) {
      revealIntervalRef.current = setInterval(() => {
        setCircles((prev) => [...prev, generateRandomCircle()]);
      }, 3000);
    }

    return () => {
      if (revealIntervalRef.current) clearInterval(revealIntervalRef.current);
    };
  }, [roundWinner, gameOver, circles.length, generateRandomCircle]);

  const startRevealing = () => {
    if (circles.length === 0) {
      setCircles([generateRandomCircle()]);
      setRoundStartTime(Date.now());
    }
  };

  const handleSendMessage = (playerName: string, text: string) => {
    const msg: ChatMessage = {
      id: `${Date.now()}-${Math.random()}`,
      playerName,
      text,
      timestamp: Date.now(),
      isCorrect: false,
    };

    // Check if guess is correct (case-insensitive, trimmed)
    const guess = text.trim().toLowerCase();
    const answer = currentPhoto.answer.trim().toLowerCase();

    if (guess === answer && !roundWinner) {
      msg.isCorrect = true;
      setRoundWinner(playerName);

      // Score based on time: faster = more points
      const elapsed = (Date.now() - roundStartTime) / 1000;
      const timeBonus = Math.max(1, Math.round(20 - elapsed));
      setPlayers((prev) =>
        prev.map((p) =>
          p.name === playerName ? { ...p, score: p.score + timeBonus } : p
        )
      );
    }

    setMessages((prev) => [...prev, msg]);
  };

  const nextRound = () => {
    const nextIndex = currentPhotoIndex + 1;
    if (nextIndex >= totalRounds) {
      setGameOver(true);
      return;
    }
    setCurrentPhotoIndex(nextIndex);
    setCircles([]);
    setRoundWinner(null);
    setMessages([]);
  };

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  if (gameOver) {
    const winner = sortedPlayers[0];
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="game-card max-w-md w-full text-center animate-scale-in">
          <Trophy className="w-16 h-16 text-secondary mx-auto mb-4" />
          <h2 className="text-3xl font-display font-bold text-foreground mb-2">Game Over!</h2>
          <p className="text-xl text-primary font-display font-semibold mb-6">
            🎉 {winner.name} wins with {winner.score} points!
          </p>
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
    <div className="min-h-screen flex flex-col lg:flex-row p-4 gap-4">
      {/* Left: Game area */}
      <div className="flex-1 flex flex-col items-center gap-4">
        {/* Header */}
        <div className="flex items-center justify-between w-full max-w-xl animate-fade-in">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">
              Round {currentPhotoIndex + 1}/{totalRounds}
            </h2>
            <p className="text-sm text-muted-foreground">
              {circles.length} area{circles.length !== 1 ? "s" : ""} revealed
            </p>
          </div>
        </div>

        {/* Canvas */}
        <div className="game-card p-4 animate-fade-in">
          {circles.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center"
              style={{ width: 500, height: 400 }}
            >
              <Eye className="w-16 h-16 text-muted-foreground mb-4 animate-pulse-glow" />
              <p className="text-muted-foreground mb-4 font-display text-lg">
                Ready to start revealing?
              </p>
              <Button onClick={startRevealing} size="lg">
                <Eye className="w-4 h-4 mr-2" /> Start Round
              </Button>
            </div>
          ) : (
            <RevealCanvas
              imageSrc={currentPhoto.src}
              revealedCircles={circles}
              width={500}
              height={400}
            />
          )}
        </div>

        {/* Round winner banner */}
        {roundWinner && (
          <div className="game-card text-center w-full max-w-xl animate-bounce-in">
            <p className="text-lg font-display font-semibold mb-2" style={{ color: "hsl(var(--game-success))" }}>
              🎉 {roundWinner} guessed it! The answer was "{currentPhoto.answer}"
            </p>
            <img
              src={currentPhoto.src}
              alt={currentPhoto.answer}
              className="w-32 h-24 object-cover rounded-lg mx-auto mb-3"
            />
            <Button onClick={nextRound} size="lg">
              {currentPhotoIndex + 1 >= totalRounds ? (
                <>Finish Game <Trophy className="w-4 h-4 ml-2" /></>
              ) : (
                <>Next Round <ArrowRight className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Right: Sidebar with scoreboard + chat */}
      <div className="w-full lg:w-80 flex flex-col gap-4">
        {/* Scoreboard */}
        <div className="game-card">
          <Scoreboard players={players} roundWinner={roundWinner} />
        </div>

        {/* Chat */}
        <div className="game-card flex-1 flex flex-col min-h-[300px]">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Guesses
          </h3>
          <div className="flex-1 flex flex-col min-h-0">
            <ChatBox
              messages={messages}
              players={playerNames}
              onSendMessage={handleSendMessage}
              disabled={!!roundWinner}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;
