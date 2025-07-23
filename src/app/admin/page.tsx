"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

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

  // Mock data
  const seasons = [
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
    }
  }, [status, router]);

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
          <div className="bg-card rounded-xl p-6 max-w-md w-full border border-border/40">
            <h3 className="text-lg font-semibold text-foreground mb-2">{confirmAction.title}</h3>
            <p className="text-muted-foreground mb-6">{confirmAction.message}</p>
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
              <option key={season.id} value={season.id}>
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
              <p className="text-xs text-muted-foreground">Administrador</p>
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
              {seasons.find(s => s.id === selectedSeason)?.name || 'Casa Famosos 2025'}
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {seasons.map((season) => (
                  <div key={season.id} className="bg-card rounded-lg lg:rounded-xl p-4 lg:p-6 border border-border/40 hover:shadow-lg transition-all duration-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold text-foreground text-base lg:text-lg">{season.name}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            season.status === 'active' 
                              ? 'bg-green-500/10 text-green-500' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {season.status === 'active' ? '🟢 Activa' : '⚪ Completada'}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {new Date(season.startDate).toLocaleDateString('es-ES')} - {new Date(season.endDate).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-muted/30 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-foreground">12</div>
                        <div className="text-xs text-muted-foreground">Candidatos</div>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-foreground">4</div>
                        <div className="text-xs text-muted-foreground">Semanas</div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button className="flex-1 bg-muted text-muted-foreground py-2 px-3 rounded-lg text-sm font-medium hover:bg-muted/80 hover:text-foreground transition-colors">
                        Editar
                      </button>
                      {season.status === 'active' ? (
                        <button className="flex-1 bg-destructive/10 text-destructive py-2 px-3 rounded-lg text-sm font-medium hover:bg-destructive/20 transition-colors">
                          Completar
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

              {/* Season Form Modal */}
              {showSeasonForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-card rounded-xl p-6 max-w-lg w-full border border-border/40 max-h-[90vh] overflow-y-auto">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Nueva Temporada</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                          Nombre de la Temporada
                        </label>
                        <input
                          type="text"
                          placeholder="Casa Famosos 2025"
                          className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Año
                          </label>
                          <input
                            type="number"
                            placeholder="2025"
                            min="2020"
                            max="2030"
                            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary focus:outline-none"
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
                            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                          />
                        </div>
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

                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                          Descripción (Opcional)
                        </label>
                        <textarea
                          placeholder="Descripción de la temporada..."
                          rows={3}
                          className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary focus:outline-none resize-none"
                        ></textarea>
                      </div>
                    </div>

                    <div className="flex space-x-3 mt-6">
                      <button
                        onClick={() => setShowSeasonForm(false)}
                        className="flex-1 bg-muted text-muted-foreground py-2 px-4 rounded-lg font-medium hover:bg-muted/80 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => {
                          setShowSeasonForm(false);
                          // Aquí iría la lógica para crear la temporada
                        }}
                        className="flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                      >
                        Crear Temporada
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Otras pestañas */}
          {activeTab !== 'dashboard' && activeTab !== 'seasons' && (
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