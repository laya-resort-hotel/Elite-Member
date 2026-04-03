import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMock } from '../lib/firebase';

export default function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth();
  const [email, setEmail] = useState(useMock ? 'resident1@example.com' : '');
  const [password, setPassword] = useState(useMock ? 'demo1234' : '');
  const [error, setError] = useState('');

  if (isAuthenticated && !loading) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    }
  }

  return (
    <div className="app-bg">
      <div className="mobile-frame login-frame">
        <main className="page-content login-page">
          <section className="hero-card">
            <div className="hero-copy">
              <div className="eyebrow gold">LAYA Resident</div>
              <h2>Elite Black Card</h2>
              <p>Secure sign in for resident members and hotel operations users.</p>
            </div>
          </section>

          <section className="panel form-panel">
            <h3>Sign In</h3>
            <form className="stack-md" onSubmit={handleSubmit}>
              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="resident@example.com"
                  autoComplete="email"
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </label>
              {error ? <div className="error-text">{error}</div> : null}
              <button className="primary-button" type="submit" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
            {useMock ? (
              <p className="muted">Mock mode is enabled. Use any resident email, or include “admin” in the email to view admin access.</p>
            ) : null}
          </section>
        </main>
      </div>
    </div>
  );
}
