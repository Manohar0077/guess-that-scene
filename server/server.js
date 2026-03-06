const { WebSocketServer } = require("ws");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3001;
// const PHOTOS_DIR = path.join(__dirname, "..", "public", "photos");
const PHOTOS_DIR = path.join(process.cwd(), "public", "photos");
const ROUND_DURATION_SECONDS = 60;
const REVEAL_INTERVAL_MS = 3000;

// Celebrity photos (online mode) - stable Wikimedia image URLs
const CELEBRITY_PHOTOS = [
  { src: "https://upload.wikimedia.org/wikipedia/commons/8/88/Brad_Pitt_2019_by_Glenn_Francis.jpg", answer: "brad pitt" },
  { src: "https://upload.wikimedia.org/wikipedia/commons/3/3f/Leonardo_DiCaprio_Cannes_2019.jpg", answer: "leonardo dicaprio" },
  { src: "https://upload.wikimedia.org/wikipedia/commons/2/26/Robert_Downey%2C_Jr._SDCC_2014_%28cropped%29.jpg", answer: "robert downey jr" },
  { src: "https://upload.wikimedia.org/wikipedia/commons/4/4d/Johnny_Depp_Cannes_2023.jpg", answer: "johnny depp" },
  { src: "https://upload.wikimedia.org/wikipedia/commons/9/90/Angelina_Jolie_C%C3%A9sar_2011_2.jpg", answer: "angelina jolie" },
  { src: "https://upload.wikimedia.org/wikipedia/commons/2/23/Will_Smith_2019_by_Glenn_Francis.jpg", answer: "will smith" },
  { src: "https://upload.wikimedia.org/wikipedia/commons/4/49/Emma_Watson_2013.jpg", answer: "emma watson" },
  { src: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Dwayne_Johnson_2013.jpg", answer: "dwayne johnson" },
  { src: "https://upload.wikimedia.org/wikipedia/commons/0/0b/Jennifer_Lawrence_2016.jpg", answer: "jennifer lawrence" },
  { src: "https://upload.wikimedia.org/wikipedia/commons/f/f6/Morgan_Freeman_Deauville_2018.jpg", answer: "morgan freeman" },
  { src: "https://upload.wikimedia.org/wikipedia/commons/6/60/Scarlett_Johansson_by_Gage_Skidmore_2.jpg", answer: "scarlett johansson" },
  { src: "https://upload.wikimedia.org/wikipedia/commons/0/0b/Chris_Hemsworth_by_Gage_Skidmore_2.jpg", answer: "chris hemsworth" },
  { src: "https://upload.wikimedia.org/wikipedia/commons/5/5a/Natalie_Portman_Cannes_2015_5.jpg", answer: "natalie portman" },
  { src: "https://upload.wikimedia.org/wikipedia/commons/9/90/Chris_Evans_2014_Comic_Con_%28cropped%29.jpg", answer: "chris evans" },
  { src: "https://upload.wikimedia.org/wikipedia/commons/8/86/Tom_Cruise_by_Gage_Skidmore_2.jpg", answer: "tom cruise" },
];

// Scan photos folder: filename (without extension) = answer
function loadCustomPhotos() {
  const exts = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
  try {
    return fs
      .readdirSync(PHOTOS_DIR)
      .filter((f) => exts.includes(path.extname(f).toLowerCase()))
      .map((f) => ({
        src: `/photos/${f}`,
        answer: path.basename(f, path.extname(f)).toLowerCase(),
      }));
  } catch {
    return [];
  }
}

function loadPhotos(photoSource) {
  if (photoSource === "online") {
    return [...CELEBRITY_PHOTOS];
  }
  return loadCustomPhotos();
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

function normalizeRevealMode(mode) {
  return mode === "blur" ? "blur" : "bubbles";
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
    x: 0.1 + Math.random() * 0.8,
    y: 0.1 + Math.random() * 0.8,
    radius: 0.12,
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

  room.circles = room.revealMode === "bubbles" ? [generateCircle()] : [];
  room.blurLevel = room.revealMode === "blur" ? 50 : 0;
  room.roundWinner = null;
  room.roundStartTime = Date.now();
  room.roundEndsAt = room.roundStartTime + ROUND_DURATION_SECONDS * 1000;
  room.messages = [];

  room.revealInterval = setInterval(() => {
    if (room.roundWinner || room.state !== "playing") {
      return;
    }
    if (room.revealMode === "blur") {
      room.blurLevel = Math.max(0, room.blurLevel - 2);
      broadcast(room, { type: "blur_update", blurLevel: room.blurLevel });
    } else {
      room.circles.push(generateCircle());
      broadcast(room, { type: "circles", circles: room.circles });
    }
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
    revealMode: room.revealMode,
    blurLevel: room.blurLevel ?? 0,
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
        const photoSource = msg.photoSource === "online" ? "online" : "custom";
        const photos = loadPhotos(photoSource);
        if (photos.length === 0) {
          ws.send(JSON.stringify({ type: "error", message: photoSource === "custom" ? "No photos found in public/photos/ folder. Add images first!" : "No celebrity photos available." }));
          return;
        }
        const code = generateRoomCode();
        const roundCount = Math.min(msg.rounds || 5, photos.length);
        const room = {
          code,
          host: msg.playerName,
          state: "lobby",
          revealMode: normalizeRevealMode(msg.revealMode),
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
        } else {
          // Check for close match - if guess shares >= 60% of characters with answer
          const guess = text.toLowerCase();
          const maxLen = Math.max(guess.length, answer.length);
          if (maxLen > 0) {
            let matches = 0;
            const answerChars = answer.split('');
            const guessChars = guess.split('');
            const used = new Array(answerChars.length).fill(false);
            for (const gc of guessChars) {
              const idx = answerChars.findIndex((ac, i) => !used[i] && ac === gc);
              if (idx !== -1) { matches++; used[idx] = true; }
            }
            const similarity = matches / maxLen;
            if (similarity >= 0.5 && guess.length >= 2) {
              // Send private hint only to this player
              const hintMsg = {
                id: `hint-${Date.now()}-${Math.random()}`,
                playerName: "System",
                text: "🔥 You're close to the answer!",
                timestamp: Date.now(),
                isHint: true,
              };
              const p = playerRoom.players.find((p) => p.name === playerName);
              if (p && p.ws.readyState === 1) {
                p.ws.send(JSON.stringify({ type: "close_hint", message: hintMsg }));
              }
            }
          }
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
