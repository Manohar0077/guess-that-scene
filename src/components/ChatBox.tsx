import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface ChatMessage {
  id: string;
  playerName: string;
  text: string;
  timestamp: number;
  isCorrect?: boolean;
}

interface ChatBoxProps {
  messages: ChatMessage[];
  players: string[];
  onSendMessage: (playerName: string, text: string) => void;
  disabled?: boolean;
}

const ChatBox: React.FC<ChatBoxProps> = ({ messages, players, onSendMessage, disabled }) => {
  const [selectedPlayer, setSelectedPlayer] = useState(players[0] || "");
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || !selectedPlayer || disabled) return;
    onSendMessage(selectedPlayer, text);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0 px-3 py-2">
        <div className="space-y-2">
          {messages.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-4">
              Type your guesses here!
            </p>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2 text-sm ${
                msg.isCorrect ? "animate-bounce-in" : ""
              }`}
            >
              <span className="font-semibold text-primary shrink-0">
                {msg.playerName}:
              </span>
              <span
                className={
                  msg.isCorrect
                    ? "text-green-400 font-bold"
                    : "text-foreground"
                }
              >
                {msg.text}
                {msg.isCorrect && " ✅"}
              </span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Player selector + input */}
      <div className="border-t border-border p-3 space-y-2">
        <div className="flex gap-1.5 flex-wrap">
          {players.map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPlayer(p)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedPlayer === p
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={disabled ? "Round over!" : `Guess as ${selectedPlayer}...`}
            disabled={disabled}
            className="bg-muted border-border text-sm"
          />
          <Button onClick={handleSend} size="icon" disabled={disabled || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
