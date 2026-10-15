const http = require("http");
const express = require("express");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve frontend files
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Real-time chat
io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.emit("online-count", io.engine.clientsCount);
    socket.broadcast.emit("online-count", io.engine.clientsCount);

    socket.on("user-message", (data) => {
        if (
            !data ||
            typeof data.text !== "string" ||
            typeof data.username !== "string"
        ) {
            return;
        }

        const text = data.text.trim().slice(0, 2000);
        const username = data.username.trim().slice(0, 30);

        if (!text || !username) return;

        io.emit("message", {
            username,
            text,
            time: new Date().toISOString(),
            senderId: socket.id
        });
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        io.emit("online-count", io.engine.clientsCount);
    });
});

server.listen(PORT, () => {
    console.log(`Chat server running at http://localhost:${PORT}`);
});