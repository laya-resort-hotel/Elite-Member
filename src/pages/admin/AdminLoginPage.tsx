import { useState } from "react";
import { useAuth } from "../../app/providers/AuthProvider";

export default function AdminLoginPage() {
  const { signInAdmin, isLoading } = useAuth();
  const [employeeId, setEmployeeId] = useState("9001");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    try {
      await signInAdmin(employeeId, password);
    } catch {
      setError("Unable to sign in. Please verify employee ID and password.");
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="auth-card__eyebrow">LAYA Resident Admin</p>
        <h1>Staff Sign In</h1>

        <form className="form-stack" onSubmit={handleSubmit}>
          <input
            placeholder="Employee ID"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
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
          <p>Employee ID: 9001</p>
          <p>Password: demo123</p>
        </div>
      </div>
    </div>
  );
}
