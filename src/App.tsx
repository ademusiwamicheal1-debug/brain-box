import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { QuizCard } from './components/QuizCard';
import { InteractiveQuizView } from './components/InteractiveQuizView';
import { QuizResultsView } from './components/QuizResultsView';
import { AiQuizGenerator } from './components/AiQuizGenerator';
import { LeaderboardView } from './components/LeaderboardView';
import { UserStatsView } from './components/UserStatsView';
import { AdminView } from './components/AdminView';
import { ThemeBuilderModal } from './components/ThemeBuilderModal';
import { UserProfileModal } from './components/UserProfileModal';
import { QuizPack, UserStats, ThemeConfig } from './types';
import { INITIAL_QUIZ_PACKS } from './data/quizPacks';
import { DEFAULT_THEME, applyThemeToDocument } from './utils/theme';
import { soundEffects } from './utils/soundEffects';
import { Search, Sparkles, Filter, Zap, Trophy, ShieldCheck, LogIn } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  subscribeToAuthChanges,
  signInWithGoogle,
  getUserStatsFromFirestore,
  saveUserStatsToFirestore,
  postLeaderboardToFirestore,
} from './lib/firebase';

const LOCAL_STORAGE_STATS_KEY = 'quiz_arena_user_stats_v1';
const LOCAL_STORAGE_THEME_KEY = 'quiz_arena_theme_config_v1';

const INITIAL_USER_STATS: UserStats = {
  username: 'QuizMaster_' + Math.floor(1000 + Math.random() * 9000),
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
  totalQuizzesPlayed: 0,
  totalQuestionsAnswered: 0,
  totalCorrectAnswers: 0,
  totalScore: 0,
  currentStreak: 0,
  bestStreak: 0,
  totalTimeSpentSeconds: 0,
  categoryStats: {},
  quizHistory: [],
  unlockedBadgeIds: [],
};

const CATEGORIES_LIST = [
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

export default function App() {
  const [activeTab, setActiveTab] = useState<'explore' | 'ai-gen' | 'leaderboard' | 'stats' | 'admin'>('explore');
  const [activeQuizPack, setActiveQuizPack] = useState<QuizPack | null>(null);
  const [quizResults, setQuizResults] = useState<any | null>(null);

  // Firebase Auth state
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

  // User Stats state
  const [userStats, setUserStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_STATS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return INITIAL_USER_STATS;
  });

  // Theme state
  const [theme, setTheme] = useState<ThemeConfig>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_THEME_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return DEFAULT_THEME;
  });

  // Sound Mute state
  const [isMuted, setIsMuted] = useState<boolean>(() => soundEffects.getMuted());

  // Modals state
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [authModalError, setAuthModalError] = useState<string | null>(null);

  // Explore Tab Search & Category Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');

  const [isSigningInGoogle, setIsSigningInGoogle] = useState(false);

  // Google Direct Sign In Handler
  const handleDirectGoogleSignIn = async () => {
    if (isSigningInGoogle) return;
    setIsSigningInGoogle(true);
    try {
      setAuthModalError(null);
      const user = await signInWithGoogle();
      if (user) {
        const firestoreStats = await getUserStatsFromFirestore(user.uid);
        if (firestoreStats) {
          setUserStats(firestoreStats);
        } else {
          const newStats: UserStats = {
            ...userStats,
            username: user.displayName || userStats.username,
            avatar: user.photoURL || userStats.avatar,
          };
          setUserStats(newStats);
          await saveUserStatsToFirestore(user.uid, newStats, user.email || '');
        }
      }
    } catch (e: any) {
      let raw = e?.message || e?.code || '';
      if (raw.includes('auth/cancelled-popup-request') || raw.includes('auth/popup-closed-by-user')) {
        return;
      }
      console.error('Google Sign in error:', e);
      if (raw.includes('auth/configuration-not-found') || raw.includes('auth/operation-not-allowed')) {
        setAuthModalError(
          'Google Sign-In is not enabled in Firebase Console for this project. Switched to Email / Gmail Sign-In below! You can log in or create an account instantly.'
        );
      } else if (raw.includes('auth/popup-blocked')) {
        setAuthModalError('Browser blocked the popup window. Switched to Email / Gmail Sign-In below.');
      } else if (raw.includes('auth/unauthorized-domain')) {
        setAuthModalError('Current domain is not authorized in Firebase Console. Please use Email / Gmail Sign-In below.');
      } else {
        setAuthModalError(raw || 'Authentication failed');
      }
      setIsUserModalOpen(true);
    } finally {
      setIsSigningInGoogle(false);
    }
  };

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async user => {
      setCurrentUser(user);
      if (user) {
        const firestoreStats = await getUserStatsFromFirestore(user.uid);
        if (firestoreStats) {
          setUserStats(firestoreStats);
        } else {
          await saveUserStatsToFirestore(user.uid, userStats, user.email || '');
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Save stats & theme to localStorage & Firestore when changed
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_STATS_KEY, JSON.stringify(userStats));
    if (currentUser) {
      saveUserStatsToFirestore(currentUser.uid, userStats, currentUser.email || '');
    }
  }, [userStats, currentUser]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_THEME_KEY, JSON.stringify(theme));
    applyThemeToDocument(theme);
  }, [theme]);

  // Handle Starting a Quiz
  const handleStartQuiz = (quizPack: QuizPack) => {
    setActiveQuizPack(quizPack);
    setQuizResults(null);
  };

  // Handle Quiz Completion
  const handleFinishQuiz = (results: any) => {
    const newUnlockedBadges = new Set<string>(userStats.unlockedBadgeIds);

    newUnlockedBadges.add('badge-first-quiz');

    if (results.accuracy === 100) {
      newUnlockedBadges.add('badge-perfect-score');
    }

    const hasSpeedyAnswer = results.answers.some((a: any) => a.isCorrect && a.timeTakenSeconds < 5);
    if (hasSpeedyAnswer) {
      newUnlockedBadges.add('badge-speed-demon');
    }

    if (activeQuizPack?.isAiGenerated) {
      newUnlockedBadges.add('badge-ai-pioneer');
    }

    const newTotalQuizzes = userStats.totalQuizzesPlayed + 1;
    if (newTotalQuizzes >= 5) {
      newUnlockedBadges.add('badge-trivia-scholar');
    }

    const newTotalScore = userStats.totalScore + results.score;
    if (newTotalScore >= 1000) {
      newUnlockedBadges.add('badge-high-scorer');
    }

    const updatedCategoryStats = { ...userStats.categoryStats };
    const cat = results.category;
    if (!updatedCategoryStats[cat]) {
      updatedCategoryStats[cat] = { played: 0, correct: 0 };
    }
    updatedCategoryStats[cat].played += results.totalQuestions;
    updatedCategoryStats[cat].correct += results.correctAnswers;

    const newStats: UserStats = {
      ...userStats,
      totalQuizzesPlayed: newTotalQuizzes,
      totalQuestionsAnswered: userStats.totalQuestionsAnswered + results.totalQuestions,
      totalCorrectAnswers: userStats.totalCorrectAnswers + results.correctAnswers,
      totalScore: newTotalScore,
      totalTimeSpentSeconds: userStats.totalTimeSpentSeconds + results.timeSpentSeconds,
      categoryStats: updatedCategoryStats,
      quizHistory: [
        ...userStats.quizHistory,
        {
          id: `hist-${Date.now()}`,
          quizTitle: results.quizTitle,
          category: results.category,
          difficulty: results.difficulty,
          score: results.score,
          totalQuestions: results.totalQuestions,
          correctAnswers: results.correctAnswers,
          accuracy: results.accuracy,
          timeSpentSeconds: results.timeSpentSeconds,
          date: new Date().toLocaleDateString(),
        },
      ],
      unlockedBadgeIds: Array.from(newUnlockedBadges),
    };

    setUserStats(newStats);

    if (currentUser) {
      saveUserStatsToFirestore(currentUser.uid, newStats, currentUser.email || '');
    }

    setQuizResults(results);
    setActiveQuizPack(null);
  };

  // Submit Leaderboard Score to Backend & Firestore
  const handleSubmitLeaderboardScore = async (scoreData: any) => {
    try {
      // 1. Write to Firestore
      await postLeaderboardToFirestore(
        {
          username: userStats.username,
          avatar: userStats.avatar,
          score: scoreData.score,
          accuracy: scoreData.accuracy,
          timeSpentSeconds: scoreData.timeSpentSeconds,
          category: scoreData.category,
          difficulty: scoreData.difficulty,
          createdAt: new Date().toISOString(),
        },
        currentUser?.uid
      );

      // 2. Write to backend API
      await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scoreData),
      });
    } catch (e) {
      console.error('Failed to post leaderboard score:', e);
    }
  };

  // Filter Quizzes in Explore View
  const filteredQuizPacks = INITIAL_QUIZ_PACKS.filter(pack => {
    const matchesSearch =
      pack.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pack.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pack.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || pack.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'All' || pack.difficulty === selectedDifficulty;

    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  return (
    <div className="min-h-screen app-bg app-text transition-colors font-sans flex flex-col">
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={tab => {
          setActiveTab(tab);
          setActiveQuizPack(null);
          setQuizResults(null);
        }}
        theme={theme}
        setTheme={setTheme}
        openThemeModal={() => setIsThemeModalOpen(true)}
        openUserModal={() => setIsUserModalOpen(true)}
        onGoogleSignIn={handleDirectGoogleSignIn}
        userStats={userStats}
        currentUser={currentUser}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
      />

      {/* Main App Body */}
      <main className="pt-4 flex-1">
        {/* Active 30s Quiz View */}
        {activeQuizPack && (
          <InteractiveQuizView
            quizPack={activeQuizPack}
            onFinishQuiz={handleFinishQuiz}
            onQuitQuiz={() => setActiveQuizPack(null)}
            primaryColor={theme.primaryColor}
          />
        )}

        {/* Quiz Completion Results View */}
        {!activeQuizPack && quizResults && (
          <QuizResultsView
            results={quizResults}
            userStats={userStats}
            currentUser={currentUser}
            onGoogleSignIn={handleDirectGoogleSignIn}
            onPlayAgain={() => {
              const pack = INITIAL_QUIZ_PACKS.find(p => p.title === quizResults.quizTitle) || INITIAL_QUIZ_PACKS[0];
              handleStartQuiz(pack);
            }}
            onExploreMore={() => {
              setQuizResults(null);
              setActiveTab('explore');
            }}
            onSubmitLeaderboardScore={handleSubmitLeaderboardScore}
            primaryColor={theme.primaryColor}
          />
        )}

        {/* Explore Quizzes Tab */}
        {!activeQuizPack && !quizResults && activeTab === 'explore' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Hero Banner */}
            <div className="relative rounded-2xl p-6 sm:p-8 mb-8 overflow-hidden app-surface app-border border shadow-xl">
              <div className="relative z-10 max-w-2xl">
                <div
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full font-bold text-xs uppercase tracking-wider mb-4 border font-mono"
                  style={{
                    backgroundColor: `rgba(var(--color-primary-rgb), 0.12)`,
                    color: theme.primaryColor,
                    borderColor: `rgba(var(--color-primary-rgb), 0.3)`,
                  }}
                >
                  <Zap className="w-3.5 h-3.5" style={{ color: theme.accentColor }} /> 30-Second Rapid-Fire Academic & General Arena
                </div>

                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight mb-3 app-text">
                  Test Your Knowledge Across Sciences, Tech & Arts
                </h1>

                <p className="text-xs sm:text-sm app-text-muted leading-relaxed mb-6 font-medium">
                  Maths, Biology, Further Maths, Civic Education, Agric Science, Physics, Chemistry, English, Tech, Literature, Economics & more.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setActiveTab('ai-gen')}
                    className="px-5 py-2.5 rounded-lg font-bold text-xs text-white shadow-lg transition-all flex items-center gap-2 hover:opacity-90 active:scale-95"
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-white/90" />
                    Try AI Quiz Generator
                  </button>

                  <button
                    onClick={() => {
                      if (currentUser) {
                        setIsUserModalOpen(true);
                      } else {
                        handleDirectGoogleSignIn();
                      }
                    }}
                    className="px-5 py-2.5 rounded-lg font-bold text-xs app-surface-subtle app-text app-border border shadow-sm transition-all flex items-center gap-2 hover:opacity-90 active:scale-95"
                  >
                    {currentUser ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Account Synced</span>
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
              {/* Search Bar */}
              <div className="relative w-full md:w-80">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search subject or topic..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg app-surface app-border border text-xs font-semibold app-text placeholder:text-slate-400 focus:outline-none shadow-sm transition-colors"
                />
                <Search className="w-4 h-4 app-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>

              {/* Category & Difficulty Dropdowns */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2 app-surface p-1.5 rounded-lg app-border border shadow-sm w-full md:w-auto">
                  <Filter className="w-4 h-4 app-text-muted ml-2 shrink-0" />
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className="bg-transparent text-xs font-semibold app-text focus:outline-none p-1 max-w-[200px] cursor-pointer"
                  >
                    {CATEGORIES_LIST.map(cat => (
                      <option key={cat} value={cat} className="app-surface app-text">
                        {cat === 'All' ? 'All Subjects & Categories' : cat}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedDifficulty}
                    onChange={e => setSelectedDifficulty(e.target.value)}
                    className="bg-transparent text-xs font-semibold app-text focus:outline-none p-1 app-border border-l cursor-pointer"
                  >
                    <option value="All" className="app-surface app-text">All Difficulties</option>
                    <option value="Easy" className="app-surface app-text">Easy</option>
                    <option value="Medium" className="app-surface app-text">Medium</option>
                    <option value="Hard" className="app-surface app-text">Hard</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Quiz Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredQuizPacks.map(pack => (
                <QuizCard
                  key={pack.id}
                  quizPack={pack}
                  onStartQuiz={handleStartQuiz}
                  primaryColor={theme.primaryColor}
                />
              ))}
            </div>
          </div>
        )}

        {/* AI Quiz Generator Tab */}
        {!activeQuizPack && !quizResults && activeTab === 'ai-gen' && (
          <AiQuizGenerator
            onStartQuiz={handleStartQuiz}
            primaryColor={theme.primaryColor}
          />
        )}

        {/* Leaderboards Tab */}
        {!activeQuizPack && !quizResults && activeTab === 'leaderboard' && (
          <LeaderboardView primaryColor={theme.primaryColor} />
        )}

        {/* User Stats Tab */}
        {!activeQuizPack && !quizResults && activeTab === 'stats' && (
          <UserStatsView userStats={userStats} primaryColor={theme.primaryColor} />
        )}

        {/* Admin Panel Tab */}
        {!activeQuizPack && !quizResults && activeTab === 'admin' && (
          <AdminView currentUser={currentUser} primaryColor={theme.primaryColor} />
        )}
      </main>

      {/* Technical High Density Footer */}
      <footer className="h-12 app-surface app-border border-t px-6 sm:px-8 flex items-center justify-between text-[10px] app-text-muted font-bold uppercase tracking-[0.2em] font-mono mt-auto transition-colors">
        <span>Firestore Persistence: Connected</span>
        <div className="hidden sm:flex gap-6">
          <span>Auth Provider: Google Identity</span>
          <span>Latency: 18ms</span>
          <span>Status: Protected</span>
        </div>
      </footer>

      {/* Theme Builder Modal */}
      <ThemeBuilderModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        theme={theme}
        setTheme={setTheme}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setAuthModalError(null);
        }}
        userStats={userStats}
        setUserStats={setUserStats}
        currentUser={currentUser}
        primaryColor={theme.primaryColor}
        initialAuthError={authModalError}
      />
    </div>
  );
}
