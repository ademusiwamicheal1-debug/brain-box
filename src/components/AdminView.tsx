import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Crown,
  Users,
  Trophy,
  Trash2,
  RefreshCw,
  Database,
  Search,
  CheckCircle2,
  BarChart2,
} from 'lucide-react';
import { LeaderboardItem } from '../types';
import {
  getLeaderboardFromFirestore,
  deleteLeaderboardItemFromFirestore,
  getAllFirestoreUsers,
  isAdminUser,
} from '../lib/firebase';
import { User as FirebaseUser } from 'firebase/auth';

interface AdminViewProps {
  currentUser: FirebaseUser | null;
  primaryColor: string;
}

export const AdminView: React.FC<AdminViewProps> = ({ currentUser, primaryColor }) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'leaderboard' | 'users' | 'analytics'>('leaderboard');
  const [leaderboardItems, setLeaderboardItems] = useState<LeaderboardItem[]>([]);
  const [firestoreUsers, setFirestoreUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteStatus, setDeleteStatus] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setDeleteStatus(null);
    try {
      const items = await getLeaderboardFromFirestore('all', 'All');
      setLeaderboardItems(items);

      const users = await getAllFirestoreUsers();
      setFirestoreUsers(users);
    } catch (e) {
      console.error('Error fetching admin data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteLeaderboardItem = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name}'s score from the global leaderboard?`)) {
      return;
    }
    try {
      await deleteLeaderboardItemFromFirestore(id);
      setLeaderboardItems(prev => prev.filter(item => item.id !== id));
      setDeleteStatus(`Removed entry for ${name}`);
    } catch (e) {
      console.error('Failed to delete item:', e);
      setDeleteStatus('Failed to delete entry.');
    }
  };

  const filteredLeaderboard = leaderboardItems.filter(
    item =>
      item.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = firestoreUsers.filter(
    u =>
      (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      {/* Admin Header Banner */}
      <div className="rounded-2xl p-6 sm:p-8 mb-8 app-surface app-border border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-500 font-bold text-xs uppercase tracking-wider border border-amber-500/30 font-mono">
            <Crown className="w-3.5 h-3.5" /> Official Admin Portal & Control Panel
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight app-text">
            System Administration & Firestore Moderation
          </h1>

          <p className="text-xs sm:text-sm app-text-muted max-w-2xl font-medium">
            Manage global quiz leaderboards, view authenticated users, inspect Firestore database records, and monitor overall app performance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl app-surface-subtle hover:opacity-80 app-text app-border border font-bold text-xs flex items-center gap-2 transition-all shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 app-surface-subtle p-1.5 rounded-xl app-border border w-full sm:w-auto">
          <button
            onClick={() => setActiveAdminTab('leaderboard')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeAdminTab === 'leaderboard'
                ? 'text-white shadow-md'
                : 'app-text-muted hover:app-text'
            }`}
            style={activeAdminTab === 'leaderboard' ? { backgroundColor: primaryColor } : {}}
          >
            <Trophy className="w-4 h-4" />
            Leaderboard Moderation ({leaderboardItems.length})
          </button>

          <button
            onClick={() => setActiveAdminTab('users')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeAdminTab === 'users'
                ? 'text-white shadow-md'
                : 'app-text-muted hover:app-text'
            }`}
            style={activeAdminTab === 'users' ? { backgroundColor: primaryColor } : {}}
          >
            <Users className="w-4 h-4" />
            Registered Users ({firestoreUsers.length})
          </button>

          <button
            onClick={() => setActiveAdminTab('analytics')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeAdminTab === 'analytics'
                ? 'text-white shadow-md'
                : 'app-text-muted hover:app-text'
            }`}
            style={activeAdminTab === 'analytics' ? { backgroundColor: primaryColor } : {}}
          >
            <BarChart2 className="w-4 h-4" />
            System Metrics
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search records or users..."
            className="w-full pl-9 pr-4 py-2 rounded-xl app-surface-subtle app-border border text-xs font-semibold app-text focus:outline-none"
          />
          <Search className="w-4 h-4 app-text-subtle absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {deleteStatus && (
        <div className="mb-4 p-3 rounded-xl app-surface app-border border text-xs font-bold font-mono" style={{ color: primaryColor }}>
          {deleteStatus}
        </div>
      )}

      {/* TAB 1: LEADERBOARD MODERATION */}
      {activeAdminTab === 'leaderboard' && (
        <div className="app-surface rounded-2xl app-border border shadow-xl overflow-hidden">
          <div className="px-6 py-4 app-border border-b flex items-center justify-between">
            <h3 className="font-bold text-sm app-text flex items-center gap-2">
              <Database className="w-4 h-4" style={{ color: primaryColor }} />
              Global Leaderboard Records ({filteredLeaderboard.length})
            </h3>
            <span className="text-xs app-text-muted font-mono">Live Firestore Collection</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs app-text">
              <thead className="app-surface-subtle app-text-subtle uppercase font-mono text-[10px] tracking-wider app-border border-b">
                <tr>
                  <th className="px-6 py-3">Player</th>
                  <th className="px-6 py-3">Subject / Category</th>
                  <th className="px-6 py-3">Score</th>
                  <th className="px-6 py-3">Accuracy</th>
                  <th className="px-6 py-3">Time</th>
                  <th className="px-6 py-3 text-right">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y app-border font-mono">
                {filteredLeaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center app-text-subtle font-sans">
                      No leaderboard items found matching query.
                    </td>
                  </tr>
                ) : (
                  filteredLeaderboard.map(item => (
                    <tr key={item.id} className="hover:bg-slate-500/5 transition-colors">
                      <td className="px-6 py-3.5 font-sans">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.avatar}
                            alt={item.username}
                            className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-400"
                          />
                          <div>
                            <p className="font-bold app-text">{item.username}</p>
                            <p className="text-[10px] app-text-subtle font-mono">{item.createdAt?.slice(0, 10)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="px-2 py-1 rounded app-surface-subtle app-text text-[11px] font-semibold app-border border">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 font-bold" style={{ color: primaryColor }}>{item.score.toLocaleString()} pts</td>
                      <td className="px-6 py-3.5 text-emerald-500 font-bold">{item.accuracy}%</td>
                      <td className="px-6 py-3.5 app-text-muted">{item.timeSpentSeconds}s</td>
                      <td className="px-6 py-3.5 text-right font-sans">
                        <button
                          onClick={() => handleDeleteLeaderboardItem(item.id, item.username)}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 text-[11px] font-bold inline-flex items-center gap-1.5 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: REGISTERED FIRESTORE USERS */}
      {activeAdminTab === 'users' && (
        <div className="app-surface rounded-2xl app-border border shadow-xl overflow-hidden">
          <div className="px-6 py-4 app-border border-b flex items-center justify-between">
            <h3 className="font-bold text-sm app-text flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-500" />
              Authenticated Firestore Accounts ({filteredUsers.length})
            </h3>
            <span className="text-xs app-text-muted font-mono">users collection</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {filteredUsers.length === 0 ? (
              <p className="app-text-subtle text-xs font-mono col-span-3 text-center py-6">
                No registered user accounts found yet.
              </p>
            ) : (
              filteredUsers.map(u => (
                <div key={u.id} className="p-4 rounded-xl app-surface-subtle app-border border flex items-start gap-3">
                  <img
                    src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'}
                    alt={u.username}
                    className="w-10 h-10 rounded-xl object-cover ring-2 shrink-0"
                    style={{ ringColor: primaryColor }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs app-text truncate">{u.username || 'Quizzer'}</p>
                    <p className="text-[10px] app-text-subtle font-mono truncate">{u.email || 'Google / Email User'}</p>

                    <div className="mt-2 pt-2 app-border border-t grid grid-cols-2 gap-2 text-[10px] font-mono">
                      <div>
                        <span className="app-text-subtle block">Total Score</span>
                        <span className="font-bold" style={{ color: primaryColor }}>{u.totalScore || 0} pts</span>
                      </div>
                      <div>
                        <span className="app-text-subtle block">Quizzes Taken</span>
                        <span className="font-bold text-emerald-500">{u.totalQuizzesPlayed || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SYSTEM METRICS */}
      {activeAdminTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="app-surface rounded-2xl p-6 app-border border shadow-xl space-y-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{
                backgroundColor: `rgba(var(--color-primary-rgb), 0.15)`,
                borderColor: `rgba(var(--color-primary-rgb), 0.3)`,
                color: primaryColor,
              }}
            >
              <Users className="w-5 h-5" />
            </div>
            <p className="text-xs app-text-subtle uppercase tracking-wider font-mono font-bold">Total Accounts</p>
            <p className="text-3xl font-extrabold app-text font-mono">{firestoreUsers.length}</p>
            <p className="text-[11px] app-text-muted">Authenticated via Google OAuth & Email</p>
          </div>

          <div className="app-surface rounded-2xl p-6 app-border border shadow-xl space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
              <Trophy className="w-5 h-5" />
            </div>
            <p className="text-xs app-text-subtle uppercase tracking-wider font-mono font-bold">Leaderboard Scores</p>
            <p className="text-3xl font-extrabold app-text font-mono">{leaderboardItems.length}</p>
            <p className="text-[11px] app-text-muted">Entries recorded in Firestore database</p>
          </div>

          <div className="app-surface rounded-2xl p-6 app-border border shadow-xl space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <p className="text-xs app-text-subtle uppercase tracking-wider font-mono font-bold">Database Status</p>
            <p className="text-xl font-extrabold text-emerald-500 font-mono flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> Active & Synced
            </p>
            <p className="text-[11px] app-text-muted">Firestore (default) Cloud Database</p>
          </div>
        </div>
      )}
    </div>
  );
};
