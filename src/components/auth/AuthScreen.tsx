import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  AlertCircle, 
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { GlassCard } from '../common/GlassCard';
import { GlossyButton } from '../common/GlossyButton';
import { GlowInput } from '../common/GlowInput';
import { UNIVERSITY_DOMAIN, isUniversityEmail } from '../../hooks/useAuth';

interface AuthScreenProps {
  onLogin: (email: string, password?: string) => Promise<void>;
  onSignup: (email: string, password: string, fullName: string) => Promise<void>;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLogin,
  onSignup,
}) => {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // University domain client-side validation
    if (!isUniversityEmail(email)) {
      setError(`Access is restricted to official university accounts (@${UNIVERSITY_DOMAIN}).`);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      if (isLoginTab) {
        await onLogin(email, password);
      } else {
        if (!fullName.trim()) {
          setError('Please enter your full name.');
          setLoading(false);
          return;
        }
        await onSignup(email, password, fullName);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAppendDomain = () => {
    const prefix = email.split('@')[0];
    if (prefix) {
      setEmail(`${prefix}@${UNIVERSITY_DOMAIN}`);
      setError(null);
    }
  };

  const switchMode = (login: boolean) => {
    setIsLoginTab(login);
    setError(null);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden bg-cyber-bg text-cyber-primary">
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.04] dark:opacity-[0.06]"
        style={{ backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '20px 20px' }}
        aria-hidden="true"
      />
      <div
        className="fixed -top-40 left-1/2 -translate-x-1/2 w-[640px] h-[640px] rounded-full bg-accent-cyan/10 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="w-full max-w-md relative z-10 space-y-6">
        <div className="text-center space-y-3">
          <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-xl bg-cyber-surface border border-accent-cyan/60 shadow-cyber-sm" aria-hidden="true">
            <span className="font-display font-black text-accent-cyan text-lg tracking-tighter">ZC</span>
          </div>
          <div className="space-y-1.5">
            <h1 className="font-display font-black text-2xl sm:text-3xl text-cyber-primary uppercase tracking-wider">
              PitLane
            </h1>
            <p className="text-sm text-cyber-secondary">
              Zewail City Formula Student · engineering workspace
            </p>
          </div>
        </div>

        <GlassCard variant="elevated" cornerMark={false} className="p-5 sm:p-7 border-cyber-border-strong shadow-cyber-elevated">
          <div role="tablist" aria-label="Account" className="grid grid-cols-2 p-1 rounded-lg bg-cyber-bg-alt border border-cyber-border mb-6">
            {[
              { login: true, label: 'Sign in' },
              { login: false, label: 'Create account' },
            ].map((tab) => {
              const selected = isLoginTab === tab.login;
              return (
                <button
                  key={tab.label}
                  type="button"
                  role="tab"
                  id={`auth-tab-${tab.login ? 'login' : 'register'}`}
                  aria-selected={selected}
                  aria-controls="auth-panel"
                  onClick={() => switchMode(tab.login)}
                  className={`h-10 text-sm font-semibold rounded-md transition-colors duration-fast cursor-pointer ${
                    selected ? 'bg-cyber-surface text-cyber-primary shadow-cyber-sm border border-cyber-border' : 'text-cyber-secondary hover:text-cyber-primary'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div id="auth-panel" role="tabpanel" aria-labelledby={`auth-tab-${isLoginTab ? 'login' : 'register'}`}>
            {error && (
              <div role="alert" className="mb-5 p-3 rounded-lg bg-accent-red/10 border border-accent-red/30 text-accent-red flex items-start gap-2 text-sm animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <p className="leading-snug">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {!isLoginTab && (
                <GlowInput
                  label="Full name"
                  icon={<User className="w-4 h-4" />}
                  placeholder="e.g. Mostafa Ibrahim"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              )}

              <div className="space-y-1.5">
                <GlowInput
                  label="University email"
                  type="email"
                  inputMode="email"
                  autoComplete={isLoginTab ? 'username' : 'email'}
                  autoCapitalize="none"
                  spellCheck={false}
                  icon={<Mail className="w-4 h-4" />}
                  placeholder={`username@${UNIVERSITY_DOMAIN}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                {!email.includes('@') && email.length > 2 && (
                  <button
                    type="button"
                    onClick={handleAppendDomain}
                    className="h-8 px-2 -ml-2 rounded-md text-xs font-mono text-accent-cyan hover:bg-accent-cyan/10 transition-colors duration-fast cursor-pointer"
                  >
                    Use {email.split('@')[0]}@{UNIVERSITY_DOMAIN}
                  </button>
                )}
              </div>

              <GlowInput
                label="Password"
                hint={isLoginTab ? undefined : 'At least 6 characters'}
                type={showPassword ? 'text' : 'password'}
                autoComplete={isLoginTab ? 'current-password' : 'new-password'}
                icon={<Lock className="w-4 h-4" />}
                placeholder={isLoginTab ? 'Your password' : 'Create a password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    className="w-9 h-9 rounded-md flex items-center justify-center text-cyber-muted hover:text-cyber-primary hover:bg-cyber-surface-hover transition-colors duration-fast cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                  </button>
                }
              />

              <GlossyButton
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                icon={<ArrowRight className="w-4 h-4" />}
                className="!mt-6"
              >
                {loading ? (isLoginTab ? 'Signing in…' : 'Creating account…') : isLoginTab ? 'Sign in' : 'Create account'}
              </GlossyButton>
            </form>

            {!isLoginTab && (
              <p className="mt-4 text-xs text-cyber-muted text-center leading-relaxed">
                New accounts are reviewed by a club admin before you can access tasks and chat.
              </p>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-cyber-border flex items-center justify-center gap-1.5 text-xs text-cyber-muted">
            <ShieldCheck className="w-4 h-4 text-accent-lime" aria-hidden="true" />
            <span>Restricted to @{UNIVERSITY_DOMAIN} accounts</span>
          </div>
        </GlassCard>
      </div>
    </main>
  );
};
