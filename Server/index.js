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
  console.log("User connected:", socket.id);

  socket.on("join_room", ({ roomId, password }) => {
    if (!rooms[roomId]) {
      rooms[roomId] = {
        password,
        state: null,
        host: socket.id,
      };
    }

    if (rooms[roomId].password !== password) {
      socket.emit("error_msg", "Wrong password");
      return;
    }

    socket.join(roomId);

    const isHost = rooms[roomId].host === socket.id;

    // 🔥 Send role to current user
    socket.emit("role", { isHost });

    // 🔥 ALSO ensure host is reinforced
    io.to(rooms[roomId].host).emit("role", { isHost: true });

    if (rooms[roomId].state) {
      socket.emit("sync_state", rooms[roomId].state);
    }
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

  socket.on("disconnect", () => {
    for (let roomId in rooms) {
      if (rooms[roomId].host === socket.id) {
        const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);

        if (clients.length > 0) {
          rooms[roomId].host = clients[0];

          // 🔥 NEW HOST gets role
          io.to(clients[0]).emit("role", { isHost: true });
        }
      }
    }

    console.log("User disconnected:", socket.id);
  });
});


const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});