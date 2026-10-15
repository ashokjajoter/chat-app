const socket = io();

const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("message");
const messagesContainer = document.getElementById("messages");
const emptyState = document.getElementById("emptyState");
const onlineCount = document.getElementById("onlineCount");
const profileName = document.getElementById("profileName");
const profileAvatar = document.getElementById("profileAvatar");
const editNameButton = document.getElementById("editName");
const scrollBottomButton = document.getElementById("scrollBottom");
const emojiButton = document.getElementById("emojiBtn");

let username = "";

function getUsername() {
    const savedName = sessionStorage.getItem("chatUsername");

    if (savedName) {
        return savedName;
    }

    const enteredName = prompt("Welcome to ChAT! What should we call you?");

    return (enteredName || "Guest").trim().slice(0, 30) || "Guest";
}

function updateProfile(name) {
    username = name.trim().slice(0, 30) || "Guest";

    sessionStorage.setItem("chatUsername", username);

    profileName.textContent = username;
    profileAvatar.textContent = username.charAt(0).toUpperCase();
}

updateProfile(getUsername());

editNameButton.addEventListener("click", () => {
    const newName = prompt("Enter your new display name:", username);

    if (newName && newName.trim()) {
        updateProfile(newName);
    }
});

socket.on("connect", () => {
    onlineCount.textContent = "Connected";
});

socket.on("disconnect", () => {
    onlineCount.textContent = "Reconnecting...";
});

socket.on("online-count", (count) => {
    onlineCount.textContent =
        `${count} ${count === 1 ? "person" : "people"} online`;
});

chatForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const text = messageInput.value.trim();

    if (!text || !socket.connected) {
        if (!socket.connected) {
            onlineCount.textContent = "Reconnecting...";
        }
        return;
    }

    socket.emit("user-message", {
        username,
        text
    });

    messageInput.value = "";
    messageInput.focus();
});

socket.on("message", (message) => {
    if (!message || typeof message.text !== "string") return;

    if (emptyState) {
        emptyState.remove();
    }

    const isOwnMessage = message.senderId === socket.id;

    const row = document.createElement("article");
    row.className = `message-row${isOwnMessage ? " own" : ""}`;

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent =
        (message.username || "G").charAt(0).toUpperCase();

    const body = document.createElement("div");
    body.className = "message-body";

    const meta = document.createElement("div");
    meta.className = "message-meta";

    const name = document.createElement("span");
    name.className = "message-name";
    name.textContent = isOwnMessage ? "You" : (message.username || "Guest");

    const time = document.createElement("time");
    time.className = "message-time";

    const date = new Date(message.time);

    time.textContent = Number.isNaN(date.getTime())
        ? ""
        : date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
        });

    meta.append(name, time);

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    bubble.textContent = message.text;

    body.append(meta, bubble);
    row.append(avatar, body);
    messagesContainer.appendChild(row);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
});

scrollBottomButton.addEventListener("click", () => {
    messagesContainer.scrollTo({
        top: messagesContainer.scrollHeight,
        behavior: "smooth"
    });
});

emojiButton.addEventListener("click", () => {
    messageInput.value += " 😊";
    messageInput.focus();
});

messageInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        chatForm.requestSubmit();
    }
});