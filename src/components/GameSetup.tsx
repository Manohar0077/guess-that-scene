import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, X, Sparkles, ImageIcon } from "lucide-react";
import photoLibrary from "@/data/photoLibrary";

interface GameSetupProps {
  onStartGame: (players: string[], roundCount: number) => void;
}

const GameSetup: React.FC<GameSetupProps> = ({ onStartGame }) => {
  const [players, setPlayers] = useState<string[]>([]);
  const [playerInput, setPlayerInput] = useState("");
  const [roundCount, setRoundCount] = useState(Math.min(5, photoLibrary.length));

  const addPlayer = () => {
    const name = playerInput.trim();
    if (name && !players.includes(name)) {
      setPlayers([...players, name]);
      setPlayerInput("");
    }
  };

  const removePlayer = (index: number) => {
    setPlayers(players.filter((_, i) => i !== index));
  };

  const canStart = players.length >= 2;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="game-card max-w-lg w-full animate-scale-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <Sparkles className="w-8 h-8 text-secondary" />
            <h1 className="text-4xl font-display font-bold text-foreground">
              Guess Who?
            </h1>
            <Sparkles className="w-8 h-8 text-secondary" />
          </div>
          <p className="text-muted-foreground">
            Add players and start guessing! Photos are loaded automatically.
          </p>
        </div>

        {/* Photo library info */}
        <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-muted">
          <ImageIcon className="w-5 h-5 text-primary shrink-0" />
          <div className="text-sm">
            <span className="text-foreground font-medium">{photoLibrary.length} photos</span>
            <span className="text-muted-foreground"> available in library</span>
          </div>
        </div>

        {/* Rounds selector */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-foreground mb-2">
            Number of Rounds
          </label>
          <div className="flex gap-2">
            {[3, 5, Math.min(photoLibrary.length, 8)].map((n) => (
              <button
                key={n}
                onClick={() => setRoundCount(n)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  roundCount === n
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {n} rounds
              </button>
            ))}
          </div>
        </div>

        {/* Players */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-foreground mb-2">
            Players (min 2)
          </label>
          <div className="flex gap-2 mb-3">
            <Input
              value={playerInput}
              onChange={(e) => setPlayerInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addPlayer()}
              placeholder="Enter player name..."
              className="bg-muted border-border"
            />
            <Button onClick={addPlayer} size="icon" variant="outline">
              <UserPlus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {players.map((name, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/15 text-primary text-sm font-medium animate-bounce-in"
              >
                {name}
                <button onClick={() => removePlayer(i)}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <Button
          onClick={() => canStart && onStartGame(players, roundCount)}
          disabled={!canStart}
          className="w-full h-12 text-lg font-display font-semibold"
          size="lg"
        >
          Start Game 🎮
        </Button>
      </div>
    </div>
  );
};

export default GameSetup;
