import { Link } from 'react-router-dom';

function RolePendingAssignment() {
  return (
    <main style={{ padding: '2rem', maxWidth: 720, margin: '0 auto' }}>
      <h1>Role not assigned yet</h1>
      <p>
        Your account is signed in, but your role has not been assigned or
        refreshed yet.
      </p>
      <p>
        If this was just updated, sign out and sign in again. If not, ask an
        admin to assign your role.
      </p>
      <Link to="/">Go home</Link>
    </main>
  );
}

export default RolePendingAssignment;
