const http = require("http");
const express = require("express");
const {
    Server
} = require("socket.io");
const app = express();
const port = 5000;
const RoomManager = require("./room");
const roomManager = new RoomManager();
const connectDB = require("./datasource");
const mongoose = require("mongoose");
const questionModel = require("./models/question.model");
const gameDataModel = require("./models/gameData.model");
const Router = require("./routes/routes");

app.use(Router);
app.use(express.json());
app.use(express.static('public'));
app.get("/ping", (req, res) => {
    res.send("Welcome to the server");
});

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

const server = http.createServer(app);
const io = new Server(server);

server.on("error", (err) => {
    console.log("Error opening server");
});

server.listen(port, () => {
    connectDB();
    console.log("Server listening on port %s", port);
});

let roomsData = {};

io.on("connection", (socket) => {
    let currentRoomId = null;

    socket.on("createRoom", async () => {
        const roomId = await roomManager.createRoom(socket.id);
        socket.join(roomId);
        currentRoomId = roomId;
        roomsData[currentRoomId] = {
            scores: {},
            questions: [],
            currentQuestionIndex: 0,
        };
        console.log("Room Created: %s and created by %s", currentRoomId, socket.id);
        const room = roomManager.rooms.get(currentRoomId);
        console.log("ROOm in Start GAme Event :", room)
        roomsData[currentRoomId].scores[socket.id] = 0;
        io.to(roomId).emit('readyState', roomId);
        console.log("Sent the room ID : ", roomId)
        io.emit("updateRooms", {
            rooms: roomManager.getRooms(),
        });
    });

    socket.on("joinRoom", (roomId) => {
        if (roomManager.joinRoom(roomId, socket.id)) {
            socket.join(roomId);
            console.log("user with ID %s joined the room: %s", socket.id, roomId);
            currentRoomId = roomId;
            roomsData[currentRoomId].scores[socket.id] = 0;
            io.to(roomId).emit("startGame", async () => {
                const room = roomManager.rooms.get(currentRoomId);
                console.log("ROOm in Start GAme Event :", room)
                if (room && room.users.length === 2) {
                    await startQuiz(currentRoomId);
                }
            });
            io.emit("updateRooms", {
                rooms: roomManager.getRooms(),
            });
        }
    });

    async function startQuiz(roomId) {
        const roomData = roomsData[roomId];
        console.log("event fired with roomID : : :", roomId);
        const questionData = await questionModel.find({});
        if (questionData.length === 0) {
            console.error("No questions available.");
            return;
        }

        const shuffledQuestions = shuffleArray(questionData);

        const questionArray = shuffledQuestions.slice(0, 5).map((quest) => ({
            id: quest._id,
            question: quest.question,
            option1: quest.option1,
            option2: quest.option2,
            option3: quest.option3,
            option4: quest.option4,
            answer: quest.answer,
        }));

        roomData.questions = questionArray;

        let i = 0;
        const numberOfQuestions = 5;
        const timeWindow = 10 * 1000;

        let questionsSent = 0;
        const intervalId = setInterval(() => {
            if (questionsSent >= numberOfQuestions) {
                finishQuiz(roomId);
            } else {
                const questionAndOption = {
                    question: questionArray[i].question,
                    option1: questionArray[i].option1,
                    option2: questionArray[i].option2,
                    option3: questionArray[i].option3,
                    option4: questionArray[i].option4,
                }
                sendQuestionToRoom(socket, roomId, questionAndOption);
                i++;
                questionsSent++;
                roomData.currentQuestionIndex++;
            }
        }, timeWindow);

        if (!roomsData[roomId]) {
            roomsData[roomId] = {
                scores: {},
                questions: questionArray,
                currentQuestionIndex: 0,
            };
        } else {
            roomsData[roomId].questions = questionArray;
        }

        roomsData[roomId].intervalId = intervalId;

        roomData.intervalId = intervalId;
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function finishQuiz(roomId) {
        const finalScores = calculateFinalScores(roomId);
        io.to(roomId).emit("finalScores", finalScores);
        roomManager.deleteRoom(roomId);
        io.emit("updateRooms", {
            rooms: roomManager.getRooms(),
        });
    }

    socket.on("disconnect", () => {
        if (currentRoomId) {
            const room = roomManager.rooms.get(currentRoomId);
            if (room) {
                if (roomsData[currentRoomId].intervalId) {
                    clearInterval(roomsData[currentRoomId].intervalId);
                }

                room.users = room.users.filter((userId) => userId !== socket.id);
                if (room.users.length === 0) {
                    roomManager.rooms.delete(currentRoomId);
                    delete roomsData[currentRoomId];
                }
            }
            io.to(currentRoomId).emit("playerDisconnected");
            io.emit("updateRooms", {
                rooms: roomManager.getRooms(),
            });
        }
    });

    function sendQuestionToRoom(socket, roomID, question) {
        console.log("This Is My Room ID : ", roomID)
        io.to(roomID).emit("receive-question", question);
    }

    socket.on("submit-answer", (submittedAnswer) => {
        console.log("Submitted Answer by %s: %s ", socket.id, submittedAnswer);
        const roomData = roomsData[currentRoomId];
        const correctAnswer = roomData.questions[roomData.currentQuestionIndex - 1].answer;
        const isCorrect = submittedAnswer === correctAnswer;
        updatePlayerScore(currentRoomId, socket.id, isCorrect);
        console.log(roomsData[currentRoomId].scores, currentRoomId);
    });
});

function updatePlayerScore(roomId, playerId, isCorrect) {

    if (roomsData[roomId] && roomsData[roomId].scores[playerId] !== undefined) {
        console.log("Score Updated")
        roomsData[roomId].scores[playerId] = (roomsData[roomId].scores[playerId] || 0) + (isCorrect ? 10 : 0);
    }
}

function calculateFinalScores(roomId) {
    const roomData = roomsData[roomId];
    if (roomData) {
        const playerScores = roomData.scores;
        const finalScores = {};
        for (const playerId in playerScores) {
            finalScores[playerId] = playerScores[playerId];
        }
        return finalScores;
    }
    return {};
}

const setIntervalX = (fn, delay, times) => {
    if (!times) return;

    setTimeout(() => {
        fn();
        setIntervalX(fn, delay, times - 1);
    }, delay);
};