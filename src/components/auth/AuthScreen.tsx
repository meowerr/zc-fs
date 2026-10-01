import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  AlertCircle, 
  ArrowRight,
  Gauge,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlossyButton } from '../common/GlossyButton';
import { GlowInput } from '../common/GlowInput';
import { UNIVERSITY_DOMAIN, isUniversityEmail } from '../../hooks/useAuth';
import { IS_GOOGLE_AUTH_ENABLED, IS_AUTH_EMAIL_ENABLED } from '../../config/authFeatures';

interface AuthScreenProps {
  onLogin: (email: string, password?: string) => Promise<void>;
  onSignup: (email: string, password: string, fullName: string) => Promise<void>;
  onGoogleSignIn?: () => Promise<void>;
  authError?: string | null;
  onClearError?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLogin,
  onSignup,
  onGoogleSignIn,
  authError,
  onClearError,
}) => {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // If Google auth is enabled, keep secondary email form collapsed initially
  const [showEmailForm, setShowEmailForm] = useState(!IS_GOOGLE_AUTH_ENABLED);

  const activeError = authError || localError;

  const handleClearError = () => {
    setLocalError(null);
    if (onClearError) onClearError();
  };

  const handleGoogleClick = async () => {
    if (isGoogleLoading || loading || !onGoogleSignIn) return;
    handleClearError();
    setIsGoogleLoading(true);
    try {
      await onGoogleSignIn();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed';
      setLocalError(msg);
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    handleClearError();

    // University domain client-side validation
    if (!isUniversityEmail(email)) {
      setLocalError(`Access is restricted to official university accounts (@${UNIVERSITY_DOMAIN}).`);
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      if (isLoginTab) {
        await onLogin(email, password);
      } else {
        if (!fullName.trim()) {
          setLocalError('Please provide your full engineering name.');
          setLoading(false);
          return;
        }
        await onSignup(email, password, fullName);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setLocalError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAppendDomain = () => {
    const prefix = email.split('@')[0];
    if (prefix) {
      setEmail(`${prefix}@${UNIVERSITY_DOMAIN}`);
      handleClearError();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-cyber-bg text-cyber-primary">
      {/* Background Subtle Tech-Grid Texture */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `radial-gradient(currentColor 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}
      />

      <div className="w-full max-w-md relative z-10 space-y-4">
        {/* Main Brand Header */}
        <div className="text-center space-y-2 mb-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-cyber-bg-alt border border-cyber-border font-mono text-xs shadow-cyber-sm">
            <Gauge className="w-3.5 h-3.5 text-accent-cyan animate-pulse" />
            <span className="font-bold tracking-wider text-cyber-primary uppercase">
              PitLane Telemetry v1.0
            </span>
          </div>

          <h1 className="font-display font-black text-2xl sm:text-3xl text-cyber-primary uppercase tracking-wider">
            Zewail City Racing
          </h1>
          <p className="text-xs sm:text-sm font-sans text-cyber-secondary">
            Formula Student Engineering & Project Workspace
          </p>
        </div>

        {/* Auth Glass Card */}
        <GlassCard variant="elevated" className="p-6 sm:p-7 border-cyber-border-strong shadow-cyber-elevated">
          {/* Error Banner */}
          {activeError && (
            <div className="mb-4 p-2.5 rounded-lg bg-accent-red/10 border border-accent-red/30 text-accent-red flex items-start gap-2 text-xs font-sans animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="leading-snug flex-1">{activeError}</div>
              <button
                type="button"
                onClick={handleClearError}
                className="text-[10px] uppercase font-mono text-accent-red hover:underline ml-1 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Primary Action: Google Sign-In */}
          {IS_GOOGLE_AUTH_ENABLED && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={isGoogleLoading || loading}
                aria-label="Continue with Google"
                className="w-full min-h-[48px] px-4 py-3 rounded-lg font-sans font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-900 border border-slate-200/80 shadow-cyber-sm active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {isGoogleLoading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-slate-900 border-t-transparent animate-spin" />
                    <span className="font-mono text-xs tracking-wider uppercase font-bold text-slate-900">
                      Redirecting to Google...
                    </span>
                  </>
                ) : (
                  <>
                    {/* Official Multi-Color Google "G" SVG Mark */}
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span className="tracking-wide">Continue with Google</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Secondary Option: Email / Password Authentication */}
          {IS_AUTH_EMAIL_ENABLED && (
            <div className="mt-4">
              {IS_GOOGLE_AUTH_ENABLED && (
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-cyber-border" />
                  </div>
                  <div className="relative flex justify-center text-[11px] font-mono uppercase tracking-wider">
                    <button
                      type="button"
                      onClick={() => setShowEmailForm((prev) => !prev)}
                      className="bg-cyber-surface px-2.5 py-0.5 rounded text-cyber-muted hover:text-cyber-primary flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>{showEmailForm ? 'Hide Email Sign-in' : 'Use email instead'}</span>
                      {showEmailForm ? (
                        <ChevronUp className="w-3 h-3 text-accent-cyan" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-accent-cyan" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {showEmailForm && (
                <div className="space-y-4 animate-fade-in pt-1">
                  {/* Tab Selector: Login vs Register */}
                  <div className="grid grid-cols-2 p-1 rounded-lg bg-cyber-bg-alt border border-cyber-border mb-3">
                    <button
                      type="button"
                      onClick={() => { setIsLoginTab(true); handleClearError(); }}
                      className={`
                        py-1.5 text-xs font-mono font-bold uppercase rounded transition-all cursor-pointer
                        ${isLoginTab 
                          ? 'bg-accent-cyan text-black shadow-sm font-bold' 
                          : 'text-cyber-secondary hover:text-cyber-primary'}
                      `}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => { setIsLoginTab(false); handleClearError(); }}
                      className={`
                        py-1.5 text-xs font-mono font-bold uppercase rounded transition-all cursor-pointer
                        ${!isLoginTab 
                          ? 'bg-accent-cyan text-black shadow-sm font-bold' 
                          : 'text-cyber-secondary hover:text-cyber-primary'}
                      `}
                    >
                      Register
                    </button>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-3.5">
                    {!isLoginTab && (
                      <div>
                        <label className="block text-xs font-mono font-semibold uppercase text-cyber-secondary mb-1">
                          Full Name
                        </label>
                        <GlowInput
                          icon={<User className="w-4 h-4" />}
                          placeholder="e.g. Mostafa Ibrahim"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required={!isLoginTab}
                        />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-mono font-semibold uppercase text-cyber-secondary">
                          University Email
                        </label>
                        {!email.includes('@') && email.length > 2 && (
                          <button
                            type="button"
                            onClick={handleAppendDomain}
                            className="text-[10px] font-mono text-accent-cyan hover:underline cursor-pointer"
                          >
                            +@{UNIVERSITY_DOMAIN}
                          </button>
                        )}
                      </div>
                      <GlowInput
                        type="email"
                        icon={<Mail className="w-4 h-4" />}
                        placeholder={`username@${UNIVERSITY_DOMAIN}`}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-semibold uppercase text-cyber-secondary mb-1">
                        Password
                      </label>
                      <GlowInput
                        type="password"
                        icon={<Lock className="w-4 h-4" />}
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>

                    <div className="pt-2">
                      <GlossyButton
                        type="submit"
                        variant="primary"
                        size="lg"
                        fullWidth
                        disabled={loading || isGoogleLoading}
                        icon={<ArrowRight className="w-4 h-4" />}
                      >
                        {loading ? 'AUTHENTICATING...' : isLoginTab ? 'LOG IN TO PITLANE' : 'REGISTER FOR PITLANE'}
                      </GlossyButton>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Domain Security Badge */}
          <div className="mt-5 pt-3.5 border-t border-cyber-border flex items-center justify-center gap-1.5 text-[11px] font-mono text-cyber-muted">
            <ShieldCheck className="w-3.5 h-3.5 text-accent-lime shrink-0" />
            <span>Server-side restricted to @{UNIVERSITY_DOMAIN}</span>
          </div>

          {/* Minimal Privacy / Terms Links in Footer */}
          <div className="mt-3 flex items-center justify-center gap-2 text-[11px] font-sans text-cyber-muted">
            <a 
              href="/privacy" 
              className="hover:text-accent-cyan transition-colors underline-offset-2 hover:underline"
            >
              Privacy Policy
            </a>
            <span className="text-cyber-border">•</span>
            <a 
              href="/terms" 
              className="hover:text-accent-cyan transition-colors underline-offset-2 hover:underline"
            >
              Terms of Service
            </a>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
