import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Share2, Twitter, Copy, Download, Check, RotateCcw, ArrowRight, CheckCircle2, XCircle, Send } from 'lucide-react';
import { Question, UserStats } from '../types';
import { User as FirebaseUser } from 'firebase/auth';

interface QuizResultsViewProps {
  results: {
    quizTitle: string;
    category: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    accuracy: number;
    timeSpentSeconds: number;
    answers: { question: Question; selectedIndex: number | null; isCorrect: boolean; timeTakenSeconds: number }[];
  };
  userStats: UserStats;
  currentUser?: FirebaseUser | null;
  onGoogleSignIn?: () => void;
  onPlayAgain: () => void;
  onExploreMore: () => void;
  onSubmitLeaderboardScore: (scoreData: {
    username: string;
    avatar: string;
    score: number;
    accuracy: number;
    timeSpentSeconds: number;
    category: string;
    difficulty: string;
  }) => Promise<void>;
  primaryColor: string;
}

export const QuizResultsView: React.FC<QuizResultsViewProps> = ({
  results,
  userStats,
  currentUser,
  onGoogleSignIn,
  onPlayAgain,
  onExploreMore,
  onSubmitLeaderboardScore,
  primaryColor,
}) => {
  const [hasSubmittedScore, setHasSubmittedScore] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [badgeDownloaded, setBadgeDownloaded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Trigger confetti on mount
  useEffect(() => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }
  }, []);

  // Generate Score Badge Image on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 340;

    // Background Gradient
    const grad = ctx.createLinearGradient(0, 0, 600, 340);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 340);

    // Decorative circle
    ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
    ctx.beginPath();
    ctx.arc(520, 60, 140, 0, Math.PI * 2);
    ctx.fill();

    // Border line
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, 580, 320);

    // Header Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('QUIZ ARENA • OFFICIAL SCORE BADGE', 40, 50);

    // Quiz title
    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px monospace';
    ctx.fillText(`Subject: ${results.quizTitle}`, 40, 85);

    // Player info
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`Player: ${userStats.username}`, 40, 130);

    // Big Score
    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 52px monospace';
    ctx.fillText(`${results.score.toLocaleString()} PTS`, 40, 195);

    // Metrics grid
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '15px monospace';
    ctx.fillText(`Accuracy: ${results.accuracy}%`, 40, 245);
    ctx.fillText(`Correct: ${results.correctAnswers}/${results.totalQuestions}`, 230, 245);
    ctx.fillText(`Time: ${results.timeSpentSeconds}s`, 420, 245);

    // Watermark
    ctx.fillStyle = '#64748b';
    ctx.font = '12px sans-serif';
    ctx.fillText('Verified on Quiz Arena Rapid-Fire Live Platform', 40, 300);
  }, [results, userStats, primaryColor]);

  const handleDownloadBadge = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `quiz-arena-score-${Date.now()}.png`;
    a.click();
    setBadgeDownloaded(true);
    setTimeout(() => setBadgeDownloaded(false), 3000);
  };

  const handleShareTwitter = () => {
    const tweetText = `I just scored ${results.score} points with ${results.accuracy}% accuracy in "${results.quizTitle}" on Quiz Arena! 🏆\nCan you beat my score? #QuizArena #Trivia`;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(shareUrl, '_blank');
  };

  const handleCopyShareLink = () => {
    const text = `I scored ${results.score} pts (${results.accuracy}% accuracy) on Quiz Arena! Check it out: ${window.location.href}`;
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Quiz Arena Score',
          text: `I scored ${results.score} pts with ${results.accuracy}% accuracy on "${results.quizTitle}"!`,
          url: window.location.href,
        });
      } catch (err) {
        // user cancelled
      }
    } else {
      handleCopyShareLink();
    }
  };

  const handleLeaderboardSubmit = async () => {
    if (hasSubmittedScore || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmitLeaderboardScore({
        username: userStats.username,
        avatar: userStats.avatar,
        score: results.score,
        accuracy: results.accuracy,
        timeSpentSeconds: results.timeSpentSeconds,
        category: results.category,
        difficulty: results.difficulty,
      });
      setHasSubmittedScore(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fadeIn" id="quiz-results-container">
      {/* Celebration Header */}
      <div className="text-center mb-8">
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center text-white shadow-xl animate-bounce"
          style={{ backgroundColor: primaryColor }}
        >
          <Trophy className="w-8 h-8" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold app-text mb-2">
          Quiz Challenge Completed!
        </h1>
        <p className="text-xs font-mono app-text-muted">
          Awesome work, <span className="app-text font-bold">{userStats.username}</span>! Here is your performance overview.
        </p>
      </div>

      {/* Main Score Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 font-mono">
        <div className="app-surface p-4 rounded-2xl app-border border text-center shadow-md">
          <span className="text-[10px] font-bold uppercase tracking-wider app-text-subtle block mb-1">
            Total Points
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-emerald-500">
            {results.score.toLocaleString()}
          </span>
        </div>

        <div className="app-surface p-4 rounded-2xl app-border border text-center shadow-md">
          <span className="text-[10px] font-bold uppercase tracking-wider app-text-subtle block mb-1">
            Accuracy
          </span>
          <span className="text-2xl sm:text-3xl font-bold" style={{ color: primaryColor }}>
            {results.accuracy}%
          </span>
        </div>

        <div className="app-surface p-4 rounded-2xl app-border border text-center shadow-md">
          <span className="text-[10px] font-bold uppercase tracking-wider app-text-subtle block mb-1">
            Correct Answers
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-sky-500">
            {results.correctAnswers} / {results.totalQuestions}
          </span>
        </div>

        <div className="app-surface p-4 rounded-2xl app-border border text-center shadow-md">
          <span className="text-[10px] font-bold uppercase tracking-wider app-text-subtle block mb-1">
            Time Spent
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-orange-500">
            {results.timeSpentSeconds}s
          </span>
        </div>
      </div>

      {/* Leaderboard Submit Callout */}
      <div className="app-surface rounded-2xl p-5 app-border border text-white shadow-xl mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 text-center sm:text-left">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
            style={{
              backgroundColor: `rgba(var(--color-primary-rgb), 0.15)`,
              borderColor: `rgba(var(--color-primary-rgb), 0.3)`,
            }}
          >
            <Trophy className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="font-bold text-sm app-text">Claim Your Rank on Global Leaderboard</h3>
            <p className="text-xs app-text-muted font-mono mt-0.5">
              Submit your score of {results.score} pts to compete against players worldwide!
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {!currentUser && onGoogleSignIn && (
            <button
              onClick={onGoogleSignIn}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-white hover:bg-slate-50 text-slate-900 shadow-md transition-colors flex items-center gap-2 border border-slate-200"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          )}

          <button
            onClick={handleLeaderboardSubmit}
            disabled={hasSubmittedScore || isSubmitting}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 ${
              hasSubmittedScore
                ? 'bg-emerald-600 text-white cursor-default'
                : 'text-white hover:opacity-90 active:scale-95'
            }`}
            style={!hasSubmittedScore ? { backgroundColor: primaryColor } : {}}
          >
            {hasSubmittedScore ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Score Posted!
              </>
            ) : isSubmitting ? (
              'Submitting...'
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                Post to Leaderboard
              </>
            )}
          </button>
        </div>
      </div>

      {/* Social Media Share Badge Section */}
      <div className="app-surface rounded-2xl p-5 app-border border shadow-xl mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4" style={{ color: primaryColor }} />
            <h3 className="font-bold text-sm app-text uppercase font-mono tracking-wider">
              Score Share Badge
            </h3>
          </div>
          <span className="text-[10px] font-mono font-bold app-text-subtle uppercase tracking-wider">
            Share & Challenge Friends
          </span>
        </div>

        {/* Canvas rendered for badge */}
        <div className="rounded-xl overflow-hidden mb-5 app-border border app-surface-subtle flex justify-center p-2">
          <canvas ref={canvasRef} className="w-full max-w-xl h-auto rounded-lg shadow-sm" />
        </div>

        {/* Share Actions Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={handleDownloadBadge}
            className="py-2.5 px-3 rounded-xl app-surface-subtle app-text app-border border hover:opacity-80 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            {badgeDownloaded ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Download className="w-3.5 h-3.5" />}
            {badgeDownloaded ? 'Saved!' : 'Download Badge'}
          </button>

          <button
            onClick={handleShareTwitter}
            className="py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 font-bold text-xs text-white flex items-center justify-center gap-2 transition-colors shadow-md"
          >
            <Twitter className="w-3.5 h-3.5 fill-current" />
            Share on X
          </button>

          <button
            onClick={handleCopyShareLink}
            className="py-2.5 px-3 rounded-xl app-surface-subtle app-text app-border border hover:opacity-80 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedLink ? 'Copied!' : 'Copy Link'}
          </button>

          <button
            onClick={handleNativeShare}
            className="py-2.5 px-3 rounded-xl font-bold text-xs text-white shadow-md flex items-center justify-center gap-2 transition-all hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
          >
            <Share2 className="w-3.5 h-3.5" />
            Share App
          </button>
        </div>
      </div>

      {/* Detailed Question Review */}
      <div className="app-surface rounded-2xl p-5 app-border border shadow-xl mb-8">
        <h3 className="font-bold text-sm app-text mb-5 uppercase font-mono tracking-wider">
          Question Review & Explanations
        </h3>

        <div className="space-y-4">
          {results.answers.map((item, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border ${
                item.isCorrect
                  ? 'border-emerald-500/30 bg-emerald-500/10'
                  : 'border-rose-500/30 bg-rose-500/10'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg app-surface app-text font-mono font-bold text-xs flex items-center justify-center app-border border">
                    {idx + 1}
                  </span>
                  <h4 className="font-bold text-xs sm:text-sm app-text">
                    {item.question.question}
                  </h4>
                </div>

                {item.isCorrect ? (
                  <span className="flex items-center gap-1 text-xs font-mono font-bold text-emerald-500 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-mono font-bold text-rose-500 shrink-0">
                    <XCircle className="w-3.5 h-3.5" /> Incorrect
                  </span>
                )}
              </div>

              {/* Options breakdown */}
              <div className="text-xs font-mono space-y-1 mb-3 pl-8">
                <div>
                  <span className="app-text-muted">Your choice: </span>
                  <span className={`font-bold ${item.isCorrect ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {item.selectedIndex !== null ? item.question.options[item.selectedIndex] : 'Time Expired'}
                  </span>
                </div>
                {!item.isCorrect && (
                  <div>
                    <span className="app-text-muted">Correct answer: </span>
                    <span className="font-bold text-emerald-500">
                      {item.question.options[item.question.correctIndex]}
                    </span>
                  </div>
                )}
              </div>

              {/* Explanation */}
              <p className="text-xs app-text app-surface p-3 rounded-lg app-border border leading-relaxed font-sans pl-4">
                {item.question.explanation}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onPlayAgain}
          className="flex-1 py-3.5 rounded-xl font-bold text-xs app-surface-subtle app-text app-border border hover:opacity-80 flex items-center justify-center gap-2 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Play Again
        </button>

        <button
          onClick={onExploreMore}
          className="flex-1 py-3.5 rounded-xl font-bold text-xs text-white shadow-md flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95"
          style={{ backgroundColor: primaryColor }}
        >
          Explore More Quizzes
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
