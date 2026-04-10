import { Navigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

function RequireAuth({ children }) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <p>Loading authentication...</p>;
  }

  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default RequireAuth;
