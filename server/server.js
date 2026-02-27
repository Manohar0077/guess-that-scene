const { WebSocketServer } = require("ws");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3001;
const PHOTOS_DIR = path.join(__dirname, "..", "public", "photos");
const ROUND_DURATION_SECONDS = 60;
const REVEAL_INTERVAL_MS = 3000;

// Scan photos folder: filename (without extension) = answer
function loadPhotos() {
  if (!fs.existsSync(PHOTOS_DIR)) {
    fs.mkdirSync(PHOTOS_DIR, { recursive: true });
    console.log(`Created photos directory: ${PHOTOS_DIR}`);
    return [];
  }
  const exts = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
  return fs
    .readdirSync(PHOTOS_DIR)
    .filter((f) => exts.includes(path.extname(f).toLowerCase()))
    .map((f) => ({
      src: `/photos/${f}`,
      answer: path.basename(f, path.extname(f)).toLowerCase(),
    }));
}

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// --- Room state ---
const rooms = new Map();

function broadcast(room, msg) {
  const data = JSON.stringify(msg);
  room.players.forEach((p) => {
    if (p.ws.readyState === 1) p.ws.send(data);
  });
}

function getScoreboard(room) {
  return room.players.map((p) => ({ name: p.name, score: p.score }));
}

function generateCircle() {
  return {
    x: 0.12 + Math.random() * 0.76,
    y: 0.12 + Math.random() * 0.76,
    radius: 0.025 + Math.random() * 0.02,
  };
}

function clearRoomTimers(room) {
  if (room.revealInterval) {
    clearInterval(room.revealInterval);
    room.revealInterval = null;
  }
  if (room.roundTimerInterval) {
    clearInterval(room.roundTimerInterval);
    room.roundTimerInterval = null;
  }
  if (room.roundTimeout) {
    clearTimeout(room.roundTimeout);
    room.roundTimeout = null;
  }
}

function startRound(room) {
  clearRoomTimers(room);

  room.circles = [generateCircle()];
  room.roundWinner = null;
  room.roundStartTime = Date.now();
  room.roundEndsAt = room.roundStartTime + ROUND_DURATION_SECONDS * 1000;
  room.messages = [];

  room.revealInterval = setInterval(() => {
    if (room.roundWinner || room.state !== "playing") {
      return;
    }
    room.circles.push(generateCircle());
    broadcast(room, { type: "circles", circles: room.circles });
  }, REVEAL_INTERVAL_MS);

  room.roundTimerInterval = setInterval(() => {
    if (room.roundWinner || room.state !== "playing") {
      return;
    }
    const timeLeft = Math.max(0, Math.ceil((room.roundEndsAt - Date.now()) / 1000));
    broadcast(room, { type: "round_time", timeLeft });
  }, 1000);

  room.roundTimeout = setTimeout(() => {
    if (room.roundWinner || room.state !== "playing") return;

    const answer = room.photos[room.currentRound].answer;
    room.roundWinner = "__timeout__";
    clearRoomTimers(room);

    broadcast(room, {
      type: "round_timeout",
      answer,
      photoSrc: room.photos[room.currentRound].src,
      scoreboard: getScoreboard(room),
    });

    setTimeout(() => {
      if (room.state === "playing") nextRound(room);
    }, 2000);
  }, ROUND_DURATION_SECONDS * 1000);

  broadcast(room, {
    type: "round_start",
    roundIndex: room.currentRound,
    totalRounds: room.totalRounds,
    photoSrc: room.photos[room.currentRound].src,
    circles: room.circles,
    scoreboard: getScoreboard(room),
    timeLeft: ROUND_DURATION_SECONDS,
  });
}

function nextRound(room) {
  clearRoomTimers(room);

  room.currentRound++;
  if (room.currentRound >= room.totalRounds) {
    broadcast(room, {
      type: "game_over",
      scoreboard: getScoreboard(room),
    });
    room.state = "finished";
    return;
  }
  startRound(room);
}

const wss = new WebSocketServer({ port: PORT });
console.log(`Guess Who server running on ws://localhost:${PORT}`);

wss.on("connection", (ws) => {
  let playerRoom = null;
  let playerName = null;

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    switch (msg.type) {
      case "create_room": {
        const photos = loadPhotos();
        if (photos.length === 0) {
          ws.send(JSON.stringify({ type: "error", message: "No photos found in public/photos/ folder. Add images first!" }));
          return;
        }
        const code = generateRoomCode();
        const roundCount = Math.min(msg.rounds || 5, photos.length);
        const room = {
          code,
          host: msg.playerName,
          state: "lobby",
          players: [],
          photos: shuffle(photos).slice(0, roundCount),
          totalRounds: roundCount,
          currentRound: 0,
          circles: [],
          messages: [],
          roundWinner: null,
          roundStartTime: 0,
          roundEndsAt: 0,
          revealInterval: null,
          roundTimerInterval: null,
          roundTimeout: null,
        };
        rooms.set(code, room);
        playerRoom = room;
        playerName = msg.playerName;
        room.players.push({ name: playerName, score: 0, ws });
        ws.send(JSON.stringify({ type: "room_created", code, photoCount: photos.length }));
        broadcast(room, { type: "lobby", players: room.players.map((p) => p.name), host: room.host });
        break;
      }

      case "join_room": {
        const room = rooms.get(msg.code?.toUpperCase());
        if (!room) {
          ws.send(JSON.stringify({ type: "error", message: "Room not found." }));
          return;
        }
        if (room.state !== "lobby") {
          ws.send(JSON.stringify({ type: "error", message: "Game already in progress." }));
          return;
        }
        if (room.players.some((p) => p.name === msg.playerName)) {
          ws.send(JSON.stringify({ type: "error", message: "Name already taken in this room." }));
          return;
        }
        playerRoom = room;
        playerName = msg.playerName;
        room.players.push({ name: playerName, score: 0, ws });
        ws.send(JSON.stringify({ type: "room_joined", code: room.code }));
        broadcast(room, { type: "lobby", players: room.players.map((p) => p.name), host: room.host });
        break;
      }

      case "start_game": {
        if (!playerRoom || playerRoom.host !== playerName) return;
        if (playerRoom.players.length < 2) {
          ws.send(JSON.stringify({ type: "error", message: "Need at least 2 players." }));
          return;
        }
        playerRoom.state = "playing";
        playerRoom.currentRound = 0;
        startRound(playerRoom);
        break;
      }

      case "guess": {
        if (!playerRoom || playerRoom.state !== "playing" || playerRoom.roundWinner) return;
        const text = msg.text?.trim();
        if (!text) return;

        const chatMsg = {
          id: `${Date.now()}-${Math.random()}`,
          playerName,
          text,
          timestamp: Date.now(),
          isCorrect: false,
        };

        const answer = playerRoom.photos[playerRoom.currentRound].answer;
        if (text.toLowerCase() === answer) {
          chatMsg.isCorrect = true;
          playerRoom.roundWinner = playerName;
          if (playerRoom.revealInterval || playerRoom.roundTimerInterval || playerRoom.roundTimeout) {
            clearRoomTimers(playerRoom);
          }

          const elapsed = (Date.now() - playerRoom.roundStartTime) / 1000;
          const points = Math.max(1, Math.round(20 - elapsed));
          const player = playerRoom.players.find((p) => p.name === playerName);
          if (player) player.score += points;

          broadcast(playerRoom, {
            type: "round_won",
            winner: playerName,
            answer,
            points,
            photoSrc: playerRoom.photos[playerRoom.currentRound].src,
            scoreboard: getScoreboard(playerRoom),
          });

          // Auto next round after 5 seconds
          setTimeout(() => {
            if (playerRoom.state === "playing") nextRound(playerRoom);
          }, 5000);
        }

        playerRoom.messages.push(chatMsg);
        broadcast(playerRoom, { type: "chat", message: chatMsg });
        break;
      }
    }
  });

  ws.on("close", () => {
    if (playerRoom) {
      playerRoom.players = playerRoom.players.filter((p) => p.ws !== ws);
      if (playerRoom.players.length === 0) {
        clearRoomTimers(playerRoom);
        rooms.delete(playerRoom.code);
      } else {
        broadcast(playerRoom, {
          type: "player_left",
          playerName,
          players: playerRoom.players.map((p) => p.name),
        });
      }
    }
  });
});
