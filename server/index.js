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
    cors: {
        origin: true, 
        methods: ["GET", "POST"],
        credentials: true 
    }
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
    if (!roomId) {
      roomId = generateRoomId();
    }
    socket.join(roomId);
    if (!rooms[roomId]) {
      rooms[roomId] = { users: [],isPlaying : true, currentTime: 0 }; // Add currentTime to track video time
    }

    rooms[roomId].users.push({ id: socket.id, name: userName });

    socket.to(roomId).emit("chat", {
      userName: "Admin",
      msg: `${userName} has joined the room!`,
    });

    io.to(roomId).emit("userList", rooms[roomId].users);
    // Send current video time to the new user
    // socket.emit("syncVideo", rooms[roomId].currentTime);

    // socket.emit('sync-video', {
    //   type: rooms[roomId].isPlaying ? 'play' : 'pause',
    //   time: rooms[roomId].currentTime,
    // });

    // socket.on('video-action', (action) => {
    //   // Update room state based on the action
    //   if (action.type === 'play') {
    //     rooms[roomId].isPlaying = true;
    //   } else if (action.type === 'pause') {
    //     rooms[roomId].isPlaying = false;
    //   } else if (action.type === 'seek') {
    //     rooms[roomId].currentTime = action.time;
    //   }

    //   // Broadcast the action to everyone in the room except the sender
    //   socket.to(roomId).emit('sync-video', action);

    socket.emit('sync-video', {
      time: rooms[roomId].currentTime,
      isPlaying: rooms[roomId].isPlaying,
    });

    // Notify other users in the room about the new user
    socket.to(roomId).emit('user-joined', { userName });

    
  });

  socket.on('video-action', ({ roomId, type }) => {
    if (rooms[roomId]) {
      rooms[roomId].isPlaying = (type === 'play'); // Update playback state
    }
  });

  socket.on('video-timeupdate', ({ roomId, time }) => {
    if (rooms[roomId]) {
      rooms[roomId].currentTime = time; // Store the current time on the server
      // Emit the updated current time to all users in the room
      io.to(roomId).emit('sync-video', {
        time: rooms[roomId].currentTime,
        isPlaying: rooms[roomId].isPlaying,
      });
    }
  });

  

  socket.on("chat", ({ roomId, msg }) => {
      if (msg.trim() === "") return;
      const userIndex = rooms[roomId].users.findIndex(user => user.id === socket.id);
      
      // Check if userIndex is valid
      if (userIndex === -1) {
          console.log(`User with socket ID ${socket.id} not found in room ${roomId}`);
          return; // Exit if user is not found
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
              const userName = rooms[roomId].users[userIndex].name; // Ensure userIndex is valid
              rooms[roomId].users.splice(userIndex, 1);

              socket.to(roomId).emit("chat", {
                  userName: "Admin",
                  msg: `${userName} has left the room.`,
              });

              io.to(roomId).emit("userList", rooms[roomId].users);
              break; // Exit the loop after handling the disconnect
          } else {
              console.log(`User with socket ID ${socket.id} not found in room ${roomId}`);
          }
      }
  });
});

app.use(express.static(path.join(__dirname, '../client/build')));

app.get('*', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  } else {
    res.send('API is running...');
  }
});


server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});