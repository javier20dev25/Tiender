# Plan: User Authentication Flow

This plan outlines the phases and tasks to implement the user authentication flow with Supabase.

## Phase 1: UI Components & Routing Setup [checkpoint: d9bf22c]

- [x] Task: Create UI component for the Sign-Up form (`src/features/auth/components/SignUpForm.tsx`). [8d0e004]
- [x] Task: Create UI component for the Sign-In form (`src/features/auth/components/SignInForm.tsx`). [52f6d82]
- [x] Task: Create a container page `AuthPage.tsx` to display and toggle between the Sign-Up and Sign-In forms. [4212b18]
- [x] Task: Configure `react-router-dom` to set up routes for `/auth`, `/dashboard` (initially a placeholder), and a default redirect. [e3746d7]
- [x] Task: Conductor - User Manual Verification 'UI Components & Routing Setup' (Protocol in workflow.md) [d9bf22c]

## Phase 2: Supabase Client & API Logic

- [x] Task: Install `@supabase/supabase-js`. (Already done, but good to verify). [verification]
- [x] Task: Create a Supabase client singleton (`src/lib/supabaseClient.ts`) to be used across the app. [ce50de0]
- [x] Task: Write failing unit tests for the `signUp` service function. [cb12d69]
- [x] Task: Implement the `signUp` service function that wraps `supabase.auth.signUp`. [cb12d69]
- [x] Task: Write failing unit tests for the `signIn` service function. [0175d02]
- [x] Task: Implement the `signIn` service function that wraps `supabase.auth.signInWithPassword`. [0175d02]
- [x] Task: Write failing unit tests for the `signOut` service function. [060dfa8]
- [x] Task: Implement the `signOut` service function that wraps `supabase.auth.signOut`. [060dfa8]
- [ ] Task: Conductor - User Manual Verification 'Supabase Client & API Logic' (Protocol in workflow.md)

## Phase 3: State Management & Integration

- [x] Task: Create a React Context for session management to provide user and session state globally.
- [x] Task: Implement the logic within the `SignUpForm` component to call the `signUp` service function and handle UI state (loading, errors).
- [x] Task: Implement the logic within the `SignInForm` component to call the `signIn` service function and handle UI state.
- [x] Task: Write failing tests for a `ProtectedRoute` component that checks for an active session.
- [x] Task: Implement the `ProtectedRoute` component to redirect unauthenticated users.
- [x] Task: Update the router configuration to use the `ProtectedRoute` for the `/dashboard` route.
- [ ] Task: Conductor - User Manual Verification 'State Management & Integration' (Protocol in workflow.md)
