# Specification: User Authentication Flow

## 1. Overview

This track covers the implementation of a complete user authentication flow (sign-up and sign-in) for "Vendedores" using Supabase as the backend service. This is the foundational step to allow sellers to access a private area of the application.

## 2. Functional Requirements

*   **FR1: User Registration (Sign-up):**
    *   The system must provide a sign-up form that accepts an email and a password.
    *   The form must perform basic client-side validation (e.g., valid email format, password complexity if required).
    *   On submission, the system will call Supabase Auth's `signUp` method.
    *   Success: The user is created in the Supabase `auth.users` table, and they are automatically logged in.
    *   Failure: An appropriate error message (e.g., "User already exists", "Invalid password") must be displayed to the user.

*   **FR2: User Authentication (Sign-in):**
    *   The system must provide a sign-in form that accepts an email and a password.
    *   On submission, the system will call Supabase Auth's `signInWithPassword` method.
    *   Success: The user is authenticated, and a session is created. The user should be redirected to a private dashboard page.
    *   Failure: An appropriate error message (e.g., "Invalid credentials") must be displayed.

*   **FR3: Session Management & Logout:**
    *   The application must be able to persist the user's session.
    *   A logged-in user must have access to a "Logout" action.
    *   The logout action will call Supabase Auth's `signOut` method, clear the session, and redirect the user to a public page (e.g., the login page).

*   **FR4: Protected Routes:**
    *   Certain routes (e.g., `/dashboard`) must be protected.
    *   An unauthenticated user attempting to access a protected route must be redirected to the login page.

## 3. Out of Scope

*   Password recovery ("Forgot Password") functionality.
*   Third-party authentication providers (e.g., Google, GitHub).
*   Role-based access control (all signed-up users are considered "Vendedores" for now).
*   Profile creation or management beyond the initial sign-up.

## 4. Acceptance Criteria

*   **AC1:** A new user can successfully create an account using the sign-up form.
*   **AC2:** An existing user can successfully log in using the sign-in form.
*   **AC3:** A logged-in user can log out of the application.
*   **AC4:** A non-logged-in user cannot access the `/dashboard` page and is redirected to the login page.
