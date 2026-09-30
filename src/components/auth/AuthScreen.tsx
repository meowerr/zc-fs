import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  AlertCircle, 
  ArrowRight,
  Gauge
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
          setError('Please provide your full engineering name.');
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-b from-chrome-100 via-chrome-50 to-chrome-100 dark:from-midnight-950 dark:via-midnight-900 dark:to-midnight-950">
      {/* Background Decorative Neon Rings */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-telemetry-blue/15 dark:bg-telemetry-blue/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-telemetry-pink/15 dark:bg-telemetry-pink/20 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-4">
        {/* Main Brand Header */}
        <div className="text-center space-y-2 mb-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 dark:bg-white/10 border border-chrome-300 dark:border-white/20 backdrop-blur-md shadow-sm">
            <Gauge className="w-4 h-4 text-telemetry-blue dark:text-telemetry-aqua animate-pulse" />
            <span className="font-mono text-xs font-bold tracking-wider text-chrome-900 dark:text-white uppercase">
              PitLane Telemetry v1.0
            </span>
          </div>

          <h1 className="font-display font-black text-2xl sm:text-3xl text-chrome-900 dark:text-white uppercase tracking-wider">
            Zewail City Racing
          </h1>
          <p className="text-xs sm:text-sm font-sans text-chrome-900/70 dark:text-white/60">
            Formula Student Engineering & Project Workspace
          </p>
        </div>

        {/* Auth Glass Card */}
        <GlassCard variant="elevated" className="p-6 sm:p-8">
          {/* Tab Selector: Login vs Register */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-black/5 dark:bg-white/5 border border-chrome-300/60 dark:border-white/10 mb-6">
            <button
              type="button"
              onClick={() => { setIsLoginTab(true); setError(null); }}
              className={`
                py-2 text-xs font-mono font-bold uppercase rounded-lg transition-all cursor-pointer
                ${isLoginTab 
                  ? 'bg-telemetry-blue text-white shadow-neon-blue' 
                  : 'text-chrome-900/70 dark:text-white/70 hover:text-chrome-900 dark:hover:text-white'}
              `}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsLoginTab(false); setError(null); }}
              className={`
                py-2 text-xs font-mono font-bold uppercase rounded-lg transition-all cursor-pointer
                ${!isLoginTab 
                  ? 'bg-telemetry-blue text-white shadow-neon-blue' 
                  : 'text-chrome-900/70 dark:text-white/70 hover:text-chrome-900 dark:hover:text-white'}
              `}
            >
              Register
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-telemetry-red/10 border border-telemetry-red/40 text-telemetry-red flex items-start gap-2.5 text-xs font-sans animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="leading-snug">{error}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLoginTab && (
              <div>
                <label className="block text-xs font-mono font-semibold uppercase text-chrome-900/70 dark:text-white/70 mb-1">
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
                <label className="block text-xs font-mono font-semibold uppercase text-chrome-900/70 dark:text-white/70">
                  University Email
                </label>
                {!email.includes('@') && email.length > 2 && (
                  <button
                    type="button"
                    onClick={handleAppendDomain}
                    className="text-[10px] font-mono text-telemetry-blue dark:text-telemetry-aqua hover:underline cursor-pointer"
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
              <label className="block text-xs font-mono font-semibold uppercase text-chrome-900/70 dark:text-white/70 mb-1">
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
                className="w-full justify-center"
                disabled={loading}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                {loading ? 'AUTHENTICATING...' : isLoginTab ? 'LOG IN TO PITLANE' : 'REGISTER FOR PITLANE'}
              </GlossyButton>
            </div>
          </form>

          {/* Domain Security Badge */}
          <div className="mt-5 pt-4 border-t border-chrome-300/60 dark:border-white/10 flex items-center justify-center gap-1.5 text-[11px] font-mono text-chrome-900/60 dark:text-white/40">
            <ShieldCheck className="w-3.5 h-3.5 text-[#8ED91E]" />
            <span>Server-side restricted to @{UNIVERSITY_DOMAIN}</span>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
