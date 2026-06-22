// import { 
//   signInWithPopup, 
//   GoogleAuthProvider, 
//   signInWithEmailAndPassword,
//   createUserWithEmailAndPassword,
//   signOut,
//   onAuthStateChanged,
//   User
// } from 'firebase/auth';
// import { auth } from '../config/firebase.config';
// import { db } from '../config/firebase.config';
// import { doc, setDoc, getDoc } from 'firebase/firestore';

// const googleProvider = new GoogleAuthProvider();

// // Configure Google provider to always prompt for account selection
// googleProvider.setCustomParameters({
//   prompt: 'select_account'
// });

// /**
//  * Sign in with Google
//  */
// export const signInWithGoogle = async (): Promise<User> => {
//   try {
//     const result = await signInWithPopup(auth, googleProvider);
//     const user = result.user;

//     // Save user data to Firestore
//     await saveUserData(user);
    
//     return user;
//   } catch (error: any) {
//     throw new Error(error.message);
//   }
// };

// /**
//  * Sign in with email and password
//  */
// export const signInWithEmail = async (email: string, password: string): Promise<User> => {
//   try {
//     const result = await signInWithEmailAndPassword(auth, email, password);
//     const user = result.user;
    
//     // Save user data to Firestore
//     await saveUserData(user);
    
//     return user;
//   } catch (error: any) {
//     throw new Error(error.message);
//   }
// };

// /**
//  * Sign up with email and password
//  */
// export const signUpWithEmail = async (email: string, password: string, displayName: string): Promise<User> => {
//   try {
//     const result = await createUserWithEmailAndPassword(auth, email, password);
//     const user = result.user;

//     // Save user data to Firestore
//     await saveUserData(user, displayName);
    
//     return user;
//   } catch (error: any) {
//     throw new Error(error.message);
//   }
// };

// /**
//  * Sign out current user
//  */
// export const logout = async (): Promise<void> => {
//   try {
//     await signOut(auth);
//   } catch (error: any) {
//     throw new Error(error.message);
//   }
// };

// /**
//  * Get current user
//  */
// export const getCurrentUser = (): User | null => {
//   return auth.currentUser;
// };

// /**
//  * Subscribe to auth state changes
//  */
// export const onAuthChange = (callback: (user: User | null) => void) => {
//   return onAuthStateChanged(auth, callback);
// };

// /**
//  * Save user data to Firestore following the schema
//  */
// const saveUserData = async (user: User, displayName?: string): Promise<void> => {
//   try {
//     const userRef = doc(db, 'users_table', user.uid);
    
//     // Check if user document already exists
//     const userSnap = await getDoc(userRef);
    
//     const now = new Date();
//     const isoTimestamp = now.toISOString();

//     if (!userSnap.exists()) {
//       // Parse display name into first and last name
//       const nameParts = (displayName || user.displayName || 'User').split(' ');
//       const firstName = nameParts[0];
//       const lastName = nameParts.slice(1).join(' ') || '';

//       // Create new user document with schema structure
//       await setDoc(userRef, {
//         id: user.uid,
//         email: user.email,
//         account: {
//           isEmailVerified: user.emailVerified,
//           joinedAt: isoTimestamp,
//           lastLogin: isoTimestamp
//         },
//         preferences: {
//           language: 'en',
//           theme: 'dark'
//         },
//         profile: {
//           bio: '',
//           city: '',
//           country: '',
//           firstName: firstName,
//           lastName: lastName,
//           role: 'User',
//           state: '',
//           photoURL: user.photoURL || null
//         }
//       });
//       console.log('✅ New user document created:', user.uid);
//     } else {
//       // Update lastLogin timestamp for existing user
//       await setDoc(userRef, {
//         account: {
//           lastLogin: isoTimestamp
//         }
//       }, { merge: true });
//       console.log('✅ User login updated:', user.uid);
//     }
//   } catch (error: any) {
//     console.error('❌ Error saving user data:', error);
//     throw error;
//   }
// };

// /**
//  * Get user data from Firestore
//  */
// export const getUserData = async (uid: string) => {
//   try {
//     const userRef = doc(db, 'users_table', uid);
//     const userSnap = await getDoc(userRef);
    
//     if (userSnap.exists()) {
//       return userSnap.data();
//     }
//     return null;
//   } catch (error: any) {
//     console.error('Error getting user data:', error);
//     return null;
//   }
// };


























import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from '../config/firebase.config';
import { db } from '../config/firebase.config';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

const googleProvider = new GoogleAuthProvider();

// Configure Google provider to always prompt for account selection
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Sign in with Google
 */
export const signInWithGoogle = async (): Promise<User> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Save user data to Firestore
    await saveUserData(user);
    
    return user;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const user = result.user;
    
    // Save user data to Firestore
    await saveUserData(user);
    
    return user;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Sign up with email and password
 */
export const signUpWithEmail = async (email: string, password: string, displayName: string): Promise<User> => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;

    // Save user data to Firestore
    await saveUserData(user, displayName);
    
    return user;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Sign out current user
 */
export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Get current user
 */
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

/**
 * Subscribe to auth state changes
 */
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Save user data to Firestore following the schema
 */
const saveUserData = async (user: User, displayName?: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users_table', user.uid);
    
    // Check if user document already exists
    const userSnap = await getDoc(userRef);
    
    const now = new Date();
    const isoTimestamp = now.toISOString();

    if (!userSnap.exists()) {
      // Parse display name into first and last name
      const nameParts = (displayName || user.displayName || 'User').split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';

      // Create new user document with schema structure
      await setDoc(userRef, {
        id: user.uid,
        email: user.email,
        account: {
          isEmailVerified: user.emailVerified,
          joinedAt: isoTimestamp,
          lastLogin: isoTimestamp
        },
        preferences: {
          language: 'en',
          theme: 'dark'
        },
        profile: {
          bio: '',
          city: '',
          country: '',
          firstName: firstName,
          lastName: lastName,
          role: 'User',
          state: '',
          photoURL: user.photoURL || null
        }
      });
      console.log('✅ New user document created:', user.uid);
    } else {
      // Update lastLogin timestamp for existing user
      await setDoc(
        userRef,
        {
          account: {
            lastLogin: isoTimestamp
          }
        },
        { merge: true }
      );
      console.log('✅ User login updated:', user.uid);
    }
  } catch (error: any) {
    console.error('❌ Error saving user data:', error);
    throw error;
  }
};

/**
 * Get user data from Firestore
 */
export const getUserData = async (uid: string) => {
  try {
    const userRef = doc(db, 'users_table', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data();
    }
    return null;
  } catch (error: any) {
    console.error('Error getting user data:', error);
    return null;
  }
};

/**
 * Update user data in Firestore (expects full schema or partial, merged)
 */
export const updateUserData = async (uid: string, data: any): Promise<void> => {
  try {
    const userRef = doc(db, 'users_table', uid);
    // merge so you do not lose existing fields
    await setDoc(userRef, data, { merge: true });
    console.log('✅ User data updated:', uid);
  } catch (error: any) {
    console.error('❌ Error updating user data:', error);
    throw error;
  }
};
