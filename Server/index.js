const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

let rooms = {};

io.on("connection", (socket) => {
  socket.on("join_room", ({ roomId, password }) => {
    if (!rooms[roomId]) {
      rooms[roomId] = {
        password,
        state: null,
        host: socket.id,
        playlist: [],
      };
    }

    if (rooms[roomId].password !== password) {
      socket.emit("error_msg", "Wrong password");
      return;
    }

    socket.join(roomId);

    const isHost = rooms[roomId].host === socket.id;

    socket.emit("role", { isHost });
    io.to(rooms[roomId].host).emit("role", { isHost: true });

    if (rooms[roomId].state) {
      socket.emit("sync_state", rooms[roomId].state);
    }

    socket.emit("playlist_update", {
      playlist: rooms[roomId].playlist,
    });

    const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
    io.to(roomId).emit("room_users", { count: clients.length });
  });

  socket.on("sync_event", ({ roomId, state }) => {
    if (!rooms[roomId]) return;
    if (rooms[roomId].host !== socket.id) return;

    rooms[roomId].state = {
      ...state,
      lastUpdated: Date.now(),
    };

    socket.to(roomId).emit("sync_state", rooms[roomId].state);
  });

  socket.on("add_song", ({ roomId, url }) => {
    if (!rooms[roomId]) return;
    if (rooms[roomId].host !== socket.id) return;

    rooms[roomId].playlist.push(url);

    io.to(roomId).emit("playlist_update", {
      playlist: rooms[roomId].playlist,
    });
  });

  socket.on("disconnect", () => {
    for (let roomId in rooms) {
      const room = io.sockets.adapter.rooms.get(roomId);
      if (!room) continue;

      if (rooms[roomId].host === socket.id) {
        const clients = Array.from(room);

        if (clients.length > 0) {
          rooms[roomId].host = clients[0];
          io.to(clients[0]).emit("role", { isHost: true });
        }
      }

      const updatedClients = Array.from(room);
      io.to(roomId).emit("room_users", { count: updatedClients.length });
    }
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});