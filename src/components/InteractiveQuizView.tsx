import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, CheckCircle2, XCircle, AlertCircle, Sparkles, Flame, Pause, Play, ArrowRight, X } from 'lucide-react';
import { Question, QuizPack } from '../types';
import { soundEffects } from '../utils/soundEffects';

interface InteractiveQuizViewProps {
  quizPack: QuizPack;
  onFinishQuiz: (results: {
    quizTitle: string;
    category: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    accuracy: number;
    timeSpentSeconds: number;
    answers: { question: Question; selectedIndex: number | null; isCorrect: boolean; timeTakenSeconds: number }[];
  }) => void;
  onQuitQuiz: () => void;
  primaryColor: string;
}

const QUESTION_TIMER_SECONDS = 30;

export const InteractiveQuizView: React.FC<InteractiveQuizViewProps> = ({
  quizPack,
  onFinishQuiz,
  onQuitQuiz,
  primaryColor,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIMER_SECONDS);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

  // Store detailed answers history
  const [userAnswers, setUserAnswers] = useState<{
    question: Question;
    selectedIndex: number | null;
    isCorrect: boolean;
    timeTakenSeconds: number;
  }[]>([]);

  // Total quiz timer
  const [totalTimeSeconds, setTotalTimeSeconds] = useState(0);

  const currentQuestion = quizPack.questions[currentQuestionIndex];
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const totalTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Total elapsed time tracker
  useEffect(() => {
    totalTimerRef.current = setInterval(() => {
      if (!isPaused && !isAnswered) {
        setTotalTimeSeconds(prev => prev + 1);
      }
    }, 1000);
    return () => {
      if (totalTimerRef.current) clearInterval(totalTimerRef.current);
    };
  }, [isPaused, isAnswered]);

  // Question 30-second Countdown Timer
  useEffect(() => {
    if (isAnswered || isPaused) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }

        if (prev <= 10) {
          soundEffects.playTick(true);
        } else {
          soundEffects.playTick(false);
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQuestionIndex, isAnswered, isPaused]);

  const handleTimeout = () => {
    setIsAnswered(true);
    setSelectedOption(null);
    soundEffects.playWrong();
    setStreak(0);

    const timeTaken = QUESTION_TIMER_SECONDS;
    setUserAnswers(prev => [
      ...prev,
      {
        question: currentQuestion,
        selectedIndex: null,
        isCorrect: false,
        timeTakenSeconds: timeTaken,
      },
    ]);
  };

  const handleSelectOption = (optionIndex: number) => {
    if (isAnswered || isPaused) return;

    if (timerRef.current) clearInterval(timerRef.current);

    const timeTaken = QUESTION_TIMER_SECONDS - timeLeft;
    setSelectedOption(optionIndex);
    setIsAnswered(true);

    const isCorrect = optionIndex === currentQuestion.correctIndex;

    if (isCorrect) {
      soundEffects.playCorrect();
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > bestStreak) {
        setBestStreak(newStreak);
      }

      // Base score 100 + speed bonus up to 100 + streak bonus
      const speedBonus = Math.round((timeLeft / QUESTION_TIMER_SECONDS) * 100);
      const streakBonus = (newStreak - 1) * 20;
      const questionScore = 100 + speedBonus + streakBonus;
      setScore(prev => prev + questionScore);
    } else {
      soundEffects.playWrong();
      setStreak(0);
    }

    setUserAnswers(prev => [
      ...prev,
      {
        question: currentQuestion,
        selectedIndex: optionIndex,
        isCorrect,
        timeTakenSeconds: timeTaken,
      },
    ]);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < quizPack.questions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
      setTimeLeft(QUESTION_TIMER_SECONDS);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      // Quiz Completed!
      const correctCount = userAnswers.filter(a => a.isCorrect).length + (selectedOption === currentQuestion.correctIndex ? 1 : 0);
      const totalQuestions = quizPack.questions.length;
      const accuracy = Math.round((correctCount / totalQuestions) * 100);

      onFinishQuiz({
        quizTitle: quizPack.title,
        category: quizPack.category,
        difficulty: quizPack.difficulty,
        score,
        totalQuestions,
        correctAnswers: correctCount,
        accuracy,
        timeSpentSeconds: totalTimeSeconds,
        answers: userAnswers,
      });
    }
  };

  const progressPercent = ((currentQuestionIndex + 1) / quizPack.questions.length) * 100;
  const timerPercent = (timeLeft / QUESTION_TIMER_SECONDS) * 100;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-fadeIn" id="interactive-quiz-container">
      {/* Top Header Card */}
      <div className="app-surface rounded-2xl p-5 app-border border shadow-lg mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          {/* Pause / Quit buttons */}
          <div className="flex items-center gap-2">
            <button
              id="pause-quiz-button"
              onClick={() => setIsPaused(!isPaused)}
              className="p-2.5 rounded-xl app-surface-subtle app-text app-border border hover:opacity-80 transition-colors"
              title={isPaused ? 'Resume Quiz' : 'Pause Quiz'}
            >
              {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
            </button>

            <button
              id="quit-quiz-button"
              onClick={() => setShowQuitConfirm(true)}
              className="p-2.5 rounded-xl app-surface-subtle app-text-muted hover:text-rose-500 app-border border hover:bg-rose-500/10 transition-colors"
              title="Quit Quiz"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Time Remaining Bar */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase app-text-subtle font-semibold tracking-wider font-mono">Time Remaining</span>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-36 sm:w-48 h-2.5 app-surface-subtle rounded-full overflow-hidden app-border border">
                <motion.div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${timerPercent}%`,
                    backgroundColor: timeLeft <= 5 ? '#f43f5e' : primaryColor,
                  }}
                />
              </div>
              <span className={`text-sm font-mono font-bold ${timeLeft <= 5 ? 'text-rose-500 animate-pulse' : 'app-text'}`}>
                {timeLeft}s
              </span>
            </div>
          </div>

          {/* Live Score & Streak */}
          <div className="flex items-center gap-4">
            {streak >= 2 && (
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: [1, 1.15, 1] }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-500 text-xs font-bold"
              >
                <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                {streak}x Streak
              </motion.div>
            )}

            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase app-text-subtle font-semibold tracking-wider font-mono">Current Score</span>
              <span className="text-xl font-mono font-bold" style={{ color: primaryColor }}>
                {score.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-mono font-bold app-text-subtle uppercase tracking-wider">
            <span>Overall Progress</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="w-full h-2 app-surface-subtle rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: primaryColor,
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Question Card */}
      <div className="app-surface rounded-2xl p-6 sm:p-8 app-border border shadow-xl mb-6">
        {/* Category / Question count badge header */}
        <div className="flex justify-between items-center mb-6">
          <span
            className="px-3.5 py-1 text-xs font-bold rounded-full border font-mono"
            style={{
              backgroundColor: `rgba(var(--color-primary-rgb), 0.12)`,
              borderColor: `rgba(var(--color-primary-rgb), 0.25)`,
              color: primaryColor,
            }}
          >
            Question {currentQuestionIndex + 1} of {quizPack.questions.length}
          </span>
          <span className="app-text-muted text-xs italic font-medium">
            Category: {quizPack.category}
          </span>
        </div>

        {/* Question Text */}
        <h2 className="text-xl sm:text-2xl font-bold leading-snug mb-8 app-text">
          {currentQuestion.question}
        </h2>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrectAnswer = idx === currentQuestion.correctIndex;

            let buttonClass = 'app-surface-subtle app-border border hover:opacity-90 app-text';
            let badgeClass = 'app-surface app-border border app-text';

            if (isAnswered) {
              if (isCorrectAnswer) {
                buttonClass = 'border-emerald-500/50 bg-emerald-500/10';
                badgeClass = 'bg-emerald-500 text-white font-bold';
              } else if (isSelected && !isCorrectAnswer) {
                buttonClass = 'border-rose-500/50 bg-rose-500/10 animate-shake';
                badgeClass = 'bg-rose-500 text-white font-bold';
              } else {
                buttonClass = 'opacity-40 app-surface-subtle app-border border';
                badgeClass = 'app-surface-subtle app-text-subtle';
              }
            }

            return (
              <button
                key={idx}
                disabled={isAnswered}
                onClick={() => handleSelectOption(idx)}
                className={`flex items-center gap-4 p-5 rounded-xl text-left transition-all ${buttonClass}`}
              >
                <span className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-xs shrink-0 ${badgeClass}`}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="flex-1 text-sm font-semibold">{option}</span>
                {isAnswered && isCorrectAnswer && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                )}
                {isAnswered && isSelected && !isCorrectAnswer && (
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation Banner when Answered */}
        <AnimatePresence>
          {isAnswered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="p-5 rounded-xl app-surface-subtle app-border border space-y-2 mb-6"
            >
              <div className="flex items-center gap-2">
                {selectedOption === currentQuestion.correctIndex ? (
                  <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    Correct Answer (+Speed Bonus)
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-wider">
                    <AlertCircle className="w-4 h-4" />
                    {selectedOption === null ? 'Time Expired!' : 'Incorrect Choice'}
                  </div>
                )}
              </div>

              <p className="text-xs sm:text-sm app-text leading-relaxed">
                {currentQuestion.explanation}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Next Action Button */}
        {isAnswered && (
          <div className="flex justify-end">
            <button
              onClick={handleNextQuestion}
              className="px-6 py-3 rounded-xl font-bold text-sm text-white shadow-lg flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
              style={{ backgroundColor: primaryColor }}
            >
              {currentQuestionIndex + 1 === quizPack.questions.length ? 'View Final Results' : 'Next Question'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* High Density Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="app-surface rounded-2xl p-4 app-border border shadow-md">
          <span className="text-[10px] uppercase app-text-subtle font-bold tracking-wider block mb-1 font-mono">
            Global Accuracy
          </span>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold font-mono app-text">
              {userAnswers.length > 0
                ? `${Math.round((userAnswers.filter(a => a.isCorrect).length / userAnswers.length) * 100)}%`
                : '84%'}
            </span>
            <span className="text-emerald-500 text-xs font-bold pb-1 font-mono">+2.4%</span>
          </div>
          <div className="w-full h-1.5 app-surface-subtle mt-2 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                backgroundColor: primaryColor,
                width: userAnswers.length > 0
                  ? `${Math.round((userAnswers.filter(a => a.isCorrect).length / userAnswers.length) * 100)}%`
                  : '84%',
              }}
            />
          </div>
        </div>

        <div className="app-surface rounded-2xl p-4 app-border border shadow-md">
          <span className="text-[10px] uppercase app-text-subtle font-bold tracking-wider block mb-1 font-mono">
            Best Streak
          </span>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold font-mono text-orange-500">
              {Math.max(streak, bestStreak)}
            </span>
            <span className="app-text-muted text-xs font-bold pb-1">Correct</span>
          </div>
          <div className="flex gap-1 mt-2">
            <div className={`h-1 flex-1 rounded-full ${streak >= 1 ? 'bg-orange-500' : 'app-surface-subtle'}`} />
            <div className={`h-1 flex-1 rounded-full ${streak >= 2 ? 'bg-orange-500' : 'app-surface-subtle'}`} />
            <div className={`h-1 flex-1 rounded-full ${streak >= 3 ? 'bg-orange-500' : 'app-surface-subtle'}`} />
            <div className={`h-1 flex-1 rounded-full ${streak >= 5 ? 'bg-orange-500' : 'app-surface-subtle'}`} />
          </div>
        </div>

        <div className="app-surface rounded-2xl p-4 app-border border shadow-md">
          <span className="text-[10px] uppercase app-text-subtle font-bold tracking-wider block mb-1 font-mono">
            Global Rank
          </span>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold font-mono app-text">#42</span>
            <span className="app-text-muted text-xs font-bold pb-1">Top 5%</span>
          </div>
          <div className="text-[10px] mt-2 font-bold uppercase font-mono tracking-wider" style={{ color: primaryColor }}>
            Diamond League
          </div>
        </div>
      </div>

      {/* Paused Overlay Modal */}
      {isPaused && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="app-surface rounded-2xl p-8 max-w-sm w-full text-center app-border border shadow-2xl">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: `rgba(var(--color-primary-rgb), 0.15)`, color: primaryColor }}
            >
              <Pause className="w-8 h-8" />
            </div>
            <h3 className="font-extrabold text-xl mb-2 app-text">Quiz Paused</h3>
            <p className="text-xs app-text-muted mb-6">
              Take a breath! The 30s timer is frozen.
            </p>
            <button
              onClick={() => setIsPaused(false)}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
              style={{ backgroundColor: primaryColor }}
            >
              Resume Quiz
            </button>
          </div>
        </div>
      )}

      {/* Quit Confirm Modal */}
      {showQuitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="app-surface rounded-2xl p-8 max-w-sm w-full text-center app-border border shadow-2xl">
            <h3 className="font-extrabold text-xl mb-2 app-text">Quit Quiz?</h3>
            <p className="text-xs app-text-muted mb-6">
              Your progress for this attempt will be lost. Are you sure?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowQuitConfirm(false)}
                className="flex-1 py-3 rounded-xl font-bold text-xs app-surface-subtle app-text app-border border"
              >
                Keep Playing
              </button>
              <button
                onClick={onQuitQuiz}
                className="flex-1 py-3 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-500 text-white shadow-md"
              >
                Quit Quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
