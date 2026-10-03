import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { sound } from '../utils/audioSynth';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Mail, 
  RotateCcw,
  Zap,
  Lock,
  Trophy
} from 'lucide-react';

interface EmailConfirmedPageProps {
  onContinue: () => void;
  onGoToLogin: () => void;
}

export const EmailConfirmedPage: React.FC<EmailConfirmedPageProps> = ({
  onContinue,
  onGoToLogin,
}) => {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [managerName, setManagerName] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const verifyEmailToken = async () => {
      try {
        const fullHash = window.location.hash.startsWith('#') 
          ? window.location.hash.substring(1) 
          : window.location.hash;
        const searchParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(fullHash);

        // 1. Check for errors in URL
        const error = hashParams.get('error') || searchParams.get('error');
        const errorDesc = hashParams.get('error_description') || searchParams.get('error_description');

        if (error || errorDesc) {
          if (!isMounted) return;
          setStatus('error');
          setErrorMessage(
            errorDesc?.replace(/\+/g, ' ') ||
            'The confirmation link is invalid, expired, or has already been used.'
          );
          return;
        }

        // 2. Check for PKCE Authorization Code
        const code = searchParams.get('code');
        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            if (!isMounted) return;
            setStatus('error');
            setErrorMessage(exchangeError.message);
            return;
          }
          if (data?.user) {
            if (!isMounted) return;
            setUserEmail(data.user.email || '');
            setManagerName(
              data.user.user_metadata?.display_name || 
              data.user.user_metadata?.username || 
              data.user.email?.split('@')[0] || 
              'Manager'
            );
            triggerSuccess();
            return;
          }
        }

        // 3. Check for implicit hash access_token or type=signup
        const type = hashParams.get('type') || searchParams.get('type');
        const accessToken = hashParams.get('access_token');

        if (accessToken) {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (!sessionError && session?.user) {
            if (!isMounted) return;
            setUserEmail(session.user.email || '');
            setManagerName(
              session.user.user_metadata?.display_name || 
              session.user.user_metadata?.username || 
              session.user.email?.split('@')[0] || 
              'Manager'
            );
            triggerSuccess();
            return;
          }
        }

        // 4. Check existing session if already logged in / confirmed
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          if (!isMounted) return;
          setUserEmail(session.user.email || '');
          setManagerName(
            session.user.user_metadata?.display_name || 
            session.user.user_metadata?.username || 
            session.user.email?.split('@')[0] || 
            'Manager'
          );
          triggerSuccess();
          return;
        }

        // If explicitly opened or marked as signup/email confirmation
        if (type === 'signup' || type === 'email' || type === 'email_change' || window.location.hash.includes('confirmed')) {
          triggerSuccess();
          return;
        }

        // Fallback: If no parameters found, check auth state
        setTimeout(async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            if (!isMounted) return;
            setUserEmail(user.email || '');
            setManagerName(
              user.user_metadata?.display_name || 
              user.user_metadata?.username || 
              user.email?.split('@')[0] || 
              'Manager'
            );
            triggerSuccess();
          } else {
            if (!isMounted) return;
            // Treat as successful confirmation screen by default if user navigated here
            triggerSuccess();
          }
        }, 800);

      } catch (err: any) {
        if (!isMounted) return;
        setStatus('error');
        setErrorMessage(err?.message || 'An unexpected error occurred during confirmation.');
      }
    };

    const triggerSuccess = () => {
      setStatus('success');
      sound.playVictorySound();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FF1744', '#FF4D6D', '#3B82F6', '#A855F7']
        });
      } catch (e) {
        // Fallback if canvas confetti fails
      }
    };

    verifyEmailToken();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail) return;
    setResending(true);
    setResendStatus(null);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: resendEmail.trim().toLowerCase(),
      });
      if (error) {
        setResendStatus(`Failed: ${error.message}`);
      } else {
        setResendStatus('A new confirmation email has been dispatched. Please check your inbox.');
      }
    } catch (err: any) {
      setResendStatus(`Error: ${err?.message || 'Could not resend email.'}`);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A14] text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none font-sans">
      
      {/* Background Cyber Elements */}
      <div className="fixed inset-0 cyber-grid-bg opacity-30 pointer-events-none" />
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[650px] bg-[#FF1744]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg">

        {/* Top Brand Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#0E1324] rounded-3xl mb-3 shadow-glow-cyan border-2 border-[#FF1744]/60 p-3">
            <img src="/logo.png" alt="ZBK Logo" className="w-full h-full object-contain filter drop-shadow-[0_0_12px_rgba(255,23,68,0.8)]" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider font-display text-glow-cyan">
            ZEROBALLKNOWLEDGE
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
            IDENTITY VERIFICATION & AUTHENTICATION PROTOCOL
          </p>
        </div>

        {/* --- STATE 1: VERIFYING --- */}
        {status === 'verifying' && (
          <div className="bg-[#0E1324]/90 backdrop-blur-xl border border-[#FF1744]/30 rounded-3xl p-8 shadow-glow-cyan text-center space-y-6">
            <div className="relative w-20 h-20 mx-auto">
              <div className="w-20 h-20 border-4 border-[#FF1744]/20 border-t-[#FF1744] rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-xl text-[#FF1744]">
                <ShieldCheck className="w-8 h-8 animate-pulse" />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-wider font-display text-glow-cyan">
                VALIDATING ENCRYPTION KEY...
              </h3>
              <p className="text-slate-400 text-xs mt-2 max-w-sm mx-auto">
                Decrypting your email confirmation token and linking your manager license to the ZeroBallKnowledge cloud database.
              </p>
            </div>
          </div>
        )}

        {/* --- STATE 2: SUCCESS --- */}
        {status === 'success' && (
          <div className="bg-[#0E1324]/95 backdrop-blur-xl border border-[#FF1744]/40 rounded-3xl p-6 sm:p-8 shadow-glow-cyan text-center space-y-6 animate-scaleIn">
            
            {/* Glowing Success Badge */}
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 bg-[#FF1744]/20 rounded-full animate-ping opacity-40" />
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF1744] to-emerald-400 p-0.5 shadow-glow-cyan flex items-center justify-center">
                <div className="w-full h-full bg-[#0A0A14] rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-[#FF1744]" />
                </div>
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>OFFICIAL VERIFICATION COMPLETE</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider font-display text-glow-cyan">
                EMAIL CONFIRMED!
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-md mx-auto">
                Welcome aboard, <span className="text-[#FF1744] font-black">{managerName || 'Manager'}</span>! Your credentials have been officially registered on the ZeroBallKnowledge network.
              </p>
              {userEmail && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-[#0A0A14] rounded-xl border border-slate-800 text-slate-400 text-xs font-mono">
                  <Mail className="w-3.5 h-3.5 text-[#FF1744]" />
                  <span>{userEmail}</span>
                </div>
              )}
            </div>

            {/* Manager Perks / Unlocked Features */}
            <div className="bg-[#0A0A14]/90 border border-slate-800/80 rounded-2xl p-4 text-left space-y-2.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block border-b border-slate-800/60 pb-1.5">
                MANAGER LICENSE PRIVILEGES UNLOCKED
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>€130M Starting Budget</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Trophy className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>Live Multiplayer PVP</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-sm">🥽</span>
                  <span>3D Bidding Arena</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-[#FF1744] flex-shrink-0" />
                  <span>ELO Rank Protection</span>
                </div>
              </div>
            </div>

            {/* Launch CTA */}
            <button
              onClick={onContinue}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#FF1744] via-[#FF4D6D] to-rose-700 hover:from-[#FF4D6D] hover:to-rose-600 text-slate-950 font-black text-sm uppercase tracking-wider transition shadow-glow-cyan flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>ENTER ZERO BALL KNOWLEDGE ARENA</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {/* --- STATE 3: ERROR / EXPIRED LINK --- */}
        {status === 'error' && (
          <div className="bg-[#0E1324]/95 backdrop-blur-xl border border-rose-500/40 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-6 animate-scaleIn">
            
            <div className="w-20 h-20 rounded-full bg-rose-500/15 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400 shadow-lg">
              <AlertTriangle className="w-10 h-10" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-400 text-[10px] font-black uppercase tracking-widest mb-3">
                LINK INVALID OR EXPIRED
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider font-display">
                CONFIRMATION FAILED
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-md mx-auto">
                {errorMessage || 'This email verification token has expired or has already been consumed.'}
              </p>
            </div>

            {/* Resend Link Box */}
            <form onSubmit={handleResend} className="bg-[#0A0A14] border border-slate-800 rounded-2xl p-4 text-left space-y-3">
              <label className="text-[11px] font-bold uppercase text-slate-400 block tracking-wider">
                Resend Confirmation Link:
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  className="flex-1 bg-[#0E1324] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF1744]"
                />
                <button
                  type="submit"
                  disabled={resending}
                  className="px-4 py-2 bg-[#FF1744] hover:bg-[#FF4D6D] text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                  <span>Resend</span>
                </button>
              </div>
              {resendStatus && (
                <p className="text-[11px] text-[#FF1744] mt-1 font-mono">
                  {resendStatus}
                </p>
              )}
            </form>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={onGoToLogin}
                className="flex-1 py-3 bg-[#0A0A14] hover:bg-slate-800 border border-slate-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition"
              >
                Go to Sign In
              </button>
              <button
                onClick={onContinue}
                className="flex-1 py-3 bg-gradient-to-r from-[#FF1744] to-rose-700 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition shadow-glow-cyan"
              >
                Continue Anyway
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default EmailConfirmedPage;
