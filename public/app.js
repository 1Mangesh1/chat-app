const socket = io();
const joinForm = document.getElementById("joinForm");
const container = document.getElementById("container");
const chatroomDiv = document.getElementById("chatroom");
const privateChatDiv = document.getElementById("privateChat");
const userList = document.getElementById("userList");
const messages = document.getElementById("messages");
const privateMessages = document.getElementById("privateMessages");
const form = document.getElementById("form");
const privateForm = document.getElementById("privateForm");
const input = document.getElementById("input");
const privateInput = document.getElementById("privateInput");
const recipientInput = document.getElementById("recipient");
const typingNowMessage = document.getElementById("typingNow");

let username = "";
let isTyping = false;
let typingTimeout;
let isDisconnected = false;

function updateUserList(onlineUsers) {
  userList.innerHTML = "";
  onlineUsers.forEach((user) => {
    const li = document.createElement("li");
    li.textContent = user;
    userList.appendChild(li);
  });
}

function showUserConnectedMessage(username) {
  const userConnectedMessage = document.createElement("li");
  userConnectedMessage.textContent = `${username} has joined the chat`;
  userConnectedMessage.classList.add("userConnectedMessage");
  messages.appendChild(userConnectedMessage);
  setTimeout(() => {
    userConnectedMessage.remove();
  }, 5000);
}

function showUserDisconnectedMessage(username) {
  const userDisconnectedMessage = document.createElement("li");
  userDisconnectedMessage.textContent = `${username} has left the chat`;
  userDisconnectedMessage.classList.add("userDisconnectedMessage");
  messages.appendChild(userDisconnectedMessage);
  setTimeout(() => {
    userDisconnectedMessage.remove();
  }, 5000);
}

function showUserTypingMessage(username) {
  typingNowMessage.textContent = `${username} is typing...`;
}

function hideUserTypingMessage() {
  typingNowMessage.textContent = "";
}

function sendMessage(msg) {
  socket.emit("chatMessage", msg);
}

function addChatMessage(username, message) {
  const item = document.createElement("li");
  item.textContent = `${username}: ${message}`;
  messages.appendChild(item);
  scrollToBottom(messages);
}

function addPrivateMessage(sender, message, recipient) {
  const item = document.createElement("li");
  item.textContent = `${sender} privately to ${recipient}: ${message}`;
  privateMessages.appendChild(item);
  scrollToBottom(privateMessages);
}

function scrollToBottom(element) {
  element.scrollTop = element.scrollHeight;
}

joinForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  username = document.getElementById("username").value.trim();
  socket.emit("join", { name, username });

  joinForm.style.display = "none";
  container.style.display = "flex";
  chatroomDiv.style.display = "block";
  privateChatDiv.style.display = "block";
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const msg = input.value.trim();
  if (msg) {
    sendMessage(msg);
    input.value = "";
  }
});

recipientInput.addEventListener("input", () => {
  const recipient = recipientInput.value.trim();
  const onlineUsersOptions = userList.getElementsByTagName("li");
  let isRecipientOnline = false;

  for (let i = 0; i < onlineUsersOptions.length; i++) {
    if (onlineUsersOptions[i].textContent === recipient) {
      isRecipientOnline = true;
      break;
    }
  }

  if (isRecipientOnline) {
    recipientInput.style.border = "2px solid #07e507";
  } else {
    recipientInput.style.border = "2px solid #d9534f";
  }
});

userList.addEventListener("click", (e) => {
  if (e.target && e.target.nodeName === "LI") {
    const recipient = e.target.textContent;
    recipientInput.value = recipient;
    recipientInput.disabled = true; // Disable the recipient input
  }
});

privateForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const recipient = recipientInput.value.trim();
  const msg = privateInput.value.trim();
  if (recipient && msg) {
    sendPrivateMessage(recipient, msg);
    privateInput.value = "";
    recipientInput.disabled = false; // Re-enable the recipient input
  }
});

function sendPrivateMessage(recipient, message) {
  socket.emit("privateMessage", { recipient, message, sender: username });
}

input.addEventListener("input", () => {
  if (!isTyping) {
    isTyping = true;
    socket.emit("typing");
  }
});

input.addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    isTyping = false;
    socket.emit("stoppedTyping");
    const msg = input.value.trim();
    if (msg) {
      sendMessage(msg);
      input.value = "";
    }
  } else {
    // Start typing again
    if (isDisconnected) {
      isDisconnected = false;
      socket.emit("typing");
    }
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      isTyping = false;
      socket.emit("stoppedTyping");
    }, 2000); // Adjust the delay here (in milliseconds)
  }
});

socket.on("userConnected", ({ username }) => {
  showUserConnectedMessage(username);
});

socket.on("userDisconnected", ({ username }) => {
  showUserDisconnectedMessage(username);
});

socket.on("onlineUsers", (onlineUsers) => {
  updateUserList(onlineUsers);
});

socket.on("userTyping", (username) => {
  showUserTypingMessage(username);
});

socket.on("userStoppedTyping", () => {
  hideUserTypingMessage();
});

socket.on("chatMessage", ({ username, message }) => {
  addChatMessage(username, message);
});

socket.on("privateMessage", ({ sender, message, recipient }) => {
  addPrivateMessage(sender, message, recipient);
});

socket.on("privateMessageError", ({ recipient, message }) => {
  alert(`${message} Recipient: ${recipient}`);
});

socket.on("disconnect", () => {
  isTyping = true;
  isDisconnected = true;
  socket.emit("stoppedTyping");
  hideUserTypingMessage();
});
