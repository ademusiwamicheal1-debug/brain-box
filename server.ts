import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "5mb" }));

// In-memory persistent storage for global leaderboards across server restarts during dev
interface LeaderboardEntry {
  id: string;
  username: string;
  avatar: string;
  score: number;
  accuracy: number;
  timeSpentSeconds: number;
  category: string;
  difficulty: string;
  createdAt: string;
}

// Initial mock leaderboard records for initial vibrant leaderboard display
let globalLeaderboard: LeaderboardEntry[] = [
  {
    id: "lb-1",
    username: "QuizMaster_Alex",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
    score: 980,
    accuracy: 100,
    timeSpentSeconds: 112,
    category: "Science & Nature",
    difficulty: "Hard",
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "lb-2",
    username: "CyberSamurai",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
    score: 910,
    accuracy: 90,
    timeSpentSeconds: 125,
    category: "Technology & AI",
    difficulty: "Medium",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "lb-3",
    username: "Elena_Brainwave",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
    score: 880,
    accuracy: 90,
    timeSpentSeconds: 140,
    category: "World History",
    difficulty: "Hard",
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: "lb-4",
    username: "SpeedyRider",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
    score: 820,
    accuracy: 80,
    timeSpentSeconds: 98,
    category: "Pop Culture",
    difficulty: "Easy",
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
  },
  {
    id: "lb-5",
    username: "NovaTrivia",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80",
    score: 790,
    accuracy: 80,
    timeSpentSeconds: 130,
    category: "Geography",
    difficulty: "Medium",
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
  },
];

// Initialize Gemini Client
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// GET Leaderboards
app.get("/api/leaderboard", (req, res) => {
  const timeframe = (req.query.timeframe as string) || "all"; // 'daily', 'weekly', 'all'
  const category = req.query.category as string;

  let filtered = [...globalLeaderboard];

  const now = Date.now();
  if (timeframe === "daily") {
    const oneDay = 24 * 60 * 60 * 1000;
    filtered = filtered.filter(entry => now - new Date(entry.createdAt).getTime() <= oneDay);
  } else if (timeframe === "weekly") {
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    filtered = filtered.filter(entry => now - new Date(entry.createdAt).getTime() <= oneWeek);
  }

  if (category && category !== "All") {
    filtered = filtered.filter(entry => entry.category === category);
  }

  // Sort descending by score, then accuracy, then ascending time
  filtered.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
    return a.timeSpentSeconds - b.timeSpentSeconds;
  });

  res.json({ leaderboard: filtered.slice(0, 50) });
});

// POST Leaderboard score entry
app.post("/api/leaderboard", (req, res) => {
  const { username, avatar, score, accuracy, timeSpentSeconds, category, difficulty } = req.body;

  if (!username || typeof score !== "number") {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const newEntry: LeaderboardEntry = {
    id: `lb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    username: username || "Anonymous Quizzer",
    avatar: avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
    score: Math.round(score),
    accuracy: Math.round(accuracy || 0),
    timeSpentSeconds: Math.round(timeSpentSeconds || 0),
    category: category || "General Knowledge",
    difficulty: difficulty || "Medium",
    createdAt: new Date().toISOString(),
  };

  globalLeaderboard.push(newEntry);
  res.json({ success: true, entry: newEntry });
});

// POST AI Quiz Generator
app.post("/api/generate-quiz", async (req, res) => {
  const { topic, difficulty = "Medium", questionCount = 5 } = req.body;

  if (!topic || typeof topic !== "string") {
    res.status(400).json({ error: "Please provide a valid quiz topic." });
    return;
  }

  const ai = getGeminiClient();
  if (!ai) {
    res.status(500).json({
      error: "Gemini API key is not configured on the server. Please check environment configuration.",
    });
    return;
  }

  try {
    const prompt = `Generate a high-quality ${questionCount}-question multiple choice quiz on the topic: "${topic}".
Difficulty level: ${difficulty}.
Ensure the questions are interesting, clear, educational, and accurate. Each question must have exactly 4 options.
Include a detailed, helpful explanation for the correct answer.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction:
          "You are an expert quiz designer. Generate creative, engaging, accurate trivia questions with 4 distractor options and 1 correct answer index (0-based: 0, 1, 2, or 3).",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Catchy title for the quiz" },
            description: { type: Type.STRING, description: "Short description of what the quiz covers" },
            category: { type: Type.STRING, description: "Inferred category or custom topic" },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING, description: "The question text" },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Array of exactly 4 choices",
                  },
                  correctIndex: { type: Type.INTEGER, description: "0-based index of the correct answer" },
                  explanation: { type: Type.STRING, description: "Short educational explanation of why it is correct" },
                },
                required: ["question", "options", "correctIndex", "explanation"],
              },
            },
          },
          required: ["title", "description", "category", "questions"],
        },
      },
    });

    const jsonText = response.text?.trim() || "";
    const quizData = JSON.parse(jsonText);

    res.json({ success: true, quiz: quizData });
  } catch (error: any) {
    console.error("Error generating quiz with Gemini:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI quiz." });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Quiz Arena Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
