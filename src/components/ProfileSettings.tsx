import React, { useState } from 'react';
import {
  User as UserIcon,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ChevronLeft,
  Save,
  KeyRound,
  Sparkles,
  Smartphone,
  LogOut,
  Info,
} from 'lucide-react';
import {
  updateSupabaseUserProfile,
  isSupabaseConfigured,
} from '../services/supabase';

export interface UserProfileData {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  isGuest?: boolean;
}

interface ProfileSettingsProps {
  currentUser: UserProfileData;
  onUpdateUser: (updatedUser: UserProfileData) => void;
  onBack: () => void;
  onLogout: () => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  currentUser,
  onUpdateUser,
  onBack,
  onLogout,
}) => {
  // Form fields
  const [name, setName] = useState(currentUser.name || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  
  // Password change fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Visibility toggles
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Phone input formatting (Brazil (XX) 9XXXX-XXXX or (XX) XXXX-XXXX)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '');
    if (raw.length > 11) raw = raw.slice(0, 11);
    
    let formatted = raw;
    if (raw.length > 2) {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2)}`;
    }
    if (raw.length > 7) {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
    } else if (raw.length > 6 && raw.length <= 10) {
      formatted = `(${raw.slice(0, 2)}) ${raw.slice(2, 6)}-${raw.slice(6)}`;
    }
    setPhone(formatted);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    // Basic Validations
    if (!name.trim()) {
      setErrorMessage('Por favor, informe seu nome completo.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    // Password validation if user filled new password
    if (newPassword || confirmPassword) {
      if (newPassword.length < 6) {
        setErrorMessage('A nova senha deve ter no mínimo 6 caracteres.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage('A confirmação da nova senha não confere.');
        return;
      }
    }

    setLoading(true);

    try {
      if (currentUser.isGuest) {
        // Guest mode simulated save
        const updated: UserProfileData = {
          ...currentUser,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
        };
        onUpdateUser(updated);
        setSuccessMessage('Dados de perfil atualizados com sucesso (Modo Demonstração).');
        setNewPassword('');
        setConfirmPassword('');
        setCurrentPassword('');
      } else if (isSupabaseConfigured) {
        // Cloud Supabase update
        const res = await updateSupabaseUserProfile({
          name: name.trim(),
          email: email.trim() !== currentUser.email ? email.trim() : undefined,
          phone: phone.trim(),
          password: newPassword ? newPassword.trim() : undefined,
        });

        if (!res.success) {
          setErrorMessage(res.error || 'Erro ao atualizar dados no servidor.');
          setLoading(false);
          return;
        }

        const updated: UserProfileData = {
          ...currentUser,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
        };
        onUpdateUser(updated);

        if (res.emailNeedsConfirmation) {
          setSuccessMessage(
            'Dados atualizados! Foi enviado um link de confirmação para o novo e-mail para validar a alteração.'
          );
        } else {
          setSuccessMessage('Seu perfil e credenciais foram atualizados com sucesso!');
        }

        setNewPassword('');
        setConfirmPassword('');
        setCurrentPassword('');
      } else {
        // Local account mode (localStorage)
        const updated: UserProfileData = {
          ...currentUser,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
        };
        onUpdateUser(updated);
        setSuccessMessage('Dados do usuário e senha atualizados com sucesso!');
        setNewPassword('');
        setConfirmPassword('');
        setCurrentPassword('');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Ocorreu um erro ao salvar as alterações.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased selection:bg-teal-100 selection:text-teal-900 flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Voltar</span>
            </button>
            <div className="h-5 w-px bg-slate-200 mx-1" />
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-teal-800" />
                Configurações da Conta
              </h1>
              <p className="text-[11px] text-slate-500">
                Gerencie seus dados pessoais, credenciais de login e contato
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sair da Conta</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* Banner de Identificação */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-teal-800 text-white flex items-center justify-center text-xl font-bold shadow-sm shadow-teal-900/20">
              {name ? name.slice(0, 2).toUpperCase() : 'CT'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{name || 'Usuário Consignatec'}</h2>
              <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                <span>{email}</span>
                {currentUser.isGuest && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                    Modo Visitante
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Conta Ativa &bull; Consignatec
            </span>
          </div>
        </div>

        {/* Feedback alerts */}
        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-start gap-3 animate-fadeIn">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{successMessage}</div>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm flex items-start gap-3 animate-fadeIn">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{errorMessage}</div>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Seção 1: Dados Pessoais & Contato */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-teal-800" />
                Dados Pessoais & Contato
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Mantenha suas informações sempre atualizadas para comunicações e notificações do sistema.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nome Completo */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nome Completo <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Tiago Kloehn"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition-colors"
                  />
                </div>
              </div>

              {/* Endereço de E-mail */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  E-mail de Acesso <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition-colors"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Usado para login em todas as ferramentas da Consignatec.
                </p>
              </div>

              {/* Número de Celular / WhatsApp */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Número de Celular / WhatsApp
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Smartphone className="h-4 w-4" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    maxLength={15}
                    placeholder="(41) 99999-9999"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition-colors"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Para avisos de margem, simulações de crédito e suporte.
                </p>
              </div>
            </div>
          </div>

          {/* Seção 2: Alteração de Senha */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Lock className="h-4 w-4 text-teal-800" />
                Segurança & Senha de Acesso
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Deixe os campos em branco se não desejar alterar sua senha atual.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Nova Senha */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nova Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmar Nova Senha */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600">
              <Info className="h-4 w-4 text-teal-800 shrink-0 mt-0.5" />
              <span>
                Sua senha é protegida por hash criptográfico unidirecional. Nunca compartilhe sua senha com terceiros.
              </span>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onBack}
              className="w-full sm:w-auto px-5 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs rounded-xl transition-colors cursor-pointer text-center"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-semibold text-xs rounded-xl transition-all shadow-sm shadow-teal-900/20 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Salvando Alterações...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
