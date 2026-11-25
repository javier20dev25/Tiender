// src/pages/AdminPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, UserPlus, Trash2, ExternalLink, LogOut, Search,
  CheckCircle, Copy, AlertTriangle, Store, RefreshCw, Key,
  Clock, DollarSign, Tag, Calendar, RotateCcw, MessageCircle,
  Crown
} from 'lucide-react';
import { getSupabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabaseClient';
import { isMasterAdmin } from '../utils/admin';

const STORAGE_KEY = 'tiender_admin_users_cache';

export interface ClientUser {
  id: string;
  email: string;
  phone: string;
  created_at: string;
  must_change_password?: boolean;
  tag?: string | null;
  store: {
    id: string;
    name: string;
    slug: string;
    plan_type: string;
    product_limit?: number;
    billing_exempt?: boolean;
    trial_ends_at?: string | null;
    plan_expires_at?: string | null;
    status?: string;
    whatsapp_number: string;
    created_at?: string;
  } | null;
}

type TabType = 'all' | 'expiring' | 'expired' | 'partners';

const AdminPage: React.FC = () => {
  const navigate = useNavigate();

  // Authentication check
  const adminEmail = localStorage.getItem('tiender_admin_email');
  const isAdminAuthenticated =
    localStorage.getItem('tiender_admin_authenticated') === 'true' ||
    isMasterAdmin(adminEmail);

  useEffect(() => {
    if (!isAdminAuthenticated) {
      navigate('/auth?mode=signin');
    }
  }, [isAdminAuthenticated, navigate]);

  // State
  const [users, setUsers] = useState<ClientUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDays, setFilterDays] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Form State
  const [phone, setPhone] = useState('');
  const [storeName, setStoreName] = useState('');
  const [defaultPassword, setDefaultPassword] = useState('Tiender2026*');
  const [selectedPlan, setSelectedPlan] = useState<'standard' | 'full' | 'socio'>('standard');
  const [durationDays, setDurationDays] = useState<number>(30);
  const [customTag, setCustomTag] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createdSuccess, setCreatedSuccess] = useState<{
    phone: string;
    password: string;
    storeName: string;
    slug: string;
    plan: string;
  } | null>(null);

  // Loading actions state
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  // Helper to calculate days remaining
  const getDaysRemaining = useCallback((user: ClientUser): number => {
    if (user.store?.billing_exempt || user.store?.plan_type === 'socio') {
      return Infinity;
    }
    const expDate = user.store?.plan_expires_at || user.store?.trial_ends_at;
    if (!expDate) return 0;
    const diff = new Date(expDate).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, []);

  // Helper date formatter
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Load users from Backend Edge Function
  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    const fnUrl = `${SUPABASE_URL}/functions/v1/admin-manage-users`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const directRes = await fetch(fnUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ action: 'list' }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (directRes.ok) {
        const directData = await directRes.json();
        if (directData?.users && Array.isArray(directData.users)) {
          const filtered = directData.users.filter((u: ClientUser) => !isMasterAdmin(u.email));
          setUsers(filtered);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
          setLoading(false);
          return;
        }
      }

      // 2. Fallback via getSupabase().functions.invoke
      const { data, error: funcError } = await getSupabase().functions.invoke('admin-manage-users', {
        body: { action: 'list' }
      });

      if (!funcError && data?.users && Array.isArray(data.users)) {
        const filtered = data.users.filter((u: ClientUser) => !isMasterAdmin(u.email));
        setUsers(filtered);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        setLoading(false);
        return;
      }

      // 3. Fallback directo a base de datos
      const { data: storesData } = await getSupabase()
        .from('stores')
        .select('*')
        .order('created_at', { ascending: false });

      if (storesData && storesData.length > 0) {
        const fallbackUsers: ClientUser[] = storesData.map((s: any) => ({
          id: s.user_id,
          email: `${s.whatsapp_number}@tiender.app`,
          phone: s.whatsapp_number,
          created_at: s.created_at,
          must_change_password: false,
          tag: s.theme_color || null,
          store: {
            id: s.id,
            name: s.name,
            slug: s.slug,
            plan_type: s.plan_type || 'standard',
            product_limit: s.product_limit || (s.plan_type === 'standard' ? 10 : 30),
            billing_exempt: Boolean(s.billing_exempt || (s.trial_ends_at ? new Date(s.trial_ends_at).getFullYear() >= 2030 : false)),
            trial_ends_at: s.trial_ends_at,
            plan_expires_at: s.plan_expires_at,
            status: s.status || 'active',
            whatsapp_number: s.whatsapp_number,
            created_at: s.created_at
          }
        }));
        setUsers(fallbackUsers);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fallbackUsers));
        setLoading(false);
        return;
      }

      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        setUsers(Array.isArray(parsed) ? parsed.filter((u: ClientUser) => !isMasterAdmin(u.email)) : []);
      }
    } catch (err: unknown) {
      console.warn('[AdminPage] loadUsers error:', err);
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setUsers(Array.isArray(parsed) ? parsed.filter((u: ClientUser) => !isMasterAdmin(u.email)) : []);
        } catch {
          // ignore
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleLogout = () => {
    try {
      getSupabase().auth.signOut().catch(() => {});
    } catch {
      // ignore
    }
    localStorage.removeItem('tiender_admin_authenticated');
    localStorage.removeItem('tiender_admin_email');
    localStorage.removeItem('antigravity-auth-token');
    sessionStorage.clear();
    navigate('/auth?mode=signin');
  };

  // Crear Cliente
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !storeName.trim() || !defaultPassword.trim()) {
      setError('Por favor completa teléfono, nombre de tienda y contraseña.');
      return;
    }

    setIsCreating(true);
    setError(null);
    setCreatedSuccess(null);

    let rawDigits = phone.replace(/\D/g, '');
    const cleanPhone = rawDigits.length === 8 ? `505${rawDigits}` : rawDigits;
    const cleanStore = storeName.trim();
    const isSocio = selectedPlan === 'socio';

    const chosenTag = customTag.trim() || (isSocio ? 'Socio Marketing' : (durationDays === 7 ? 'Prueba 1 semana' : ''));

    try {
      const fnUrl = `${SUPABASE_URL}/functions/v1/admin-manage-users`;
      const res = await fetch(fnUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'create',
          payload: {
            phone: cleanPhone,
            storeName: cleanStore,
            password: defaultPassword.trim(),
            planType: isSocio ? 'socio' : selectedPlan,
            durationDays: isSocio ? 3650 : durationDays,
            billingExempt: isSocio,
            tag: chosenTag
          }
        }),
      });

      const resData = await res.json();
      if (!res.ok || resData.error) {
        throw new Error(resData.error || 'Error al crear cliente');
      }

      setCreatedSuccess({
        phone: cleanPhone,
        password: defaultPassword.trim(),
        storeName: cleanStore,
        slug: resData.user?.store?.slug || cleanStore.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        plan: isSocio ? 'Socio (Exento)' : (selectedPlan === 'standard' ? 'Emprendedor (10 prod)' : 'Business (30 prod)')
      });

      showNotification('¡Cliente y tienda activados con éxito!');
      setPhone('');
      setStoreName('');
      setDefaultPassword('Tiender2026*');
      setCustomTag('');
      loadUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsCreating(false);
    }
  };

  // Marcar Pagado (Renovar +30 días)
  const handleMarkPaid = async (storeId: string, storeName: string) => {
    setActionLoadingId(storeId);
    try {
      const fnUrl = `${SUPABASE_URL}/functions/v1/admin-manage-users`;
      const res = await fetch(fnUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'renew-plan',
          payload: { storeId, days: 30 }
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Error al renovar plan.');

      showNotification(`Pago registrado para "${storeName}". Plan renovado por +30 días.`);
      loadUsers();
    } catch (err: any) {
      alert(`Error al registrar pago: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Relanzar / Reactivar cuenta vencida
  const handleRelaunch = async (storeId: string, storeName: string) => {
    setActionLoadingId(storeId);
    try {
      const fnUrl = `${SUPABASE_URL}/functions/v1/admin-manage-users`;
      const res = await fetch(fnUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'relaunch',
          payload: { storeId }
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Error al relanzar tienda.');

      showNotification(`Tienda "${storeName}" reactivada por 30 días.`);
      loadUsers();
    } catch (err: any) {
      alert(`Error al reactivar tienda: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Editar Etiqueta
  const handleEditTag = async (user: ClientUser) => {
    const newTag = window.prompt(
      `Ingresa una etiqueta para "${user.store?.name || user.phone}":\n(Ej: "Prueba 1 semana", "Socio Marketing", "Familiar", "Influencer")`,
      user.tag || ''
    );
    if (newTag === null) return;

    setActionLoadingId(user.id);
    try {
      const fnUrl = `${SUPABASE_URL}/functions/v1/admin-manage-users`;
      const res = await fetch(fnUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'update-tag',
          payload: { userId: user.id, tag: newTag.trim() }
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Error al actualizar etiqueta.');

      showNotification('Etiqueta actualizada.');
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, tag: newTag.trim() } : u));
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Cambiar Contraseña
  const handleUpdatePassword = async (userId: string, phone: string) => {
    const newPassword = window.prompt(`Ingresa la nueva contraseña para el usuario (${phone}):`);
    if (!newPassword || !newPassword.trim()) return;

    setActionLoadingId(userId);
    try {
      const fnUrl = `${SUPABASE_URL}/functions/v1/admin-manage-users`;
      const res = await fetch(fnUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'update-password',
          payload: { userId, password: newPassword.trim() }
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Error al actualizar contraseña.');

      showNotification(`Contraseña actualizada para ${phone}.`);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Eliminar Usuario y Tienda Permanentemente
  const handleDeleteUser = async (userId: string, storeName?: string) => {
    if (!window.confirm(`¿Seguro que deseas ELIMINAR PERMANENTEMENTE a "${storeName || 'esta tienda'}"?\n\nEsta acción borrará la tienda, todos sus productos y su cuenta de usuario sin posibilidad de recuperación.`)) {
      return;
    }

    setActionLoadingId(userId);
    try {
      const fnUrl = `${SUPABASE_URL}/functions/v1/admin-manage-users`;
      await fetch(fnUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ action: 'delete', payload: { userId } })
      });
      showNotification('Cuenta y tienda eliminadas permanentemente.');
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err: any) {
      alert(`Error al eliminar: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showNotification('¡Texto copiado al portapapeles!');
  };

  // KPI Calculations
  const kpis = useMemo(() => {
    let expiringCount = 0;
    let expiredCount = 0;
    let partnersCount = 0;

    users.forEach(u => {
      const days = getDaysRemaining(u);
      if (days === Infinity) {
        partnersCount++;
      } else if (days < 0) {
        expiredCount++;
      } else if (days <= 3) {
        expiringCount++;
      }
    });

    return {
      total: users.length,
      expiring: expiringCount,
      expired: expiredCount,
      partners: partnersCount
    };
  }, [users, getDaysRemaining]);

  // Filtering Logic (Smart phone search 8 digits or 505 + name + tabs + days)
  const filteredUsers = useMemo(() => {
    const rawTerm = search.trim().toLowerCase();
    const cleanDigits = rawTerm.replace(/\D/g, '');

    return users.filter(u => {
      const userPhone = u.phone.replace(/\D/g, '');
      const storePhone = (u.store?.whatsapp_number || '').replace(/\D/g, '');
      const storeName = (u.store?.name || '').toLowerCase();
      const userEmail = (u.email || '').toLowerCase();
      const userTag = (u.tag || '').toLowerCase();

      // Search matching (by phone 8 digits or full, or text)
      let matchesSearch = true;
      if (rawTerm) {
        const matchesPhone = cleanDigits.length > 0 && (
          userPhone.includes(cleanDigits) ||
          storePhone.includes(cleanDigits) ||
          (cleanDigits.length === 8 && (userPhone.endsWith(cleanDigits) || storePhone.endsWith(cleanDigits)))
        );
        const matchesText = storeName.includes(rawTerm) || userEmail.includes(rawTerm) || userTag.includes(rawTerm);
        matchesSearch = matchesPhone || matchesText;
      }

      if (!matchesSearch) return false;

      // Tab filtering
      const days = getDaysRemaining(u);
      if (activeTab === 'expiring') {
        if (days === Infinity || days > 3 || days < 0) return false;
      } else if (activeTab === 'expired') {
        if (days === Infinity || days >= 0) return false;
      } else if (activeTab === 'partners') {
        if (days !== Infinity) return false;
      }

      // Dropdown Days Filter
      if (filterDays === '3') {
        return days !== Infinity && days >= 0 && days <= 3;
      } else if (filterDays === '7') {
        return days !== Infinity && days >= 0 && days <= 7;
      } else if (filterDays === 'expired') {
        return days !== Infinity && days < 0;
      } else if (filterDays === 'partners') {
        return days === Infinity;
      }

      return true;
    });
  }, [users, search, activeTab, filterDays, getDaysRemaining]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-violet-200 pb-20 font-sans">
      {/* Top Admin Header */}
      <header className="border-b border-slate-200/80 bg-white sticky top-0 z-40 px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black italic tracking-tighter uppercase text-slate-900">
              Tiender<span className="text-violet-600">.</span>
            </span>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-bold uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Panel Maestro</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Administrador</span>
              <span className="block text-xs font-bold text-slate-700">{adminEmail || 'admin@tiender.app'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Floating Notification */}
        <AnimatePresence>
          {actionSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl flex items-center gap-3 text-xs font-bold shadow-md"
            >
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{actionSuccess}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-300 text-rose-800 rounded-2xl flex items-center gap-3 text-xs font-bold shadow-sm">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Section 0: KPI Summary & Alert Boxes */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => { setActiveTab('all'); setFilterDays('all'); }}
            className={`p-5 rounded-3xl bg-white border cursor-pointer transition-all ${
              activeTab === 'all' && filterDays === 'all'
                ? 'border-violet-600 ring-2 ring-violet-500/20 shadow-md'
                : 'border-slate-200/80 hover:border-slate-300 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase mb-2">
              <span>Total Tiendas</span>
              <Store className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-3xl font-black text-slate-900">{kpis.total}</div>
            <div className="text-[11px] text-slate-400 mt-1 font-medium">Todas las registradas</div>
          </div>

          <div
            onClick={() => { setActiveTab('expiring'); setFilterDays('all'); }}
            className={`p-5 rounded-3xl bg-white border cursor-pointer transition-all ${
              activeTab === 'expiring'
                ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                : 'border-slate-200/80 hover:border-slate-300 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-amber-700 font-bold uppercase mb-2">
              <span>Por Vencer (≤ 3d)</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-3xl font-black text-amber-600">{kpis.expiring}</div>
            <div className="text-[11px] text-amber-600/80 mt-1 font-medium">Cobro físico pendiente</div>
          </div>

          <div
            onClick={() => { setActiveTab('expired'); setFilterDays('all'); }}
            className={`p-5 rounded-3xl bg-white border cursor-pointer transition-all ${
              activeTab === 'expired'
                ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-md'
                : 'border-slate-200/80 hover:border-slate-300 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-rose-700 font-bold uppercase mb-2">
              <span>Vencidas</span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-3xl font-black text-rose-600">{kpis.expired}</div>
            <div className="text-[11px] text-rose-600/80 mt-1 font-medium">Para relanzar o borrar</div>
          </div>

          <div
            onClick={() => { setActiveTab('partners'); setFilterDays('all'); }}
            className={`p-5 rounded-3xl bg-white border cursor-pointer transition-all ${
              activeTab === 'partners'
                ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                : 'border-slate-200/80 hover:border-slate-300 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-emerald-700 font-bold uppercase mb-2">
              <span>Socios / Exentos</span>
              <Crown className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-3xl font-black text-emerald-600">{kpis.partners}</div>
            <div className="text-[11px] text-emerald-600/80 mt-1 font-medium">Vitalicios de marketing</div>
          </div>
        </div>

        {/* Section 1: Create User & Store Form */}
        <section className="bg-white border border-slate-200/80 rounded-[32px] p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase italic tracking-tight text-slate-900">
                Crear Nuevo Cliente & Tienda
              </h2>
              <p className="text-slate-500 text-xs">
                Asigna el número, nombre, plan e inicializa la fecha de vencimiento según tu cobro.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                  Número de WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="Ej: 88057625 o 50588057625"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 text-sm font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                  Nombre de la Tienda
                </label>
                <input
                  type="text"
                  placeholder="Ej: Urban Style Shop"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 text-sm font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                  Contraseña Inicial
                </label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Contraseña temporal"
                    value={defaultPassword}
                    onChange={(e) => setDefaultPassword(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 text-sm font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Plan and Options Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                  Tipo de Cuenta / Plan
                </label>
                <select
                  value={selectedPlan}
                  onChange={(e) => setSelectedPlan(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                >
                  <option value="standard">🚀 Plan Emprendedor (10 productos máx)</option>
                  <option value="full">💼 Plan Business (30 productos máx)</option>
                  <option value="socio">👑 Cuenta Socio / Marketing (Vitalicia sin vencimiento)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                  Duración Inicial
                </label>
                <select
                  disabled={selectedPlan === 'socio'}
                  value={selectedPlan === 'socio' ? 'socio' : String(durationDays)}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/30 disabled:opacity-50"
                >
                  <option value="30">1 Mes (30 días)</option>
                  <option value="7">1 Semana (Prueba de 7 días)</option>
                  <option value="60">2 Meses (60 días)</option>
                  {selectedPlan === 'socio' && <option value="socio">Vitalicio (Exento)</option>}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                  Etiqueta Especial (Opcional)
                </label>
                <input
                  type="text"
                  placeholder={durationDays === 7 ? 'Prueba 1 semana' : (selectedPlan === 'socio' ? 'Socio Marketing' : 'Ej: Influencer, Familiar')}
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 text-sm font-medium"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isCreating}
                className="px-8 py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-40"
              >
                {isCreating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                <span>{isCreating ? 'Activando...' : 'Crear Usuario y Activar Tienda'}</span>
              </button>
            </div>
          </form>

          {/* Success Banner with Copy button */}
          <AnimatePresence>
            {createdSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-6 p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-sm text-emerald-800">¡Cliente y Tienda Creados con Éxito!</h3>
                    <p className="text-slate-700 text-xs mt-1">
                      Tienda: <strong>{createdSuccess.storeName}</strong> • WhatsApp: <strong>{createdSuccess.phone}</strong> • Plan: <strong>{createdSuccess.plan}</strong>
                    </p>
                    <p className="text-slate-500 text-[11px] mt-0.5 font-mono">
                      Contraseña temporal: <strong>{createdSuccess.password}</strong>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => copyToClipboard(`¡Hola! Tu tienda en Tiender está lista.\n\nPuedes entrar en: https://tiender.vercel.app/\n📱 Número: ${createdSuccess.phone}\n🔑 Contraseña temporal: ${createdSuccess.password}\n\n(Al entrar se te pedirá actualizar tu contraseña)`)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition-all flex-shrink-0 shadow-sm"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Mensaje para WhatsApp</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Section 2: Users Management with Tabs & Search */}
        <section className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            {/* Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => { setActiveTab('all'); setFilterDays('all'); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'all'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Todas ({users.length})
              </button>

              <button
                onClick={() => { setActiveTab('expiring'); setFilterDays('all'); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'expiring'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Por Vencer ≤ 3d ({kpis.expiring})</span>
              </button>

              <button
                onClick={() => { setActiveTab('expired'); setFilterDays('all'); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'expired'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Vencidas ({kpis.expired})</span>
              </button>

              <button
                onClick={() => { setActiveTab('partners'); setFilterDays('all'); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'partners'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Socios ({kpis.partners})</span>
              </button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por teléfono (8 o 11 dígitos) o tienda..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 shadow-sm"
                />
              </div>

              <select
                value={filterDays}
                onChange={(e) => setFilterDays(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none shadow-sm"
              >
                <option value="all">Plazo: Todos</option>
                <option value="3">Vence en ≤ 3 días</option>
                <option value="7">Vence en ≤ 7 días</option>
                <option value="expired">Ya vencidos</option>
                <option value="partners">Socios vitalicios</option>
              </select>

              <button
                onClick={loadUsers}
                className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors shadow-sm"
                title="Refrescar lista"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          {loading && users.length === 0 ? (
            <div className="py-24 text-center text-slate-400 text-sm bg-white rounded-3xl border border-slate-200 shadow-sm">
              <div className="w-8 h-8 border-3 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-3" />
              <span>Cargando lista de clientes y tiendas...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-16 text-center text-slate-500 text-sm shadow-sm">
              <Store className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-bold text-slate-700 text-base">No se encontraron tiendas en este filtro.</p>
              <p className="text-xs text-slate-400 mt-1">
                {search ? 'Prueba con otro término de búsqueda o limpia el buscador.' : 'No hay cuentas que coincidan con la pestaña seleccionada.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredUsers.map((u) => {
                const daysRemaining = getDaysRemaining(u);
                const isSocio = daysRemaining === Infinity;
                const isExpired = !isSocio && daysRemaining < 0;
                const isUrgent = !isSocio && daysRemaining >= 0 && daysRemaining <= 3;
                const isTrialTag = u.tag?.toLowerCase().includes('prueba');

                const expirationDate = u.store?.plan_expires_at || u.store?.trial_ends_at;

                return (
                  <motion.div
                    key={u.id}
                    layout
                    className={`bg-white border rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-5 relative overflow-hidden ${
                      isExpired
                        ? 'border-rose-200 ring-1 ring-rose-200 bg-rose-50/20'
                        : isUrgent
                        ? 'border-amber-300 ring-1 ring-amber-300 bg-amber-50/20'
                        : 'border-slate-200/90'
                    }`}
                  >
                    <div>
                      {/* Top Row: Name and Badges */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="min-w-0">
                          <h3 className="font-black text-lg text-slate-900 tracking-tight leading-tight truncate">
                            {u.store?.name || 'Tienda sin nombre'}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-mono font-bold text-slate-600">
                              📱 {u.phone}
                            </span>
                            <a
                              href={`https://wa.me/${u.phone}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-0.5 bg-emerald-50 px-2 py-0.5 rounded-full"
                              title="Abrir chat en WhatsApp"
                            >
                              <MessageCircle className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        </div>

                        {/* Plan & Tag Badges */}
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                            isSocio
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : u.store?.product_limit === 10
                              ? 'bg-sky-100 text-sky-800 border border-sky-200'
                              : 'bg-violet-100 text-violet-800 border border-violet-200'
                          }`}>
                            {isSocio ? 'Socio (Exento)' : (u.store?.product_limit === 10 ? 'Emprendedor (10 prod)' : 'Business (30 prod)')}
                          </span>

                          {u.tag && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                              isTrialTag
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              <Tag className="w-2.5 h-2.5" />
                              <span>{u.tag}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Store Public URL */}
                      {u.store?.slug && (
                        <div className="mb-4">
                          <a
                            href={`/tienda/${u.store.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 font-semibold hover:underline"
                          >
                            <span>/tienda/{u.store.slug}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}

                      {/* Dates and Expiration Countdown */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-slate-500">
                          <span className="flex items-center gap-1.5 font-medium">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Alta: {formatDate(u.created_at)}</span>
                          </span>
                          <span>
                            {isSocio ? 'Vence: Nunca' : `Vence: ${formatDate(expirationDate)}`}
                          </span>
                        </div>

                        {/* Status / Countdown Pill */}
                        <div className="pt-1 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-500">Estado del Plan:</span>
                          {isSocio ? (
                            <span className="text-xs font-black text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <Crown className="w-3 h-3" />
                              <span>Socio Vitalicio ∞</span>
                            </span>
                          ) : isExpired ? (
                            <span className="text-xs font-black text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">
                              Vencido hace {Math.abs(daysRemaining)} días
                            </span>
                          ) : isUrgent ? (
                            <span className="text-xs font-black text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full animate-pulse">
                              ⚠️ Vence en {daysRemaining === 0 ? 'hoy' : `${daysRemaining} días`}
                            </span>
                          ) : isTrialTag ? (
                            <span className="text-xs font-bold text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full">
                              Prueba: Quedan {daysRemaining} días
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-slate-700 bg-slate-200/70 px-2.5 py-0.5 rounded-full">
                              Quedan {daysRemaining} días
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions Row */}
                    <div className="border-t border-slate-100 pt-3 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Botón Pagado / Renovar */}
                        {u.store?.id && !isSocio && (
                          <button
                            onClick={() => handleMarkPaid(u.store!.id, u.store!.name)}
                            disabled={actionLoadingId === u.store.id}
                            className="flex-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-40"
                            title="Añade 30 días a la fecha de vencimiento"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>{actionLoadingId === u.store.id ? 'Renovando...' : 'Pagado (+30d)'}</span>
                          </button>
                        )}

                        {/* Botón Relanzar si está vencida */}
                        {isExpired && u.store?.id && (
                          <button
                            onClick={() => handleRelaunch(u.store!.id, u.store!.name)}
                            disabled={actionLoadingId === u.store.id}
                            className="px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all disabled:opacity-40"
                            title="Reactiva la tienda con 30 días nuevos desde hoy"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Relanzar</span>
                          </button>
                        )}

                        {/* Botón Etiqueta */}
                        <button
                          onClick={() => handleEditTag(u)}
                          disabled={actionLoadingId === u.id}
                          className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-all"
                          title="Cambiar etiqueta"
                        >
                          <Tag className="w-3.5 h-3.5 text-slate-500" />
                        </button>

                        {/* Botón Cambiar Contraseña */}
                        <button
                          onClick={() => handleUpdatePassword(u.id, u.phone)}
                          disabled={actionLoadingId === u.id}
                          className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-all"
                          title="Asignar nueva contraseña temporal"
                        >
                          <Key className="w-3.5 h-3.5 text-slate-500" />
                        </button>

                        {/* Botón Eliminar Permanentemente */}
                        <button
                          onClick={() => handleDeleteUser(u.id, u.store?.name)}
                          disabled={actionLoadingId === u.id}
                          className="px-2.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold flex items-center gap-1 transition-all disabled:opacity-40"
                          title="Eliminar cuenta permanentemente"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default AdminPage;
