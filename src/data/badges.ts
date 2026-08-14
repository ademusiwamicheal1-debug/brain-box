import { Badge } from '../types';

export const BADGES: Badge[] = [
  {
    id: 'badge-first-quiz',
    title: 'Quiz Debut',
    description: 'Completed your first quiz challenge!',
    icon: 'Sparkles',
    conditionText: 'Complete 1 quiz',
  },
  {
    id: 'badge-perfect-score',
    title: 'Perfectionist',
    description: 'Achieved 100% accuracy on a quiz!',
    icon: 'Award',
    conditionText: 'Score 100% accuracy on any quiz',
  },
  {
    id: 'badge-speed-demon',
    title: 'Speed Demon',
    description: 'Answered a question in under 5 seconds with a speed bonus!',
    icon: 'Zap',
    conditionText: 'Answer in < 5 seconds',
  },
  {
    id: 'badge-streak-master',
    title: 'Streak Legend',
    description: 'Maintained a 5-question answer streak without missing a beat.',
    icon: 'Flame',
    conditionText: 'Reach a streak of 5',
  },
  {
    id: 'badge-ai-pioneer',
    title: 'AI Adventurer',
    description: 'Generated and completed a custom AI Quiz with Gemini.',
    icon: 'Bot',
    conditionText: 'Complete 1 AI Generated Quiz',
  },
  {
    id: 'badge-trivia-scholar',
    title: 'Trivia Scholar',
    description: 'Completed at least 5 different quiz challenges.',
    icon: 'GraduationCap',
    conditionText: 'Complete 5 total quizzes',
  },
  {
    id: 'badge-high-scorer',
    title: 'Century Club',
    description: 'Accumulated over 1,000 total career points.',
    icon: 'Trophy',
    conditionText: 'Reach 1,000 total points',
  },
  {
    id: 'badge-night-owl',
    title: 'Night Owl Quizzer',
    description: 'Answered quizzes with razor-sharp precision.',
    icon: 'Moon',
    conditionText: 'Complete a quiz with >80% score',
  },
];
