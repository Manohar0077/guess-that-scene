import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, UserPlus, X, Sparkles } from "lucide-react";

interface GameSetupProps {
  onStartGame: (imageDataUrl: string, players: string[]) => void;
}

const GameSetup: React.FC<GameSetupProps> = ({ onStartGame }) => {
  const [players, setPlayers] = useState<string[]>([""]);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState("");
  const [playerInput, setPlayerInput] = useState("");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageDataUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const addPlayer = () => {
    const name = playerInput.trim();
    if (name && !players.includes(name)) {
      setPlayers([...players.filter(Boolean), name]);
      setPlayerInput("");
    }
  };

  const removePlayer = (index: number) => {
    setPlayers(players.filter((_, i) => i !== index));
  };

  const validPlayers = players.filter(Boolean);
  const canStart = imageDataUrl && validPlayers.length >= 2;

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
            Upload a photo, add players, and start guessing!
          </p>
        </div>

        {/* Image Upload */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-foreground mb-2">
            Mystery Photo
          </label>
          <label
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer transition-colors ${
              imageDataUrl
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-muted/50"
            }`}
          >
            {imageDataUrl ? (
              <div className="text-center">
                <img
                  src={imageDataUrl}
                  alt="Preview"
                  className="w-24 h-24 object-cover rounded-lg mx-auto mb-2"
                />
                <p className="text-sm text-primary font-medium">{imageName}</p>
                <p className="text-xs text-muted-foreground mt-1">Click to change</p>
              </div>
            ) : (
              <>
                <Upload className="w-10 h-10 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  Click to upload a photo
                </span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
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
            {validPlayers.map((name, i) => (
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
          onClick={() => canStart && onStartGame(imageDataUrl!, validPlayers)}
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
