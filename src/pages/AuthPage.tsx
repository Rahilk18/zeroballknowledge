import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

type AuthMode = 'signin' | 'signup' | 'reset';

const BADGES = ['⚡', '🔥', '🦁', '🐉', '⭐', '🚀', '🏆', '🎯', '🦅', '💎', '🌟', '⚔️'];

interface AuthPageProps {
  onLogin?: (account: any) => void;
  onSignUp?: (account: any) => void;
  onContinueGuest?: () => void;
  savedAccounts?: any[];
}

export function AuthPage({ onLogin, onSignUp, onContinueGuest }: AuthPageProps = {}) {
  const { signIn, signUp, resetPassword, loading } = useAuth();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [selectedBadge, setSelectedBadge] = useState('⚡');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Sign In fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Sign Up fields
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regClub, setRegClub] = useState('');

  // Reset
  const [resetEmail, setResetEmail] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    const { error: err } = await signIn(loginEmail, loginPassword);
    if (err) {
      setError(err);
    } else {
      if (onLogin) {
        onLogin({ email: loginEmail });
      }
    }
    setSubmitting(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (regPassword !== regConfirm) { setError('Passwords do not match.'); return; }
    if (regPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (!regUsername.trim()) { setError('Username is required.'); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(regUsername)) { setError('Username can only contain letters, numbers, and underscores.'); return; }
    setSubmitting(true);
    const { error: err } = await signUp(regEmail, regPassword, regUsername, regName || regClub || regUsername);
    if (err) {
      setError(err);
    } else {
      // Check if logged in directly
      if (onSignUp) {
        onSignUp({
          email: regEmail,
          managerName: regName || regUsername,
          clubName: regClub || `${regName || regUsername} FC`,
          badgeIcon: selectedBadge
        });
      }
      setSuccess('Account created successfully! Welcome to Football Draft FC.');
    }
    setSubmitting(false);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const { error: err } = await resetPassword(resetEmail);
    if (err) setError(err);
    else setSuccess('Password reset email sent! Check your inbox.');
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      {/* Background pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-950/30 via-gray-950 to-gray-950" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-4 shadow-lg shadow-green-500/20">
            <span className="text-3xl">⚽</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Rahil's Football Draft FC</h1>
          <p className="text-gray-400 mt-1 text-sm">The ultimate multiplayer football manager</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-800">
            <button
              onClick={() => { setMode('signin'); setError(''); setSuccess(''); }}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                mode === 'signin' ? 'text-green-400 border-b-2 border-green-400 bg-green-400/5' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                mode === 'signup' ? 'text-green-400 border-b-2 border-green-400 bg-green-400/5' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Create Account
            </button>
          </div>

          <div className="p-6">
            {/* Error / Success */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
                {success}
              </div>
            )}

            {/* SIGN IN */}
            {mode === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Email or Username</label>
                  <input
                    type="text"
                    required
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    placeholder="you@example.com or username"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Signing in...' : 'Sign In'}
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('reset'); setError(''); setSuccess(''); }}
                  className="w-full text-center text-xs text-gray-500 hover:text-green-400 transition-colors"
                >
                  Forgot your password?
                </button>
              </form>
            )}

            {/* SIGN UP */}
            {mode === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={e => setRegName(e.target.value)}
                      placeholder="Rahil Khan"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Username</label>
                    <input
                      type="text"
                      required
                      value={regUsername}
                      onChange={e => setRegUsername(e.target.value)}
                      placeholder="rahil99"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Club Name</label>
                  <input
                    type="text"
                    value={regClub}
                    onChange={e => setRegClub(e.target.value)}
                    placeholder="e.g. Rahil FC"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Password</label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Confirm</label>
                    <input
                      type="password"
                      required
                      value={regConfirm}
                      onChange={e => setRegConfirm(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors text-sm"
                    />
                  </div>
                </div>

                {/* Badge picker */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">Team Badge</label>
                  <div className="grid grid-cols-6 gap-2">
                    {BADGES.map(b => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setSelectedBadge(b)}
                        className={`aspect-square flex items-center justify-center text-xl rounded-lg border transition-all ${
                          selectedBadge === b
                            ? 'border-green-500 bg-green-500/20'
                            : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Creating account...' : 'Create Account'}
                </button>
              </form>
            )}

            {/* RESET PASSWORD */}
            {mode === 'reset' && (
              <form onSubmit={handleReset} className="space-y-4">
                <p className="text-sm text-gray-400">Enter your email and we'll send you a link to reset your password.</p>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50"
                >
                  {submitting ? 'Sending...' : 'Send Reset Link'}
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('signin'); setError(''); setSuccess(''); }}
                  className="w-full text-center text-xs text-gray-500 hover:text-green-400 transition-colors"
                >
                  ← Back to Sign In
                </button>
              </form>
            )}
            {onContinueGuest && (
              <div className="mt-4 pt-4 border-t border-gray-800 text-center">
                <button
                  type="button"
                  onClick={onContinueGuest}
                  className="text-xs text-gray-400 hover:text-green-400 transition"
                >
                  ⚡ Skip & Continue as Guest / Demo Mode
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Rahil's Football Draft FC © 2025
        </p>
      </div>
    </div>
  );
}

export default AuthPage;
