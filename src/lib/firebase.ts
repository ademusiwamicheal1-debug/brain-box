import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserStats, LeaderboardItem } from '../types';

// Admin Email Whitelist or matcher
const ADMIN_EMAILS = ['ademusiwamicheal1@gmail.com', 'admin@quizpro.com'];

export const isAdminUser = (user: User | null): boolean => {
  if (!user || !user.email) return false;
  const emailLower = user.email.toLowerCase();
  return (
    ADMIN_EMAILS.some(a => a.toLowerCase() === emailLower) ||
    emailLower.startsWith('admin') ||
    emailLower.includes('+admin@')
  );
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db =
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

// Analytics
export let analytics: any = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Auth Helpers
export const signInWithGoogle = async (): Promise<User | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    const errCode = error?.code || '';
    const errStr = error?.message || String(error);

    if (
      errCode === 'auth/cancelled-popup-request' ||
      errCode === 'auth/popup-closed-by-user' ||
      errStr.includes('auth/cancelled-popup-request') ||
      errStr.includes('auth/popup-closed-by-user')
    ) {
      console.warn('Google sign-in popup request was cancelled or closed.');
      return null;
    }
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

export const signUpWithEmail = async (
  email: string,
  pass: string,
  displayName?: string
): Promise<User> => {
  try {
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    if (displayName && res.user) {
      await updateProfile(res.user, { displayName });
    }
    return res.user;
  } catch (error) {
    console.error('Error signing up with email:', error);
    throw error;
  }
};

export const signInWithEmail = async (email: string, pass: string): Promise<User> => {
  try {
    const res = await signInWithEmailAndPassword(auth, email, pass);
    return res.user;
  } catch (error) {
    console.error('Error signing in with email:', error);
    throw error;
  }
};

export const sendPasswordReset = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Error sending password reset:', error);
    throw error;
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Firestore User Stats Sync
export const saveUserStatsToFirestore = async (uid: string, stats: UserStats, email?: string) => {
  if (!uid) return;
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(
      userRef,
      {
        uid,
        username: stats.username,
        email: email || '',
        avatar: stats.avatar,
        totalQuizzesPlayed: stats.totalQuizzesPlayed,
        totalQuestionsAnswered: stats.totalQuestionsAnswered,
        totalCorrectAnswers: stats.totalCorrectAnswers,
        totalScore: stats.totalScore,
        currentStreak: stats.currentStreak,
        bestStreak: stats.bestStreak,
        totalTimeSpentSeconds: stats.totalTimeSpentSeconds,
        categoryStats: stats.categoryStats || {},
        quizHistory: stats.quizHistory || [],
        unlockedBadgeIds: stats.unlockedBadgeIds || [],
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error saving user stats to Firestore:', error);
  }
};

export const getUserStatsFromFirestore = async (uid: string): Promise<UserStats | null> => {
  if (!uid) return null;
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        username: data.username || 'Quizzer',
        avatar: data.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
        totalQuizzesPlayed: data.totalQuizzesPlayed || 0,
        totalQuestionsAnswered: data.totalQuestionsAnswered || 0,
        totalCorrectAnswers: data.totalCorrectAnswers || 0,
        totalScore: data.totalScore || 0,
        currentStreak: data.currentStreak || 0,
        bestStreak: data.bestStreak || 0,
        totalTimeSpentSeconds: data.totalTimeSpentSeconds || 0,
        categoryStats: data.categoryStats || {},
        quizHistory: data.quizHistory || [],
        unlockedBadgeIds: data.unlockedBadgeIds || [],
      };
    }
  } catch (error) {
    console.error('Error getting user stats from Firestore:', error);
  }
  return null;
};

// Leaderboard Firestore Actions
export const postLeaderboardToFirestore = async (entry: Omit<LeaderboardItem, 'id'>, uid?: string) => {
  try {
    const lbRef = collection(db, 'leaderboard');
    const docRef = await addDoc(lbRef, {
      uid: uid || 'anonymous',
      username: entry.username,
      avatar: entry.avatar,
      score: entry.score,
      accuracy: entry.accuracy,
      timeSpentSeconds: entry.timeSpentSeconds,
      category: entry.category,
      difficulty: entry.difficulty,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error posting leaderboard entry to Firestore:', error);
    throw error;
  }
};

export const getLeaderboardFromFirestore = async (
  timeframe: string = 'all',
  category: string = 'All'
): Promise<LeaderboardItem[]> => {
  try {
    const lbRef = collection(db, 'leaderboard');
    let q = query(lbRef, orderBy('score', 'desc'), limit(100));

    const snap = await getDocs(q);
    let items: LeaderboardItem[] = snap.docs.map(docSnap => {
      const d = docSnap.data();
      return {
        id: docSnap.id,
        username: d.username || 'Anonymous',
        avatar: d.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
        score: d.score || 0,
        accuracy: d.accuracy || 0,
        timeSpentSeconds: d.timeSpentSeconds || 0,
        category: d.category || 'General Knowledge',
        difficulty: d.difficulty || 'Medium',
        createdAt: d.createdAt || new Date().toISOString(),
      };
    });

    const now = Date.now();
    if (timeframe === 'daily') {
      const oneDay = 24 * 60 * 60 * 1000;
      items = items.filter(item => now - new Date(item.createdAt).getTime() <= oneDay);
    } else if (timeframe === 'weekly') {
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      items = items.filter(item => now - new Date(item.createdAt).getTime() <= oneWeek);
    }

    if (category && category !== 'All') {
      items = items.filter(item => item.category === category);
    }

    return items;
  } catch (error) {
    console.error('Error fetching leaderboard from Firestore:', error);
    return [];
  }
};

export const deleteLeaderboardItemFromFirestore = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, 'leaderboard', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting leaderboard item:', error);
    throw error;
  }
};

export const getAllFirestoreUsers = async (): Promise<any[]> => {
  try {
    const usersRef = collection(db, 'users');
    const snap = await getDocs(usersRef);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error getting all firestore users:', error);
    return [];
  }
};

