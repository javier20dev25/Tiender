import { useState } from 'react';
import { SignUpForm } from '../features/auth/components/SignUpForm';
import SignInForm from '../features/auth/components/SignInForm'; // Default import

const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(true); // State to toggle between forms

  const switchToSignIn = () => setIsSignUp(false);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md">
        {isSignUp ? (
          <SignUpForm onSwitchToSignIn={switchToSignIn} />
        ) : (
          <SignInForm />
        )}

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-indigo-600 hover:text-indigo-500 focus:outline-none"
            // Use role="button" for accessibility, matching the test
            role="button"
          >
            {isSignUp ? '¿Ya tienes una cuenta? Inicia sesión' : '¿No tienes una cuenta? Regístrate'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
