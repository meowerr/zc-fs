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
          {/* Tab Selector: Login vs Register */}
          <div className="grid grid-cols-2 p-1 rounded-lg bg-cyber-bg-alt border border-cyber-border mb-5">
            <button
              type="button"
              onClick={() => { setIsLoginTab(true); setError(null); }}
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
              onClick={() => { setIsLoginTab(false); setError(null); }}
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

          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-2.5 rounded-lg bg-accent-red/10 border border-accent-red/30 text-accent-red flex items-start gap-2 text-xs font-sans animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="leading-snug">{error}</div>
            </div>
          )}

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
                disabled={loading}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                {loading ? 'AUTHENTICATING...' : isLoginTab ? 'LOG IN TO PITLANE' : 'REGISTER FOR PITLANE'}
              </GlossyButton>
            </div>
          </form>

          {/* Domain Security Badge */}
          <div className="mt-5 pt-3.5 border-t border-cyber-border flex items-center justify-center gap-1.5 text-[10px] font-mono text-cyber-muted">
            <ShieldCheck className="w-3.5 h-3.5 text-accent-lime" />
            <span>Server-side restricted to @{UNIVERSITY_DOMAIN}</span>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
