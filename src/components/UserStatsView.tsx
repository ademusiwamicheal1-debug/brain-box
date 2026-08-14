import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from 'recharts';
import { Trophy, Award, Flame, Clock, CheckCircle2, Lock, HelpCircle } from 'lucide-react';
import { UserStats } from '../types';
import { BADGES } from '../data/badges';

interface UserStatsViewProps {
  userStats: UserStats;
  primaryColor: string;
}

export const UserStatsView: React.FC<UserStatsViewProps> = ({ userStats, primaryColor }) => {
  const avgAccuracy = userStats.totalQuestionsAnswered > 0
    ? Math.round((userStats.totalCorrectAnswers / userStats.totalQuestionsAnswered) * 100)
    : 0;

  // Prepare chart data for history trend
  const historyChartData = userStats.quizHistory.slice(-7).map((item, idx) => ({
    name: `Quiz ${idx + 1}`,
    score: item.score,
    accuracy: item.accuracy,
    title: item.quizTitle,
  }));

  // Prepare category breakdown chart data
  const categoryData = (Object.entries(userStats.categoryStats) as [string, { played: number; correct: number }][]).map(([cat, stat]) => ({
    category: cat.length > 12 ? `${cat.substring(0, 10)}...` : cat,
    accuracy: stat.played > 0 ? Math.round((stat.correct / stat.played) * 100) : 0,
    played: stat.played,
  }));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fadeIn" id="user-stats-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4 text-center sm:text-left">
          <img
            src={userStats.avatar}
            alt={userStats.username}
            className="w-14 h-14 rounded-2xl object-cover ring-2 shadow-lg shrink-0"
            style={{ ringColor: primaryColor }}
          />
          <div>
            <h1 className="text-2xl font-extrabold app-text">
              {userStats.username}'s Analytics
            </h1>
            <p className="text-xs app-text-muted font-mono">
              Personalized performance, streaks, history, and achievements
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <span className="px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 font-bold text-xs flex items-center gap-1.5 shadow-sm">
            <Flame className="w-3.5 h-3.5 fill-orange-500" />
            Best Streak: {userStats.bestStreak}
          </span>
          <span
            className="px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm border"
            style={{
              backgroundColor: `rgba(var(--color-primary-rgb), 0.1)`,
              borderColor: `rgba(var(--color-primary-rgb), 0.25)`,
              color: primaryColor,
            }}
          >
            <Trophy className="w-3.5 h-3.5" style={{ color: primaryColor }} />
            Total: {userStats.totalScore.toLocaleString()} pts
          </span>
        </div>
      </div>

      {/* Top Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="app-surface p-4 rounded-2xl app-border border shadow-md">
          <div className="flex items-center gap-2 app-text-subtle mb-1 font-mono">
            <HelpCircle className="w-3.5 h-3.5" style={{ color: primaryColor }} />
            <span className="text-[10px] uppercase font-bold tracking-wider">Quizzes Played</span>
          </div>
          <span className="text-2xl sm:text-3xl font-bold font-mono app-text">
            {userStats.totalQuizzesPlayed}
          </span>
        </div>

        <div className="app-surface p-4 rounded-2xl app-border border shadow-md">
          <div className="flex items-center gap-2 app-text-subtle mb-1 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Avg Accuracy</span>
          </div>
          <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-500">
            {avgAccuracy}%
          </span>
        </div>

        <div className="app-surface p-4 rounded-2xl app-border border shadow-md">
          <div className="flex items-center gap-2 app-text-subtle mb-1 font-mono">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Current Streak</span>
          </div>
          <span className="text-2xl sm:text-3xl font-bold font-mono text-orange-500">
            {userStats.currentStreak}
          </span>
        </div>

        <div className="app-surface p-4 rounded-2xl app-border border shadow-md">
          <div className="flex items-center gap-2 app-text-subtle mb-1 font-mono">
            <Clock className="w-3.5 h-3.5" style={{ color: primaryColor }} />
            <span className="text-[10px] uppercase font-bold tracking-wider">Time Spent</span>
          </div>
          <span className="text-2xl sm:text-3xl font-bold font-mono" style={{ color: primaryColor }}>
            {Math.round(userStats.totalTimeSpentSeconds / 60)}m
          </span>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Score History Line Chart */}
        <div className="app-surface p-5 rounded-2xl app-border border shadow-md">
          <h3 className="font-bold text-sm app-text mb-4 font-mono uppercase tracking-wider">
            Recent Quiz Score Progression
          </h3>

          {historyChartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center app-text-muted text-xs font-mono">
              Play a quiz to unlock your score progression trend chart!
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#64748b" opacity={0.2} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--app-surface)',
                      borderRadius: '12px',
                      border: '1px solid var(--app-border)',
                      color: 'var(--app-text)',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke={primaryColor}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: primaryColor }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Category Performance Bar Chart */}
        <div className="app-surface p-5 rounded-2xl app-border border shadow-md">
          <h3 className="font-bold text-sm app-text mb-4 font-mono uppercase tracking-wider">
            Category Mastery Accuracy (%)
          </h3>

          {categoryData.length === 0 ? (
            <div className="h-64 flex items-center justify-center app-text-muted text-xs font-mono">
              Complete quizzes across different categories to see your mastery map!
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#64748b" opacity={0.2} />
                  <XAxis dataKey="category" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--app-surface)',
                      borderRadius: '12px',
                      border: '1px solid var(--app-border)',
                      color: 'var(--app-text)',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                    }}
                  />
                  <Bar dataKey="accuracy" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Badges & Achievements */}
      <div className="app-surface rounded-2xl p-5 app-border border shadow-md mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-sm app-text uppercase font-mono tracking-wider">
              Unlocked Badges & Achievements
            </h3>
          </div>
          <span className="text-xs font-mono font-bold" style={{ color: primaryColor }}>
            {userStats.unlockedBadgeIds.length} / {BADGES.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {BADGES.map(badge => {
            const isUnlocked = userStats.unlockedBadgeIds.includes(badge.id);
            return (
              <div
                key={badge.id}
                className={`p-3.5 rounded-xl border text-center transition-all ${
                  isUnlocked
                    ? 'border-indigo-500/40 bg-indigo-500/10'
                    : 'app-surface-subtle app-border border opacity-50'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center text-white ${
                    isUnlocked ? 'shadow-md' : 'app-surface app-text-subtle'
                  }`}
                  style={isUnlocked ? { backgroundColor: primaryColor } : {}}
                >
                  {isUnlocked ? <Award className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                </div>

                <h4 className="font-bold text-xs app-text mb-1">
                  {badge.title}
                </h4>
                <p className="text-[10px] app-text-muted line-clamp-2 leading-tight">
                  {badge.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent History Log */}
      <div className="app-surface rounded-2xl p-5 app-border border shadow-md">
        <h3 className="font-bold text-sm app-text mb-4 uppercase font-mono tracking-wider">
          Recent Attempt History
        </h3>

        {userStats.quizHistory.length === 0 ? (
          <p className="text-xs font-mono app-text-subtle py-6 text-center">
            No past quiz attempts recorded yet.
          </p>
        ) : (
          <div className="divide-y app-border">
            {userStats.quizHistory.slice(-10).reverse().map(item => (
              <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold app-text">
                    {item.quizTitle}
                  </h4>
                  <span className="text-[10px] app-text-subtle font-mono">
                    {item.category} • {item.date}
                  </span>
                </div>

                <div className="text-right font-mono">
                  <span className="font-bold text-sm block" style={{ color: primaryColor }}>
                    {item.score.toLocaleString()} pts
                  </span>
                  <span className="text-[10px] app-text-muted">
                    {item.accuracy}% acc
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
