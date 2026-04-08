import { useState } from 'react';
import {
  SignInButton,
  SignUpButton,
  UserButton,
  useAuth,
  useUser,
} from '@clerk/clerk-react';
import { fetchApi } from '../lib/api-client';

const Home = () => {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('Idle');
  const [error, setError] = useState('');
  const [sendAuthHeader, setSendAuthHeader] = useState(true);

  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();

  const API_URL = import.meta.env.VITE_API_URL;

  const fetchInventory = async () => {
    if (!API_URL) {
      setError('Missing VITE_API_URL in frontend/.env');
      return;
    }

    setStatus('Loading...');
    setError('');

    try {
      const response = await fetchApi({
        url: `${API_URL}/api/inventory`,
        getToken: isSignedIn && sendAuthHeader ? getToken : undefined,
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const result = await response.json();
      setData(result);
      setStatus('Success');
    } catch (requestError) {
      setStatus('Failed');
      setError(requestError.message);
    }
  };

  return (
    <main style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      <h1>Kidsfeed Auth Bootstrap</h1>

      {!isLoaded && <p>Loading Clerk authentication state...</p>}

      {isLoaded && !isSignedIn && (
        <p>
          You are signed out. Use Clerk buttons below to open hosted modals.
        </p>
      )}

      {isLoaded && isSignedIn && (
        <p>
          Signed in as{' '}
          {user?.primaryEmailAddress?.emailAddress ??
            user?.fullName ??
            user?.id}
        </p>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        {!isSignedIn && (
          <>
            <SignInButton mode="modal">
              <button type="button">Sign in</button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button type="button">Sign up</button>
            </SignUpButton>
          </>
        )}

        {isSignedIn && <UserButton afterSignOutUrl="/" />}
      </div>

      <hr style={{ margin: '1.25rem 0' }} />

      <button type="button" onClick={fetchInventory} disabled={!isLoaded}>
        Test Backend Call
      </button>

      <label
        style={{
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center',
          marginTop: '0.75rem',
        }}
      >
        <input
          type="checkbox"
          checked={sendAuthHeader}
          onChange={(event) => setSendAuthHeader(event.target.checked)}
        />
        Send Authorization header (Bearer token)
      </label>

      <p>Status: {status}</p>
      {error && <p style={{ color: 'crimson' }}>Error: {error}</p>}

      <pre>{JSON.stringify(data, null, 2)}</pre>
    </main>
  );
};

export default Home;
