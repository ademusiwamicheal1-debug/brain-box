import React, { useState, useEffect } from 'react';
import { Trophy, Crown, Filter, RefreshCw } from 'lucide-react';
import { LeaderboardItem } from '../types';
import { getLeaderboardFromFirestore } from '../lib/firebase';

interface LeaderboardViewProps {
  primaryColor: string;
}

const CATEGORY_OPTIONS = [
  'All',
  'Mathematics',
  'Further Mathematics',
  'Biology',
  'Agricultural Science',
  'Physics',
  'Chemistry',
  'English Language',
  'Literature in English',
  'Civic Education',
  'Government & Politics',
  'Fine Arts',
  'Music',
  'French',
  'Economics',
  'Commerce',
  'Financial Accounting',
  'Technology & AI',
  'Information Technology',
  'World History',
  'Geography',
  'Pop Culture',
];

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ primaryColor }) => {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch from Firestore persistent database
      const firestoreItems = await getLeaderboardFromFirestore(timeframe, categoryFilter);

      // 2. Fetch from local backend API as fallback/supplement
      const url = `/api/leaderboard?timeframe=${timeframe}&category=${encodeURIComponent(categoryFilter)}`;
      const res = await fetch(url);
      const data = await res.json();
      const apiItems = data.leaderboard || [];

      // Combine and deduplicate
      const combinedMap = new Map<string, LeaderboardItem>();
      firestoreItems.forEach(item => combinedMap.set(item.id, item));
      apiItems.forEach((item: LeaderboardItem) => {
        if (!combinedMap.has(item.id)) {
          combinedMap.set(item.id, item);
        }
      });

      const sorted = Array.from(combinedMap.values()).sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
        return a.timeSpentSeconds - b.timeSpentSeconds;
      });

      setLeaderboard(sorted);
    } catch (e) {
      console.error('Error fetching leaderboards:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [timeframe, categoryFilter]);

  // Podium positions
  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fadeIn" id="leaderboard-container">
      {/* Header */}
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full font-bold text-xs uppercase tracking-wider mb-3 border font-mono"
          style={{
            backgroundColor: `rgba(var(--color-primary-rgb), 0.12)`,
            borderColor: `rgba(var(--color-primary-rgb), 0.25)`,
            color: primaryColor,
          }}
        >
          <Trophy className="w-3.5 h-3.5 text-amber-500" /> Global Hall of Fame
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold app-text mb-2">
          Live Quiz Leaderboards
        </h1>
        <p className="text-xs sm:text-sm app-text-muted max-w-lg mx-auto">
          See who dominates the 30-second speed challenge rankings worldwide!
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="app-surface rounded-2xl p-4 app-border border shadow-md mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Timeframe Tabs */}
        <div className="flex items-center app-surface-subtle p-1 rounded-xl app-border border w-full sm:w-auto">
          {(['daily', 'weekly', 'all'] as const).map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                timeframe === tf
                  ? 'text-white font-bold shadow-sm'
                  : 'app-text-muted hover:app-text'
              }`}
              style={timeframe === tf ? { backgroundColor: primaryColor } : {}}
            >
              {tf === 'daily' ? 'Daily' : tf === 'weekly' ? 'Weekly' : 'All-Time'}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 app-text-subtle shrink-0" />
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 rounded-xl app-surface-subtle app-border border text-xs font-semibold app-text focus:outline-none"
          >
            {CATEGORY_OPTIONS.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>

          <button
            onClick={fetchLeaderboard}
            className="p-2 rounded-xl app-surface-subtle hover:opacity-80 app-text app-border border transition-colors shadow-sm"
            title="Refresh Leaderboard"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Top 3 Winners Podium */}
      {leaderboard.length >= 1 && (
        <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end mb-10 pt-4">
          {/* 2nd Place */}
          <div className="text-center order-1">
            {top2 ? (
              <div className="app-surface p-4 sm:p-5 rounded-2xl app-border border shadow-lg relative">
                <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-xl overflow-hidden ring-2 ring-slate-400 mb-2 shadow-sm">
                  <img src={top2.avatar} alt={top2.username} className="w-full h-full object-cover" />
                </div>
                <div className="inline-flex items-center justify-center w-5 h-5 rounded-md app-surface-subtle app-text-muted font-bold text-xs mb-1 font-mono app-border border">
                  02
                </div>
                <h3 className="font-bold text-xs sm:text-sm app-text truncate">
                  {top2.username}
                </h3>
                <p className="font-bold font-mono text-sm mt-1" style={{ color: primaryColor }}>
                  {top2.score.toLocaleString()} pts
                </p>
                <span className="text-[10px] app-text-subtle font-mono block">{top2.accuracy}% acc</span>
              </div>
            ) : (
              <div className="h-32 app-surface-subtle rounded-2xl border border-dashed app-border" />
            )}
          </div>

          {/* 1st Place Champion */}
          <div className="text-center order-2 -mt-4">
            {top1 ? (
              <div
                className="app-surface p-5 sm:p-7 rounded-2xl border-2 shadow-2xl relative"
                style={{ borderColor: primaryColor }}
              >
                <Crown className="w-7 h-7 text-amber-500 mx-auto mb-1 animate-bounce" />
                <div
                  className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl overflow-hidden ring-2 mb-2 shadow-lg"
                  style={{ ringColor: primaryColor }}
                >
                  <img src={top1.avatar} alt={top1.username} className="w-full h-full object-cover" />
                </div>
                <div className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-amber-500 text-slate-950 font-extrabold text-xs mb-1 font-mono">
                  01
                </div>
                <h3 className="font-extrabold text-sm sm:text-base app-text truncate">
                  {top1.username}
                </h3>
                <p className="font-bold font-mono text-lg text-amber-500 mt-1">
                  {top1.score.toLocaleString()} pts
                </p>
                <span className="text-[10px] font-mono font-bold block" style={{ color: primaryColor }}>
                  {top1.accuracy}% acc
                </span>
              </div>
            ) : (
              <div className="h-40 app-surface-subtle rounded-2xl border border-dashed app-border" />
            )}
          </div>

          {/* 3rd Place */}
          <div className="text-center order-3">
            {top3 ? (
              <div className="app-surface p-4 sm:p-5 rounded-2xl app-border border shadow-lg relative">
                <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-xl overflow-hidden ring-2 ring-amber-700/50 mb-2 shadow-sm">
                  <img src={top3.avatar} alt={top3.username} className="w-full h-full object-cover" />
                </div>
                <div className="inline-flex items-center justify-center w-5 h-5 rounded-md app-surface-subtle app-text-subtle font-bold text-xs mb-1 font-mono app-border border">
                  03
                </div>
                <h3 className="font-bold text-xs sm:text-sm app-text truncate">
                  {top3.username}
                </h3>
                <p className="font-bold font-mono text-sm mt-1" style={{ color: primaryColor }}>
                  {top3.score.toLocaleString()} pts
                </p>
                <span className="text-[10px] app-text-subtle font-mono block">{top3.accuracy}% acc</span>
              </div>
            ) : (
              <div className="h-32 app-surface-subtle rounded-2xl border border-dashed app-border" />
            )}
          </div>
        </div>
      )}

      {/* Rankings Table List */}
      <div className="app-surface rounded-2xl app-border border shadow-lg overflow-hidden">
        <div className="px-6 py-3.5 app-border border-b flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider app-text-subtle">
          <span>Rank & Player</span>
          <span>Category</span>
          <span>Accuracy</span>
          <span className="text-right">Score</span>
        </div>

        {leaderboard.length === 0 ? (
          <div className="p-12 text-center app-text-muted text-xs font-mono">
            No score records found for this filter. Be the first to claim a rank!
          </div>
        ) : (
          <div className="divide-y app-border">
            {leaderboard.map((item, index) => (
              <div
                key={item.id}
                className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-500/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 font-mono font-bold text-xs app-text-subtle text-center">
                    {index + 1 < 10 ? `0${index + 1}` : index + 1}
                  </span>
                  <img
                    src={item.avatar}
                    alt={item.username}
                    className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-400"
                  />
                  <div>
                    <h4 className="font-bold text-xs app-text">
                      {item.username}
                    </h4>
                    <span className="text-[10px] app-text-subtle font-mono">
                      {item.timeSpentSeconds}s elapsed
                    </span>
                  </div>
                </div>

                <span className="text-xs font-mono app-text-muted hidden sm:inline">
                  {item.category}
                </span>

                <span className="text-xs font-mono font-bold text-emerald-500">
                  {item.accuracy}%
                </span>

                <span className="font-mono font-bold text-sm text-right" style={{ color: primaryColor }}>
                  {item.score.toLocaleString()} <span className="text-[10px] app-text-subtle font-normal">pts</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
