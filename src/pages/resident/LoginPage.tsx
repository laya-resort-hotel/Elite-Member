import { useState } from "react";
import { useAuth } from "../../app/providers/AuthProvider";

export default function LoginPage() {
  const { signInResident, isLoading } = useAuth();
  const [identifier, setIdentifier] = useState("resident@example.com");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    try {
      await signInResident(identifier, password);
    } catch {
      setError("Unable to sign in. Please check your credentials.");
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="auth-card__eyebrow">LAYA Resident</p>
        <h1>Elite Black Card</h1>
        <p className="auth-card__subtitle">
          Exclusive privileges for resident owners
        </p>

        <form className="form-stack" onSubmit={handleSubmit}>
          <input
            placeholder="Email / Member Login"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error ? <div className="warning-panel">{error}</div> : null}
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="demo-note">
          <strong>Demo login</strong>
          <p>Email: resident@example.com</p>
          <p>Password: demo123</p>
        </div>
      </div>
    </div>
  );
}
