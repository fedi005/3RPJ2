const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mysql = require("mysql2/promise");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.json());

const dbConfig = {
  host: process.env.MYSQL_HOST || "db",
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASSWORD || "root",
  database: process.env.MYSQL_DATABASE || "gaming"
};

let pool;
const quizQuestions = [
  { id: 1, q: "Quel est le moteur de templates de Vue 3 ?", answers: ["JSX", "No template", "Vue compiler"], correct: 2 },
  { id: 2, q: "Socket.io fonctionne sur la couche", answers: ["HTTP", "WebSocket"], correct: 1 },
  { id: 3, q: "MySQL est un SGBD", answers: ["NoSQL", "SQL"], correct: 1 }
];

async function initDb() {
  pool = mysql.createPool({ ...dbConfig, waitForConnections: true, connectionLimit: 10 });

  await pool.query(`CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    author VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB`);

  await pool.query(`CREATE TABLE IF NOT EXISTS quiz_scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    player VARCHAR(100) NOT NULL,
    score INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB`);

  console.log("MySQL OK : tables messages + quiz_scores créées");
}

app.get("/", (req, res) => {
  res.send("Backend OK");
});

app.get("/api/messages", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM messages ORDER BY created_at DESC LIMIT 100");
  res.json(rows.reverse());
});

app.get("/api/leaderboard", async (req, res) => {
  const [rows] = await pool.query("SELECT player, MAX(score) AS bestScore FROM quiz_scores GROUP BY player ORDER BY bestScore DESC LIMIT 10");
  res.json(rows);
});

io.on("connection", (socket) => {
  console.log("Socket connecté", socket.id);

  socket.on("chat:message", async (payload) => {
    const { author, content } = payload;
    if (!author || !content) return;

    await pool.query("INSERT INTO messages (author, content) VALUES (?, ?)", [author, content]);
    io.emit("chat:message", { author, content, created_at: new Date() });
  });

  socket.on("quiz:answer", async ({ player, questionId, answerIndex }) => {
    const question = quizQuestions.find((q) => q.id === questionId);
    if (!question) return;

    const correct = question.correct === answerIndex;
    const points = correct ? 1 : 0;

    await pool.query("INSERT INTO quiz_scores (player, score) VALUES (?, ?)", [player, points]);

    io.emit("quiz:result", {
      player,
      questionId,
      correct,
      points
    });
  });

  socket.on("disconnect", () => {
    console.log("Socket déconnecté", socket.id);
  });
});

const PORT = process.env.PORT || 3000;

initDb().then(() => {
  server.listen(PORT, () => {
    console.log(`Serveur lancé sur le port ${PORT}`);
  });
}).catch((err) => {
  console.error("Erreur init DB", err);
  process.exit(1);
});