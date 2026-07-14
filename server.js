const http = require("http");
const fs = require("fs");
const path = require("path");
const { WebSocketServer } = require("ws");

const PORT = 8080;
const MIME = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
};

const rooms = new Map();

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return rooms.has(code) ? makeCode() : code;
}

function send(ws, msg) {
  if (ws.readyState === 1) ws.send(JSON.stringify(msg));
}

function broadcast(room, msg, exclude) {
  room.players.forEach((p) => {
    if (p.ws !== exclude) send(p.ws, msg);
  });
}

const server = http.createServer((req, res) => {
  const filePath = path.join(__dirname, req.url === "/" ? "index.html" : req.url);
  const ext = path.extname(filePath);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": MIME[ext] || "text/plain" });
    res.end(data);
  });
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  let player = null;

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }

    switch (msg.type) {
      case "create_room": {
        const code = makeCode();
        const room = { code, host: ws, players: [], started: false };
        player = { ws, name: "Host", room };
        room.players.push(player);
        rooms.set(code, room);
        send(ws, { type: "room_created", code });
        break;
      }

      case "join_room": {
        const code = (msg.code || "").toUpperCase();
        const room = rooms.get(code);
        if (!room) {
          send(ws, { type: "error", message: "Room not found" });
          return;
        }
        if (room.started) {
          send(ws, { type: "error", message: "Match already in progress" });
          return;
        }
        if (room.players.length >= 2) {
          send(ws, { type: "error", message: "Room is full" });
          return;
        }
        player = { ws, name: "Guest", room };
        room.players.push(player);
        send(ws, { type: "room_joined", code });
        broadcast(room, { type: "opponent_joined" });
        break;
      }

      case "start_match": {
        if (!player?.room) return;
        const room = player.room;
        if (ws !== room.host) return;
        if (room.players.length < 2) {
          send(ws, { type: "error", message: "Waiting for opponent" });
          return;
        }
        room.started = true;
        room.players.forEach((p, i) => {
          const opponent = room.players[1 - i];
          send(p.ws, {
            type: "match_start",
            you: p.name,
            opponent: opponent.name,
          });
        });
        break;
      }

      case "attack": {
        if (!player?.room?.started) return;
        broadcast(player.room, { type: "attack", lines: msg.lines || 0 }, ws);
        break;
      }

      case "game_over": {
        if (!player?.room?.started) return;
        broadcast(player.room, { type: "opponent_lost" }, ws);
        player.room.started = false;
        break;
      }
    }
  });

  ws.on("close", () => {
    if (!player?.room) return;
    const room = player.room;
    room.players = room.players.filter((p) => p.ws !== ws);
    if (room.players.length === 0) {
      rooms.delete(room.code);
    } else {
      room.started = false;
      broadcast(room, { type: "opponent_left" });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Tetris server running at http://localhost:${PORT}`);
  console.log(`WebSocket: ws://localhost:${PORT}`);
});
