import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { sound } from '../utils/audioSynth';
import { Zap, Shield, Trophy, ArrowRight, User, Sparkles } from 'lucide-react';

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
    sound.playClick();
    setError('');
    setSuccess('');
    setSubmitting(true);
    const { error: err } = await signIn(loginEmail, loginPassword);
    if (err) {
      setError(err);
    } else {
      sound.playVictorySound();
      if (onLogin) {
        onLogin({ email: loginEmail });
      }
    }
    setSubmitting(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
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
      sound.playVictorySound();
      if (onSignUp) {
        onSignUp({
          email: regEmail,
          managerName: regName || regUsername,
          clubName: regClub || `${regName || regUsername} FC`,
          badgeIcon: selectedBadge
        });
      }
      setSuccess('Account created successfully! Welcome to ZeroBallKnowledge Football Arena.');
    }
    setSubmitting(false);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    setError('');
    setSubmitting(true);
    const { error: err } = await resetPassword(resetEmail);
    if (err) setError(err);
    else setSuccess('Password reset email sent! Check your inbox.');
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A14] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-[#00E5FF] border-t-transparent rounded-full animate-spin mx-auto shadow-glow-cyan" />
          <p className="text-[#00E5FF] font-bold text-xs tracking-widest uppercase font-display text-glow-cyan">
            ZEROBALLKNOWLEDGE SYNCING...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A14] flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Cyber Grid background */}
      <div className="fixed inset-0 cyber-grid-bg opacity-30 pointer-events-none" />
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#00E5FF]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* ZeroBallKnowledge Logo mark */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#00E5FF] to-blue-600 rounded-3xl mb-4 shadow-glow-cyan border border-[#00E5FF]/60 animate-pulse-glow">
            <span className="text-3xl text-slate-950 font-black">⚡</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wider uppercase font-display text-glow-cyan">
            ZEROBALLKNOWLEDGE
          </h1>
          <div className="flex items-center justify-center gap-2 mt-1.5 flex-wrap">
            <span className="text-slate-400 text-xs font-bold tracking-wider uppercase">
              REAL-TIME MULTIPLAYER FOOTBALL AUCTION BATTLE
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-950/60 border border-[#00E5FF]/30 text-[10px] font-medium shadow-[0_0_10px_rgba(0,229,255,0.18)]">
              <span className="text-slate-400 lowercase font-normal text-[9px]">by</span>
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] via-cyan-300 to-sky-400">
                Rahil Kirtikar
              </span>
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#0E1324] border border-[#00E5FF]/30 rounded-3xl shadow-glow-cyan overflow-hidden backdrop-blur-xl">
          {/* Tabs */}
          <div className="flex border-b border-slate-800">
            <button
              onClick={() => { setMode('signin'); setError(''); setSuccess(''); }}
              className={`flex-1 py-4 text-xs font-black uppercase tracking-wider transition-colors font-display ${
                mode === 'signin' ? 'text-[#00E5FF] border-b-2 border-[#00E5FF] bg-[#00E5FF]/10 text-glow-cyan' : 'text-slate-400 hover:text-white'
              }`}
            >
              MANAGER SIGN IN
            </button>
            <button
              onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
              className={`flex-1 py-4 text-xs font-black uppercase tracking-wider transition-colors font-display ${
                mode === 'signup' ? 'text-[#00E5FF] border-b-2 border-[#00E5FF] bg-[#00E5FF]/10 text-glow-cyan' : 'text-slate-400 hover:text-white'
              }`}
            >
              CREATE ROSTER
            </button>
          </div>

          <div className="p-6">
            {/* Error / Success */}
            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-bold">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-[#00E5FF]/10 border border-[#00E5FF]/40 rounded-xl text-[#00E5FF] text-xs font-bold text-glow-cyan">
                {success}
              </div>
            )}

            {/* SIGN IN */}
            {mode === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1 tracking-wider">Email or Username</label>
                  <input
                    type="text"
                    required
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    placeholder="you@example.com or username"
                    className="w-full bg-[#0A0A14] border border-slate-700 rounded-xl px-3.5 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#00E5FF] transition text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1 tracking-wider">Password</label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#0A0A14] border border-slate-700 rounded-xl px-3.5 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#00E5FF] transition text-sm font-medium"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-gradient-to-r from-[#00E5FF] to-blue-600 hover:from-[#2EE6FF] hover:to-blue-500 text-slate-950 font-black rounded-xl transition shadow-glow-cyan disabled:opacity-50 uppercase tracking-wider text-xs active:scale-95"
                >
                  {submitting ? 'CONNECTING...' : 'ENTER ARENA'}
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('reset'); setError(''); setSuccess(''); }}
                  className="w-full text-center text-xs text-slate-500 hover:text-[#00E5FF] transition pt-1"
                >
                  Forgot your password?
                </button>
              </form>
            )}

            {/* SIGN UP */}
            {mode === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={e => setRegName(e.target.value)}
                      placeholder="Alex Ferguson"
                      className="w-full bg-[#0A0A14] border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-[#00E5FF] text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Username</label>
                    <input
                      type="text"
                      required
                      value={regUsername}
                      onChange={e => setRegUsername(e.target.value)}
                      placeholder="manager99"
                      className="w-full bg-[#0A0A14] border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-[#00E5FF] text-xs font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Club Name</label>
                  <input
                    type="text"
                    value={regClub}
                    onChange={e => setRegClub(e.target.value)}
                    placeholder="e.g. Cyber City FC"
                    className="w-full bg-[#0A0A14] border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-[#00E5FF] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-[#0A0A14] border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-[#00E5FF] text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Password</label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#0A0A14] border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-[#00E5FF] text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Confirm</label>
                    <input
                      type="password"
                      required
                      value={regConfirm}
                      onChange={e => setRegConfirm(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#0A0A14] border border-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-[#00E5FF] text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">Club Crest</label>
                  <div className="grid grid-cols-6 gap-1.5">
                    {BADGES.map(b => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setSelectedBadge(b)}
                        className={`aspect-square flex items-center justify-center text-lg rounded-xl border transition ${
                          selectedBadge === b ? 'border-[#00E5FF] bg-[#00E5FF]/20 shadow-glow-cyan' : 'border-slate-800 bg-[#0A0A14]'
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
                  className="w-full py-3.5 bg-gradient-to-r from-[#00E5FF] to-blue-600 hover:from-[#2EE6FF] hover:to-blue-500 text-slate-950 font-black rounded-xl transition shadow-glow-cyan disabled:opacity-50 uppercase tracking-wider text-xs active:scale-95"
                >
                  {submitting ? 'INITIALIZING...' : 'CREATE MANAGER ACCOUNT'}
                </button>
              </form>
            )}

            {/* RESET PASSWORD */}
            {mode === 'reset' && (
              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Your Email</label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-[#0A0A14] border border-slate-700 rounded-xl px-3.5 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#00E5FF] text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-[#00E5FF] hover:bg-[#2EE6FF] text-slate-950 font-black rounded-xl uppercase tracking-wider text-xs shadow-glow-cyan"
                >
                  SEND RESET LINK
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="w-full text-center text-xs text-slate-500 hover:text-white"
                >
                  Back to Sign In
                </button>
              </form>
            )}

            {/* Guest Pass / Instant Demo Entry */}
            {onContinueGuest && (
              <div className="mt-5 pt-5 border-t border-slate-800 text-center">
                <button
                  onClick={() => {
                    sound.playClick();
                    onContinueGuest();
                  }}
                  className="w-full py-3 bg-[#0A0A14] hover:bg-slate-800 text-[#00E5FF] border border-[#00E5FF]/40 rounded-xl font-black text-xs uppercase tracking-wider transition shadow-glow-cyan flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4 text-[#00E5FF]" />
                  <span>CONTINUE AS GUEST / DEMO PASS</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
