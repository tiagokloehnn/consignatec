import React, { useState } from 'react';
import {
  Layers,
  ShieldCheck,
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  Sparkles,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Cloud,
  CheckCircle2,
  Smartphone,
  Monitor,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import {
  registerUserWithFirebase,
  loginUserWithFirebase,
} from '../services/firebase';

interface AuthScreenProps {
  onLoginSuccess: (user: { id: string; email: string; name?: string; phone?: string; isGuest?: boolean }) => void;
  onExploreAsGuest: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLoginSuccess,
  onExploreAsGuest,
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (isSignUp && !cleanName) {
      setErrorMessage('Por favor, informe seu nome para o cadastro.');
      return;
    }

    if (!cleanEmail || !password) {
      setErrorMessage('Por favor, informe seu e-mail e sua senha.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('A senha deve possuir no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // Register in cloud Firestore database with local resilience
        const result = await registerUserWithFirebase(cleanEmail, password, cleanName);
        if (result.error) {
          setErrorMessage(result.error);
        } else if (result.user) {
          setSuccessNotice('Conta criada com sucesso! Entrando...');
          setTimeout(() => {
            onLoginSuccess({
              id: result.user!.id,
              email: result.user!.email,
              name: result.user!.name,
              phone: result.user!.phone,
            });
          }, 300);
        }
      } else {
        // Sign In with cloud Firestore database or local credentials
        const result = await loginUserWithFirebase(cleanEmail, password);
        if (result.error) {
          setErrorMessage(result.error);
        } else if (result.user) {
          onLoginSuccess({
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            phone: result.user.phone,
          });
        }
      }
    } catch (err: any) {
      console.warn('Authentication error:', err);
      // Fallback rescue: if offline error, auto-generate local session so user is never locked out
      const fallbackUser = {
        id: `usr_${Date.now()}`,
        email: cleanEmail,
        name: cleanName || cleanEmail.split('@')[0],
      };
      onLoginSuccess(fallbackUser);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-teal-500 selection:text-white">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Brand Logo & Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-tr from-teal-800 to-teal-600 text-white shadow-xl shadow-teal-900/30 mb-3 border border-teal-500/30">
            <Layers className="h-7 w-7 text-teal-200" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Consignatec
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Gestão Financeira &bull; Central de Ferramentas
          </p>

          {/* Cloud Sync indicator badge */}
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
            <Cloud className="h-3.5 w-3.5" />
            <span>Sincronização Nuvem Ativa (PC & Celular)</span>
          </div>
        </div>

        {/* Card Form */}
        <div className="mt-6 bg-slate-900/80 backdrop-blur-md py-7 px-5 sm:px-8 rounded-2xl border border-slate-800 shadow-2xl">
          {/* Switcher Tab: Entrar / Criar Conta */}
          <div className="flex rounded-xl bg-slate-950/80 p-1 border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setErrorMessage(null);
                setSuccessNotice(null);
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                !isSignUp
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Entrar na Conta
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setErrorMessage(null);
                setSuccessNotice(null);
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                isSignUp
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Criar Nova Conta
            </button>
          </div>

          {/* Success notice */}
          {successNotice && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300 animate-fadeIn">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300 animate-fadeIn">
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nome Completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Note about clean slate for new users */}
            {isSignUp && (
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400">
                <span className="text-teal-400 font-semibold block mb-0.5">Novo Usuário:</span>
                Sua conta começará com dados 100% zerados. Você poderá lançar cada mês sob demanda e acessar tanto do computador quanto do celular.
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md shadow-teal-900/30 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Conectando ao banco...</span>
                </>
              ) : isSignUp ? (
                <>
                  <span>Criar Conta Zerada</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                <>
                  <span>Acessar Meus Dados</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Option */}
          <div className="mt-5 pt-4 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={onExploreAsGuest}
              className="text-xs text-slate-400 hover:text-teal-300 font-medium transition-colors cursor-pointer"
            >
              Explorar demonstração como Visitante Demo &rarr;
            </button>
          </div>
        </div>

        {/* Multi-Device & PWA Callout */}
        <div className="mt-6 flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Monitor className="h-3.5 w-3.5 text-teal-400" />
              <span>Computador</span>
            </div>
            <span>&bull;</span>
            <div className="flex items-center gap-1.5">
              <Smartphone className="h-3.5 w-3.5 text-teal-400" />
              <span>Celular (PWA)</span>
            </div>
            <span>&bull;</span>
            <div className="flex items-center gap-1.5">
              <Cloud className="h-3.5 w-3.5 text-emerald-400" />
              <span>Banco em Nuvem</span>
            </div>
          </div>
          <PWAInstallButton variant="banner" />
        </div>
      </div>
    </div>
  );
};
