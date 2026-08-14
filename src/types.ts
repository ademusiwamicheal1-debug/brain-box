export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  category?: string;
  difficulty?: Difficulty;
}

export interface QuizPack {
  id: string;
  title: string;
  category: string;
  description: string;
  iconName: string;
  difficulty: Difficulty;
  estimatedMinutes: number;
  questions: Question[];
  isAiGenerated?: boolean;
}

export interface QuizHistoryItem {
  id: string;
  quizTitle: string;
  category: string;
  difficulty: Difficulty;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  timeSpentSeconds: number;
  date: string;
}

export interface UserStats {
  username: string;
  avatar: string;
  totalQuizzesPlayed: number;
  totalQuestionsAnswered: number;
  totalCorrectAnswers: number;
  totalScore: number;
  currentStreak: number;
  bestStreak: number;
  totalTimeSpentSeconds: number;
  categoryStats: Record<string, { played: number; correct: number }>;
  quizHistory: QuizHistoryItem[];
  unlockedBadgeIds: string[];
}

export interface LeaderboardItem {
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

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  conditionText: string;
}

export type ThemePresetId = 'high-density' | 'violet' | 'cyberpunk' | 'sunset' | 'emerald' | 'ocean' | 'monochrome';

export interface ThemeConfig {
  mode: 'light' | 'dark';
  presetId: ThemePresetId;
  primaryColor: string;
  accentColor: string;
  bgStyle: 'default' | 'gradient' | 'mesh';
}
