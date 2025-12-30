/**
 * Authentication Service
 *
 * This module provides authentication functionality using Apple Sign In
 * and Google Sign In via Expo authentication libraries.
 *
 * FRONTEND INTEGRATION NOTES:
 * - Call signInWithApple() or signInWithGoogle() from sign-in buttons
 * - Store the returned AuthResult.user data in the database using createUser()
 * - Use getCurrentUser() to check if a user is already signed in on app startup
 * - Call signOut() to clear credentials and reset to guest mode
 */

import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

// Complete auth session for web browser (required for Google Sign In)
WebBrowser.maybeCompleteAuthSession();

// SecureStore keys for persisting auth state
const AUTH_STATE_KEY = 'auth_state';
const AUTH_USER_KEY = 'auth_user';

// Google OAuth configuration
// NOTE: Replace these with actual values from Google Cloud Console
const GOOGLE_CLIENT_ID = '__GOOGLE_CLIENT_ID__'; // Placeholder - configure in app config
const GOOGLE_ANDROID_CLIENT_ID = '__GOOGLE_ANDROID_CLIENT_ID__'; // Placeholder
const GOOGLE_IOS_CLIENT_ID = '__GOOGLE_IOS_CLIENT_ID__'; // Placeholder

/**
 * Auth provider types
 */
export type AuthProvider = 'apple' | 'google' | 'local';

/**
 * Authenticated user data structure
 */
export interface AuthUser {
  authProvider: AuthProvider;
  authId: string;
  email?: string;
  displayName?: string;
}

/**
 * Result returned from sign-in operations
 */
export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

/**
 * Stored auth state for persistence
 */
interface StoredAuthState {
  isAuthenticated: boolean;
  provider: AuthProvider | null;
  userId: string | null;
}

/**
 * Generates a secure random nonce for Apple Sign In
 * This is used to prevent replay attacks
 */
async function generateNonce(): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(32);
  const nonce = Array.from(new Uint8Array(randomBytes))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return nonce;
}

/**
 * Hashes a string using SHA256
 * Required for Apple Sign In nonce verification
 */
async function sha256(input: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    input
  );
  return digest;
}

/**
 * Signs in with Apple
 *
 * Uses expo-apple-authentication for native Apple Sign In experience.
 * Only available on iOS 13+ and macOS.
 *
 * FRONTEND USE: Called when user taps "Sign in with Apple" button.
 *
 * @returns AuthResult with user data on success, or error message on failure
 */
export async function signInWithApple(): Promise<AuthResult> {
  try {
    // Check if Apple Authentication is available
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    if (!isAvailable) {
      return {
        success: false,
        error: 'Apple Sign In is not available on this device',
      };
    }

    // Generate nonce for security
    const nonce = await generateNonce();
    const hashedNonce = await sha256(nonce);

    // Request Apple credentials
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    // Extract user information
    const { user: appleUserId, email, fullName } = credential;

    // Construct display name from full name components
    let displayName: string | undefined;
    if (fullName) {
      const nameParts = [fullName.givenName, fullName.familyName].filter(Boolean);
      if (nameParts.length > 0) {
        displayName = nameParts.join(' ');
      }
    }

    const authUser: AuthUser = {
      authProvider: 'apple',
      authId: appleUserId,
      email: email ?? undefined,
      displayName,
    };

    // Store auth state
    await storeAuthState({
      isAuthenticated: true,
      provider: 'apple',
      userId: appleUserId,
    });
    await storeAuthUser(authUser);

    return {
      success: true,
      user: authUser,
    };
  } catch (error) {
    // Handle user cancellation
    if ((error as { code?: string }).code === 'ERR_REQUEST_CANCELED') {
      return {
        success: false,
        error: 'Sign in was cancelled',
      };
    }

    console.error('Apple Sign In error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sign in with Apple',
    };
  }
}

/**
 * Signs in with Google
 *
 * Uses expo-auth-session for OAuth2 flow with Google.
 * Works on iOS, Android, and web.
 *
 * FRONTEND USE: Called when user taps "Sign in with Google" button.
 * NOTE: Requires valid OAuth client IDs to be configured.
 *
 * @returns AuthResult with user data on success, or error message on failure
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  try {
    // Get the appropriate redirect URI for the current platform
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'workout-tracker',
      path: 'auth/google',
    });

    // Select the appropriate client ID based on platform
    const clientId = Platform.select({
      ios: GOOGLE_IOS_CLIENT_ID,
      android: GOOGLE_ANDROID_CLIENT_ID,
      default: GOOGLE_CLIENT_ID,
    });

    // Check if client ID is configured (not placeholder)
    if (clientId.startsWith('__')) {
      // Development mode: simulate successful sign-in for testing
      console.warn('Google Sign In: Using mock authentication (client ID not configured)');
      return simulateGoogleSignIn();
    }

    // Configure the Google OAuth discovery document
    const discovery = {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
    };

    // Create the auth request
    const request = new AuthSession.AuthRequest({
      clientId,
      redirectUri,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.Token,
    });

    // Prompt user to sign in
    const result = await request.promptAsync(discovery);

    if (result.type === 'success' && result.authentication) {
      // Fetch user info from Google
      const userInfo = await fetchGoogleUserInfo(result.authentication.accessToken);

      if (!userInfo) {
        return {
          success: false,
          error: 'Failed to fetch user information from Google',
        };
      }

      const authUser: AuthUser = {
        authProvider: 'google',
        authId: userInfo.id,
        email: userInfo.email,
        displayName: userInfo.name,
      };

      // Store auth state
      await storeAuthState({
        isAuthenticated: true,
        provider: 'google',
        userId: userInfo.id,
      });
      await storeAuthUser(authUser);

      return {
        success: true,
        user: authUser,
      };
    }

    if (result.type === 'cancel') {
      return {
        success: false,
        error: 'Sign in was cancelled',
      };
    }

    return {
      success: false,
      error: 'Google sign in failed',
    };
  } catch (error) {
    console.error('Google Sign In error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sign in with Google',
    };
  }
}

/**
 * Simulates Google Sign In for development/testing
 * Used when OAuth client IDs are not configured
 */
async function simulateGoogleSignIn(): Promise<AuthResult> {
  // Generate a mock user for development
  const mockUserId = `mock-google-${Date.now()}`;
  const authUser: AuthUser = {
    authProvider: 'google',
    authId: mockUserId,
    email: 'test.user@example.com',
    displayName: 'Test User',
  };

  await storeAuthState({
    isAuthenticated: true,
    provider: 'google',
    userId: mockUserId,
  });
  await storeAuthUser(authUser);

  return {
    success: true,
    user: authUser,
  };
}

/**
 * Fetches user information from Google's userinfo endpoint
 */
async function fetchGoogleUserInfo(
  accessToken: string
): Promise<{ id: string; email?: string; name?: string } | null> {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    const data = await response.json();
    return {
      id: data.id,
      email: data.email,
      name: data.name,
    };
  } catch (error) {
    console.error('Error fetching Google user info:', error);
    return null;
  }
}

/**
 * Signs out the current user
 *
 * Clears all stored authentication credentials and resets to guest mode.
 *
 * FRONTEND USE: Called from settings or profile screen when user wants to sign out.
 */
export async function signOut(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(AUTH_STATE_KEY);
    await SecureStore.deleteItemAsync(AUTH_USER_KEY);
  } catch (error) {
    console.error('Error signing out:', error);
    // Continue even if delete fails - state will be cleared on next read
  }
}

/**
 * Gets the currently authenticated user
 *
 * Checks stored credentials and returns user data if authenticated.
 *
 * FRONTEND USE: Called on app startup to restore authentication state.
 *
 * @returns The authenticated user, or null if not signed in (guest mode)
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const storedUser = await SecureStore.getItemAsync(AUTH_USER_KEY);
    if (storedUser) {
      return JSON.parse(storedUser) as AuthUser;
    }
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Checks if a user is currently authenticated
 *
 * FRONTEND USE: Quick check for auth status without loading full user data.
 *
 * @returns true if user is authenticated, false if guest
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const storedState = await SecureStore.getItemAsync(AUTH_STATE_KEY);
    if (storedState) {
      const state = JSON.parse(storedState) as StoredAuthState;
      return state.isAuthenticated;
    }
    return false;
  } catch (error) {
    console.error('Error checking auth state:', error);
    return false;
  }
}

/**
 * Checks if Apple Sign In is available on this device
 *
 * FRONTEND USE: Use to conditionally show/hide Apple Sign In button.
 */
export async function isAppleSignInAvailable(): Promise<boolean> {
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

/**
 * Stores auth state in SecureStore
 */
async function storeAuthState(state: StoredAuthState): Promise<void> {
  await SecureStore.setItemAsync(AUTH_STATE_KEY, JSON.stringify(state));
}

/**
 * Stores auth user in SecureStore
 */
async function storeAuthUser(user: AuthUser): Promise<void> {
  await SecureStore.setItemAsync(AUTH_USER_KEY, JSON.stringify(user));
}

/**
 * Gets the stored auth state
 */
export async function getStoredAuthState(): Promise<StoredAuthState | null> {
  try {
    const stored = await SecureStore.getItemAsync(AUTH_STATE_KEY);
    if (stored) {
      return JSON.parse(stored) as StoredAuthState;
    }
    return null;
  } catch (error) {
    console.error('Error getting stored auth state:', error);
    return null;
  }
}
