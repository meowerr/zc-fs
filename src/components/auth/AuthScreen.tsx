import React, { useState } from 'react';
import { 
  Sparkles, 
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
import { isDemoMode } from '../../lib/supabase';

interface AuthScreenProps {
  onLogin: (email: string, password?: string) => Promise<void>;
  onSignup: (email: string, password: string, fullName: string) => Promise<void>;
  onSelectDemoPersona: (email: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLogin,
  onSignup,
  onSelectDemoPersona,
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
      setError(`Access Restricted: Only @${UNIVERSITY_DOMAIN} university accounts are permitted.`);
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

  const demoAccounts = [
    { label: 'Club Admin', email: 'admin@zewailcity.edu.eg', desc: 'Oversees 5 sub-teams & approvals' },
    { label: 'Head (Vehicle Dynamics)', email: 'kareem.vd@zewailcity.edu.eg', desc: 'Creates/reviews sub-team tasks' },
    { label: 'Member (Engineer)', email: 'omar.member@zewailcity.edu.eg', desc: 'Completes & submits deliverables' },
    { label: 'Pending User', email: 'ziad.new@zewailcity.edu.eg', desc: 'Newly registered, awaiting review' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-b from-chrome-100 via-chrome-50 to-chrome-100 dark:from-midnight-950 dark:via-midnight-900 dark:to-midnight-950">
      {/* Background Decorative Neon Rings */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-telemetry-blue/15 dark:bg-telemetry-blue/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-telemetry-pink/15 dark:bg-telemetry-pink/20 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-telemetry-blue via-telemetry-aqua to-telemetry-pink shadow-neon-blue/30 p-1 mb-1">
            <div className="w-full h-full rounded-xl bg-midnight-900 flex items-center justify-center">
              <Gauge className="w-7 h-7 text-telemetry-aqua animate-pulse" />
            </div>
          </div>

          <h1 className="font-display font-black text-2xl sm:text-3xl tracking-widest text-chrome-900 dark:text-white uppercase">
            ZC PITLANE
          </h1>
          <p className="text-xs font-mono tracking-wider text-chrome-900/60 dark:text-white/60 uppercase">
            Formula Student Telemetry & Project Workspace
          </p>
        </div>

        {/* Auth Glass Card */}
        <GlassCard variant="elevated" className="p-6 sm:p-8">
          {/* Mode Switcher Tabs */}
          <div className="flex p-1 mb-6 rounded-xl bg-black/5 dark:bg-white/5 border border-chrome-300/60 dark:border-white/10">
            <button
              type="button"
              onClick={() => { setIsLoginTab(true); setError(null); }}
              className={`flex-1 py-2 rounded-lg text-xs font-display font-bold tracking-wider uppercase transition-all cursor-pointer ${
                isLoginTab
                  ? 'bg-white dark:bg-midnight-800 text-telemetry-blue dark:text-telemetry-aqua shadow-sm'
                  : 'text-chrome-900/60 dark:text-white/50 hover:text-chrome-900 dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsLoginTab(false); setError(null); }}
              className={`flex-1 py-2 rounded-lg text-xs font-display font-bold tracking-wider uppercase transition-all cursor-pointer ${
                !isLoginTab
                  ? 'bg-white dark:bg-midnight-800 text-telemetry-blue dark:text-telemetry-aqua shadow-sm'
                  : 'text-chrome-900/60 dark:text-white/50 hover:text-chrome-900 dark:hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-telemetry-red/10 border border-telemetry-red/40 text-telemetry-red text-xs font-sans flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLoginTab && (
              <GlowInput
                label="Full Name"
                placeholder="e.g. Omar Sherif"
                icon={<User className="w-4 h-4" />}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            )}

            <div>
              <GlowInput
                label="University Email"
                hint="must end in @zewailcity.edu.eg"
                type="email"
                placeholder={`username@${UNIVERSITY_DOMAIN}`}
                icon={<Mail className="w-4 h-4" />}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                required
              />
              {/* Quick auto-complete button if user typed username without domain */}
              {email && !email.includes('@') && (
                <button
                  type="button"
                  onClick={handleAppendDomain}
                  className="mt-1 text-[11px] font-mono text-telemetry-blue dark:text-telemetry-aqua hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" /> Append @{UNIVERSITY_DOMAIN}
                </button>
              )}
            </div>

            <GlowInput
              label="Password"
              type="password"
              placeholder="••••••••"
              icon={<Lock className="w-4 h-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="pt-2">
              <GlossyButton
                type="submit"
                variant="primary"
                fullWidth
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

        {/* Quick Demo Persona Shortcuts (Gated by isDemoMode) */}
        {isDemoMode && (
          <GlassCard variant="telemetry" className="p-4 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono font-bold text-chrome-900/70 dark:text-white/60 uppercase">
              <span>⚡ Instant Demo Personas</span>
              <span className="text-telemetry-aqua">Click to Test</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => onSelectDemoPersona(acc.email)}
                  className="p-2.5 rounded-xl bg-white/60 dark:bg-white/5 border border-chrome-300/60 dark:border-white/10 text-left hover:border-telemetry-blue dark:hover:border-telemetry-aqua transition-all cursor-pointer group"
                >
                  <div className="font-display font-bold text-xs text-chrome-900 dark:text-white group-hover:text-telemetry-blue dark:group-hover:text-telemetry-aqua transition-colors">
                    {acc.label}
                  </div>
                  <div className="text-[10px] text-chrome-900/50 dark:text-white/40 truncate">
                    {acc.desc}
                  </div>
                </button>
              ))}
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
};
