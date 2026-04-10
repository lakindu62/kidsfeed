import { Link } from 'react-router-dom';

function Unauthorized() {
  return (
    <main style={{ padding: '2rem', maxWidth: 720, margin: '0 auto' }}>
      <h1>Not allowed</h1>
      <p>You do not have permission to open this page.</p>
      <p>
        Try going back to the home page, or contact an admin if you think this
        is a mistake.
      </p>
      <Link to="/">Go home</Link>
    </main>
  );
}

export default Unauthorized;
