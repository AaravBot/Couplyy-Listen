import { useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("https://couplyy-listen-production.up.railway.app");

function App() {
  const [roomId, setRoomId] = useState("");
  const [password, setPassword] = useState("");
  const [joined, setJoined] = useState(false);

  const audioRef = useRef(null);
  const isSyncing = useRef(false);

  // auto-fill + auto-join from link
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
    socket.emit("join_room", { roomId, password });
    setJoined(true);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !joined) return;

    const sendState = () => {
      if (isSyncing.current) return;

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

      if (Math.abs(audio.currentTime - targetTime) > 0.3) {
        audio.currentTime = targetTime;
      }

      audio.volume = state.volume;

      if (state.isPlaying) {
        if (audio.paused) {
          await audio.play().catch(() => {});
        }
      } else {
        if (!audio.paused) {
          audio.pause();
        }
      }

      setTimeout(() => {
        isSyncing.current = false;
      }, 100);
    };

    const interval = setInterval(() => {
      sendState();
    }, 2000);

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
  }, [joined]);

  return (
    <div style={{ padding: "40px" }}>
      <h1>Couplyy Listen</h1>

      {!joined ? (
        <div>
          <input
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <br /><br />
          <input
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <br /><br />
          <button onClick={joinRoom}>Join</button>
        </div>
      ) : (
        <div>
          <h2>Room: {roomId}</h2>

          <p>Share this link:</p>
          <input
            value={`${window.location.origin}/?room=${roomId}&pass=${password}`}
            readOnly
            style={{ width: "400px" }}
          />

          <br /><br />

          <audio ref={audioRef} controls preload="auto">
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