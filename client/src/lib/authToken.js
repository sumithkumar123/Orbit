// client/src/lib/authToken.js
export function getToken() {
  // Try common keys—update this to your real key if different
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('jwt') ||
    localStorage.getItem('authToken') ||
    ''
  );
}
