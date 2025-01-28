const express = require("express");
const http = require('http');
const { Server } = require('socket.io');
require("dotenv").config({path: 'config.env'});
const path = require("path");
const { generateRoomId } = require("./utils"); 
const connectToMongo = require('./db.connection');
const morgan = require("morgan");
const cors = require("cors");

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
    path: "/socket.io",
    wssEngine: ['ws', 'wss'],
    transports: ['websocket', 'polling'],
    cors: {
        origin: true, 
        methods: ["GET", "POST"],
        credentials: true 
    },
    allowEIO3: true
});
const port = 5001 || process.env.PORT;

connectToMongo()

app.use(express.json());
app.use(morgan("dev"));
app.use(cors({
  origin:true,
  credentials: true,
}));

app.use("/api/user", require("./routes/user.route"));

const rooms = {};  

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on("joinRoom", ({ roomId, userName }) => {
    if (!roomId || !userName) return;

    socket.join(roomId);  
    if (!rooms[roomId]) {
      rooms[roomId] = {
        users: [],
        isPlaying: true,
        currentTime: 0,
        videoUsers: [], // Initialize empty array
        screenShare: null,
        hostId: null,
        pinnedUser: null,
        raisedHands: [],
        chat: [],
        settings: {
          everyoneCanShareScreen: true,
          everyoneCanToggleOthersMic: false,
          everyoneCanToggleOthersCamera: false
        }
      };
    }

    rooms[roomId].users.push({ id: socket.id, name: userName });

    socket.to(roomId).emit("chat", {
      userName: "Admin",
      msg: `${userName} has joined the room!`,
    });

    io.to(roomId).emit("userList", rooms[roomId].users);
  });

  socket.on('video-action', ({ roomId, type }) => {
    if (rooms[roomId]) {
      rooms[roomId].isPlaying = (type === 'play'); 
    }
  });

  socket.on('video-timeupdate', ({ roomId, time }) => {
    if (rooms[roomId]) {
      rooms[roomId].currentTime = time; 
      io.to(roomId).emit('sync-video', {
        time: rooms[roomId].currentTime,
        isPlaying: rooms[roomId].isPlaying,
      });
    }
  });

  

  socket.on("chat", ({ roomId, msg }) => {
      if (msg.trim() === "") return;
      const userIndex = rooms[roomId].users.findIndex(user => user.id === socket.id);
      if (userIndex === -1) {
          console.log(`User with socket ID ${socket.id} not found in room ${roomId}`);
          return;
      }
      
      const userName = rooms[roomId].users[userIndex].name; 
      io.to(roomId).emit("chat", {
          userName: userName, 
          msg: msg,
      });
  });

  socket.on("disconnect", () => {
      for (const roomId in rooms) {
          const userIndex = rooms[roomId].users.findIndex(user => user.id === socket.id);
          if (userIndex !== -1) {
              const userName = rooms[roomId].users[userIndex].name; 
              rooms[roomId].users.splice(userIndex, 1);

              socket.to(roomId).emit("chat", {
                  userName: "Admin",
                  msg: `${userName} has left the room.`,
              });

              socket.to(roomId).emit("user-left-video", socket.id);

              io.to(roomId).emit("userList", rooms[roomId].users);
              break; 
          } else {
              console.log(`User with socket ID ${socket.id} not found in room ${roomId}`);
          }
      }
  });

  socket.on("join-video-room", ({ roomId, userId, userName }) => {
    if (!roomId || !userId || !userName) return;
    
    socket.join(roomId);

    const users = Array.from(io.sockets.adapter.rooms.get(roomId) || []);

    socket.emit("all-users", users.filter(id => id !== socket.id));
    

    if (!rooms[roomId]) {
      rooms[roomId] = {
        users: [],
        videoUsers: [],
      };
    }
    
    if (!rooms[roomId].videoUsers) {
      rooms[roomId].videoUsers = [];
    }
    
    // Add user to videoUsers
    rooms[roomId].videoUsers.push({
      id: userId,
      name: userName,
      isAudioOn: true,
      isVideoOn: true
    });
  });

  socket.on("sending-signal", payload => {
    const { userToSignal, callerId, signal } = payload;
    io.to(userToSignal).emit('user-joined', { 
      signal, 
      callerId 
    });
  });

  socket.on("returning-signal", payload => {
    const { callerId, signal } = payload;
    io.to(callerId).emit('receiving-returned-signal', { 
      signal, 
      id: socket.id 
    });
  });

  socket.on("leave-video-room", ({ roomId, userId }) => {
    if (rooms[roomId]) {
      if (!rooms[roomId].videoUsers) {
        rooms[roomId].videoUsers = [];
      }
      
      // Remove user from video users
      rooms[roomId].videoUsers = rooms[roomId].videoUsers.filter(u => u.id !== userId);
      
      // Notify other users
      socket.to(roomId).emit("user-left-video", userId);
      
      if (rooms[roomId].videoUsers.length === 0) {
        delete rooms[roomId].videoUsers;
      }
    }
    
    socket.leave(roomId);
  });

  socket.on("start-screen-share", ({ roomId, userId }) => {
    if (rooms[roomId]) {
      rooms[roomId].screenShare = userId;
      io.to(roomId).emit("screen-share-update", { userId });
    }
  });

  socket.on("stop-screen-share", ({ roomId }) => {
    if (rooms[roomId]) {
      rooms[roomId].screenShare = null;
      io.to(roomId).emit("screen-share-update", { userId: null });
    }
  });

  // Handle raised hands
  socket.on("toggle-hand", ({ roomId, userId, isRaised }) => {
    if (rooms[roomId]) {
      const user = rooms[roomId].videoUsers.find(u => u.id === userId);
      if (user) {
        user.handRaised = isRaised;
        io.to(roomId).emit("hand-state-update", { userId, isRaised });
      }
    }
  });

  socket.on("pin-user", ({ roomId, userId }) => {
    if (rooms[roomId]) {
      rooms[roomId].pinnedUser = userId;
      io.to(roomId).emit("pin-update", { userId });
    }
  });

  socket.on("media-state-update", ({ roomId, userId, type, enabled }) => {
    if (rooms[roomId]) {
      const user = rooms[roomId].videoUsers.find(u => u.id === userId);
      if (user) {
        if (type === 'audio') user.isAudioOn = enabled;
        if (type === 'video') user.isVideoOn = enabled;
        
        io.to(roomId).emit("user-media-update", { 
          userId, 
          type, 
          enabled 
        });
      }
    }
  });

  socket.on("create-meeting", ({ roomId, hostId, hostName }) => {
    console.log("Creating meeting:", { roomId, hostId, hostName });
    
    if (!rooms[roomId]) {
      rooms[roomId] = {
        users: [],
        hostId: hostId,
        hostName: hostName,
        videoUsers: [], // Initialize empty array
        screenShare: null,
        pinnedUser: null,
        isPlaying: true,
        currentTime: 0,
        raisedHands: [],
        chat: [],
        settings: {
          everyoneCanShareScreen: true,
          everyoneCanToggleOthersMic: false,
          everyoneCanToggleOthersCamera: false
        }
      };
    }
    socket.join(roomId);
    rooms[roomId].users.push({ id: hostId, name: hostName });
    console.log("Room created:", rooms[roomId]);
  });

  socket.on("check-host", ({ roomId, userId }) => {
    const isHost = rooms[roomId]?.hostId === userId;
    socket.emit("host-status", { isHost });
  });

  socket.on("request-to-join", ({ roomId, userId, userName }) => {
    console.log("Join request received:", { roomId, userId, userName });

    if (!roomId || !userId || !userName) {
      console.log("Missing required fields");
      socket.emit("join-rejected", { reason: "Invalid request" });
      return;
    }

    if (!rooms[roomId]) {
      console.log("Room not found:", roomId);
      socket.emit("join-rejected", { reason: "Meeting not found" });
      return;
    }

    const hostId = rooms[roomId].hostId;
    console.log("Host ID:", hostId);

    if (userId === hostId || rooms[roomId].hostName === userName) {
      console.log("Host joining - auto accepting");

      rooms[roomId].hostId = socket.id;
      socket.emit("join-accepted");
      socket.emit("host-status", { isHost: true });
      return;
    }

    // For non-host users, notify host of join request
    console.log("Emitting join request to host:", hostId);
    io.to(hostId).emit("join-request", {
      userId,
      userName,
      roomId
    });
  });

  socket.on("handle-join-request", ({ roomId, userId, accepted }) => {
    console.log("Handling join request:", { roomId, userId, accepted });
    
    if (accepted) {
      // Add user to room if accepted
      if (rooms[roomId] && !rooms[roomId].users.find(u => u.id === userId)) {
        rooms[roomId].users.push({ id: userId });
      }
      io.to(userId).emit("join-accepted");
    } else {
      io.to(userId).emit("join-rejected", { reason: "Host denied your request" });
    }
  });

  socket.on("user-reconnected", ({ roomId, userId, userName }) => {
    if (rooms[roomId]) {
      // Update user's socket ID if they were in the room
      const existingUser = rooms[roomId].users.find(u => u.name === userName);
      if (existingUser) {
        existingUser.id = socket.id;
      }

      socket.to(roomId).emit("user-reconnected", {
        userId: socket.id,
        userName
      });
    }
  });
});

app.use('/',(req,res) => {
    res.send("Server is Running");
})

// if (process.env.NODE_ENV === 'production') {
//   // Serve static files
//   app.use(express.static(path.join(__dirname, '../client/build')));
  
//   // Handle React routing
//   app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, '../client/build/index.html'));
//   });
// }

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});