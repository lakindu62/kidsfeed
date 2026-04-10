export function describeApiFetchFailure(error, fallbackMessage) {
  const msg = error?.message ?? '';
  if (msg === 'Failed to fetch' || error?.name === 'TypeError') {
    return 'Could not reach the API (network). Try: (1) run the backend on port 3000 and set VITE_API_URL=http://localhost:3000 in frontend/.env, or (2) remove VITE_API_URL to use the Vite dev proxy. Deployed hosts may be asleep on first request.';
  }
  return msg || fallbackMessage;
}
