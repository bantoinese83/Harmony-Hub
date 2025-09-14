import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import { logUserSignUp, logUserLogin, setUserId } from './analyticsService';
import { showErrorToast } from '../components/Toast';

export const signUp = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user document in Firestore
    const displayName = email.split('@')[0]; // Derive displayName from email prefix
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: displayName,
      loggedConcertsCount: 0,
    });

    // Set user ID for analytics and log signup event
    await setUserId(user.uid);
    await logUserSignUp('email');

    return user;
  } catch (error: any) {
    console.error('Sign up error:', error);
    showErrorToast(error.message || 'Failed to create account');
    throw error;
  }
};

export const signIn = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Set user ID for analytics and log login event
    await setUserId(user.uid);
    await logUserLogin('email');

    return user;
  } catch (error: any) {
    console.error('Sign in error:', error);
    showErrorToast(error.message || 'Failed to sign in');
    throw error;
  }
};

export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
    // Clear user ID from analytics
    await setUserId(null);
  } catch (error: any) {
    console.error('Sign out error:', error);
    showErrorToast(error.message || 'Failed to sign out');
    throw error;
  }
};
