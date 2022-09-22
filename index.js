const express = require("express");
const cors = require("cors");
const http = require("http");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const  mongoose = require("mongoose");
const { Server } = require("socket.io");

const authRoute = require('./routes/auth');
const userRoute = require('./routes/user');

dotenv.config();

const app = express();
app.use(cors());
app.use(cookieParser());
app.use(express.json());
const PORT = 8000;

mongoose.connect(process.env.MONGODB_URL, () => {
    console.log("connected to DB")
})

// AUTHENTICATION
// Routes
app.use("/v1/auth", authRoute);

app.use("/v1/user", userRoute)


// CONECT TO SOCKET.IO
const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    }
})

io.on("connection", (socket) => {
    console.log(`User connected ${socket.id}`)

    socket.on("join_room", (data) => {
        socket.join(data)
        console.log(`User with ID: ${socket.id} joined room: ${data}`)
    })

    socket.on("send_message", (data) => {
        socket.to(data.room).emit("receive_message", data)
    })

    socket.on("disconnect", () => {
        console.log("User disconnected", socket.id)
    })
})

server.listen(PORT, () => {
    console.log("Server running bae!")
})

/* 
    JWT
    Xác thực người dùng,
*/