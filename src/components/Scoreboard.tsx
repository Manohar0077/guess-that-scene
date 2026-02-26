import React from "react";

interface Player {
  name: string;
  score: number;
}

interface ScoreboardProps {
  players: Player[];
  roundWinner?: string | null;
}

const Scoreboard: React.FC<ScoreboardProps> = ({ players, roundWinner }) => {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-1.5">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        Scoreboard
      </h3>
      {sorted.map((p, i) => (
        <div
          key={p.name}
          className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-colors ${
            p.name === roundWinner
              ? "bg-accent/20 text-accent"
              : i === 0
              ? "bg-secondary/15 text-secondary"
              : "bg-muted text-foreground"
          }`}
        >
          <span className="font-medium">
            {i === 0 ? "👑" : `${i + 1}.`} {p.name}
          </span>
          <span className="score-badge text-xs">{p.score} pts</span>
        </div>
      ))}
    </div>
  );
};

export default Scoreboard;
