import React, { useState } from "react";
import { Sparkles, Eye, EyeOff, UserRound, Lock, Mail, ArrowLeft } from "lucide-react";
import { auth } from "../data/storage.js";

export function LoginPage({ onLogin, onGoSignup, onBack, t }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please fill all fields"); return; }
    setLoading(true);
    setTimeout(() => {
      const result = auth.login(email, password);
      setLoading(false);
      if (result.error) setError(result.error);
      else onLogin(result.user);
    }, 600);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {onBack && (
          <button type="button" className="auth-back-top-btn" onClick={onBack} aria-label={t.backToStore || "Back to Store"}>
            <ArrowLeft size={16} /> <span>{t.backToStore || "Back to Store"}</span>
          </button>
        )}
        <div className="auth-brand">
          <div className="brand-mark"><Sparkles size={19} /></div>
          <span>NEXA</span><b>AI</b>
        </div>
        <h2>{t.loginTitle}</h2>
        <p className="auth-sub">{t.loginSub}</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <label>{t.email}
            <div className="auth-input-wrap">
              <Mail size={15} />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
            </div>
          </label>
          <label>{t.password}
            <div className="auth-input-wrap">
              <Lock size={15} />
              <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
              <button type="button" className="show-pass" onClick={() => setShowPass(s => !s)} aria-label="Toggle password">{showPass ? <EyeOff size={14} /> : <Eye size={14} />}</button>
            </div>
          </label>
          <button className="primary-button auth-btn" type="submit" disabled={loading}>{loading ? "..." : t.login}</button>
        </form>
        <p className="auth-switch">{t.noAccount} <button onClick={onGoSignup}>{t.signup}</button></p>

        <div className="demo-credentials-box">
          <span className="demo-credentials-title">⚡ {t.demoCredentials || "Quick Demo Logins (Click to autofill):"}</span>
          <div className="demo-credentials-btns">
            <button
              type="button"
              className="demo-credential-chip admin-chip"
              onClick={() => {
                setEmail("admin@nexa.com");
                setPassword("admin123");
                setError("");
              }}
            >
              🛡️ <strong>Admin</strong>: admin@nexa.com / admin123
            </button>
            <button
              type="button"
              className="demo-credential-chip user-chip"
              onClick={() => {
                setEmail("user@nexa.com");
                setPassword("user123");
                setError("");
              }}
            >
              👤 <strong>User</strong>: user@nexa.com / user123
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SignupPage({ onLogin, onGoLogin, onBack, t }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!name || !email || !password || !confirm) { setError("Please fill all fields"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    setTimeout(() => {
      const result = auth.register(email, password, name);
      setLoading(false);
      if (result.error) setError(result.error);
      else onLogin(result.user);
    }, 600);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {onBack && (
          <button type="button" className="auth-back-top-btn" onClick={onBack} aria-label={t.backToStore || "Back to Store"}>
            <ArrowLeft size={16} /> <span>{t.backToStore || "Back to Store"}</span>
          </button>
        )}
        <div className="auth-brand">
          <div className="brand-mark"><Sparkles size={19} /></div>
          <span>NEXA</span><b>AI</b>
        </div>
        <h2>{t.signupTitle}</h2>
        <p className="auth-sub">{t.signupSub}</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <label>{t.fullName}
            <div className="auth-input-wrap">
              <UserRound size={15} />
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Sharvari Pawar" autoComplete="name" />
            </div>
          </label>
          <label>{t.email}
            <div className="auth-input-wrap">
              <Mail size={15} />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
            </div>
          </label>
          <label>{t.password}
            <div className="auth-input-wrap">
              <Lock size={15} />
              <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" autoComplete="new-password" />
              <button type="button" className="show-pass" onClick={() => setShowPass(s => !s)} aria-label="Toggle password">{showPass ? <EyeOff size={14} /> : <Eye size={14} />}</button>
            </div>
          </label>
          <label>{t.confirmPassword}
            <div className="auth-input-wrap">
              <Lock size={15} />
              <input type={showPass ? "text" : "password"} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat password" autoComplete="new-password" />
            </div>
          </label>
          <button className="primary-button auth-btn" type="submit" disabled={loading}>{loading ? "..." : t.signup}</button>
        </form>
        <p className="auth-switch">{t.alreadyAccount} <button onClick={onGoLogin}>{t.login}</button></p>
      </div>
    </div>
  );
}
