
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API = "http://localhost:5000/api/survey";

const fixedQuestions = [
  "What is your favourite subject?",
  "Which programming language do you prefer?",
  "What is your career goal?",
  "How do you rate our college?",
  "Which technology interests you?"
];

function App() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [name, setName] = useState("");
  const [total, setTotal] = useState(0);
  const [responses, setResponses] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Load fixed questions and total
  const loadData = async () => {
    try {
      const q = await axios.get(`${API}/questions`);

      if (q.data.length !== 5 ||
          !fixedQuestions.every((text, i) =>
            q.data[i]?.question === text
          )) {
        setMessage("Fixed questions are not loaded correctly!");
        return;
      }

      setQuestions(q.data);

      const r = await axios.get(`${API}/total`);
      setTotal(r.data.total);
    } catch (err) {
      setMessage("Server connection failed!");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Response details
  const showResponses = async () => {
    try {
      const result = await axios.get(`${API}/responses`);
      setResponses(result.data);
      setShowDetails(true);
    } catch (err) {
      setMessage("Unable to load response details!");
    }
  };

  // Store answers
  const handleAnswer = (id, value) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  // Submit survey
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setMessage("Please enter your name!");
      return;
    }

    if (questions.length !== 5 ||
        questions.some(q => !answers[q._id]?.trim())) {
      setMessage("Please answer all 5 questions!");
      return;
    }

    try {
      setLoading(true);

      const data = questions.map(q => ({
        questionId: q._id,
        answer: answers[q._id]
      }));

      await axios.post(`${API}/submit`, {
        name,
        answers: data
      });

      setMessage("Survey submitted successfully!");
      setName("");
      setAnswers({});

      const r = await axios.get(`${API}/total`);
      setTotal(r.data.total);

      await loadData();
    } catch (err) {
      setMessage(err.response?.data?.message || "Submission failed!");
    } finally {
      setLoading(false);
    }
  };

  // Response details page
  if (showDetails) {
    return (
      <div className="container">
        <h1>Survey Response Details</h1>

        <button className="back-button"
          onClick={() => setShowDetails(false)}>
          Back to Survey
        </button>

        <h2>Total Responses: {responses.length}</h2>

        {responses.length === 0 ? (
          <p>No responses submitted yet.</p>
        ) : responses.map((r, index) => (
          <div className="response-card" key={r._id}>
            <h3>{index + 1}. {r.name}</h3>
            <p>Submitted: {new Date(r.submittedAt).toLocaleString()}</p>

            {r.answers.map((a, i) => (
              <div className="answer-detail" key={i}>
                <strong>{i + 1}. {a.question}</strong>
                <p>{a.answer}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Online Survey Application</h1>

      <form onSubmit={handleSubmit}>
        <div className="question-card">
          <h3>Enter Your Name</h3>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        {questions.map((q, index) => (
          <div className="question-card" key={q._id}>
            <h3>{index + 1}. {fixedQuestions[index]}</h3>
            <input
              type="text"
              placeholder="Enter your answer"
              value={answers[q._id] || ""}
              onChange={e => handleAnswer(q._id, e.target.value)}
            />
          </div>
        ))}

        <button type="submit"
          disabled={loading || questions.length !== 5}>
          {loading ? "Submitting..." : "Submit Survey"}
        </button>
      </form>

      {message && <p className="message">{message}</p>}

      <button className="total-card" onClick={showResponses}>
        <h2>Total Responses</h2>
        <h1>{total}</h1>
        <p>Click to view response details</p>
      </button>
    </div>
  );
}

export default App;
