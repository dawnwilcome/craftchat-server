import { createServer } from "node:http";
import { Server } from "socket.io";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: "*" }
});

const players = new Map();
// Key: lowercase username, Value: nickname
const nicknames = new Map();

io.on("connection", (socket) => {
  console.log(`[+] Player connected: ${socket.id}`);

  socket.on("join", (username) => {
    players.set(socket.id, username);
    console.log(`[+] ${username} joined (${socket.id})`);
    
    // Broadcast active player list
    io.emit("player_list", Array.from(players.values()));

    // Sync all currently established nicknames to the newly joined player
    socket.emit("nickname_sync", Object.fromEntries(nicknames));

    io.emit("chat_message", {
      user: "CraftChat",
      text: `${username} joined the game.`,
      color: "green",
      isSystem: true
    });
  });

  socket.on("chat_message", (payload) => {
    io.emit("chat_message", payload);
  });

  socket.on("give_item", (payload) => {
    io.emit("give_item", payload);
  });

  socket.on("set_nickname", (payload) => {
    const { target, nickname, setter } = payload;
    nicknames.set(target.toLowerCase(), nickname);
    io.emit("nickname_update", { target, nickname, setter });
  });

  socket.on("trigger_effect", (payload) => {
    io.emit("trigger_effect", payload);
  });

  socket.on("clear_effects", (payload) => {
    io.emit("clear_effects", payload);
  });

  socket.on("kill_player", (payload) => {
    io.emit("kill_player", payload);
  });

  socket.on("trigger_creeper", (payload) => {
    io.emit("trigger_creeper", payload);
  });

  socket.on("disconnect", () => {
    const username = players.get(socket.id);
    if (username) {
      players.delete(socket.id);
      console.log(`[-] ${username} disconnected`);
      io.emit("player_list", Array.from(players.values()));
      io.emit("chat_message", {
        user: "CraftChat",
        text: `${username} left the game.`,
        color: "gray",
        isSystem: true
      });
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`CraftChat Relay Server running on port ${PORT}`);
});