const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST"]
}));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
});

let rooms = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join_room", ({ roomId, password }) => {
    if (!rooms[roomId]) {
      rooms[roomId] = {
        password,
        state: null,
      };
    }

    if (rooms[roomId].password !== password) {
      socket.emit("error_msg", "Wrong password");
      return;
    }

    socket.join(roomId);

    if (rooms[roomId].state) {
      socket.emit("sync_state", rooms[roomId].state);
    }
  });

  socket.on("sync_event", ({ roomId, state }) => {
    if (!rooms[roomId]) return;

    rooms[roomId].state = {
      ...state,
      lastUpdated: Date.now(),
    };

    socket.to(roomId).emit("sync_state", rooms[roomId].state);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});