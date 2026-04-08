export const fetchApi = async ({ url, getToken, options = {} }) => {
  const headers = new Headers(options.headers || {});

  if (getToken) {
    const token = await getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  return fetch(url, {
    ...options,
    headers,
  });
};
