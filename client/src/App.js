import { useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("https://couplyy-listen-production.up.railway.app");

function App() {
  const [roomId, setRoomId] = useState("");
  const [password, setPassword] = useState("");
  const [joined, setJoined] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [status, setStatus] = useState("Paused");
  const [userCount, setUserCount] = useState(1);

  const audioRef = useRef(null);
  const isSyncing = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get("room");
    const pass = params.get("pass");

    if (room && pass) {
      setRoomId(room);
      setPassword(pass);

      setTimeout(() => {
        socket.emit("join_room", { roomId: room, password: pass });
        setJoined(true);
      }, 300);
    }
  }, []);

  const joinRoom = () => {
    if (!roomId || !password) return;
    socket.emit("join_room", { roomId, password });
    setJoined(true);
  };

  useEffect(() => {
    socket.on("role", ({ isHost }) => setIsHost(isHost));
    return () => socket.off("role");
  }, []);

  useEffect(() => {
    socket.on("room_users", ({ count }) => setUserCount(count));
    return () => socket.off("room_users");
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !joined) return;

    const sendState = () => {
      if (isSyncing.current || !isHost) return;

      socket.emit("sync_event", {
        roomId,
        state: {
          currentTime: audio.currentTime,
          isPlaying: !audio.paused,
          volume: audio.volume,
        },
      });
    };

    const waitForMetadata = () => {
      return new Promise((resolve) => {
        if (audio.readyState >= 2) resolve();
        else audio.addEventListener("loadedmetadata", resolve, { once: true });
      });
    };

    const handleSync = async (state) => {
      if (!audio) return;

      isSyncing.current = true;

      await waitForMetadata();

      const delay = (Date.now() - state.lastUpdated) / 1000;
      const targetTime = state.currentTime + delay;

      const diff = targetTime - audio.currentTime;

      if (Math.abs(diff) > 0.6) {
        audio.currentTime = targetTime;
      } else if (Math.abs(diff) > 0.1) {
        audio.currentTime += diff * 0.4;
      }

      audio.volume = state.volume;

      if (state.isPlaying) {
        if (audio.paused) {
          await audio.play().catch(() => {});
        }
        setStatus("Playing");
      } else {
        if (!audio.paused) {
          audio.pause();
        }
        setStatus("Paused");
      }

      setTimeout(() => {
        isSyncing.current = false;
      }, 70);
    };

    const handlePlay = () => {
      setStatus("Playing");
      sendState();
    };

    const handlePause = () => {
      setStatus("Paused");
      sendState();
    };

    const interval = setInterval(sendState, 1000);

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("seeked", sendState);

    socket.on("sync_state", handleSync);

    return () => {
      clearInterval(interval);

      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("seeked", sendState);

      socket.off("sync_state", handleSync);
    };
  }, [joined, roomId, isHost]);

  return (
    <div
      style={{
        height: "100vh",
        background: "#121212",
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {!joined ? (
        <div
          style={{
            background: "#1e1e1e",
            padding: "30px",
            borderRadius: "12px",
            width: "300px",
            textAlign: "center",
          }}
        >
          <h2>🎧 Couplyy Listen</h2>

          <input
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            style={{ width: "100%", padding: "10px", marginTop: "10px" }}
          />

          <input
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: "10px", marginTop: "10px" }}
          />

          <button
            onClick={joinRoom}
            style={{
              marginTop: "15px",
              padding: "10px",
              width: "100%",
              background: "#1db954",
              border: "none",
              color: "white",
            }}
          >
            Join Room
          </button>
        </div>
      ) : (
        <div
          style={{
            background: "#1e1e1e",
            padding: "30px",
            borderRadius: "12px",
            width: "400px",
            textAlign: "center",
          }}
        >
          <h2>Room: {roomId}</h2>

          <p style={{ color: "#1db954" }}>
            {isHost ? "You are Host 🎧" : "Listener 👂"}
          </p>

          <p>{userCount} people listening</p>

          <p>Status: {status}</p>

          <button
            onClick={() =>
              navigator.clipboard.writeText(
                `${window.location.origin}/?room=${roomId}&pass=${password}`
              )
            }
          >
            Copy Invite Link
          </button>

          <audio
            ref={audioRef}
            controls
            style={{ width: "100%", marginTop: "10px" }}
          >
            <source
              src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
              type="audio/mpeg"
            />
          </audio>
        </div>
      )}
    </div>
  );
}

export default App;