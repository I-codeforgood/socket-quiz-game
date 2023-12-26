const mongoose = require("mongoose");

const GameSchema = new mongoose.Schema({
    room_id: {
        type: String,
        required: true,
    },
    player1_id: {
        type: String,
        required: true,
    },
    player2_id: {
        type: String
    },
    sent_questions: [{
        type: String
    }],
    received_answers: [{
        type: String
    }],
    player1_score: {
        type: Number
    },
    player2_score: {
        type: Number
    }
});

const GameData = mongoose.model("GameData", GameSchema);

module.exports = GameData;