const express = require("express");
const questionModel = require("../models/question.model");
const userModel = require("../models/gameData.model")
const app = express();

app.post("/add_question", async (request, response) => {
    const question = new questionModel(request.body);

    try {
        await question.save();
        response.send(question);
    } catch (error) {
        response.status(500).send(error);
    }
});

app.get("/questions", async (request, response) => {
    const questionsData = await questionModel.find({});
    const question = questionsData.map((quest) => {
        return quest.question
    })
    try {
        response.send(question);
    } catch (error) {
        response.status(500).send(error);
    }
});

module.exports = app