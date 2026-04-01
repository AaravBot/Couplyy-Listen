const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

let rooms = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join_room", ({ roomId }) => {
    socket.join(roomId);

    if (rooms[roomId]) {
      socket.emit("sync_state", rooms[roomId]);
    }
  });

  socket.on("play_song", ({ roomId, songId, currentTime }) => {
    const state = {
      songId,
      currentTime,
      isPlaying: true,
      lastUpdated: Date.now(),
    };

    rooms[roomId] = state;

    socket.to(roomId).emit("sync_state", state);
  });

  socket.on("pause_song", ({ roomId, currentTime }) => {
    const state = {
      ...rooms[roomId],
      currentTime,
      isPlaying: false,
      lastUpdated: Date.now(),
    };

    rooms[roomId] = state;

    socket.to(roomId).emit("sync_state", state);
  });

  // 🔊 VOLUME SYNC
  socket.on("volume_change", ({ roomId, volume }) => {
    socket.to(roomId).emit("volume_update", { volume });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});