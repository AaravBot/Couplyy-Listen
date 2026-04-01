# Couplyy-Listen
Couplyy-Listen is a real time music listening app that allows two users to listen to the same song together in sync. Users can join a shared room where playback actions like play, pause, and seek are synchronized instantly.
The app syncs playback state using WebSockets instead of streaming audio, keeping it fast and efficient. If a user joins mid-song, they are automatically aligned to the current playback position.
## Features
* Create or join a private room
* Real time playback synchronization
* Sync play, pause, and seek
* Join mid song with automatic sync
## Tech Stack
Frontend
React (planned)
Backend
Node.js
Express
Socket.io
## Project Structure
client/     Frontend
server/     Backend
docs/       Architecture and notes
## Getting Started
git clone https://github.com/AaravBot/Couplyy-Listen.git
cd Couplyy-Listen
## Goal
To build a real-time system demonstrating strong fundamentals in WebSockets, state synchronization, and system design.

