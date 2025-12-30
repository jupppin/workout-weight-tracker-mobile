# Workout Weight Tracker Mobile

A mobile-first app for tracking progressive overload in weight training. Built with React Native and Expo.

## Features

- Fast workout logging with minimal taps
- Offline-first local database (SQLite)
- Apple Sign In and Google Sign In support
- Browse workouts by muscle group
- Favorites and recent workouts
- Dark mode by default

## Tech Stack

- React Native + Expo
- Expo Router
- SQLite (expo-sqlite)
- TypeScript

## Getting Started

```bash
npm install
npm run start
```

Then choose a platform:
- Press `a` for Android
- Press `i` for iOS
- Press `w` for web

## Configuration

This project includes placeholders for OAuth and EAS settings:
- `app.json` -> `extra.eas.projectId`
- `app.json` -> `extra.googleAuth.*`
- `services/auth.ts` -> Google client ID placeholders

Replace these with your real values before enabling Google Sign In.

## Useful Scripts

```bash
npm run start
npm run android
npm run ios
npm run web
```

## License

MIT. See `LICENSE`.
