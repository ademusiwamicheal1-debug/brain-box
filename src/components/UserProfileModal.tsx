import React, { useState } from 'react';
import {
  X,
  Check,
  User,
  LogIn,
  LogOut,
  ShieldCheck,
  Crown,
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  KeyRound,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Globe,
} from 'lucide-react';
import { UserStats } from '../types';
import { User as FirebaseUser } from 'firebase/auth';
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  sendPasswordReset,
  logoutUser,
  getUserStatsFromFirestore,
  saveUserStatsToFirestore,
  isAdminUser,
} from '../lib/firebase';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userStats: UserStats;
  setUserStats: React.Dispatch<React.SetStateAction<UserStats>>;
  currentUser: FirebaseUser | null;
  primaryColor: string;
  initialAuthError?: string | null;
}

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  userStats,
  setUserStats,
  currentUser,
  primaryColor,
  initialAuthError,
}) => {
  const [usernameInput, setUsernameInput] = useState(userStats.username);
  const [selectedAvatar, setSelectedAvatar] = useState(userStats.avatar);

  // Auth Mode: 'google' | 'email-signin' | 'email-signup' | 'forgot-password'
  const [authMode, setAuthMode] = useState<'google' | 'email-signin' | 'email-signup' | 'forgot-password'>('google');

  // Form Fields
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Loading & Messages
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(initialAuthError || null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';

  const handleCopyHostname = () => {
    if (currentHostname) {
      navigator.clipboard.writeText(currentHostname);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    }
  };

  React.useEffect(() => {
    if (isOpen && initialAuthError) {
      setAuthError(initialAuthError);
      setAuthMode('email-signin');
    }
  }, [isOpen, initialAuthError]);

  if (!isOpen) return null;

  const isAdmin = isAdminUser(currentUser);

  const handleGoogleSignIn = async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);
    try {
      const user = await signInWithGoogle();
      if (user) {
        setAuthSuccess(`Signed in as ${user.displayName || user.email}!`);
        const stats = await getUserStatsFromFirestore(user.uid);
        if (stats) {
          setUserStats(stats);
          setUsernameInput(stats.username);
          setSelectedAvatar(stats.avatar);
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
    } catch (error: any) {
      console.error('Google Sign in error:', error);
      let msg = error.message || 'Failed to sign in with Google.';
      if (msg.includes('auth/unauthorized-domain') || msg.includes('auth/operation-not-supported-in-this-environment')) {
        msg = `Current app domain (${currentHostname || 'this domain'}) is not listed in Authorized Domains in Firebase Console. You can add it, or use Email / Gmail Sign-In below!`;
      } else if (msg.includes('auth/popup-closed-by-user') || msg.includes('auth/cancelled-popup-request')) {
        msg = 'Sign in popup closed before finishing.';
      }
      setAuthError(msg);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError(null);
    setAuthSuccess(null);

    try {
      if (authMode === 'email-signin') {
        const user = await signInWithEmail(emailInput.trim(), passwordInput);
        setAuthSuccess(`Welcome back, ${user.displayName || user.email}!`);
        const stats = await getUserStatsFromFirestore(user.uid);
        if (stats) {
          setUserStats(stats);
          setUsernameInput(stats.username);
          setSelectedAvatar(stats.avatar);
        }
      } else if (authMode === 'email-signup') {
        const name = displayNameInput.trim() || emailInput.split('@')[0];
        const user = await signUpWithEmail(emailInput.trim(), passwordInput, name);
        setAuthSuccess(`Account created for ${name}!`);
        const newStats: UserStats = {
          ...userStats,
          username: name,
          avatar: selectedAvatar,
        };
        setUserStats(newStats);
        await saveUserStatsToFirestore(user.uid, newStats, user.email || '');
      } else if (authMode === 'forgot-password') {
        await sendPasswordReset(emailInput.trim());
        setAuthSuccess(`Password reset email sent to ${emailInput.trim()}. Check your inbox!`);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      let msg = error.message || 'Authentication failed.';
      if (msg.includes('auth/configuration-not-found') || msg.includes('auth/operation-not-allowed')) {
        msg =
          'Firebase Authentication (Email Provider) is not enabled in Firebase Console for project "quiz-pro-30283". Enable Email/Password under Authentication > Sign-in method, or customize your local Player Profile below!';
      } else if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password')) {
        msg = 'Invalid credentials or account does not exist. If you do not have an account yet, switch to "Create Account" above!';
      } else if (msg.includes('auth/email-already-in-use')) {
        msg = 'An account with this email already exists. Try signing in instead!';
      } else if (msg.includes('auth/invalid-email')) {
        msg = 'Please provide a valid Gmail or email address.';
      }
      setAuthError(msg);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsAuthLoading(true);
    try {
      await logoutUser();
      setAuthSuccess('Signed out successfully.');
    } catch (e) {
      console.error('Sign out error:', e);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameInput.trim()) {
      const updatedStats: UserStats = {
        ...userStats,
        username: usernameInput.trim(),
        avatar: selectedAvatar,
      };
      setUserStats(updatedStats);

      if (currentUser) {
        await saveUserStatsToFirestore(currentUser.uid, updatedStats, currentUser.email || '');
      }

      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-md app-surface rounded-2xl shadow-2xl app-border border overflow-hidden app-text transition-colors"
        id="user-profile-modal-container"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 app-border border-b">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md"
              style={{ backgroundColor: primaryColor }}
            >
              {isAdmin ? <Crown className="w-5 h-5 text-amber-300" /> : <User className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base leading-none app-text">
                  {currentUser ? (isAdmin ? 'Admin Portal Account' : 'Player Account') : 'Authentication & Sign In'}
                </h3>
                {isAdmin && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30 font-mono">
                    ADMIN
                  </span>
                )}
              </div>
              <p className="text-xs app-text-muted mt-1 font-mono">
                Google & Gmail Authentication + Firestore Sync
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg app-text-muted hover:app-text app-surface-subtle transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Authenticated User Status Card OR Auth Options */}
        <div className="p-6 pb-2">
          {currentUser ? (
            <div className="p-4 rounded-xl app-surface-subtle app-border border flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3 min-w-0">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-11 h-11 rounded-xl object-cover ring-2 shrink-0"
                    style={{ ringColor: primaryColor }}
                  />
                ) : (
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white text-lg shrink-0"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Authenticated ({isAdmin ? 'Admin' : 'User'})</span>
                  </div>
                  <p className="text-xs font-bold app-text truncate">
                    {currentUser.displayName || userStats.username}
                  </p>
                  <p className="text-[10px] app-text-muted font-mono truncate">
                    {currentUser.email}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={isAuthLoading}
                className="px-3 py-1.5 rounded-xl app-surface hover:bg-rose-500/10 text-xs font-bold text-rose-500 app-border border shrink-0 flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="app-surface-subtle rounded-2xl p-4 app-border border space-y-4">
              {/* Auth Mode Toggle Buttons */}
              <div className="grid grid-cols-2 gap-1.5 app-surface p-1 rounded-xl app-border border text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('google');
                    setAuthError(null);
                    setAuthSuccess(null);
                  }}
                  className={`py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    authMode === 'google'
                      ? 'text-white font-bold shadow-sm'
                      : 'app-text-muted hover:app-text'
                  }`}
                  style={authMode === 'google' ? { backgroundColor: primaryColor } : {}}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Google 1-Click
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('email-signin');
                    setAuthError(null);
                    setAuthSuccess(null);
                  }}
                  className={`py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    authMode !== 'google'
                      ? 'text-white font-bold shadow-sm'
                      : 'app-text-muted hover:app-text'
                  }`}
                  style={authMode !== 'google' ? { backgroundColor: primaryColor } : {}}
                >
                  <Mail className="w-3.5 h-3.5" />
                  Email / Gmail
                </button>
              </div>

              {/* GOOGLE OAuth Mode */}
              {authMode === 'google' && (
                <div className="text-center space-y-3 pt-1">
                  <p className="text-xs app-text-muted font-medium">
                    Sign in or register instantly with your Google or Gmail account to sync stats and record scores on the global leaderboard.
                  </p>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isAuthLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs shadow-md flex items-center justify-center gap-2.5 transition-all border border-slate-200"
                  >
                    {isAuthLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-800" />
                    ) : (
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
                    )}
                    <span>Sign in with Google / Gmail</span>
                  </button>
                </div>
              )}

              {/* EMAIL / GMAIL Password Mode */}
              {authMode !== 'google' && (
                <form onSubmit={handleEmailAuthSubmit} className="space-y-3 pt-1">
                  {/* Email & Password Mode Switcher */}
                  <div className="flex items-center justify-between text-[11px] font-mono app-border border-b pb-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('email-signin');
                        setAuthError(null);
                      }}
                      className={`font-bold ${
                        authMode === 'email-signin' ? 'underline' : 'app-text-muted'
                      }`}
                      style={authMode === 'email-signin' ? { color: primaryColor } : {}}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('email-signup');
                        setAuthError(null);
                      }}
                      className={`font-bold ${
                        authMode === 'email-signup' ? 'underline' : 'app-text-muted'
                      }`}
                      style={authMode === 'email-signup' ? { color: primaryColor } : {}}
                    >
                      Create Account
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('forgot-password');
                        setAuthError(null);
                      }}
                      className={`font-bold ${
                        authMode === 'forgot-password' ? 'underline' : 'app-text-muted'
                      }`}
                      style={authMode === 'forgot-password' ? { color: primaryColor } : {}}
                    >
                      Reset Password
                    </button>
                  </div>

                  {/* Display Name (Sign Up only) */}
                  {authMode === 'email-signup' && (
                    <div>
                      <label className="text-[10px] font-mono font-bold uppercase tracking-wider app-text-subtle block mb-1">
                        Full Name / Display Nickname
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={displayNameInput}
                          onChange={e => setDisplayNameInput(e.target.value)}
                          placeholder="e.g. Alex Quizmaster"
                          className="w-full pl-9 pr-3 py-2 rounded-xl app-surface app-border border text-xs font-semibold app-text focus:outline-none"
                        />
                        <User className="w-4 h-4 app-text-subtle absolute left-3 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  )}

                  {/* Email Input */}
                  <div>
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider app-text-subtle block mb-1">
                      Gmail or Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={emailInput}
                        onChange={e => setEmailInput(e.target.value)}
                        placeholder="yourname@gmail.com"
                        className="w-full pl-9 pr-3 py-2 rounded-xl app-surface app-border border text-xs font-semibold app-text focus:outline-none font-mono"
                      />
                      <Mail className="w-4 h-4 app-text-subtle absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Password Input (if not forgot password mode) */}
                  {authMode !== 'forgot-password' && (
                    <div>
                      <label className="text-[10px] font-mono font-bold uppercase tracking-wider app-text-subtle block mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={passwordInput}
                          onChange={e => setPasswordInput(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-9 pr-9 py-2 rounded-xl app-surface app-border border text-xs font-semibold app-text focus:outline-none font-mono"
                        />
                        <Lock className="w-4 h-4 app-text-subtle absolute left-3 top-1/2 -translate-y-1/2" />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 app-text-subtle hover:app-text"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isAuthLoading}
                    className="w-full py-2.5 px-4 rounded-xl text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all hover:opacity-90 mt-2"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {isAuthLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : authMode === 'email-signup' ? (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Sign Up with Email</span>
                      </>
                    ) : authMode === 'email-signin' ? (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>Sign In to Account</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>Send Password Reset Link</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Status Feedback Banners */}
              {authError && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-medium space-y-2.5">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Authentication Notice</span>
                  </div>
                  <p className="text-[11px] leading-relaxed opacity-90">{authError}</p>

                  {/* Domain Authorization Helper */}
                  {(authError.includes('Authorized Domains') || authError.includes('unauthorized-domain') || authError.includes('Current app domain')) && (
                    <div className="mt-2 p-3 rounded-xl app-surface app-border border text-slate-200 space-y-2 text-[11px]">
                      <div className="flex items-center gap-1.5 text-amber-500 font-bold text-[11px]">
                        <Globe className="w-3.5 h-3.5 shrink-0" />
                        <span>How to Authorize This Domain in Firebase:</span>
                      </div>
                      <ol className="list-decimal list-inside space-y-1 app-text-muted text-[10.5px] leading-relaxed">
                        <li>
                          Open <a href="https://console.firebase.google.com/project/quiz-pro-30283/authentication/settings" target="_blank" rel="noreferrer" className="text-amber-500 underline font-semibold inline-flex items-center gap-0.5">Firebase Console Settings <ExternalLink className="w-3 h-3 inline" /></a>
                        </li>
                        <li>Click the <strong>Authorized domains</strong> tab & select <strong>Add domain</strong></li>
                        <li>Paste the app domain below:</li>
                      </ol>

                      {currentHostname && (
                        <div className="flex items-center gap-2 mt-1.5">
                          <code className="flex-1 px-2.5 py-1.5 rounded-lg app-surface-subtle app-border border text-amber-500 text-[10px] font-mono select-all truncate">
                            {currentHostname}
                          </code>
                          <button
                            type="button"
                            onClick={handleCopyHostname}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 border border-amber-500/40 text-[10.5px] font-bold transition-all flex items-center gap-1 shrink-0"
                          >
                            {copiedDomain ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Domain</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                      <p className="text-[10px] app-text-subtle italic">
                        💡 Tip: You can also use Email / Password sign-in or play as Guest below without adding domains!
                      </p>
                    </div>
                  )}

                  {/* Quick helper buttons depending on error type */}
                  {authError.includes('Invalid credentials') && authMode === 'email-signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('email-signup');
                        setAuthError(null);
                      }}
                      className="mt-1 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 border border-amber-500/40 text-[11px] font-bold transition-colors flex items-center gap-1.5"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-amber-500" />
                      <span>Switch to Create Account</span>
                    </button>
                  )}
                </div>
              )}

              {authSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <p className="text-[11px] font-bold">{authSuccess}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile Customization Form */}
        <form onSubmit={handleSaveProfile} className="p-6 space-y-5 app-border border-t">
          {/* Username input */}
          <div>
            <label className="text-[11px] font-mono font-bold uppercase tracking-wider app-text-subtle block mb-2">
              Player Display Name
            </label>
            <input
              type="text"
              required
              maxLength={20}
              value={usernameInput}
              onChange={e => setUsernameInput(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl app-surface-subtle app-border border text-xs font-bold app-text focus:outline-none font-mono"
              placeholder="Enter your nickname..."
            />
          </div>

          {/* Avatar selector */}
          <div>
            <label className="text-[11px] font-mono font-bold uppercase tracking-wider app-text-subtle block mb-3">
              Select Profile Avatar
            </label>
            <div className="grid grid-cols-3 gap-3">
              {AVATAR_OPTIONS.map((avatarUrl, idx) => {
                const isSelected = selectedAvatar === avatarUrl;
                return (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setSelectedAvatar(avatarUrl)}
                    className={`relative p-1 rounded-2xl border-2 transition-all overflow-hidden ${
                      isSelected
                        ? 'ring-2 scale-105'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                    style={isSelected ? { borderColor: primaryColor } : {}}
                  >
                    <img src={avatarUrl} alt="Avatar option" className="w-full h-14 object-cover rounded-xl" />
                    {isSelected && (
                      <div
                        className="absolute inset-0 backdrop-blur-[1px] flex items-center justify-center text-white"
                        style={{ backgroundColor: `rgba(var(--color-primary-rgb), 0.4)` }}
                      >
                        <Check className="w-5 h-5 drop-shadow" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold app-text-muted hover:app-text transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl font-bold text-xs text-white shadow-md transition-all hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
