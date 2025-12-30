import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { DatabaseProvider, useDatabaseContext } from '../hooks';
import { AuthProvider } from '../hooks/useAuth';
import { ThemeProvider, useTheme, PreferencesProvider, RefreshProvider } from '../context';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    // Add custom fonts here if needed
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

/**
 * Inner component that uses theme from context
 */
function ThemedApp() {
  const { colors, isDark } = useTheme();

  // Create navigation theme from our app theme
  const navigationTheme = isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          primary: colors.primary,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          notification: colors.primary,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          primary: colors.primary,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          notification: colors.primary,
        },
      };

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="workout/[id]"
          options={{
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="log/[id]"
          options={{
            presentation: 'card',
          }}
        />
      </Stack>
    </NavigationThemeProvider>
  );
}

/**
 * Inner component that uses database context for auth provider
 */
function AuthenticatedApp() {
  const { db } = useDatabaseContext();

  return (
    <AuthProvider database={db}>
      <ThemeProvider>
        <PreferencesProvider>
          <RefreshProvider>
            <ThemedApp />
          </RefreshProvider>
        </PreferencesProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

function RootLayoutNav() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DatabaseProvider>
        <AuthenticatedApp />
      </DatabaseProvider>
    </GestureHandlerRootView>
  );
}
