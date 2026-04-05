import { useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("https://couplyy-listen-production.up.railway.app");

function App() {
  const [roomId, setRoomId] = useState("");
  const [password, setPassword] = useState("");
  const [joined, setJoined] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [status, setStatus] = useState("Paused");

  const audioRef = useRef(null);
  const isSyncing = useRef(false);

  // auto join via link
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

  // role (host / listener)
  useEffect(() => {
    socket.on("role", ({ isHost }) => {
      setIsHost(isHost);
    });

    return () => socket.off("role");
  }, []);

  // main sync logic
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

    const handleSync = async (state) => {
      const audio = audioRef.current;
      if (!audio) return;

      isSyncing.current = true;

      if (audio.readyState < 2) {
        await new Promise((resolve) => {
          audio.onloadedmetadata = resolve;
        });
      }

      const delay = (Date.now() - state.lastUpdated) / 1000;
      const targetTime = state.currentTime + delay;

      if (Math.abs(audio.currentTime - targetTime) > 0.25) {
        audio.currentTime = targetTime;
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
      }, 100);
    };

    const interval = setInterval(() => {
      sendState();
    }, 1500);

    audio.addEventListener("play", sendState);
    audio.addEventListener("pause", sendState);
    audio.addEventListener("seeked", sendState);
    audio.addEventListener("volumechange", sendState);

    socket.on("sync_state", handleSync);

    return () => {
      clearInterval(interval);

      audio.removeEventListener("play", sendState);
      audio.removeEventListener("pause", sendState);
      audio.removeEventListener("seeked", sendState);
      audio.removeEventListener("volumechange", sendState);

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
        fontFamily: "sans-serif",
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
              fontWeight: "bold",
              cursor: "pointer",
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

          <p style={{ marginBottom: "10px", color: "#1db954" }}>
            {isHost ? "You are Host 🎧" : "Listener 👂"}
          </p>

          <p style={{ marginBottom: "15px" }}>
            Status: {status}
          </p>

          <button
            onClick={() =>
              navigator.clipboard.writeText(
                `${window.location.origin}/?room=${roomId}&pass=${password}`
              )
            }
            style={{
              marginBottom: "15px",
              padding: "8px 12px",
              background: "#333",
              border: "none",
              color: "white",
              cursor: "pointer",
            }}
          >
            Copy Invite Link
          </button>

          <audio ref={audioRef} controls preload="auto" style={{ width: "100%" }}>
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