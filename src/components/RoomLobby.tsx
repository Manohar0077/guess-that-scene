import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Copy, Users, Play, LogIn, Plus } from "lucide-react";
import { useWebSocket, WSMessage } from "@/hooks/useWebSocket";
import { toast } from "sonner";

interface RoomLobbyProps {
  onGameStart: (ws: ReturnType<typeof useWebSocket>, playerName: string, initialRoundData?: WSMessage) => void;
}

const RoomLobby: React.FC<RoomLobbyProps> = ({ onGameStart }) => {
  const [mode, setMode] = useState<"menu" | "create" | "join">("menu");
  const [serverUrl, setServerUrl] = useState("ws://localhost:3001");
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [rounds, setRounds] = useState(5);
  const [lobbyPlayers, setLobbyPlayers] = useState<string[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [createdCode, setCreatedCode] = useState("");
  const [error, setError] = useState("");
  const [connecting, setConnecting] = useState(false);

  const ws = useWebSocket();

  const handleMessages = useCallback(
    (msg: WSMessage) => {
      switch (msg.type) {
        case "room_created":
          setCreatedCode(msg.code);
          setIsHost(true);
          break;
        case "room_joined":
          setCreatedCode(msg.code);
          break;
        case "lobby":
          setLobbyPlayers(msg.players);
          break;
        case "round_start":
          onGameStart(ws, playerName, msg);
          break;
        case "error":
          setError(msg.message);
          toast.error(msg.message);
          break;
        case "player_left":
          setLobbyPlayers(msg.players);
          toast.info(`${msg.playerName} left the room`);
          break;
      }
    },
    [ws, playerName, onGameStart]
  );

  useEffect(() => {
    const unsubs = [
      ws.on("room_created", handleMessages),
      ws.on("room_joined", handleMessages),
      ws.on("lobby", handleMessages),
      ws.on("round_start", handleMessages),
      ws.on("error", handleMessages),
      ws.on("player_left", handleMessages),
    ];
    return () => unsubs.forEach((u) => u());
  }, [ws, handleMessages]);

  const connectAndCreate = async () => {
    if (!playerName.trim()) { setError("Enter your name"); return; }
    setError("");
    setConnecting(true);
    try {
      await ws.connect(serverUrl);
      ws.send({ type: "create_room", playerName: playerName.trim(), rounds });
    } catch {
      setError("Could not connect to server. Is it running?");
    }
    setConnecting(false);
  };

  const connectAndJoin = async () => {
    if (!playerName.trim()) { setError("Enter your name"); return; }
    if (!roomCode.trim()) { setError("Enter room code"); return; }
    setError("");
    setConnecting(true);
    try {
      await ws.connect(serverUrl);
      ws.send({ type: "join_room", playerName: playerName.trim(), code: roomCode.trim().toUpperCase() });
    } catch {
      setError("Could not connect to server. Is it running?");
    }
    setConnecting(false);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(createdCode);
    toast.success("Room code copied!");
  };

  // In lobby
  if (createdCode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="game-card max-w-md w-full text-center animate-scale-in">
          <Users className="w-12 h-12 text-primary mx-auto mb-3" />
          <h2 className="text-2xl font-display font-bold text-foreground mb-1">Room Lobby</h2>
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-3xl font-mono font-bold tracking-widest text-secondary">{createdCode}</span>
            <button onClick={copyCode} className="text-muted-foreground hover:text-foreground transition-colors">
              <Copy className="w-5 h-5" />
            </button>
          </div>
          <p className="text-muted-foreground text-sm mb-4">Share this code with other players</p>

          <div className="space-y-2 mb-6">
            {lobbyPlayers.map((name, i) => (
              <div key={name} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted">
                <span className="text-foreground font-medium">{name}</span>
                {i === 0 && <span className="text-xs text-secondary font-semibold ml-auto">HOST</span>}
              </div>
            ))}
          </div>

          {isHost ? (
            <Button
              onClick={() => ws.send({ type: "start_game" })}
              disabled={lobbyPlayers.length < 2}
              className="w-full"
              size="lg"
            >
              <Play className="w-4 h-4 mr-2" /> Start Game ({lobbyPlayers.length} players)
            </Button>
          ) : (
            <p className="text-muted-foreground text-sm">Waiting for host to start...</p>
          )}
        </div>
      </div>
    );
  }

  // Menu / Create / Join
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="game-card max-w-lg w-full animate-scale-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <Sparkles className="w-8 h-8 text-secondary" />
            <h1 className="text-4xl font-display font-bold text-foreground">Guess Who?</h1>
            <Sparkles className="w-8 h-8 text-secondary" />
          </div>
          <p className="text-muted-foreground">Online multiplayer photo guessing game</p>
        </div>

        {/* Server URL */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-foreground mb-1.5">Server URL</label>
          <Input
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            placeholder="ws://localhost:3001"
            className="bg-muted border-border font-mono text-sm"
          />
        </div>

        {/* Player name */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-foreground mb-1.5">Your Name</label>
          <Input
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name..."
            className="bg-muted border-border"
          />
        </div>

        {error && <p className="text-destructive text-sm mb-4">{error}</p>}

        {mode === "menu" && (
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => setMode("create")} size="lg" className="h-14">
              <Plus className="w-5 h-5 mr-2" /> Create Room
            </Button>
            <Button onClick={() => setMode("join")} size="lg" variant="outline" className="h-14">
              <LogIn className="w-5 h-5 mr-2" /> Join Room
            </Button>
          </div>
        )}

        {mode === "create" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Rounds</label>
              <div className="flex gap-2">
                {[3, 5, 8, 10].map((n) => (
                  <button
                    key={n}
                    onClick={() => setRounds(n)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      rounds === n
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setMode("menu")} className="flex-1">Back</Button>
              <Button onClick={connectAndCreate} disabled={connecting} className="flex-1">
                {connecting ? "Connecting..." : "Create Room"}
              </Button>
            </div>
          </div>
        )}

        {mode === "join" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Room Code</label>
              <Input
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="ABCDE"
                maxLength={5}
                className="bg-muted border-border font-mono text-lg tracking-widest text-center"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setMode("menu")} className="flex-1">Back</Button>
              <Button onClick={connectAndJoin} disabled={connecting} className="flex-1">
                {connecting ? "Connecting..." : "Join Room"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomLobby;
