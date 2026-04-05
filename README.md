# Couplyy Listen

Couplyy Listen is a real-time collaborative music listening web application that allows multiple users to listen to the same audio in perfect sync. It focuses on seamless playback synchronization rather than streaming, ensuring a lightweight and responsive experience.

---

## Overview

Couplyy Listen enables users to join a shared room using a room ID and password. Once connected, one user acts as the **host**, controlling playback actions such as play, pause, and seek. These actions are instantly reflected across all connected users with minimal delay.

The system maintains synchronization by continuously sharing playback state and correcting time drift, ensuring that all users stay aligned even if they join mid-session.

## Features

* Private room system with password protection
* Multi-user real-time connection
* Host-controlled playback system
* Sync play, pause, and seek across devices
* Volume synchronization
* Shareable room links for easy access
* Drift correction for accurate real-time syncing
* Fully deployed (frontend + backend)

---

## How It Works

Instead of streaming audio, the application synchronizes playback state using WebSockets.

* The **host** sends playback updates (time, state, volume)
* The **server** distributes this state to all listeners
* Each client adjusts its playback using timestamp-based correction
* Minor time differences are smoothly corrected to maintain sync

This approach keeps the system efficient while achieving near real-time synchronization.

---

## Tech Stack

**Frontend**

* React
* Socket.IO Client

**Backend**

* Node.js
* Express
* Socket.IO

**Deployment**

* Frontend: Vercel
* Backend: Railway

---

## Installation & Setup

### Clone the repository

```bash
git clone https://github.com/AaravBot/Couplyy-Listen.git
cd Couplyy-Listen
```

---

### Backend Setup

```bash
cd Server
npm install
node index.js
```

---

### Frontend Setup

```bash
cd client
npm install
npm start
```

---

## Usage

1. Open the application
2. Enter a Room ID and Password
3. Share the generated link with another user
4. The first user becomes the **host**
5. Press play — both users hear audio in sync

---

## Project Highlights

* Implements real-time synchronization logic instead of simple media sharing
* Handles network delay using timestamp-based correction
* Demonstrates understanding of WebSockets and distributed state
* Clean separation between host authority and listeners

---

## Future Improvements

* Real-time chat inside rooms
* Playlist and queue system
* Improved UI/UX (music app style interface)
* Mobile optimization
* Authentication system

---

## Contributing

Contributions are welcome. Feel free to fork the repository and submit a pull request.

---

## License

This project is open-source and available under the MIT License.

---

## Author

Aarav Sharma
B.Tech Electrical & Computer Science Engineering Student

---

If you found this project useful or interesting, consider giving it a star ⭐
