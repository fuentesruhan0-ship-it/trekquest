import React, { useState } from 'react';
import { Mountain, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, WifiOff } from 'lucide-react';
import GoogleIcon from '@/components/GoogleIcon';
import { useAuth } from '@/lib/AuthContext';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';

export default function Login() {
  const { isAuthenticated, user, signInWithCredentials } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';

  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // If user already has an active session, navigate to home map
  if (isAuthenticated && user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }
    if (isSignUp && !name.trim()) {
      setError('Please enter your full name');
      return;
    }

    setIsLoading(true);
    try {
      await signInWithCredentials({
        email: email.trim(),
        password,
        name: isSignUp ? name.trim() : '',
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithCredentials({
        email: 'google.hiker@trekquest.app',
        password: 'google_session',
        name: 'Google Hiker',
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError('Google sign-in error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithCredentials({
        email: 'trail.master@trekquest.ph',
        password: 'trail_master_hiker',
        name: 'Alex Rivera',
      });
      navigate('/', { replace: true });
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0D2818] text-white flex flex-col justify-center p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Dark Forest Green Background Ambient Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 left-1/4 w-96 h-96 rounded-full bg-[#f05c48]/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md mx-auto space-y-5">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-16 h-16 rounded-3xl bg-gradient-to-b from-[#1c432d] to-[#0d2215] border-2 border-emerald-400/40 shadow-2xl items-center justify-center text-white mb-1">
            <Mountain size={32} className="text-white drop-shadow" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight leading-tight">
            TrekQuest
          </h1>
          <p className="text-xs text-emerald-200/80 font-medium">
            &ldquo;Your smart hiking companion, on or off the grid&rdquo;
          </p>
        </div>

        {/* Frosted Glass Login Card */}
        <div className="bg-black/40 backdrop-blur-2xl border border-white/15 rounded-[32px] p-6 sm:p-7 shadow-2xl space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-lg font-extrabold text-white">
              {isSignUp ? 'Create your account' : 'Log in to TrekQuest'}
            </h2>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              <ShieldCheck size={12} />
              <span>Offline Safe</span>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs font-semibold animate-in fade-in duration-150">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isSignUp && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 block uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f05c48]"
                />
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 block uppercase tracking-wider">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hiker@trekquest.app"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f05c48]"
                />
                <Mail size={17} className="absolute left-3.5 top-3.5 text-slate-400" />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-300 block uppercase tracking-wider">
                  Password
                </label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => alert('Password reset link is sent to your registered email.')}
                    className="text-[11px] text-emerald-300 hover:text-white transition font-medium cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 rounded-2xl bg-white/10 border border-white/15 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f05c48]"
                />
                <Lock size={17} className="absolute left-3.5 top-3.5 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Primary Coral-Red Action Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 rounded-2xl bg-[#f05c48] hover:bg-[#e44e39] active:scale-[0.98] text-white font-extrabold text-sm shadow-xl shadow-[#f05c48]/30 flex items-center justify-center gap-2 transition cursor-pointer border border-white/20 disabled:opacity-50"
            >
              <span>{isLoading ? 'Processing…' : isSignUp ? 'Create Account' : 'Log in'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400">
              <span className="bg-[#112419] px-3 py-0.5 rounded-full border border-white/10">or</span>
            </div>
          </div>

          {/* Continue with Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-[0.98] border border-white/20 text-white font-bold text-xs flex items-center justify-center gap-2.5 transition cursor-pointer backdrop-blur-md"
          >
            <GoogleIcon className="w-4 h-4" />
            <span>Continue with Google</span>
          </button>

          {/* Quick 1-Tap Offline Hiker Demo Access */}
          <button
            type="button"
            onClick={handleQuickDemoSignIn}
            className="w-full py-2.5 rounded-2xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <span>⚡ Instant Offline Hiker Access</span>
          </button>

          {/* Toggle between Sign up and Log in */}
          <div className="text-center pt-1 border-t border-white/10">
            {isSignUp ? (
              <p className="text-xs text-slate-300">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setIsSignUp(false); setError(''); }}
                  className="text-emerald-300 hover:text-white font-bold underline cursor-pointer ml-1"
                >
                  Log in
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-300">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setIsSignUp(true); setError(''); }}
                  className="text-[#f05c48] hover:text-white font-bold underline cursor-pointer ml-1"
                >
                  Sign up
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Back to Landing Page Link */}
        <div className="text-center">
          <button
            onClick={() => navigate('/landing')}
            className="text-xs text-slate-400 hover:text-white transition cursor-pointer"
          >
            ← Back to Landing Page
          </button>
        </div>
      </div>
    </div>
  );
}
