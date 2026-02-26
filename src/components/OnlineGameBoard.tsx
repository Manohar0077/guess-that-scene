import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import RevealCanvas from "./RevealCanvas";
import Scoreboard from "./Scoreboard";
import { Trophy, RotateCcw, ArrowRight } from "lucide-react";
import { useWebSocket, WSMessage } from "@/hooks/useWebSocket";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

interface ChatMessage {
  id: string;
  playerName: string;
  text: string;
  timestamp: number;
  isCorrect?: boolean;
}

interface PlayerScore {
  name: string;
  score: number;
}

interface OnlineGameBoardProps {
  ws: ReturnType<typeof useWebSocket>;
  playerName: string;
  onPlayAgain: () => void;
}

const OnlineGameBoard: React.FC<OnlineGameBoardProps> = ({ ws, playerName, onPlayAgain }) => {
  const [photoSrc, setPhotoSrc] = useState("");
  const [circles, setCircles] = useState<{ x: number; y: number; radius: number }[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [scoreboard, setScoreboard] = useState<PlayerScore[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [totalRounds, setTotalRounds] = useState(0);
  const [roundWinner, setRoundWinner] = useState<string | null>(null);
  const [winnerAnswer, setWinnerAnswer] = useState("");
  const [winnerPhotoSrc, setWinnerPhotoSrc] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleRoundStart = useCallback((msg: WSMessage) => {
    setPhotoSrc(msg.photoSrc);
    setCircles(msg.circles);
    setRoundIndex(msg.roundIndex);
    setTotalRounds(msg.totalRounds);
    setScoreboard(msg.scoreboard);
    setRoundWinner(null);
    setWinnerAnswer("");
    setMessages([]);
  }, []);

  const handleCircles = useCallback((msg: WSMessage) => {
    setCircles(msg.circles);
  }, []);

  const handleChat = useCallback((msg: WSMessage) => {
    setMessages((prev) => [...prev, msg.message]);
  }, []);

  const handleRoundWon = useCallback((msg: WSMessage) => {
    setRoundWinner(msg.winner);
    setWinnerAnswer(msg.answer);
    setWinnerPhotoSrc(msg.photoSrc);
    setScoreboard(msg.scoreboard);
  }, []);

  const handleGameOver = useCallback((msg: WSMessage) => {
    setScoreboard(msg.scoreboard);
    setGameOver(true);
  }, []);

  useEffect(() => {
    const unsubs = [
      ws.on("round_start", handleRoundStart),
      ws.on("circles", handleCircles),
      ws.on("chat", handleChat),
      ws.on("round_won", handleRoundWon),
      ws.on("game_over", handleGameOver),
    ];
    return () => unsubs.forEach((u) => u());
  }, [ws, handleRoundStart, handleCircles, handleChat, handleRoundWon, handleGameOver]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || roundWinner) return;
    ws.send({ type: "guess", text });
    setInput("");
  };

  const sortedPlayers = [...scoreboard].sort((a, b) => b.score - a.score);

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
        <div className="flex items-center justify-between w-full max-w-xl animate-fade-in">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">
              Round {roundIndex + 1}/{totalRounds}
            </h2>
            <p className="text-sm text-muted-foreground">
              {circles.length} area{circles.length !== 1 ? "s" : ""} revealed • Playing as <span className="text-primary font-semibold">{playerName}</span>
            </p>
          </div>
        </div>

        <div className="game-card p-4 animate-fade-in">
          {photoSrc ? (
            <RevealCanvas
              imageSrc={photoSrc}
              revealedCircles={circles}
              width={500}
              height={400}
            />
          ) : (
            <div className="flex items-center justify-center" style={{ width: 500, height: 400 }}>
              <p className="text-muted-foreground">Waiting for round...</p>
            </div>
          )}
        </div>

        {roundWinner && (
          <div className="game-card text-center w-full max-w-xl animate-bounce-in">
            <p className="text-lg font-display font-semibold mb-2" style={{ color: "hsl(var(--game-success))" }}>
              🎉 {roundWinner} guessed it! The answer was "{winnerAnswer}"
            </p>
            {winnerPhotoSrc && (
              <img
                src={winnerPhotoSrc}
                alt={winnerAnswer}
                className="w-32 h-24 object-cover rounded-lg mx-auto mb-3"
              />
            )}
            <p className="text-muted-foreground text-sm">Next round starting automatically...</p>
          </div>
        )}
      </div>

      {/* Right: Sidebar */}
      <div className="w-full lg:w-80 flex flex-col gap-4">
        <div className="game-card">
          <Scoreboard players={scoreboard} roundWinner={roundWinner} />
        </div>

        {/* Chat */}
        <div className="game-card flex-1 flex flex-col min-h-[300px]">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Guesses
          </h3>
          <ScrollArea className="flex-1 min-h-0 px-3 py-2" style={{ maxHeight: 400 }}>
            <div className="space-y-2">
              {messages.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-4">
                  Type your guesses here!
                </p>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 text-sm ${msg.isCorrect ? "animate-bounce-in" : ""}`}
                >
                  <span className="font-semibold text-primary shrink-0">{msg.playerName}:</span>
                  <span className={msg.isCorrect ? "font-bold" : "text-foreground"} style={msg.isCorrect ? { color: "hsl(var(--game-success))" } : undefined}>
                    {msg.text}
                    {msg.isCorrect && " ✅"}
                  </span>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          <div className="border-t border-border p-3">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={roundWinner ? "Round over!" : "Type your guess..."}
                disabled={!!roundWinner}
                className="bg-muted border-border text-sm"
              />
              <Button onClick={handleSend} size="icon" disabled={!!roundWinner || !input.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnlineGameBoard;
