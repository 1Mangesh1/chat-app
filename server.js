//https://chat-app-rhlw.onrender.com/
const { Socket } = require("dgram");
const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const users = {};

app.use(express.static(__dirname + "/public"));

io.on("connection", (socket) => {
    if(!users[socket.id]){
    users[socket.id] = { name: "Anonymous", username: "Anonymous" };
  }
  console.log("User connected:", socket.id);
  // socket.emit("userConnected", { username: users[socket.id]?.username });

  // When a user joins

  socket.on("join", (userData) => {
    const { name, username } = userData;
    users[socket.id] = { name, username };
    console.log(`User ${username} with socket ID ${socket.id} joined.`);
    socket.broadcast.emit("userConnected", { username });
    io.emit(
      "onlineUsers",
      Object.values(users).map((user) => user.username)
    );
  });

  socket.on("chatMessage", (msg) => {
    const { username } = users[socket.id];
    console.log(`Message from ${username}: ${msg}`);
    io.emit("chatMessage", { username, message: msg });
  });

  socket.on("privateMessage", ({ sender, message, recipient }) => {
    const recipientSocket = Object.keys(users).find(
      (socketId) => users[socketId].username === recipient
    );
  
    if (recipientSocket && socket.id !== recipientSocket) {
      io.to(recipientSocket).emit("privateMessage", {
        sender: sender,
        message: message,
        recipient: "You",
      });
      socket.emit("privateMessage", {
        sender: "You",
        message: message,
        recipient: recipient,
      });
    } else if (socket.id === recipientSocket) {
      socket.emit("privateMessageError", {
        recipient,
        message: "You cannot send a private message to yourself.",
      });
    } else {
      socket.emit("privateMessageError", {
        recipient,
        message: "User is not online or doesn't exist.",
      });
    }
  });
  
  
  

  socket.on("typing", () => {
    const { username } = users[socket.id];
    socket.broadcast.emit("userTyping", username);
  });

  socket.on("stoppedTyping", () => {
    const { username } = users[socket.id];
    socket.broadcast.emit("userStoppedTyping", username);
  });

  socket.on("disconnect", () => {
    const { username } = users[socket.id];
    delete users[socket.id];
    console.log(`User ${username} with socket ID ${socket.id} disconnected.`);
    io.emit("userDisconnected", { username });
    io.emit(
      "onlineUsers",
      Object.values(users).map((user) => user.username)
    );
  });
});

server.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
