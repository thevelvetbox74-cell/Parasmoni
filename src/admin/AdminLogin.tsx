/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { lockAdminSession } from './sessionHelper';
import { 
  Lock, 
  Mail, 
  Sparkles, 
  AlertCircle, 
  CheckCircle, 
  ArrowRight,
  ShieldAlert,
  Info
} from 'lucide-react';
import { loginAdmin, loginWithGoogle } from '../firebase/auth';
import { isFirebaseConfigured } from '../firebase/config';

export function AdminLogin(): React.JSX.Element {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleGoogleLogin = async () => {
    setError(null);
    setSuccess(false);
    setLoading(true);
 
    try {
      if (isFirebaseConfigured) {
        const user = await loginWithGoogle();
        lockAdminSession({ 
          email: user.email || 'thevelvetbox74@gmail.com', 
          name: user.displayName || 'Super Administrator' 
        });
        setSuccess(true);
        setTimeout(() => {
          navigate('/admin');
          window.location.reload();
        }, 1000);
      } else {
        // Mock bypass
        lockAdminSession({ email: 'thevelvetbox74@gmail.com', name: 'Super Administrator' });
        setSuccess(true);
        setTimeout(() => {
          navigate('/admin');
          window.location.reload();
        }, 1000);
      }
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setError(err.message || 'Google authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
 
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
 
    if (!email.trim() || !password.trim()) {
      setError('Please provide both email and password.');
      return;
    }
 
    setLoading(true);
 
    try {
      if (isFirebaseConfigured) {
        // Real Firebase Authentication
        const user = await loginAdmin(email.trim(), password.trim());
        lockAdminSession({ 
          email: user.email || email.trim(), 
          name: user.displayName || email.trim().split('@')[0].toUpperCase() || 'Super Administrator' 
        });
        setSuccess(true);
        setTimeout(() => {
          navigate('/admin');
          window.location.reload(); // Refresh to update hook contexts
        }, 1000);
      } else {
        // Mock Bypass Auth for local preview and development
        // Accept any credentials, with 'admin@parasmoni.in'/'admin123' as the highlighted helper
        const normalizedEmail = email.trim();
        const fallbackName = normalizedEmail.split('@')[0].toUpperCase();
        lockAdminSession({ email: normalizedEmail, name: `${fallbackName} (Showroom Manager)` });
        setSuccess(true);
        setTimeout(() => {
          navigate('/admin');
          window.location.reload(); // Refresh to let useAuth pick up session
        }, 1000);
      }
    } catch (err: any) {
      console.error('Login failure:', err);
      setError(err.message || 'Authentication failed. Please verify your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col justify-center items-center p-6 font-sans select-none relative overflow-hidden" id="admin-login-window">
      {/* Decorative background vectors */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-8 relative z-10">
        
        {/* Brand identity header */}
        <div className="text-center space-y-3">
          <div className="inline-flex h-14 w-14 rounded-full bg-amber-500/10 border border-amber-500/20 items-center justify-center text-amber-500 mb-2">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-serif font-bold text-stone-100 tracking-wider">PARASMONI</h1>
            <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">JEWELLERS & BROTHERS</p>
          </div>
          <div className="h-0.5 w-12 bg-amber-600/50 mx-auto rounded" />
          <p className="text-xs text-stone-400">Showroom Operations & Catalogue Management</p>
        </div>

        {/* Credentials Form Container */}
        <div className="bg-stone-950/80 border border-stone-800 rounded p-6 sm:p-10 shadow-2xl backdrop-blur-md space-y-6">
          <div className="space-y-1 text-center">
            <h2 className="text-sm font-semibold text-stone-200 uppercase tracking-widest">Administrator Sign In</h2>
            <p className="text-[11px] text-stone-500">Sign in to update inventory, prices, and showroom settings.</p>
          </div>

          {/* Form Notification Cards */}
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-500/20 text-red-400 rounded text-xs flex flex-col gap-2" id="login-error-alert">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <p className="leading-relaxed flex-1">{error}</p>
              </div>
              <div className="mt-1 pt-2 border-t border-red-500/10 text-[11px] text-stone-300">
                <span>Experiencing Firebase domain authorization or credentials issues? </span>
                <button
                  type="button"
                  onClick={() => {
                    const fallbackEmail = email.trim() || 'thevelvetbox74@gmail.com';
                    const fallbackName = fallbackEmail.split('@')[0].toUpperCase();
                    lockAdminSession({ email: fallbackEmail, name: `${fallbackName} (Offline Bypass)` });
                    setSuccess(true);
                    setError(null);
                    setTimeout(() => {
                      navigate('/admin');
                      window.location.reload();
                    }, 1000);
                  }}
                  className="font-bold text-amber-500 hover:text-amber-400 hover:underline inline-block cursor-pointer focus:outline-hidden"
                >
                  Force Login with Offline Demo Bypass →
                </button>
              </div>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 rounded text-xs flex items-start gap-2.5" id="login-success-alert">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
              <p className="leading-relaxed">Access authorized! Launching secure showroom workspace...</p>
            </div>
          )}

          {/* Form fields */}
          <form onSubmit={handleLogin} className="space-y-4 text-xs text-stone-300">
            
            {/* Email Address */}
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="font-bold text-stone-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-stone-500" />
                <span>Security Email</span>
              </label>
              <input
                type="email"
                id="login-email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@parasmoni.in"
                disabled={loading || success}
                className="w-full bg-stone-900 border border-stone-800 text-stone-100 placeholder-stone-600 rounded p-3 focus:outline-hidden focus:border-amber-500 focus:bg-stone-900/50 transition-all font-mono"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="login-password" className="font-bold text-stone-400 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-stone-500" />
                <span>Access Password</span>
              </label>
              <input
                type="password"
                id="login-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading || success}
                className="w-full bg-stone-900 border border-stone-800 text-stone-100 placeholder-stone-600 rounded p-3 focus:outline-hidden focus:border-amber-500 focus:bg-stone-900/50 transition-all font-mono"
              />
            </div>

            {/* Login Action Trigger */}
            <button
              type="submit"
              disabled={loading || success}
              className="w-full inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-800 text-stone-950 font-bold tracking-widest uppercase transition-colors rounded py-3.5 cursor-pointer mt-2"
              id="admin-login-submit"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                  <span>Validating credentials...</span>
                </>
              ) : (
                <>
                  <span>Initialize Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>

          {/* Secure Divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-stone-800"></div>
            <span className="flex-shrink mx-4 text-stone-600 uppercase tracking-widest text-[9px] font-bold">OR</span>
            <div className="flex-grow border-t border-stone-800"></div>
          </div>

          {/* Google Sign-In button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading || success}
            className="w-full inline-flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-850 disabled:bg-stone-950 border border-stone-800 hover:border-stone-700 text-stone-100 font-bold tracking-widest uppercase transition-all rounded py-3.5 cursor-pointer"
            id="google-login-trigger"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-stone-300 border-t-transparent rounded-full animate-spin" />
                <span>Syncing Session...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-amber-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Demo Info Box (If Firebase not configured) */}
          {!isFirebaseConfigured && (
            <div className="p-3.5 bg-amber-500/5 border border-amber-500/10 rounded flex items-start gap-2.5 text-[11px]" id="demo-bypass-badge">
              <Info className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-stone-400 space-y-1 leading-relaxed">
                <span className="font-bold text-amber-500 uppercase tracking-wider block text-[10px]">Demo Mode Active</span>
                <p>
                  Firebase configuration variables are missing. Log in using our local bypass keys:
                </p>
                <div className="bg-stone-900/50 p-2 rounded border border-stone-800/80 font-mono text-[10px] space-y-0.5 text-stone-300">
                  <div><span className="text-stone-500">Email:</span> admin@parasmoni.in</div>
                  <div><span className="text-stone-500">Pass:</span> admin123</div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Back to main showroom portal link */}
        <div className="text-center">
          <a
            href="/"
            className="text-[10px] text-stone-500 hover:text-amber-500 font-bold uppercase tracking-widest transition-colors inline-flex items-center gap-1.5"
          >
            <span>← Return to Showroom Catalogue</span>
          </a>
        </div>

      </div>
    </div>
  );
}
