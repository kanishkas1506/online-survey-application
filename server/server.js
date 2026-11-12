
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// Question Schema
const Question = mongoose.model("Question",
  new mongoose.Schema({
    question: { type: String, required: true }
  })
);

// Response Schema
const Response = mongoose.model("Response",
  new mongoose.Schema({
    name: { type: String, required: true },
    answers: [{
      questionId: mongoose.Schema.Types.ObjectId,
      question: String,
      answer: String
    }],
    submittedAt: {
      type: Date,
      default: Date.now
    }
  })
);

// Fixed 5 Questions
const sampleQuestions = [
  "What is your favourite subject?",
  "Which programming language do you prefer?",
  "What is your career goal?",
  "How do you rate our college?",
  "Which technology interests you?"
];

// Get Fixed Questions
app.get("/api/survey/questions", async (req, res) => {
  try {
    const questions = await Question.find().sort({ _id: 1 });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Submit Survey
app.post("/api/survey/submit", async (req, res) => {
  try {
    const { name, answers } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Please enter your name"
      });
    }

    if (!Array.isArray(answers) || answers.length !== 5) {
      return res.status(400).json({
        message: "Exactly 5 answers required"
      });
    }

    const savedAnswers = [];

    for (const item of answers) {
      if (!mongoose.isValidObjectId(item.questionId) ||
          typeof item.answer !== "string" ||
          !item.answer.trim()) {
        return res.status(400).json({
          message: "Invalid question or empty answer"
        });
      }

      const question = await Question.findById(item.questionId);

      if (!question) {
        return res.status(400).json({
          message: "Question not found"
        });
      }

      if (savedAnswers.some(a =>
        a.questionId.toString() === question._id.toString()
      )) {
        return res.status(400).json({
          message: "Duplicate question"
        });
      }

      savedAnswers.push({
        questionId: question._id,
        question: question.question,
        answer: item.answer.trim()
      });
    }

    await Response.create({
      name: name.trim(),
      answers: savedAnswers
    });

    res.status(201).json({
      message: "Survey submitted successfully!"
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get Total Responses
app.get("/api/survey/total", async (req, res) => {
  try {
    const total = await Response.countDocuments();
    res.json({ total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get Response Details
app.get("/api/survey/responses", async (req, res) => {
  try {
    const responses = await Response.find().sort({
      submittedAt: -1
    });
    res.json(responses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Database Connection
async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected Successfully!");

    // Replace old questions with fixed 5 questions
    await Question.deleteMany({});

    await Question.insertMany(
      sampleQuestions.map(q => ({ question: q }))
    );

    console.log("5 Fixed Questions Inserted!");

    app.listen(process.env.PORT || 5000, () => {
      console.log("Server running on port 5000");
    });

  } catch (err) {
    console.log("Database Error:", err.message);
  }
}

startServer();
