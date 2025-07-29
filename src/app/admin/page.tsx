"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Tipos para las temporadas
interface Season {
  _id: string;
  name: string;
  year: number;
  description?: string;
  startDate: string;
  endDate: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  isActive: boolean;
  defaultDailyPoints: number;
  settings: {
    maxNomineesPerWeek: number;
    votingEndTime: string;
    votingDays: number[];
  };
  stats: {
    totalWeeks: number;
    totalCandidates: number;
    totalVotes: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface SeasonStats {
  season: {
    id: string;
    name: string;
    year: number;
    status: string;
    isActive: boolean;
    startDate: string;
    endDate: string;
  };
  candidates: {
    total: number;
    active: number;
    eliminated: number;
    winner: number;
  };
  weeks: {
    total: number;
    active: number;
    completed: number;
    scheduled: number;
  };
  votes: {
    totalVotes: number;
    totalPoints: number;
    uniqueVoters: number;
    uniqueCandidates: number;
  };
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState({ title: '', message: '', onConfirm: () => {} });
  
  // Estados para formularios
  const [showSeasonForm, setShowSeasonForm] = useState(false);
  const [showCandidateForm, setShowCandidateForm] = useState(false);
  const [showWeekForm, setShowWeekForm] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState('2025');
  const [selectedWeek, setSelectedWeek] = useState(null);

  // Estados para temporadas (reales)
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loadingSeasons, setLoadingSeasons] = useState(true);
  const [seasonStats, setSeasonStats] = useState<{ [key: string]: SeasonStats }>({});
  const [loadingStats, setLoadingStats] = useState<{ [key: string]: boolean }>({});
  const [error, setError] = useState<string | null>(null);

  // Estados para formulario de temporada
  const [seasonForm, setSeasonForm] = useState({
    name: '',
    year: new Date().getFullYear(),
    description: '',
    startDate: '',
    endDate: '',
    defaultDailyPoints: 60,
  });
  const [submittingSeason, setSubmittingSeason] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [stats, setStats] = useState({
    totalUsers: 1247,
    activeUsers: 342,
    totalSeasons: 2,
    activeSeason: 'Casa Famosos 2025',
    totalCandidates: 12,
    eliminatedCandidates: 3,
    currentWeek: 4,
    activeWeek: true,
    totalVotes: 15680,
    weeklyVotes: 3420,
  });

  // Mock data (se mantiene para otras secciones)
  const mockSeasons = [
    { id: '2025', name: 'Casa Famosos 2025', year: 2025, status: 'active', startDate: '2025-01-15', endDate: '2025-06-15' },
    { id: '2024', name: 'Casa Famosos 2024', year: 2024, status: 'completed', startDate: '2024-01-15', endDate: '2024-06-15' }
  ];

  const weeks = [
    { id: 1, number: 1, startDate: '2025-01-15', endDate: '2025-01-21', status: 'completed', nominees: 4 },
    { id: 2, number: 2, startDate: '2025-01-22', endDate: '2025-01-28', status: 'completed', nominees: 4 },
    { id: 3, number: 3, startDate: '2025-01-29', endDate: '2025-02-04', status: 'completed', nominees: 3 },
    { id: 4, number: 4, startDate: '2025-02-05', endDate: '2025-02-11', status: 'active', nominees: 4 },
    { id: 5, number: 5, startDate: '2025-02-12', endDate: '2025-02-18', status: 'scheduled', nominees: 0 },
  ];

  const candidates = [
    { id: 1, name: 'Ana García', photo: '', age: 28, profession: 'Actriz', status: 'active', nominated: true, eliminatedWeek: null },
    { id: 2, name: 'Carlos López', photo: '', age: 32, profession: 'Cantante', status: 'active', nominated: true, eliminatedWeek: null },
    { id: 3, name: 'Sofia Herrera', photo: '', age: 25, profession: 'Influencer', status: 'active', nominated: false, eliminatedWeek: null },
    { id: 4, name: 'Diego Martín', photo: '', age: 30, profession: 'Actor', status: 'eliminated', nominated: false, eliminatedWeek: 2 },
  ];

  // Redirigir si no está logueado o no es admin
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    } else if (status === 'authenticated' && session && !(session.user as any)?.isAdmin) {
      // Si está autenticado pero no es admin, redirigir
      router.push('/');
    }
  }, [status, session, router]);

  // Cargar temporadas al montar el componente
  useEffect(() => {
    if (status === 'authenticated') {
      loadSeasons();
    }
  }, [status]);

  // Función para cargar temporadas
  const loadSeasons = async () => {
    try {
      setLoadingSeasons(true);
      setError(null);
      const response = await fetch('/api/seasons');
      if (!response.ok) {
        throw new Error('Error al cargar temporadas');
      }
      const data = await response.json();
      setSeasons(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error cargando temporadas:', err);
    } finally {
      setLoadingSeasons(false);
    }
  };

  // Función para cargar estadísticas de una temporada
  const loadSeasonStats = async (seasonId: string) => {
    try {
      setLoadingStats(prev => ({ ...prev, [seasonId]: true }));
      const response = await fetch(`/api/seasons?id=${seasonId}&action=stats`);
      if (!response.ok) {
        throw new Error('Error al cargar estadísticas');
      }
      const stats = await response.json();
      setSeasonStats(prev => ({ ...prev, [seasonId]: stats }));
    } catch (err: any) {
      console.error('Error cargando estadísticas:', err);
    } finally {
      setLoadingStats(prev => ({ ...prev, [seasonId]: false }));
    }
  };

  // Función para crear o editar temporada
  const handleSeasonSubmit = async () => {
    if (isEditMode) {
      await editSeason();
    } else {
      await createSeason();
    }
  };

  // Función para crear temporada
  const createSeason = async () => {
    try {
      setSubmittingSeason(true);
      setError(null);
      
      const response = await fetch('/api/seasons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(seasonForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear temporada');
      }

      const newSeason = await response.json();
      setSeasons(prev => [newSeason, ...prev]);
      setShowSeasonForm(false);
      setSeasonForm({
        name: '',
        year: new Date().getFullYear(),
        description: '',
        startDate: '',
        endDate: '',
        defaultDailyPoints: 60,
      });
    } catch (err: any) {
      setError(err.message);
      console.error('Error creando temporada:', err);
    } finally {
      setSubmittingSeason(false);
    }
  };

  // Función para activar temporada
  const activateSeason = async (seasonId: string) => {
    try {
      setError(null);
      const response = await fetch('/api/seasons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'activate',
          seasonId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al activar temporada');
      }

      await loadSeasons(); // Recargar para actualizar estados
    } catch (err: any) {
      setError(err.message);
      console.error('Error activando temporada:', err);
    }
  };

  // Función para completar temporada
  const completeSeason = async (seasonId: string) => {
    try {
      setError(null);
      const response = await fetch('/api/seasons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'complete',
          seasonId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al completar temporada');
      }

      await loadSeasons(); // Recargar para actualizar estados
    } catch (err: any) {
      setError(err.message);
      console.error('Error completando temporada:', err);
    }
  };

  // Función para editar temporada
  const editSeason = async () => {
    if (!editingSeason) return;
    
    try {
      setSubmittingSeason(true);
      setError(null);
      
      const response = await fetch('/api/seasons', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          seasonId: editingSeason._id,
          name: seasonForm.name,
          year: seasonForm.year,
          description: seasonForm.description,
          startDate: seasonForm.startDate,
          endDate: seasonForm.endDate,
          defaultDailyPoints: seasonForm.defaultDailyPoints,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar temporada');
      }

      const updatedSeason = await response.json();
      setSeasons(prev => prev.map(s => s._id === editingSeason._id ? updatedSeason : s));
      setShowSeasonForm(false);
      setEditingSeason(null);
      setIsEditMode(false);
      setSeasonForm({
        name: '',
        year: new Date().getFullYear(),
        description: '',
        startDate: '',
        endDate: '',
        defaultDailyPoints: 60,
      });
    } catch (err: any) {
      setError(err.message);
      console.error('Error actualizando temporada:', err);
    } finally {
      setSubmittingSeason(false);
    }
  };

  // Función para abrir formulario de edición
  const openEditForm = (season: Season) => {
    setEditingSeason(season);
    setIsEditMode(true);
    setSeasonForm({
      name: season.name,
      year: season.year,
      description: season.description || '',
      startDate: season.startDate.split('T')[0], // Convertir a formato date
      endDate: season.endDate.split('T')[0],
      defaultDailyPoints: season.defaultDailyPoints,
    });
    setShowSeasonForm(true);
  };

  // Función para obtener información de eliminación
  const getDeleteInfo = async (seasonId: string) => {
    try {
      const response = await fetch(`/api/seasons?id=${seasonId}&action=stats`);
      if (!response.ok) {
        throw new Error('Error al obtener información de la temporada');
      }
      const stats = await response.json();
      return stats;
    } catch (err) {
      console.error('Error obteniendo información de eliminación:', err);
      return null;
    }
  };

  // Función para eliminar temporada con información detallada
  const deleteSeasonWithInfo = async (seasonId: string, seasonName: string) => {
    const stats = await getDeleteInfo(seasonId);
    
    let deleteMessage = `¿Estás seguro de que quieres eliminar la temporada "${seasonName}"?\n\n⚠️ Esta acción eliminará PERMANENTEMENTE:\n• La temporada completa\n• Todas las semanas asociadas\n• Todos los candidatos de la temporada\n• Todos los votos registrados\n• Todas las nominaciones\n\nEsta acción NO SE PUEDE DESHACER.`;
    
    if (stats) {
      deleteMessage += `\n\n📊 Datos que se eliminarán:\n• ${stats.candidates.total} candidatos (${stats.candidates.active} activos, ${stats.candidates.eliminated} eliminados)\n• ${stats.weeks.total} semanas (${stats.weeks.completed} completadas, ${stats.weeks.active} activas)\n• ${stats.votes.totalVotes.toLocaleString()} votos totales\n• ${stats.votes.uniqueVoters} votantes únicos`;
    }
    
    handleConfirmAction(
      'Eliminar Temporada',
      deleteMessage,
      () => deleteSeason(seasonId)
    );
  };

  // Función para eliminar temporada
  const deleteSeason = async (seasonId: string) => {
    try {
      setError(null);
      const response = await fetch(`/api/seasons?id=${seasonId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar temporada');
      }

      setSeasons(prev => prev.filter(s => s._id !== seasonId));
    } catch (err: any) {
      setError(err.message);
      console.error('Error eliminando temporada:', err);
    }
  };

  // Función para convertir usuario en admin (solo desarrollo)
  const makeAdmin = async () => {
    try {
      setError(null);
      const response = await fetch('/api/admin/make-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: session?.user?.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al convertir en admin');
      }

      const result = await response.json();
      alert(result.message);
      // Recargar la página para actualizar la sesión
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
      console.error('Error convirtiendo en admin:', err);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl text-primary">Cargando panel de administración...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Verificar si el usuario es admin
  const isAdmin = (session.user as any)?.isAdmin;
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🚫</div>
          <h1 className="text-xl font-semibold text-foreground mb-2">Acceso Denegado</h1>
          <p className="text-muted-foreground">No tienes permisos de administrador para acceder a esta página.</p>
          <button 
            onClick={() => router.push('/')}
            className="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'seasons', label: 'Temporadas', icon: '🏆' },
    { id: 'weeks', label: 'Semanas', icon: '📅' },
    { id: 'candidates', label: 'Candidatos', icon: '👥' },
    { id: 'nominees', label: 'Nominados', icon: '🎯' },
    { id: 'votes', label: 'Votaciones', icon: '🗳️' },
  ];

  const handleConfirmAction = (title: string, message: string, onConfirm: () => void) => {
    setConfirmAction({ title, message, onConfirm });
    setShowConfirmModal(true);
  };

  const executeConfirmAction = () => {
    confirmAction.onConfirm();
    setShowConfirmModal(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Modal de Confirmación */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl p-6 max-w-lg w-full border border-border/40 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-foreground mb-4">{confirmAction.title}</h3>
            <div className="text-muted-foreground mb-6 whitespace-pre-line leading-relaxed">
              {confirmAction.message}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-muted text-muted-foreground py-2 px-4 rounded-lg font-medium hover:bg-muted/80 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={executeConfirmAction}
                className="flex-1 bg-destructive text-destructive-foreground py-2 px-4 rounded-lg font-medium hover:bg-destructive/90 transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border/40 flex flex-col transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-4 lg:p-6 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 lg:w-10 h-8 lg:h-10 bg-gradient-to-r from-primary to-accent rounded-lg glow flex items-center justify-center">
                <span className="text-white font-bold text-sm lg:text-base">CF</span>
              </div>
              <div>
                <h1 className="text-base lg:text-lg font-bold text-foreground">Casa Famosos</h1>
                <p className="text-xs lg:text-sm text-muted-foreground">Panel Admin</p>
              </div>
            </div>
            {/* Close button for mobile */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-muted-foreground hover:text-foreground"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Season Selector */}
        <div className="p-3 lg:p-4 border-b border-border/40">
          <label className="block text-xs font-medium text-muted-foreground mb-2">
            Temporada Activa
          </label>
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            {seasons.map(season => (
              <option key={season._id} value={season._id}>
                {season.name}
              </option>
            ))}
          </select>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 lg:p-4">
          <div className="space-y-1 lg:space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3 lg:px-4 py-2 lg:py-3 rounded-lg text-left transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                }`}
              >
                <span className="text-base lg:text-lg">{tab.icon}</span>
                <span className="font-medium text-sm lg:text-base">{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* User Info */}
        <div className="p-3 lg:p-4 border-t border-border/40">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
              <span className="text-primary text-sm font-bold">
                {session.user?.name?.[0] || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {session.user?.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? '👑 Administrador' : 'Usuario'}
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Ir al inicio"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-0 overflow-auto">
        {/* Top Bar */}
        <header className="bg-card/50 border-b border-border/20 px-4 lg:px-8 py-3 lg:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-muted-foreground hover:text-foreground"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <div>
                <h2 className="text-xl lg:text-2xl font-bold text-foreground capitalize">
                  {tabs.find(tab => tab.id === activeTab)?.label}
                </h2>
                <p className="text-muted-foreground text-sm lg:text-base hidden sm:block">
                  {activeTab === 'dashboard' && 'Resumen general del sistema'}
                  {activeTab === 'seasons' && 'Gestión de temporadas'}
                  {activeTab === 'weeks' && 'Administración de semanas de votación'}
                  {activeTab === 'candidates' && 'Gestión de participantes'}
                  {activeTab === 'nominees' && 'Control de nominaciones semanales'}
                  {activeTab === 'votes' && 'Control de votaciones'}
                </p>
              </div>
            </div>
            <div className="text-xs lg:text-sm text-muted-foreground hidden md:block">
              {seasons.find(s => s._id === selectedSeason)?.name || 'Casa Famosos 2025'}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-4 lg:p-8">
          {activeTab === 'dashboard' && (
            <div className="space-y-6 lg:space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
                <div className="bg-card rounded-lg lg:rounded-xl p-4 lg:p-6 border border-border/40 hover:shadow-lg transition-all duration-200">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="mb-2 lg:mb-0">
                      <p className="text-muted-foreground text-xs lg:text-sm font-medium">Usuarios Totales</p>
                      <p className="text-xl lg:text-3xl font-bold text-foreground mt-1 lg:mt-2">{stats.totalUsers.toLocaleString()}</p>
                    </div>
                    <div className="w-8 h-8 lg:w-12 lg:h-12 bg-blue-500/10 rounded-lg flex items-center justify-center self-end lg:self-auto">
                      <span className="text-lg lg:text-2xl">👥</span>
                    </div>
                  </div>
                  <div className="mt-2 lg:mt-4 flex items-center text-xs lg:text-sm">
                    <span className="text-green-500">↗ +12%</span>
                    <span className="text-muted-foreground ml-2 hidden lg:inline">vs mes anterior</span>
                  </div>
                </div>

                <div className="bg-card rounded-lg lg:rounded-xl p-4 lg:p-6 border border-border/40 hover:shadow-lg transition-all duration-200">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="mb-2 lg:mb-0">
                      <p className="text-muted-foreground text-xs lg:text-sm font-medium">Semana Actual</p>
                      <p className="text-xl lg:text-3xl font-bold text-foreground mt-1 lg:mt-2">Semana {stats.currentWeek}</p>
                    </div>
                    <div className="w-8 h-8 lg:w-12 lg:h-12 bg-green-500/10 rounded-lg flex items-center justify-center self-end lg:self-auto">
                      <span className="text-lg lg:text-2xl">📅</span>
                    </div>
                  </div>
                  <div className="mt-2 lg:mt-4 flex items-center text-xs lg:text-sm">
                    <span className="text-green-500">{stats.activeWeek ? '🟢 Activa' : '🔴 Cerrada'}</span>
                  </div>
                </div>

                <div className="bg-card rounded-lg lg:rounded-xl p-4 lg:p-6 border border-border/40 hover:shadow-lg transition-all duration-200">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="mb-2 lg:mb-0">
                      <p className="text-muted-foreground text-xs lg:text-sm font-medium">Candidatos</p>
                      <p className="text-xl lg:text-3xl font-bold text-foreground mt-1 lg:mt-2">{stats.totalCandidates}</p>
                    </div>
                    <div className="w-8 h-8 lg:w-12 lg:h-12 bg-purple-500/10 rounded-lg flex items-center justify-center self-end lg:self-auto">
                      <span className="text-lg lg:text-2xl">⭐</span>
                    </div>
                  </div>
                  <div className="mt-2 lg:mt-4 flex items-center text-xs lg:text-sm">
                    <span className="text-destructive">{stats.eliminatedCandidates} eliminados</span>
                  </div>
                </div>

                <div className="bg-card rounded-lg lg:rounded-xl p-4 lg:p-6 border border-border/40 hover:shadow-lg transition-all duration-200">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="mb-2 lg:mb-0">
                      <p className="text-muted-foreground text-xs lg:text-sm font-medium">Votos Semanales</p>
                      <p className="text-xl lg:text-3xl font-bold text-foreground mt-1 lg:mt-2">{stats.weeklyVotes.toLocaleString()}</p>
                    </div>
                    <div className="w-8 h-8 lg:w-12 lg:h-12 bg-orange-500/10 rounded-lg flex items-center justify-center self-end lg:self-auto">
                      <span className="text-lg lg:text-2xl">🗳️</span>
                    </div>
                  </div>
                  <div className="mt-2 lg:mt-4 flex items-center text-xs lg:text-sm">
                    <span className="text-green-500">↗ +15%</span>
                    <span className="text-muted-foreground ml-2 hidden lg:inline">vs semana anterior</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
                <div className="bg-card rounded-lg lg:rounded-xl p-4 lg:p-6 border border-border/40">
                  <h3 className="text-base lg:text-lg font-semibold text-foreground mb-3 lg:mb-4">Acciones Rápidas</h3>
                  <div className="space-y-2 lg:space-y-3">
                    {/* Botón temporal para convertir en admin (solo desarrollo) */}
                    {!isAdmin && (
                      <button 
                        onClick={makeAdmin}
                        className="w-full flex items-center justify-between bg-yellow-500 text-yellow-900 p-3 lg:p-4 rounded-lg font-medium hover:bg-yellow-600 transition-colors group">
                        <div className="flex items-center space-x-2 lg:space-x-3">
                          <span className="text-lg lg:text-xl">👑</span>
                          <span className="text-sm lg:text-base">Convertir en Admin</span>
                        </div>
                        <svg className="w-4 h-4 lg:w-5 lg:h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    )}
                    <button 
                      onClick={() => setActiveTab('weeks')}
                      className="w-full flex items-center justify-between bg-primary text-primary-foreground p-3 lg:p-4 rounded-lg font-medium hover:bg-primary/90 transition-colors group">
                      <div className="flex items-center space-x-2 lg:space-x-3">
                        <span className="text-lg lg:text-xl">📅</span>
                        <span className="text-sm lg:text-base">Gestionar Semana Actual</span>
                      </div>
                      <svg className="w-4 h-4 lg:w-5 lg:h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => setActiveTab('nominees')}
                      className="w-full flex items-center justify-between bg-accent text-accent-foreground p-3 lg:p-4 rounded-lg font-medium hover:bg-accent/90 transition-colors group">
                      <div className="flex items-center space-x-2 lg:space-x-3">
                        <span className="text-lg lg:text-xl">🎯</span>
                        <span className="text-sm lg:text-base">Actualizar Nominados</span>
                      </div>
                      <svg className="w-4 h-4 lg:w-5 lg:h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => handleConfirmAction(
                        'Resetear Votos Semanales',
                        '¿Estás seguro de que quieres resetear todos los votos de la semana actual? Esta acción no se puede deshacer.',
                        () => alert('Votos reseteados')
                      )}
                      className="w-full flex items-center justify-between bg-destructive text-destructive-foreground p-3 lg:p-4 rounded-lg font-medium hover:bg-destructive/90 transition-colors group">
                      <div className="flex items-center space-x-2 lg:space-x-3">
                        <span className="text-lg lg:text-xl">🔄</span>
                        <span className="text-sm lg:text-base">Resetear Votos</span>
                      </div>
                      <svg className="w-4 h-4 lg:w-5 lg:h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="bg-card rounded-lg lg:rounded-xl p-4 lg:p-6 border border-border/40">
                  <h3 className="text-base lg:text-lg font-semibold text-foreground mb-3 lg:mb-4">Estado de la Temporada</h3>
                  <div className="space-y-3 lg:space-y-4">
                    <div className="flex items-center justify-between p-2 lg:p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs lg:text-sm font-medium text-foreground">Temporada Activa</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{stats.activeSeason}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 lg:p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-xs lg:text-sm font-medium text-foreground">Semana en Curso</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Semana {stats.currentWeek}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 lg:p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span className="text-xs lg:text-sm font-medium text-foreground">Participantes Activos</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{stats.totalCandidates - stats.eliminatedCandidates}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Temporadas Tab */}
          {activeTab === 'seasons' && (
            <div className="space-y-6 lg:space-y-8">
              {/* Error Display */}
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-destructive">⚠️</span>
                    <span className="text-destructive font-medium">{error}</span>
                    <button 
                      onClick={() => setError(null)}
                      className="ml-auto text-destructive hover:text-destructive/80"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                <div>
                  <h3 className="text-lg lg:text-xl font-semibold text-foreground">Gestión de Temporadas</h3>
                  <p className="text-muted-foreground text-sm lg:text-base">Administra las temporadas del programa</p>
                </div>
                <button 
                  onClick={() => setShowSeasonForm(true)}
                  className="bg-primary text-primary-foreground px-4 lg:px-6 py-2 lg:py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center space-x-2"
                >
                  <span>+</span>
                  <span>Nueva Temporada</span>
                </button>
              </div>

              {/* Loading State */}
              {loadingSeasons ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Cargando temporadas...</p>
                  </div>
                </div>
              ) : seasons.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🏆</div>
                  <p className="text-lg font-medium text-foreground mb-2">No hay temporadas</p>
                  <p className="text-muted-foreground">Crea la primera temporada para comenzar</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  {seasons.map((season) => {
                    const stats = seasonStats[season._id];
                    return (
                      <div key={season._id} className="bg-card rounded-lg lg:rounded-xl p-4 lg:p-6 border border-border/40 hover:shadow-lg transition-all duration-200">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-semibold text-foreground text-base lg:text-lg">{season.name}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                season.status === 'active' 
                                  ? 'bg-green-500/10 text-green-500' 
                                  : season.status === 'completed'
                                    ? 'bg-muted text-muted-foreground'
                                    : 'bg-blue-500/10 text-blue-500'
                              }`}>
                                {season.status === 'active' ? '🟢 Activa' : season.status === 'completed' ? '✅ Completada' : '⏳ Programada'}
                              </span>
                            </div>
                            <p className="text-muted-foreground text-sm">
                              {new Date(season.startDate).toLocaleDateString('es-ES')} - {new Date(season.endDate).toLocaleDateString('es-ES')}
                            </p>
                            {season.description && (
                              <p className="text-muted-foreground text-xs mt-1">{season.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-muted/30 rounded-lg p-3 text-center">
                            <div className="text-lg font-bold text-foreground">
                              {stats ? stats.candidates.total : season.stats.totalCandidates}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Candidatos
                              {stats && (
                                <div className="text-xs text-green-500 mt-1">
                                  {stats.candidates.active} activos, {stats.candidates.eliminated} eliminados
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="bg-muted/30 rounded-lg p-3 text-center">
                            <div className="text-lg font-bold text-foreground">
                              {stats ? stats.weeks.total : season.stats.totalWeeks}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Semanas
                              {stats && (
                                <div className="text-xs text-blue-500 mt-1">
                                  {stats.weeks.active} activas, {stats.weeks.completed} completadas
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Estadísticas adicionales cuando están cargadas */}
                        {stats && (
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-green-500/10 rounded-lg p-3 text-center">
                              <div className="text-lg font-bold text-green-600">
                                {stats.votes.totalVotes.toLocaleString()}
                              </div>
                              <div className="text-xs text-green-600">Votos Totales</div>
                            </div>
                            <div className="bg-blue-500/10 rounded-lg p-3 text-center">
                              <div className="text-lg font-bold text-blue-600">
                                {stats.votes.uniqueVoters}
                              </div>
                              <div className="text-xs text-blue-600">Votantes Únicos</div>
                            </div>
                          </div>
                        )}

                        <div className="flex space-x-2">
                          <button 
                            onClick={() => loadSeasonStats(season._id)}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                              stats 
                                ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' 
                                : loadingStats[season._id] 
                                  ? 'bg-muted text-muted-foreground' 
                                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                            }`}
                          >
                            {loadingStats[season._id] ? '⏳ Cargando...' : stats ? '✅ Stats Cargadas' : '📊 Ver Stats'}
                          </button>
                          <button 
                            onClick={() => openEditForm(season)}
                            className="flex-1 bg-blue-500/10 text-blue-500 py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-500/20 transition-colors"
                          >
                            Editar
                          </button>
                        </div>
                        
                        <div className="flex space-x-2 mt-2">
                          {season.status === 'active' ? (
                            <button 
                              onClick={() => handleConfirmAction(
                                'Completar Temporada',
                                `¿Estás seguro de que quieres completar la temporada "${season.name}"? Esta acción no se puede deshacer.`,
                                () => completeSeason(season._id)
                              )}
                              className="flex-1 bg-destructive/10 text-destructive py-2 px-3 rounded-lg text-sm font-medium hover:bg-destructive/20 transition-colors"
                            >
                              Completar
                            </button>
                          ) : season.status === 'scheduled' || season.status === 'completed' ? (
                            <button 
                              onClick={() => handleConfirmAction(
                                'Activar Temporada',
                                `¿Estás seguro de que quieres activar la temporada "${season.name}"? Esto desactivará la temporada actual.`,
                                () => activateSeason(season._id)
                              )}
                              className="flex-1 bg-primary/10 text-primary py-2 px-3 rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
                            >
                              Activar
                            </button>
                          ) : null}
                          {season.status !== 'active' && (
                            <button 
                              onClick={() => deleteSeasonWithInfo(season._id, season.name)}
                              className="flex-1 bg-red-500/10 text-red-500 py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors"
                            >
                              🗑️ Eliminar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Season Form Modal */}
              {showSeasonForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-card rounded-xl p-6 max-w-lg w-full border border-border/40 max-h-[90vh] overflow-y-auto">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      {isEditMode ? 'Editar Temporada' : 'Nueva Temporada'}
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                          Nombre de la Temporada *
                        </label>
                        <input
                          type="text"
                          placeholder="Casa Famosos 2025"
                          value={seasonForm.name}
                          onChange={(e) => setSeasonForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Año *
                          </label>
                          <input
                            type="number"
                            placeholder="2025"
                            min="2020"
                            max="2030"
                            value={seasonForm.year}
                            onChange={(e) => setSeasonForm(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Puntos Diarios
                          </label>
                          <input
                            type="number"
                            placeholder="60"
                            min="1"
                            value={seasonForm.defaultDailyPoints}
                            onChange={(e) => setSeasonForm(prev => ({ ...prev, defaultDailyPoints: parseInt(e.target.value) }))}
                            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Fecha de Inicio *
                          </label>
                          <input
                            type="date"
                            value={seasonForm.startDate}
                            onChange={(e) => setSeasonForm(prev => ({ ...prev, startDate: e.target.value }))}
                            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Fecha de Fin *
                          </label>
                          <input
                            type="date"
                            value={seasonForm.endDate}
                            onChange={(e) => setSeasonForm(prev => ({ ...prev, endDate: e.target.value }))}
                            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                          Descripción (Opcional)
                        </label>
                        <textarea
                          placeholder="Descripción de la temporada..."
                          rows={3}
                          value={seasonForm.description}
                          onChange={(e) => setSeasonForm(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary focus:outline-none resize-none"
                        ></textarea>
                      </div>
                    </div>

                    <div className="flex space-x-3 mt-6">
                      <button
                        onClick={() => {
                          setShowSeasonForm(false);
                          setEditingSeason(null);
                          setIsEditMode(false);
                          setSeasonForm({
                            name: '',
                            year: new Date().getFullYear(),
                            description: '',
                            startDate: '',
                            endDate: '',
                            defaultDailyPoints: 60,
                          });
                        }}
                        disabled={submittingSeason}
                        className="flex-1 bg-muted text-muted-foreground py-2 px-4 rounded-lg font-medium hover:bg-muted/80 transition-colors disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSeasonSubmit}
                        disabled={submittingSeason || !seasonForm.name || !seasonForm.startDate || !seasonForm.endDate}
                        className="flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                      >
                        {submittingSeason ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>{isEditMode ? 'Actualizando...' : 'Creando...'}</span>
                          </>
                        ) : (
                          <span>{isEditMode ? 'Actualizar Temporada' : 'Crear Temporada'}</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Semanas Tab */}
          {activeTab === 'weeks' && (
            <div className="space-y-6 lg:space-y-8">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                <div>
                  <h3 className="text-lg lg:text-xl font-semibold text-foreground">Gestión de Semanas</h3>
                  <p className="text-muted-foreground text-sm lg:text-base">Administra las semanas de votación de la temporada</p>
                </div>
                <button 
                  onClick={() => setShowWeekForm(true)}
                  className="bg-primary text-primary-foreground px-4 lg:px-6 py-2 lg:py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center space-x-2"
                >
                  <span>+</span>
                  <span>Nueva Semana</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {weeks.map((week) => (
                  <div key={week.id} className="bg-card rounded-lg lg:rounded-xl p-4 lg:p-6 border border-border/40 hover:shadow-lg transition-all duration-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold text-foreground text-base lg:text-lg">Semana {week.number}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            week.status === 'active' || week.status === 'voting'
                              ? 'bg-green-500/10 text-green-500'
                              : week.status === 'completed'
                                ? 'bg-muted text-muted-foreground'
                                : 'bg-muted/50 text-muted-foreground'
                          }`}>
                            {week.status === 'active' || week.status === 'voting' ? '🟢 Activa' : week.status === 'completed' ? '✅ Cerrada' : '⏳ Programada'}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {new Date(week.startDate).toLocaleDateString('es-ES')} - {new Date(week.endDate).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-muted/30 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-foreground">{week.nominees}</div>
                        <div className="text-xs text-muted-foreground">Nominados</div>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-foreground">{week.status === 'completed' ? 'Cerrada' : week.status === 'voting' ? 'Votando' : 'Pendiente'}</div>
                        <div className="text-xs text-muted-foreground">Estado</div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button className="flex-1 bg-muted text-muted-foreground py-2 px-3 rounded-lg text-sm font-medium hover:bg-muted/80 hover:text-foreground transition-colors">
                        Ver Nominados
                      </button>
                      {week.status === 'voting' ? (
                        <button className="flex-1 bg-destructive/10 text-destructive py-2 px-3 rounded-lg text-sm font-medium hover:bg-destructive/20 transition-colors">
                          Cerrar Semana
                        </button>
                      ) : week.status === 'scheduled' ? (
                        <button className="flex-1 bg-primary/10 text-primary py-2 px-3 rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors">
                          Activar
                        </button>
                      ) : null}
                      {week.status !== 'voting' && (
                        <button className="flex-1 bg-muted/20 text-muted-foreground py-2 px-3 rounded-lg text-sm font-medium hover:bg-muted/40 transition-colors">
                          Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Week Form Modal */}
              {showWeekForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-card rounded-xl p-6 max-w-lg w-full border border-border/40 max-h-[90vh] overflow-y-auto">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Nueva Semana</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                          Número de Semana
                        </label>
                        <input
                          type="number"
                          placeholder="1"
                          min="1"
                          className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Fecha de Inicio
                          </label>
                          <input
                            type="date"
                            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Fecha de Fin
                          </label>
                          <input
                            type="date"
                            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Inicio de Votación
                          </label>
                          <input
                            type="datetime-local"
                            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Fin de Votación
                          </label>
                          <input
                            type="datetime-local"
                            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-3 mt-6">
                      <button
                        onClick={() => setShowWeekForm(false)}
                        className="flex-1 bg-muted text-muted-foreground py-2 px-4 rounded-lg font-medium hover:bg-muted/80 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => {
                          setShowWeekForm(false);
                          // Aquí iría la lógica para crear la semana
                        }}
                        className="flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                      >
                        Crear Semana
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Candidatos Tab */}
          {activeTab === 'candidates' && (
            <div className="space-y-6 lg:space-y-8">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                <div>
                  <h3 className="text-lg lg:text-xl font-semibold text-foreground">Gestión de Candidatos</h3>
                  <p className="text-muted-foreground text-sm lg:text-base">Administra los candidatos del programa</p>
                </div>
                <button 
                  onClick={() => setShowCandidateForm(true)}
                  className="bg-primary text-primary-foreground px-4 lg:px-6 py-2 lg:py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center space-x-2"
                >
                  <span>+</span>
                  <span>Nuevo Candidato</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {candidates.map((candidate) => (
                  <div key={candidate.id} className="bg-card rounded-lg lg:rounded-xl p-4 lg:p-6 border border-border/40 hover:shadow-lg transition-all duration-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold text-foreground text-base lg:text-lg">{candidate.name}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            candidate.status === 'active'
                              ? 'bg-green-500/10 text-green-500'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {candidate.status === 'active' ? '🟢 Activo' : '⚪ Eliminado'}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {candidate.profession}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-muted/30 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-foreground">{candidate.age}</div>
                        <div className="text-xs text-muted-foreground">Edad</div>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-foreground">{candidate.eliminatedWeek ? `Eliminado en Semana ${candidate.eliminatedWeek}` : 'No eliminado'}</div>
                        <div className="text-xs text-muted-foreground">Eliminado</div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button className="flex-1 bg-muted text-muted-foreground py-2 px-3 rounded-lg text-sm font-medium hover:bg-muted/80 hover:text-foreground transition-colors">
                        Editar
                      </button>
                      {candidate.status === 'active' ? (
                        <button className="flex-1 bg-destructive/10 text-destructive py-2 px-3 rounded-lg text-sm font-medium hover:bg-destructive/20 transition-colors">
                          Eliminar
                        </button>
                      ) : (
                        <button className="flex-1 bg-primary/10 text-primary py-2 px-3 rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors">
                          Activar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Candidate Form Modal */}
              {showCandidateForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-card rounded-xl p-6 max-w-lg w-full border border-border/40 max-h-[90vh] overflow-y-auto">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Nuevo Candidato</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                          Nombre del Candidato
                        </label>
                        <input
                          type="text"
                          placeholder="Ana García"
                          className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Edad
                          </label>
                          <input
                            type="number"
                            placeholder="28"
                            min="18"
                            max="100"
                            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Profesión
                          </label>
                          <input
                            type="text"
                            placeholder="Actriz"
                            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Foto (URL)
                          </label>
                          <input
                            type="url"
                            placeholder="https://example.com/photo.jpg"
                            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Eliminado en Semana
                          </label>
                          <select
                            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                          >
                            <option value="">No eliminado</option>
                            {weeks.map(w => (
                              <option key={w.id} value={w.id}>Semana {w.number}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-3 mt-6">
                      <button
                        onClick={() => setShowCandidateForm(false)}
                        className="flex-1 bg-muted text-muted-foreground py-2 px-4 rounded-lg font-medium hover:bg-muted/80 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => {
                          setShowCandidateForm(false);
                          // Aquí iría la lógica para crear el candidato
                        }}
                        className="flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                      >
                        Crear Candidato
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Nominados Tab */}
          {activeTab === 'nominees' && (
            <div className="space-y-6 lg:space-y-8">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                <div>
                  <h3 className="text-lg lg:text-xl font-semibold text-foreground">Control de Nominaciones</h3>
                  <p className="text-muted-foreground text-sm lg:text-base">Gestiona las nominaciones de los candidatos</p>
                </div>
                <button 
                  onClick={() => handleConfirmAction(
                    'Resetear Nominaciones',
                    '¿Estás seguro de que quieres resetear todas las nominaciones de la temporada actual? Esta acción no se puede deshacer.',
                    () => alert('Nominaciones reseteadas')
                  )}
                  className="bg-destructive text-destructive-foreground px-4 lg:px-6 py-2 lg:py-3 rounded-lg font-medium hover:bg-destructive/90 transition-colors flex items-center justify-center space-x-2"
                >
                  <span>🔄</span>
                  <span>Resetear Nominaciones</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {candidates.map((candidate) => (
                  <div key={candidate.id} className="bg-card rounded-lg lg:rounded-xl p-4 lg:p-6 border border-border/40 hover:shadow-lg transition-all duration-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold text-foreground text-base lg:text-lg">{candidate.name}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            candidate.status === 'active'
                              ? 'bg-green-500/10 text-green-500'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {candidate.status === 'active' ? '🟢 Activo' : '⚪ Eliminado'}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {candidate.profession}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-muted/30 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-foreground">{candidate.nominated ? 'Nominado' : 'No Nominado'}</div>
                        <div className="text-xs text-muted-foreground">Nominación</div>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-foreground">{candidate.eliminatedWeek ? `Eliminado en Semana ${candidate.eliminatedWeek}` : 'No eliminado'}</div>
                        <div className="text-xs text-muted-foreground">Eliminado</div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button className="flex-1 bg-muted text-muted-foreground py-2 px-3 rounded-lg text-sm font-medium hover:bg-muted/80 hover:text-foreground transition-colors">
                        Editar Nominación
                      </button>
                      {candidate.status === 'active' && !candidate.nominated && (
                        <button className="flex-1 bg-primary/10 text-primary py-2 px-3 rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors">
                          Nominar
                        </button>
                      )}
                      {candidate.status === 'active' && candidate.nominated && (
                        <button className="flex-1 bg-destructive/10 text-destructive py-2 px-3 rounded-lg text-sm font-medium hover:bg-destructive/20 transition-colors">
                          Desnominar
                        </button>
                      )}
                      {candidate.status === 'active' && candidate.nominated && (
                        <button className="flex-1 bg-muted/20 text-muted-foreground py-2 px-3 rounded-lg text-sm font-medium hover:bg-muted/40 transition-colors">
                          Eliminar Nominación
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Votaciones Tab */}
          {activeTab === 'votes' && (
            <div className="space-y-6 lg:space-y-8">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                <div>
                  <h3 className="text-lg lg:text-xl font-semibold text-foreground">Control de Votaciones</h3>
                  <p className="text-muted-foreground text-sm lg:text-base">Gestiona las votaciones de la temporada</p>
                </div>
                <button 
                  onClick={() => handleConfirmAction(
                    'Resetear Votaciones',
                    '¿Estás seguro de que quieres resetear todas las votaciones de la temporada? Esta acción no se puede deshacer.',
                    () => alert('Votaciones reseteadas')
                  )}
                  className="bg-destructive text-destructive-foreground px-4 lg:px-6 py-2 lg:py-3 rounded-lg font-medium hover:bg-destructive/90 transition-colors flex items-center justify-center space-x-2"
                >
                  <span>🔄</span>
                  <span>Resetear Votaciones</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {/* Aquí iría la lógica para mostrar estadísticas de votos, gráficos, etc. */}
                <div className="bg-card rounded-lg lg:rounded-xl p-4 lg:p-6 border border-border/40 hover:shadow-lg transition-all duration-200">
                  <h3 className="text-base lg:text-lg font-semibold text-foreground mb-3 lg:mb-4">Estadísticas de Votaciones</h3>
                  <div className="space-y-3 lg:space-y-4">
                    <div className="flex items-center justify-between p-2 lg:p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-xs lg:text-sm font-medium text-foreground">Votos Totales</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{stats.totalVotes.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 lg:p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs lg:text-sm font-medium text-foreground">Votos Semanales</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{stats.weeklyVotes.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 lg:p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-xs lg:text-sm font-medium text-foreground">Candidatos Nominados</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{stats.totalCandidates - stats.eliminatedCandidates}</span>
                    </div>
                  </div>
                </div>

                {/* Aquí iría la lógica para mostrar la tabla de votos por semana */}
                <div className="bg-card rounded-lg lg:rounded-xl p-4 lg:p-6 border border-border/40 hover:shadow-lg transition-all duration-200">
                  <h3 className="text-base lg:text-lg font-semibold text-foreground mb-3 lg:mb-4">Votaciones por Semana</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                      <thead className="bg-muted/30">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Semana
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Votos Totales
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Votos Semanales
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Estado
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-card divide-y divide-border">
                        {weeks.map((week) => (
                          <tr key={week.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                              Semana {week.number}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                              {stats.totalVotes.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                              {stats.weeklyVotes.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                              {week.status === 'active' || week.status === 'voting' ? 'Votando' : week.status === 'completed' ? 'Cerrada' : 'Pendiente'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button 
                                onClick={() => handleConfirmAction(
                                  'Cerrar Semana',
                                  `¿Estás seguro de que quieres cerrar la semana ${week.number}? Esta acción no se puede deshacer.`,
                                  () => alert(`Semana ${week.number} cerrada`)
                                )}
                                className="text-red-500 hover:text-red-700 mr-2"
                              >
                                ✅
                              </button>
                              <button 
                                onClick={() => handleConfirmAction(
                                  'Eliminar Semana',
                                  `¿Estás seguro de que quieres eliminar la semana ${week.number}? Esta acción no se puede deshacer.`,
                                  () => alert(`Semana ${week.number} eliminada`)
                                )}
                                className="text-red-500 hover:text-red-700"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Otras pestañas */}
          {activeTab !== 'dashboard' && activeTab !== 'seasons' && activeTab !== 'weeks' && activeTab !== 'candidates' && activeTab !== 'nominees' && activeTab !== 'votes' && (
            <div className="text-center text-muted-foreground py-12">
              <div className="text-4xl lg:text-6xl mb-4">🚧</div>
              <p className="text-lg">Sección en construcción...</p>
              <p className="text-sm mt-2">Implementando {tabs.find(tab => tab.id === activeTab)?.label}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 