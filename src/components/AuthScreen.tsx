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
  Send,
  CheckCircle2,
  Inbox,
  RefreshCw,
  KeyRound,
} from 'lucide-react';
import {
  signInSupabase,
  signUpSupabase,
  resendConfirmationEmail,
  isSupabaseConfigured,
} from '../services/supabase';

interface AuthScreenProps {
  onLoginSuccess: (user: { id: string; email: string; name?: string; isGuest?: boolean }) => void;
  onExploreAsGuest: () => void;
}

interface LocalRegisteredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  confirmed: boolean;
}

const LOCAL_USERS_KEY = 'finanzen_registered_users';

function getLocalUsers(): LocalRegisteredUser[] {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalUsers(users: LocalRegisteredUser[]) {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
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
  const [showNeedsConfirmationNotice, setShowNeedsConfirmationNotice] = useState(false);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);

  // Re-sending email state
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const handleResendConfirmation = async (targetEmail: string) => {
    setResending(true);
    setResendStatus(null);
    try {
      if (isSupabaseConfigured) {
        const { success, error } = await resendConfirmationEmail(targetEmail);
        if (success) {
          setResendStatus('Novo e-mail de confirmação enviado pelo Supabase! Verifique sua caixa de entrada.');
        } else {
          setResendStatus(error || 'Não foi possível reenviar agora.');
        }
      } else {
        // Local mode confirmation simulation
        setResendStatus('Link de ativação reenviado para sua caixa postal!');
      }
    } catch {
      setResendStatus('Erro ao reenviar e-mail de confirmação.');
    } finally {
      setResending(false);
    }
  };

  const handleSimulateConfirmation = (targetEmail: string) => {
    const users = getLocalUsers();
    const updated = users.map((u) =>
      u.email.toLowerCase() === targetEmail.toLowerCase() ? { ...u, confirmed: true } : u
    );
    saveLocalUsers(updated);
    setResendStatus('E-mail validado com sucesso! Agora você já pode fazer login na sua conta.');
    setShowNeedsConfirmationNotice(false);
    setIsSignUp(false);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setResendStatus(null);

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
      if (isSupabaseConfigured) {
        // REAL SUPABASE BACKEND
        if (isSignUp) {
          const { user, needsEmailConfirmation, error } = await signUpSupabase(cleanEmail, password, cleanName);
          if (error) {
            setErrorMessage(error);
          } else if (user) {
            // STRICT BLOCK: User MUST confirm email
            setUnconfirmedEmail(cleanEmail);
            setShowNeedsConfirmationNotice(true);
            setIsSignUp(false);
            setPassword('');
          }
        } else {
          // Sign In with Supabase
          const result = await signInSupabase(cleanEmail, password);
          if (result.error) {
            setErrorMessage(result.error);
            if (result.needsConfirmation) {
              setUnconfirmedEmail(cleanEmail);
            }
          } else if (result.user) {
            const userName = (result.user.user_metadata?.full_name as string) || (result.user.user_metadata?.name as string) || cleanEmail.split('@')[0];
            onLoginSuccess({
              id: result.user.id,
              email: result.user.email || cleanEmail,
              name: userName,
            });
          }
        }
      } else {
        // LOCAL PROFILE WITH STRICT CONFIRMATION ENFORCEMENT
        const users = getLocalUsers();
        const existingUser = users.find((u) => u.email.toLowerCase() === cleanEmail);

        if (isSignUp) {
          if (existingUser) {
            if (!existingUser.confirmed) {
              setUnconfirmedEmail(cleanEmail);
              setShowNeedsConfirmationNotice(true);
              setErrorMessage('Este e-mail já possui cadastro pendente de validação. Confirme seu e-mail para acessar.');
            } else {
              setErrorMessage('Este e-mail já está cadastrado. Faça login na sua conta.');
            }
            return;
          }

          // Register new user as UNCONFIRMED
          const newUser: LocalRegisteredUser = {
            id: `usr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name: cleanName,
            email: cleanEmail,
            passwordHash: btoa(password),
            confirmed: false, // STRICTLY BLOCKED UNTIL CONFIRMED
          };

          saveLocalUsers([...users, newUser]);
          setUnconfirmedEmail(cleanEmail);
          setShowNeedsConfirmationNotice(true);
          setIsSignUp(false);
          setPassword('');
        } else {
          // Local Sign In
          if (!existingUser) {
            setErrorMessage('Usuário não encontrado. Verifique o e-mail ou crie uma nova conta.');
            return;
          }

          if (existingUser.passwordHash !== btoa(password)) {
            setErrorMessage('Senha incorreta. Tente novamente.');
            return;
          }

          // STRICT CHECK: Cannot enter if unconfirmed!
          if (!existingUser.confirmed) {
            setUnconfirmedEmail(cleanEmail);
            setErrorMessage(
              'Acesso bloqueado: E-mail não confirmado! Você precisa validar seu e-mail antes de entrar.'
            );
            return;
          }

          // User is confirmed and credentials match!
          onLoginSuccess({
            id: existingUser.id,
            email: existingUser.email,
            name: existingUser.name,
          });
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Ocorreu um erro ao processar sua solicitação.');
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
          <div className="inline-flex h-12 w-12 rounded-2xl bg-teal-800 text-emerald-300 items-center justify-center shadow-lg shadow-teal-900/30 mb-3 border border-teal-700/50">
            <Layers className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Consignatec
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Central de Ferramentas &bull; consignatec.com.br
          </p>
        </div>

        {/* Security Notice */}
        <div className="mt-6 bg-teal-950/60 border border-teal-800/60 rounded-xl p-3 text-xs text-teal-200/90 flex items-start gap-2.5">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Acesso Unificado:</strong> Faça login para acessar todo o catálogo de ferramentas e utilitários da plataforma Consignatec com segurança.
          </p>
        </div>

        {/* Confirmation Required Notice Card */}
        {showNeedsConfirmationNotice && unconfirmedEmail ? (
          <div className="mt-4 bg-slate-900/95 backdrop-blur-md p-6 sm:p-7 shadow-2xl rounded-2xl border border-teal-800/80 text-center animate-fadeIn">
            <div className="inline-flex h-14 w-14 rounded-2xl bg-teal-950 text-emerald-400 items-center justify-center border border-teal-700/60 mb-4">
              <Inbox className="h-7 w-7 animate-bounce" />
            </div>

            <h3 className="text-lg font-bold text-white mb-2">
              Confirme seu E-mail para Acessar
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Sua conta foi criada, mas o acesso está <span className="text-amber-400 font-semibold">estritamente bloqueado</span> até que o e-mail seja confirmado.
            </p>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 mb-4 break-all">
              {unconfirmedEmail}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-5">
              Enviamos um link de ativação para sua caixa de entrada. Acesse seu e-mail e clique no link para liberar seu login.
            </p>

            {resendStatus && (
              <div className="mb-4 p-3 rounded-lg bg-teal-950/60 border border-teal-700/60 text-emerald-300 text-xs flex items-center justify-center gap-2 text-left">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{resendStatus}</span>
              </div>
            )}

            <div className="space-y-2.5">
              {/* If in local mode without Supabase connected, allow simulating link click */}
              {!isSupabaseConfigured && (
                <button
                  type="button"
                  onClick={() => handleSimulateConfirmation(unconfirmedEmail)}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                >
                  <KeyRound className="h-4 w-4" />
                  <span>Simular Clique no Link do E-mail (Ativar Conta)</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleResendConfirmation(unconfirmedEmail)}
                disabled={resending}
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 bg-teal-800/80 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg border border-teal-600/50 transition-colors disabled:opacity-50"
              >
                {resending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>Reenviar Link de Confirmação</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowNeedsConfirmationNotice(false);
                  setIsSignUp(false);
                  setErrorMessage(null);
                }}
                className="w-full py-2 px-4 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Já validei meu e-mail, Ir para Login
              </button>
            </div>
          </div>
        ) : (
          /* Card Form */
          <div className="mt-4 bg-slate-900/90 backdrop-blur-md py-7 px-5 sm:px-8 shadow-2xl rounded-2xl border border-slate-800">
            {/* Tabs: Login / Cadastro */}
            <div className="flex border-b border-slate-800 pb-3 mb-5 gap-4">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setErrorMessage(null);
                  setResendStatus(null);
                }}
                className={`text-sm font-semibold pb-1.5 transition-colors relative ${
                  !isSignUp
                    ? 'text-emerald-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Entrar na Conta
                {!isSignUp && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setErrorMessage(null);
                  setResendStatus(null);
                }}
                className={`text-sm font-semibold pb-1.5 transition-colors relative ${
                  isSignUp
                    ? 'text-emerald-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Criar Nova Conta
                {isSignUp && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
                )}
              </button>
            </div>

            {/* Error Feedback */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="leading-relaxed">{errorMessage}</p>
                    {unconfirmedEmail && (
                      <div className="mt-2.5 pt-2 border-t border-rose-500/20 flex flex-col gap-1.5">
                        {!isSupabaseConfigured && (
                          <button
                            type="button"
                            onClick={() => handleSimulateConfirmation(unconfirmedEmail)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 underline"
                          >
                            <KeyRound className="h-3 w-3" />
                            <span>Simular confirmação do e-mail recebido</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleResendConfirmation(unconfirmedEmail)}
                          disabled={resending}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-amber-200 underline"
                        >
                          <RefreshCw className={`h-3 w-3 ${resending ? 'animate-spin' : ''}`} />
                          <span>Reenviar e-mail de ativação para {unconfirmedEmail}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {resendStatus && (
              <div className="mb-4 p-3 rounded-lg bg-teal-950/60 border border-teal-700/60 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{resendStatus}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Field (Only on Sign Up) */}
              {isSignUp && (
                <div className="animate-fadeIn">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nome Completo <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <UserIcon className="h-4 w-4" />
                    </div>
                    <input
                      type="text"
                      required={isSignUp}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Tiago Silva"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950/70 border border-slate-700/80 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  E-mail <span className="text-rose-400">*</span>
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
                    className="w-full pl-9 pr-3 py-2 bg-slate-950/70 border border-slate-700/80 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Senha <span className="text-rose-400">*</span>
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
                    className="w-full pl-9 pr-10 py-2 bg-slate-950/70 border border-slate-700/80 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {isSignUp && (
                <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800 text-[11px] text-slate-400">
                  <p className="leading-relaxed">
                    🔒 <strong>Segurança:</strong> O acesso é estritamente bloqueado após o cadastro até que você valide o e-mail de ativação.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-teal-700 to-teal-600 hover:from-teal-600 hover:to-teal-500 text-white text-sm font-semibold rounded-lg shadow-md shadow-teal-900/40 transition-all transform active:scale-98 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <span>{isSignUp ? 'Criar Conta e Aguardar Validação' : 'Entrar com Segurança'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Visitor / Demo Option */}
            <div className="mt-6 pt-5 border-t border-slate-800 text-center">
              <p className="text-xs text-slate-400 mb-2">
                Deseja apenas conhecer o catálogo de ferramentas?
              </p>
              <button
                type="button"
                onClick={onExploreAsGuest}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-400 hover:text-teal-300 transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                <span>Acessar Painel no Modo Demonstração</span>
              </button>
            </div>
          </div>
        )}

        {/* Database backend note */}
        <p className="text-center text-[11px] text-slate-500 mt-5">
          {isSupabaseConfigured
            ? 'Protegido por Supabase Auth & Row Level Security (RLS)'
            : 'Modo seguro com confirmação obrigatória de e-mail'}
        </p>
      </div>
    </div>
  );
};
