import React, { useState } from 'react';
import { Mountain, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Compass, Shield, UserCheck, AlertTriangle } from 'lucide-react';
import GoogleIcon from '@/components/GoogleIcon';
import { useAuth, ROLE_CONFIG } from '@/lib/AuthContext';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';

export default function Login() {
  const { isAuthenticated, user, signInWithCredentials, registerWithCredentials } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';

  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('hiker'); // 'hiker' | 'guide' | 'admin'
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

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setError('Please enter your email address');
      return;
    }
    // Basic email pattern check
    if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      setError('Please enter a valid email address (e.g., yourname@gmail.com)');
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
      if (isSignUp) {
        await registerWithCredentials({
          email: trimmedEmail,
          password,
          name: name.trim(),
          role,
        });
      } else {
        await signInWithCredentials({
          email: trimmedEmail,
          password,
        });
      }
      navigate('/', { replace: true });
    } catch (err) {
      setError(err?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      // Check if google hiker already exists, if not register, if yes sign in
      try {
        await signInWithCredentials({
          email: 'google.hiker@trekquest.app',
          password: 'google_session_pass',
        });
      } catch (e) {
        if (e.message?.includes('No account found')) {
          await registerWithCredentials({
            email: 'google.hiker@trekquest.app',
            password: 'google_session_pass',
            name: 'Google Hiker',
            role: 'hiker',
          });
        } else {
          throw e;
        }
      }
      navigate('/', { replace: true });
    } catch (err) {
      setError(err?.message || 'Google sign-in error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleDemoSignIn = async (demoRole) => {
    setIsLoading(true);
    setError('');
    const demoAccounts = {
      hiker: { email: 'hiker@trekquest.app', password: 'hiker_password' },
      guide: { email: 'trail.master@trekquest.ph', password: 'trail_master_hiker' },
      admin: { email: 'admin@trekquest.ph', password: 'admin_password' },
    };

    const target = demoAccounts[demoRole] || demoAccounts.hiker;

    try {
      await signInWithCredentials({
        email: target.email,
        password: target.password,
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err?.message || 'Failed to sign in with demo account');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0D2818] text-white flex flex-col justify-center p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Dark Forest Green Background Ambient Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 left-1/4 w-96 h-96 rounded-full bg-[#f05c48]/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md mx-auto space-y-4">
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-b from-[#1c432d] to-[#0d2215] border-2 border-emerald-400/40 shadow-2xl items-center justify-center text-white mb-0.5">
            <Mountain size={28} className="text-white drop-shadow" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
            TrekQuest
          </h1>
          <p className="text-xs text-emerald-200/80 font-medium">
            &ldquo;Your smart hiking companion, on or off the grid&rdquo;
          </p>
        </div>

        {/* Frosted Glass Login Card */}
        <div className="bg-black/45 backdrop-blur-2xl border border-white/15 rounded-[28px] p-5 sm:p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white">
                {isSignUp ? 'Create strict account' : 'Log in to TrekQuest'}
              </h2>
              <p className="text-[10px] text-slate-400">
                {isSignUp ? 'One account per email • Isolated mountain data' : 'Enter your registered email and password'}
              </p>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
              <ShieldCheck size={12} />
              <span>Role-Based</span>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-2xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs font-semibold flex items-start gap-2 animate-in fade-in duration-150">
              <AlertTriangle size={15} className="shrink-0 text-red-400 mt-0.5" />
              <div className="space-y-1">
                <p>{error}</p>
                {error.includes('already registered') && (
                  <button
                    type="button"
                    onClick={() => { setIsSignUp(false); setError(''); }}
                    className="text-emerald-300 underline font-bold text-[11px] block cursor-pointer hover:text-white"
                  >
                    Click here to switch to Log in →
                  </button>
                )}
                {error.includes('No account found') && (
                  <button
                    type="button"
                    onClick={() => { setIsSignUp(true); setError(''); }}
                    className="text-[#f05c48] underline font-bold text-[11px] block cursor-pointer hover:text-white"
                  >
                    Click here to Sign up with this email →
                  </button>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {isSignUp && (
              <>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 block uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f05c48]"
                  />
                </div>

                {/* Role Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 block uppercase tracking-wider">
                    Account Role
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('hiker')}
                      className={`p-2 rounded-xl border text-left transition cursor-pointer flex flex-col items-center justify-center text-center gap-1 ${
                        role === 'hiker'
                          ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200 shadow-md ring-1 ring-emerald-400'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      <Mountain size={16} className={role === 'hiker' ? 'text-emerald-400' : 'text-slate-400'} />
                      <span className="text-[11px] font-black">Hiker</span>
                      <span className="text-[9px] text-slate-300/80 leading-tight">Summits & GPS</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('guide')}
                      className={`p-2 rounded-xl border text-left transition cursor-pointer flex flex-col items-center justify-center text-center gap-1 ${
                        role === 'guide'
                          ? 'bg-amber-950/80 border-amber-400 text-amber-200 shadow-md ring-1 ring-amber-400'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      <Compass size={16} className={role === 'guide' ? 'text-amber-400' : 'text-slate-400'} />
                      <span className="text-[11px] font-black">Trail Guide</span>
                      <span className="text-[9px] text-slate-300/80 leading-tight">Expeditions</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('admin')}
                      className={`p-2 rounded-xl border text-left transition cursor-pointer flex flex-col items-center justify-center text-center gap-1 ${
                        role === 'admin'
                          ? 'bg-purple-950/80 border-purple-400 text-purple-200 shadow-md ring-1 ring-purple-400'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      <Shield size={16} className={role === 'admin' ? 'text-purple-400' : 'text-slate-400'} />
                      <span className="text-[11px] font-black">Park Admin</span>
                      <span className="text-[9px] text-slate-300/80 leading-tight">Safety Ops</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-emerald-200/70 italic px-1">
                    {ROLE_CONFIG[role]?.description}
                  </p>
                </div>
              </>
            )}

            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 block uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f05c48]"
                />
                <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
              </div>
              {isSignUp && (
                <p className="text-[10px] text-slate-400 px-1">
                  🔒 Strict registration: each email address can only be registered once.
                </p>
              )}
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
                    onClick={() => alert('Offline mode note: Registered passwords can be tested using the demo presets below, or enter your registered password.')}
                    className="text-[10px] text-emerald-300 hover:text-white transition font-medium cursor-pointer"
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
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f05c48]"
                />
                <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Primary Coral-Red Action Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 rounded-xl bg-[#f05c48] hover:bg-[#e44e39] active:scale-[0.98] text-white font-extrabold text-sm shadow-xl shadow-[#f05c48]/30 flex items-center justify-center gap-2 transition cursor-pointer border border-white/20 disabled:opacity-50"
            >
              <span>{isLoading ? 'Authenticating…' : isSignUp ? `Create ${ROLE_CONFIG[role]?.roleTitle || 'Hiker'} Account` : 'Log In to Account'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-[9px] uppercase font-bold text-slate-400">
              <span className="bg-[#112419] px-3 py-0.5 rounded-full border border-white/10">or explore with demo roles</span>
            </div>
          </div>

          {/* Quick 1-Tap Role Demo Sign In Buttons */}
          <div className="space-y-1.5">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center">
              Instant 1-Tap Role Access
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleRoleDemoSignIn('hiker')}
                disabled={isLoading}
                className="py-2 px-1 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold flex flex-col items-center justify-center gap-0.5 transition cursor-pointer"
              >
                <span>🏔️ Hiker</span>
                <span className="text-[8px] text-emerald-400/80 font-normal">Alex Rivera</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleDemoSignIn('guide')}
                disabled={isLoading}
                className="py-2 px-1 rounded-xl bg-amber-950/50 hover:bg-amber-900/60 border border-amber-500/30 text-amber-300 text-[10px] font-bold flex flex-col items-center justify-center gap-0.5 transition cursor-pointer"
              >
                <span>🧭 Guide</span>
                <span className="text-[8px] text-amber-400/80 font-normal">Marco V.</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleDemoSignIn('admin')}
                disabled={isLoading}
                className="py-2 px-1 rounded-xl bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 text-[10px] font-bold flex flex-col items-center justify-center gap-0.5 transition cursor-pointer"
              >
                <span>🛡️ Admin</span>
                <span className="text-[8px] text-purple-400/80 font-normal">Teresa G.</span>
              </button>
            </div>
          </div>

          {/* Continue with Google */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 active:scale-[0.98] border border-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer backdrop-blur-md"
          >
            <GoogleIcon className="w-3.5 h-3.5" />
            <span>Continue with Google</span>
          </button>

          {/* Toggle between Sign up and Log in */}
          <div className="text-center pt-2 border-t border-white/10">
            {isSignUp ? (
              <p className="text-xs text-slate-300">
                Already registered?{' '}
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
                Don&apos;t have an account yet?{' '}
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
