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

interface Week {
  _id: string;
  seasonId: string;
  weekNumber: number;
  name: string;
  startDate: string;
  endDate: string;
  votingStartDate: string;
  votingEndDate: string;
  status: 'scheduled' | 'active' | 'voting' | 'completed' | 'cancelled';
  isVotingActive: boolean;
  nominees: Array<{
    candidateId: {
      _id: string;
      name: string;
      photo?: string;
    };
    nominatedAt: string;
  }>;
  results: {
    totalVotes: number;
    votingStats: Array<{
      candidateId: string;
      votes: number;
      percentage: number;
    }>;
    winner: {
      candidateId: string;
      votes: number;
    };
  };
  settings: {
    maxVotesPerUser: number;
    allowMultipleVotes: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

interface Candidate {
  _id: string;
  seasonId: string;
  name: string;
  photo?: string;
  bio?: string;
  age?: number;
  profession?: string;
  city?: string;
  socialMedia?: {
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
  };
  status: 'active' | 'eliminated' | 'winner' | 'suspended';
  eliminationInfo: {
    isEliminated: boolean;
    eliminatedWeek?: number;
    eliminatedDate?: string;
    eliminationReason?: string;
  };
  stats: {
    totalVotes: number;
    weeklyVotes: number;
    timesNominated: number;
    weeksInHouse: number;
    averageVotes: number;
    position: number;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState({ title: '', message: '', onConfirm: () => {} });
  
  // Estados para notificaciones toast
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);
  
  // Estados para formularios
  const [showSeasonForm, setShowSeasonForm] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState('');
  const [selectedWeek, setSelectedWeek] = useState<string>('');

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

  // Estados para semanas
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [loadingWeeks, setLoadingWeeks] = useState(true);
  const [showWeekForm, setShowWeekForm] = useState(false);
  const [editingWeek, setEditingWeek] = useState<Week | null>(null);
  const [isWeekEditMode, setIsWeekEditMode] = useState(false);
  const [weekForm, setWeekForm] = useState({
    weekNumber: 1,
    votingStartDate: '',
    votingEndDate: '',
  });
  const [submittingWeek, setSubmittingWeek] = useState(false);

  // Estados para candidatos
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [showCandidateForm, setShowCandidateForm] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [isCandidateEditMode, setIsCandidateEditMode] = useState(false);
  const [candidateForm, setCandidateForm] = useState({
    name: '',
    photo: '',
    bio: '',
  });
  const [submittingCandidate, setSubmittingCandidate] = useState(false);

  // Estados para nominados
  const [showNomineesModal, setShowNomineesModal] = useState(false);
  const [selectedNominees, setSelectedNominees] = useState<string[]>([]);
  const [submittingNominees, setSubmittingNominees] = useState(false);

  // Estados para usuarios
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockingUser, setBlockingUser] = useState<any>(null);
  const [blockReason, setBlockReason] = useState('');
  const [submittingBlock, setSubmittingBlock] = useState(false);
  
  // Estados para datatable
  const [userSearch, setUserSearch] = useState('');
  const [userSortBy, setUserSortBy] = useState('createdAt');
  const [userSortOrder, setUserSortOrder] = useState('desc');
  const [userPage, setUserPage] = useState(1);
  const [userTotal, setUserTotal] = useState(0);
  const [userPages, setUserPages] = useState(0);

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalSeasons: 0,
    activeSeason: '',
    totalCandidates: 0,
    eliminatedCandidates: 0,
    currentWeek: 0,
    activeWeek: false,
    totalVotes: 0,
    weeklyVotes: 0,
  });
  const [loadingDashboardStats, setLoadingDashboardStats] = useState(false);

  // Función para cargar estadísticas del dashboard
  const loadDashboardStats = async () => {
    try {
      setLoadingDashboardStats(true);
      const seasonId = selectedSeason || '';
      
      const response = await fetch(`/api/admin?action=dashboard&seasonId=${seasonId}`);
      if (!response.ok) {
        throw new Error('Error cargando estadísticas del dashboard');
      }
      
      const dashboardData = await response.json();
      setStats(dashboardData);
    } catch (error) {
      console.error('Error cargando estadísticas del dashboard:', error);
      setError('Error cargando estadísticas del dashboard');
    } finally {
      setLoadingDashboardStats(false);
    }
  };

  // Mock data (se mantiene para otras secciones)
  const mockSeasons = [
    { id: '2025', name: 'Casa Famosos 2025', year: 2025, status: 'active', startDate: '2025-01-15', endDate: '2025-06-15' },
    { id: '2024', name: 'Casa Famosos 2024', year: 2024, status: 'completed', startDate: '2024-01-15', endDate: '2024-06-15' }
  ];

  const mockWeeks = [
    { id: 1, number: 1, startDate: '2025-01-15', endDate: '2025-01-21', status: 'completed', nominees: 4 },
    { id: 2, number: 2, startDate: '2025-01-22', endDate: '2025-01-28', status: 'completed', nominees: 4 },
    { id: 3, number: 3, startDate: '2025-01-29', endDate: '2025-02-04', status: 'completed', nominees: 3 },
    { id: 4, number: 4, startDate: '2025-02-05', endDate: '2025-02-11', status: 'active', nominees: 4 },
    { id: 5, number: 5, startDate: '2025-02-12', endDate: '2025-02-18', status: 'scheduled', nominees: 0 },
  ];

  // Mock data para candidatos (se eliminará cuando se implemente el módulo completo)
  const mockCandidates = [
    { id: 1, name: 'Ana García', photo: '', age: 28, profession: 'Actriz', status: 'active', nominated: true, eliminatedWeek: null },
    { id: 2, name: 'Carlos López', photo: '', age: 32, profession: 'Cantante', status: 'active', nominated: true, eliminatedWeek: null },
    { id: 3, name: 'Sofia Herrera', photo: '', age: 25, profession: 'Influencer', status: 'active', nominated: false, eliminatedWeek: null },
    { id: 4, name: 'Diego Martín', photo: '', age: 30, profession: 'Actor', status: 'eliminated', nominated: false, eliminatedWeek: 2 },
  ];

  // Función para guardar selecciones en localStorage
  const saveSelectionsToStorage = (seasonId: string, weekId: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_selectedSeason', seasonId);
      localStorage.setItem('admin_selectedWeek', weekId);
    }
  };

  // Función para cargar selecciones de localStorage
  const loadSelectionsFromStorage = () => {
    if (typeof window !== 'undefined') {
      const savedSeason = localStorage.getItem('admin_selectedSeason');
      const savedWeek = localStorage.getItem('admin_selectedWeek');
      return { season: savedSeason, week: savedWeek };
    }
    return { season: null, week: null };
  };

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

  // Cargar semanas cuando cambie la temporada seleccionada
  useEffect(() => {
    if (selectedSeason && seasons.length > 0) {
      loadWeeks(selectedSeason);
    }
  }, [selectedSeason, seasons]);

  // Cargar candidatos cuando cambie la temporada seleccionada
  useEffect(() => {
    if (selectedSeason && seasons.length > 0) {
      loadCandidates(selectedSeason);
    }
  }, [selectedSeason, seasons]);

  // Establecer la semana seleccionada cuando se carguen las semanas
  useEffect(() => {
    if (weeks.length > 0 && !selectedWeek) {
      const savedSelections = loadSelectionsFromStorage();
      const weekToSelect = savedSelections.week && weeks.find(w => w._id === savedSelections.week)
        ? savedSelections.week
        : weeks[0]._id;
      
      setSelectedWeek(weekToSelect);
    }
  }, [weeks, selectedWeek]);



  // Establecer la primera temporada como seleccionada cuando se carguen
  useEffect(() => {
    if (seasons.length > 0 && !selectedSeason) {
      const savedSelections = loadSelectionsFromStorage();
      const seasonToSelect = savedSelections.season && seasons.find(s => s._id === savedSelections.season) 
        ? savedSelections.season 
        : seasons[0]._id;
      
      setSelectedSeason(seasonToSelect);
    }
  }, [seasons, selectedSeason]);

  // Cargar usuarios cuando se active la pestaña de usuarios
  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers(1, '', 'createdAt', 'desc');
    }
  }, [activeTab]);

  // Cargar estadísticas del dashboard cuando cambie la temporada o se active la pestaña
  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboardStats();
    }
  }, [selectedSeason, activeTab]);

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
      showToast('success', 'Temporada creada correctamente');
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
      showToast('success', 'Temporada activada correctamente');
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
      showToast('success', 'Temporada completada correctamente');
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
      showToast('success', 'Temporada actualizada correctamente');
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
      showToast('success', result.message);
      // Recargar la página para actualizar la sesión
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      setError(err.message);
      console.error('Error convirtiendo en admin:', err);
    }
  };

  // Función para cargar semanas de una temporada
  const loadWeeks = async (seasonId: string) => {
    try {
      setLoadingWeeks(true);
      setError(null);
      const response = await fetch(`/api/weeks?seasonId=${seasonId}`);
      if (!response.ok) {
        throw new Error('Error al cargar semanas');
      }
      const data = await response.json();
      setWeeks(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error cargando semanas:', err);
    } finally {
      setLoadingWeeks(false);
    }
  };

  // Función para obtener el siguiente número de semana automáticamente
  const getNextWeekNumber = (seasonId: string) => {
    const seasonWeeks = weeks.filter(w => w.seasonId === seasonId);
    if (seasonWeeks.length === 0) return 1;
    return Math.max(...seasonWeeks.map(w => w.weekNumber)) + 1;
  };

  // Función para crear semana
  const createWeek = async () => {
    try {
      setSubmittingWeek(true);
      setError(null);
      
      const nextWeekNumber = getNextWeekNumber(selectedSeason);
      
      // Calcular automáticamente las fechas de inicio y fin basándose en las fechas de votación
      const votingStartDate = new Date(weekForm.votingStartDate);
      const votingEndDate = new Date(weekForm.votingEndDate);
      
      // La semana comienza 2 días antes del inicio de votación y termina 1 día después del fin de votación
      const startDate = new Date(votingStartDate);
      startDate.setDate(startDate.getDate() - 2);
      
      const endDate = new Date(votingEndDate);
      endDate.setDate(endDate.getDate() + 1);
      
      const response = await fetch('/api/weeks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          seasonId: selectedSeason,
          weekNumber: nextWeekNumber,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          votingStartDate: weekForm.votingStartDate,
          votingEndDate: weekForm.votingEndDate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear semana');
      }

      const newWeek = await response.json();
      setWeeks(prev => [...prev, newWeek]);
      setShowWeekForm(false);
      setWeekForm({
        weekNumber: 1,
        votingStartDate: '',
        votingEndDate: '',
      });
      showToast('success', 'Semana creada correctamente');
    } catch (err: any) {
      setError(err.message);
      console.error('Error creando semana:', err);
    } finally {
      setSubmittingWeek(false);
    }
  };

  // Función para editar semana
  const editWeek = async () => {
    if (!editingWeek) return;
    
    try {
      setSubmittingWeek(true);
      setError(null);
      
      // Calcular automáticamente las fechas de inicio y fin basándose en las fechas de votación
      const votingStartDate = new Date(weekForm.votingStartDate);
      const votingEndDate = new Date(weekForm.votingEndDate);
      
      // La semana comienza 2 días antes del inicio de votación y termina 1 día después del fin de votación
      const startDate = new Date(votingStartDate);
      startDate.setDate(startDate.getDate() - 2);
      
      const endDate = new Date(votingEndDate);
      endDate.setDate(endDate.getDate() + 1);
      
      const response = await fetch('/api/weeks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weekId: editingWeek._id,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          votingStartDate: weekForm.votingStartDate,
          votingEndDate: weekForm.votingEndDate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar semana');
      }

      const updatedWeek = await response.json();
      setWeeks(prev => prev.map(w => w._id === editingWeek._id ? updatedWeek : w));
      setShowWeekForm(false);
      setEditingWeek(null);
      setIsWeekEditMode(false);
      setWeekForm({
        weekNumber: 1,
        votingStartDate: '',
        votingEndDate: '',
      });
      showToast('success', 'Semana actualizada correctamente');
    } catch (err: any) {
      setError(err.message);
      console.error('Error actualizando semana:', err);
    } finally {
      setSubmittingWeek(false);
    }
  };

  // Función para abrir formulario de edición de semana
  const openEditWeekForm = (week: Week) => {
    setEditingWeek(week);
    setIsWeekEditMode(true);
    setWeekForm({
      weekNumber: week.weekNumber,
      votingStartDate: week.votingStartDate.slice(0, 16), // Formato datetime-local
      votingEndDate: week.votingEndDate.slice(0, 16), // Formato datetime-local
    });
    setShowWeekForm(true);
  };

  // Función para cerrar semana
  const closeWeek = async (weekId: string) => {
    try {
      setError(null);
      const response = await fetch('/api/weeks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'endVoting',
          weekId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cerrar semana');
      }

      await loadWeeks(selectedSeason);
      showToast('success', 'Semana cerrada correctamente');
    } catch (err: any) {
      setError(err.message);
      console.error('Error cerrando semana:', err);
    }
  };

  // Función para abrir semana
  const openWeek = async (weekId: string) => {
    try {
      setError(null);
      const response = await fetch('/api/weeks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'startVoting',
          weekId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al abrir semana');
      }

      await loadWeeks(selectedSeason);
      showToast('success', 'Semana abierta correctamente');
    } catch (err: any) {
      setError(err.message);
      console.error('Error abriendo semana:', err);
    }
  };

  // Función para eliminar semana
  const deleteWeek = async (weekId: string) => {
    try {
      setError(null);
      const response = await fetch(`/api/weeks?id=${weekId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar semana');
      }

      const result = await response.json();
      setWeeks(prev => prev.filter(w => w._id !== weekId));
      
      // Mostrar mensaje de éxito
      showToast('success', result.message || 'Semana eliminada correctamente');
    } catch (err: any) {
      setError(err.message);
      console.error('Error eliminando semana:', err);
    }
  };

  // Función para verificar si una semana puede ser abierta
  const canOpenWeek = (week: Week) => {
    const now = new Date();
    const votingEndDate = new Date(week.votingEndDate);
    return votingEndDate > now;
  };

  // Función para manejar envío de formulario de semana
  const handleWeekSubmit = async () => {
    if (isWeekEditMode) {
      await editWeek();
    } else {
      await createWeek();
    }
  };

  // Función para cargar candidatos de una temporada
  const loadCandidates = async (seasonId: string) => {
    try {
      setLoadingCandidates(true);
      setError(null);
      const response = await fetch(`/api/candidates?seasonId=${seasonId}`);
      if (!response.ok) {
        throw new Error('Error al cargar candidatos');
      }
      const data = await response.json();
      setCandidates(data);
    } catch (err: any) {
      setError(err.message);
      console.error('Error cargando candidatos:', err);
    } finally {
      setLoadingCandidates(false);
    }
  };

  // Función para crear candidato
  const createCandidate = async () => {
    try {
      setSubmittingCandidate(true);
      setError(null);
      
      const response = await fetch('/api/candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          seasonId: selectedSeason,
          ...candidateForm,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear candidato');
      }

      const newCandidate = await response.json();
      setCandidates(prev => [...prev, newCandidate]);
      setShowCandidateForm(false);
      setCandidateForm({
        name: '',
        photo: '',
        bio: '',
      });
      showToast('success', 'Candidato creado correctamente');
    } catch (err: any) {
      setError(err.message);
      console.error('Error creando candidato:', err);
    } finally {
      setSubmittingCandidate(false);
    }
  };

  // Función para editar candidato
  const editCandidate = async () => {
    if (!editingCandidate) return;
    
    try {
      setSubmittingCandidate(true);
      setError(null);
      
      const response = await fetch('/api/candidates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateId: editingCandidate._id,
          ...candidateForm,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar candidato');
      }

      const updatedCandidate = await response.json();
      setCandidates(prev => prev.map(c => c._id === editingCandidate._id ? updatedCandidate : c));
      setShowCandidateForm(false);
      setEditingCandidate(null);
      setIsCandidateEditMode(false);
      setCandidateForm({
        name: '',
        photo: '',
        bio: '',
      });
      showToast('success', 'Candidato actualizado correctamente');
    } catch (err: any) {
      setError(err.message);
      console.error('Error actualizando candidato:', err);
    } finally {
      setSubmittingCandidate(false);
    }
  };

  // Función para eliminar candidato de la competencia
  const eliminateCandidate = async (candidateId: string) => {
    try {
      setError(null);
      const response = await fetch('/api/candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'eliminate',
          candidateId,
          weekNumber: 1, // Por ahora hardcodeado, se puede mejorar después
          reason: 'Eliminado por administrador'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar candidato de la competencia');
      }

      const updatedCandidate = await response.json();
      setCandidates(prev => prev.map(c => c._id === candidateId ? updatedCandidate : c));
      showToast('success', 'Candidato eliminado de la competencia correctamente');
    } catch (err: any) {
      setError(err.message);
      console.error('Error eliminando candidato de la competencia:', err);
    }
  };

  // Función para eliminar candidato de la base de datos
  const deleteCandidate = async (candidateId: string) => {
    try {
      setError(null);
      const response = await fetch(`/api/candidates?id=${candidateId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar candidato');
      }

      const result = await response.json();
      setCandidates(prev => prev.filter(c => c._id !== candidateId));
      showToast('success', result.message || 'Candidato eliminado correctamente');
    } catch (err: any) {
      setError(err.message);
      console.error('Error eliminando candidato:', err);
    }
  };

  // Función para abrir formulario de edición de candidato
  const openEditCandidateForm = (candidate: Candidate) => {
    setEditingCandidate(candidate);
    setIsCandidateEditMode(true);
    setCandidateForm({
      name: candidate.name,
      photo: candidate.photo || '',
      bio: candidate.bio || '',
    });
    setShowCandidateForm(true);
  };

  // Función para manejar envío de formulario de candidato
  const handleCandidateSubmit = async () => {
    if (isCandidateEditMode) {
      await editCandidate();
    } else {
      await createCandidate();
    }
  };

  // Función para abrir modal de selección de nominados
  const openNomineesModal = () => {
    // Obtener candidatos activos de la temporada seleccionada
    const activeCandidates = candidates.filter(c => c.status === 'active');
    setSelectedNominees([]);
    setShowNomineesModal(true);
  };

  // Función para agregar nominados a la semana
  const addNomineesToWeek = async () => {
    if (!selectedNominees.length) {
      showToast('warning', 'Debes seleccionar al menos un candidato');
      return;
    }

    try {
      setSubmittingNominees(true);
      setError(null);

      // Usar la semana seleccionada o buscar una activa
      const weekToUse = selectedWeek && weeks.find(w => w._id === selectedWeek)
        ? weeks.find(w => w._id === selectedWeek)
        : weeks.find(w => w.status === 'voting' || w.status === 'active');
      
      if (!weekToUse) {
        showToast('error', 'No hay una semana seleccionada o activa para agregar nominados');
        return;
      }

      // Agregar cada candidato seleccionado como nominado
      for (const candidateId of selectedNominees) {
        const response = await fetch('/api/weeks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'addNominee',
            weekId: weekToUse._id,
            candidateId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al agregar nominado');
        }
      }

      // Recargar semanas para mostrar los cambios
      await loadWeeks(selectedSeason);
      setShowNomineesModal(false);
      setSelectedNominees([]);
      showToast('success', `${selectedNominees.length} candidato(s) agregado(s) como nominado(s)`);
    } catch (err: any) {
      setError(err.message);
      console.error('Error agregando nominados:', err);
    } finally {
      setSubmittingNominees(false);
    }
  };

  // Función para remover nominado de una semana
  const removeNominee = async (weekId: string, candidateId: string) => {
    try {
      setError(null);
      const response = await fetch('/api/weeks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'removeNominee',
          weekId,
          candidateId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al remover nominado');
      }

      await loadWeeks(selectedSeason);
      showToast('success', 'Nominado removido correctamente');
    } catch (err: any) {
      setError(err.message);
      console.error('Error removiendo nominado:', err);
    }
  };

  // Función para manejar cambio de temporada
  const handleSeasonChange = (seasonId: string) => {
    setSelectedSeason(seasonId);
    setSelectedWeek(''); // Resetear semana al cambiar temporada
    saveSelectionsToStorage(seasonId, '');
  };

  // Función para manejar cambio de semana
  const handleWeekChange = (weekId: string) => {
    setSelectedWeek(weekId);
    saveSelectionsToStorage(selectedSeason, weekId);
  };

  // Función para resetear nominaciones de la temporada
  const resetSeasonNominations = async () => {
    try {
      setError(null);
      
      // Remover todos los nominados de todas las semanas de la temporada
      for (const week of weeks) {
        for (const nominee of week.nominees) {
          await fetch('/api/weeks', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'removeNominee',
              weekId: week._id,
              candidateId: nominee.candidateId._id,
            }),
          });
        }
      }

      await loadWeeks(selectedSeason);
      showToast('success', 'Todas las nominaciones han sido reseteadas');
    } catch (err: any) {
      setError(err.message);
      console.error('Error reseteando nominaciones:', err);
    }
  };

  // Función para resetear votos de una semana específica
  const resetWeekVotes = async () => {
    if (!selectedWeek) {
      setError('Debes seleccionar una semana');
      return;
    }

    try {
      setError(null);
      const selectedWeekData = weeks.find(w => w._id === selectedWeek);
      if (!selectedWeekData) {
        setError('Semana no encontrada');
        return;
      }

      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'resetWeekVotes',
          weekId: selectedWeek,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al resetear votos de la semana');
      }

      await loadWeeks(selectedSeason);
      showToast('success', `Votos de la Semana ${selectedWeekData.weekNumber} reseteados correctamente`);
    } catch (err: any) {
      setError(err.message);
      console.error('Error reseteando votos de la semana:', err);
    }
  };

  // Función para cargar usuarios
  const loadUsers = async (page = 1, search = '', sortBy = 'createdAt', sortOrder = 'desc') => {
    try {
      setLoadingUsers(true);
      setError(null);
      
      const params = new URLSearchParams({
        action: 'users',
        page: page.toString(),
        limit: '20',
        search: search,
        sortBy: sortBy,
        sortOrder: sortOrder
      });
      
      const response = await fetch(`/api/admin?${params}`);
      if (!response.ok) {
        throw new Error('Error al cargar usuarios');
      }
      const data = await response.json();
      setUsers(data.users);
      setUserTotal(data.pagination.total);
      setUserPages(data.pagination.pages);
      setUserPage(data.pagination.page);
    } catch (err: any) {
      setError(err.message);
      console.error('Error cargando usuarios:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Función para actualizar usuarios (para el botón)
  const refreshUsers = () => {
    loadUsers(userPage, userSearch, userSortBy, userSortOrder);
  };

  // Función para bloquear usuario
  const blockUser = async () => {
    if (!blockReason.trim()) {
      showToast('error', 'Debes especificar una razón para el bloqueo');
      return;
    }

    try {
      setSubmittingBlock(true);
      setError(null);
      
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'blockUser',
          userId: blockingUser._id,
          reason: blockReason.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al bloquear usuario');
      }

      await loadUsers();
      setShowBlockModal(false);
      setBlockingUser(null);
      setBlockReason('');
      showToast('success', `Usuario ${blockingUser.name} bloqueado correctamente`);
    } catch (err: any) {
      setError(err.message);
      console.error('Error bloqueando usuario:', err);
    } finally {
      setSubmittingBlock(false);
    }
  };

  // Función para desbloquear usuario
  const unblockUser = async (userId: string, userName: string) => {
    try {
      setError(null);
      
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'unblockUser',
          userId: userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al desbloquear usuario');
      }

      await loadUsers();
      showToast('success', `Usuario ${userName} desbloqueado correctamente`);
    } catch (err: any) {
      setError(err.message);
      console.error('Error desbloqueando usuario:', err);
    }
  };

  // Función para abrir modal de bloqueo
  const openBlockModal = (user: any) => {
    setBlockingUser(user);
    setBlockReason('');
    setShowBlockModal(true);
  };

  // Función para hacer admin
  const toggleAdminStatus = async (userId: string, userName: string) => {
    try {
      setError(null);
      
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'toggleAdminStatus',
          userId: userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cambiar estado de admin');
      }

      await loadUsers(userPage, userSearch, userSortBy, userSortOrder);
      showToast('success', `Estado de admin de ${userName} actualizado correctamente`);
    } catch (err: any) {
      setError(err.message);
      console.error('Error cambiando estado de admin:', err);
    }
  };

  // Función para eliminar usuario
  const deleteUser = async (userId: string, userName: string) => {
    try {
      setError(null);
      
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'deleteUser',
          userId: userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar usuario');
      }

      await loadUsers(userPage, userSearch, userSortBy, userSortOrder);
      showToast('success', `Usuario ${userName} eliminado correctamente`);
    } catch (err: any) {
      setError(err.message);
      console.error('Error eliminando usuario:', err);
    }
  };

  // Función para manejar búsqueda
  const handleUserSearch = (searchTerm: string) => {
    setUserSearch(searchTerm);
    setUserPage(1);
    loadUsers(1, searchTerm, userSortBy, userSortOrder);
  };

  // Función para manejar ordenamiento
  const handleUserSort = (sortBy: string, sortOrder: string) => {
    setUserSortBy(sortBy);
    setUserSortOrder(sortOrder);
    setUserPage(1);
    loadUsers(1, userSearch, sortBy, sortOrder);
  };

  // Función para manejar paginación
  const handleUserPageChange = (page: number) => {
    setUserPage(page);
    loadUsers(page, userSearch, userSortBy, userSortOrder);
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
    { id: 'users', label: 'Usuarios', icon: '👤' },
  ];

  const handleConfirmAction = (title: string, message: string, onConfirm: () => void) => {
    setConfirmAction({ title, message, onConfirm });
    setShowConfirmModal(true);
  };

  const executeConfirmAction = () => {
    confirmAction.onConfirm();
    setShowConfirmModal(false);
  };

  // Función para mostrar notificaciones toast
  const showToast = (type: 'success' | 'error' | 'warning', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000); // Auto-hide después de 4 segundos
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Toast Notifications */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-2">
          <div className={`rounded-lg p-4 shadow-lg border-l-4 ${
            toast.type === 'success' 
              ? 'bg-green-50 border-green-500 text-green-800' 
              : toast.type === 'error'
                ? 'bg-red-50 border-red-500 text-red-800'
                : 'bg-yellow-50 border-yellow-500 text-yellow-800'
          }`}>
            <div className="flex items-center space-x-2">
              <span className="text-lg">
                {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : '⚠️'}
              </span>
              <span className="font-medium">{toast.message}</span>
              <button 
                onClick={() => setToast(null)}
                className="ml-2 text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Modal de Bloqueo de Usuario */}
      {showBlockModal && blockingUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl p-6 max-w-lg w-full border border-border/40 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-foreground mb-4">Bloquear Usuario</h3>
            <p className="text-muted-foreground mb-4">
              ¿Estás seguro de que quieres bloquear a <strong>{blockingUser.name}</strong>?
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                Razón del bloqueo *
              </label>
              <textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Especifica la razón del bloqueo..."
                className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary focus:outline-none resize-none"
                rows={3}
                required
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowBlockModal(false);
                  setBlockingUser(null);
                  setBlockReason('');
                }}
                className="flex-1 bg-muted text-muted-foreground py-2 px-4 rounded-lg font-medium hover:bg-muted/80 transition-colors"
                disabled={submittingBlock}
              >
                Cancelar
              </button>
              <button
                onClick={blockUser}
                disabled={submittingBlock || !blockReason.trim()}
                className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingBlock ? 'Bloqueando...' : 'Bloquear'}
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
            onChange={(e) => handleSeasonChange(e.target.value)}
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
              {/* Header */}
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
                <div>
                  <h3 className="text-lg lg:text-xl font-semibold text-foreground">Dashboard</h3>
                  <p className="text-muted-foreground text-sm lg:text-base">
                    Estadísticas de {selectedSeason ? seasons.find(s => s._id === selectedSeason)?.name : 'todas las temporadas'}
                  </p>
                </div>
                <button 
                  onClick={loadDashboardStats}
                  disabled={loadingDashboardStats}
                  className="bg-primary text-primary-foreground px-4 lg:px-6 py-2 lg:py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{loadingDashboardStats ? '⏳' : '🔄'}</span>
                  <span>{loadingDashboardStats ? 'Cargando...' : 'Actualizar'}</span>
                </button>
              </div>

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
                        () => showToast('success', 'Votos reseteados correctamente')
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
                  <h3 className="text-lg lg:text-xl font-semibold text-foreground">Gestión de Semanas</h3>
                  <p className="text-muted-foreground text-sm lg:text-base">
                    Administra las semanas de votación de {seasons.find(s => s._id === selectedSeason)?.name || 'la temporada'}
                  </p>
                </div>
                <button 
                  onClick={() => setShowWeekForm(true)}
                  disabled={!selectedSeason || seasons.length === 0}
                  className="bg-primary text-primary-foreground px-4 lg:px-6 py-2 lg:py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>+</span>
                  <span>Nueva Semana</span>
                </button>
              </div>

              {/* Loading State */}
              {loadingWeeks ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Cargando semanas...</p>
                  </div>
                </div>
              ) : weeks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">📅</div>
                  <p className="text-lg font-medium text-foreground mb-2">No hay semanas</p>
                  <p className="text-muted-foreground">Crea la primera semana para comenzar</p>
                </div>
              ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {weeks.map((week) => (
                    <div key={week._id} className="bg-card rounded-lg lg:rounded-xl p-4 lg:p-6 border border-border/40 hover:shadow-lg transition-all duration-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-semibold text-foreground text-base lg:text-lg">Semana {week.weekNumber}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            week.status === 'active' || week.status === 'voting'
                              ? 'bg-green-500/10 text-green-500'
                              : week.status === 'completed'
                                ? 'bg-muted text-muted-foreground'
                                  : 'bg-blue-500/10 text-blue-500'
                          }`}>
                              {week.status === 'active' || week.status === 'voting' ? '🟢 Votando' : week.status === 'completed' ? '✅ Cerrada' : '⏳ Programada'}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-sm">
                            Votación: {new Date(week.votingStartDate).toLocaleDateString('es-ES')} - {new Date(week.votingEndDate).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-muted/30 rounded-lg p-3 text-center">
                          <div className="text-lg font-bold text-foreground">{week.nominees.length}</div>
                        <div className="text-xs text-muted-foreground">Nominados</div>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3 text-center">
                          <div className="text-lg font-bold text-foreground">{week.results.totalVotes.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Votos</div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                        <button 
                          onClick={() => openEditWeekForm(week)}
                          className="flex-1 bg-blue-500/10 text-blue-500 py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-500/20 transition-colors"
                        >
                          Editar
                      </button>
                        {week.status === 'voting' && (
                          <button 
                            onClick={() => handleConfirmAction(
                              'Cerrar Semana',
                              `¿Estás seguro de que quieres cerrar la semana ${week.weekNumber}? Esta acción finalizará la votación y no se puede deshacer.`,
                              () => closeWeek(week._id)
                            )}
                            className="flex-1 bg-destructive/10 text-destructive py-2 px-3 rounded-lg text-sm font-medium hover:bg-destructive/20 transition-colors"
                          >
                            Cerrar
                        </button>
                        )}
                        {week.status === 'completed' && canOpenWeek(week) && (
                          <button 
                            onClick={() => handleConfirmAction(
                              'Abrir Semana',
                              `¿Estás seguro de que quieres abrir la semana ${week.weekNumber} para votación? Esta acción cerrará cualquier otra semana activa.`,
                              () => openWeek(week._id)
                            )}
                            className="flex-1 bg-green-500/10 text-green-500 py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-500/20 transition-colors"
                          >
                            Abrir
                        </button>
                        )}
                        {week.status === 'completed' && !canOpenWeek(week) && (
                          <button 
                            disabled
                            className="flex-1 bg-gray-500/10 text-gray-500 py-2 px-3 rounded-lg text-sm font-medium cursor-not-allowed"
                            title="No se puede abrir una semana cuya fecha de votación ya pasó"
                          >
                            Fecha Pasada
                          </button>
                        )}
                      </div>
                      
                      <div className="flex space-x-2 mt-2">
                        {week.isVotingActive ? (
                          <button 
                            disabled
                            className="flex-1 bg-gray-500/10 text-gray-500 py-2 px-3 rounded-lg text-sm font-medium cursor-not-allowed"
                            title="No se puede eliminar una semana con votación activa"
                          >
                            🚫 No se puede eliminar
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleConfirmAction(
                              'Eliminar Semana',
                              `¿Estás seguro de que quieres eliminar la semana ${week.weekNumber}? Esta acción eliminará todos los datos asociados y no se puede deshacer.`,
                              () => deleteWeek(week._id)
                            )}
                            className="flex-1 bg-red-500/10 text-red-500 py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors"
                          >
                            🗑️ Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              )}

              {/* Week Form Modal */}
              {showWeekForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-card rounded-xl p-6 max-w-lg w-full border border-border/40 max-h-[90vh] overflow-y-auto">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      {isWeekEditMode ? 'Editar Semana' : 'Nueva Semana'}
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                          Número de Semana
                        </label>
                        <div className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-foreground">
                          {isWeekEditMode ? `Semana ${weekForm.weekNumber}` : `Semana ${getNextWeekNumber(selectedSeason)}`}
                      </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Se asigna automáticamente el siguiente número disponible
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Inicio de Votación *
                          </label>
                          <input
                            type="datetime-local"
                            value={weekForm.votingStartDate}
                            onChange={(e) => setWeekForm(prev => ({ ...prev, votingStartDate: e.target.value }))}
                            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Fin de Votación *
                          </label>
                          <input
                            type="datetime-local"
                            value={weekForm.votingEndDate}
                            onChange={(e) => setWeekForm(prev => ({ ...prev, votingEndDate: e.target.value }))}
                            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                            required
                          />
                        </div>
                      </div>

                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                        <p className="text-sm text-blue-600">
                          <strong>Nota:</strong> Solo necesitas configurar las fechas de inicio y fin de votación. 
                          El número de semana se asigna automáticamente según la temporada seleccionada.
                        </p>
                      </div>
                    </div>

                    <div className="flex space-x-3 mt-6">
                      <button
                        onClick={() => {
                          setShowWeekForm(false);
                          setEditingWeek(null);
                          setIsWeekEditMode(false);
                          setWeekForm({
                            weekNumber: 1,
                            votingStartDate: '',
                            votingEndDate: '',
                          });
                        }}
                        disabled={submittingWeek}
                        className="flex-1 bg-muted text-muted-foreground py-2 px-4 rounded-lg font-medium hover:bg-muted/80 transition-colors disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleWeekSubmit}
                        disabled={submittingWeek || !weekForm.votingStartDate || !weekForm.votingEndDate}
                        className="flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                      >
                        {submittingWeek ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>{isWeekEditMode ? 'Actualizando...' : 'Creando...'}</span>
                          </>
                        ) : (
                          <span>{isWeekEditMode ? 'Actualizar Semana' : 'Crear Semana'}</span>
                        )}
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
                  <h3 className="text-lg lg:text-xl font-semibold text-foreground">Gestión de Candidatos</h3>
                  <p className="text-muted-foreground text-sm lg:text-base">
                    Administra los candidatos de {seasons.find(s => s._id === selectedSeason)?.name || 'la temporada'}
                  </p>
                </div>
                <button 
                  onClick={() => setShowCandidateForm(true)}
                  disabled={!selectedSeason || seasons.length === 0}
                  className="bg-primary text-primary-foreground px-4 lg:px-6 py-2 lg:py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>+</span>
                  <span>Nuevo Candidato</span>
                </button>
              </div>

              {/* Loading State */}
              {loadingCandidates ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Cargando candidatos...</p>
                  </div>
                </div>
              ) : candidates.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">👥</div>
                  <p className="text-lg font-medium text-foreground mb-2">No hay candidatos</p>
                  <p className="text-muted-foreground">Crea el primer candidato para comenzar</p>
                </div>
              ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                {candidates.map((candidate) => (
                    <div key={candidate._id} className="bg-card rounded-lg lg:rounded-xl p-4 lg:p-6 border border-border/40 hover:shadow-lg transition-all duration-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold text-foreground text-base lg:text-lg">{candidate.name}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            candidate.status === 'active'
                              ? 'bg-green-500/10 text-green-500'
                                : candidate.status === 'eliminated'
                                  ? 'bg-red-500/10 text-red-500'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                              {candidate.status === 'active' ? '🟢 Activo' : candidate.status === 'eliminated' ? '🔴 Eliminado' : '⚪ Inactivo'}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-sm">
                            {candidate.bio ? 'Con descripción' : 'Sin descripción'}
                        </p>
                          {candidate.bio && (
                            <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{candidate.bio}</p>
                          )}
                      </div>
                        {candidate.photo && (
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-muted/30 flex-shrink-0">
                            <img 
                              src={candidate.photo} 
                              alt={candidate.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-muted/30 rounded-lg p-3 text-center">
                          <div className="text-lg font-bold text-foreground">{candidate.stats.timesNominated}</div>
                          <div className="text-xs text-muted-foreground">Nominaciones</div>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3 text-center">
                          <div className="text-lg font-bold text-foreground">{candidate.stats.totalVotes.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">Votos Totales</div>
                      </div>
                    </div>

                      {candidate.eliminationInfo.isEliminated && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4">
                          <div className="text-sm text-red-600">
                            <strong>Eliminado:</strong> Semana {candidate.eliminationInfo.eliminatedWeek}
                            {candidate.eliminationInfo.eliminationReason && (
                              <div className="text-xs mt-1">Razón: {candidate.eliminationInfo.eliminationReason}</div>
                            )}
                          </div>
                        </div>
                      )}

                    <div className="flex space-x-2">
                        <button 
                          onClick={() => openEditCandidateForm(candidate)}
                          className="flex-1 bg-blue-500/10 text-blue-500 py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-500/20 transition-colors"
                        >
                        Editar
                      </button>
                      {candidate.status === 'active' ? (
                          <button 
                            onClick={() => handleConfirmAction(
                              'Eliminar de la Competencia',
                              `¿Estás seguro de que quieres eliminar a "${candidate.name}" de la competencia? Esta acción cambiará su estado a eliminado.`,
                              () => eliminateCandidate(candidate._id)
                            )}
                            className="flex-1 bg-orange-500/10 text-orange-500 py-2 px-3 rounded-lg text-sm font-medium hover:bg-orange-500/20 transition-colors"
                          >
                            🚫 Eliminar de Competencia
                        </button>
                      ) : (
                          <button 
                            onClick={() => handleConfirmAction(
                              'Borrar del Sistema',
                              `¿Estás seguro de que quieres borrar a "${candidate.name}" del sistema? Esta acción eliminará todos los datos asociados y no se puede deshacer.`,
                              () => deleteCandidate(candidate._id)
                            )}
                            className="flex-1 bg-red-500/10 text-red-500 py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors"
                          >
                            🗑️ Borrar del Sistema
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              )}

              {/* Candidate Form Modal */}
              {showCandidateForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-card rounded-xl p-6 max-w-lg w-full border border-border/40 max-h-[90vh] overflow-y-auto">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      {isCandidateEditMode ? 'Editar Candidato' : 'Nuevo Candidato'}
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                          Nombre del Candidato *
                        </label>
                        <input
                          type="text"
                          placeholder="Ana García"
                          value={candidateForm.name}
                          onChange={(e) => setCandidateForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                          required
                        />
                      </div>

                        <div>
                          <label className="block text-sm font-medium text-muted-foreground mb-2">
                          Descripción (Bio)
                          </label>
                        <textarea
                          placeholder="Breve descripción del candidato..."
                          rows={3}
                          value={candidateForm.bio}
                          onChange={(e) => setCandidateForm(prev => ({ ...prev, bio: e.target.value }))}
                          className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary focus:outline-none resize-none"
                        ></textarea>
                      </div>

                        <div>
                          <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Foto (URL)
                          </label>
                          <input
                            type="url"
                            placeholder="https://example.com/photo.jpg"
                          value={candidateForm.photo}
                          onChange={(e) => setCandidateForm(prev => ({ ...prev, photo: e.target.value }))}
                            className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                          />
                      </div>
                    </div>

                    <div className="flex space-x-3 mt-6">
                      <button
                        onClick={() => {
                          setShowCandidateForm(false);
                          setEditingCandidate(null);
                          setIsCandidateEditMode(false);
                          setCandidateForm({
                            name: '',
                            photo: '',
                            bio: '',
                          });
                        }}
                        disabled={submittingCandidate}
                        className="flex-1 bg-muted text-muted-foreground py-2 px-4 rounded-lg font-medium hover:bg-muted/80 transition-colors disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleCandidateSubmit}
                        disabled={submittingCandidate || !candidateForm.name}
                        className="flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                      >
                        {submittingCandidate ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>{isCandidateEditMode ? 'Actualizando...' : 'Creando...'}</span>
                          </>
                        ) : (
                          <span>{isCandidateEditMode ? 'Actualizar Candidato' : 'Crear Candidato'}</span>
                        )}
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

              {/* Selector de Semana */}
              <div className="bg-card rounded-lg lg:rounded-xl p-4 lg:p-6 border border-border/40">
                <h3 className="text-base lg:text-lg font-semibold text-foreground mb-3 lg:mb-4">Semana Seleccionada</h3>
                <select
                  value={selectedWeek}
                  onChange={(e) => handleWeekChange(e.target.value)}
                  disabled={!selectedSeason || weeks.length === 0}
                  className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Selecciona una semana</option>
                  {weeks.map(week => (
                    <option key={week._id} value={week._id}>
                      Semana {week.weekNumber} - {week.status === 'voting' || week.status === 'active' ? '🟢 Votando' : week.status === 'completed' ? '✅ Cerrada' : '⏳ Programada'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                <div>
                  <h3 className="text-lg lg:text-xl font-semibold text-foreground">Control de Nominaciones</h3>
                  <p className="text-muted-foreground text-sm lg:text-base">
                    Gestiona las nominaciones de {seasons.find(s => s._id === selectedSeason)?.name || 'la temporada'}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={openNomineesModal}
                    disabled={!selectedSeason || !selectedWeek || seasons.length === 0 || candidates.length === 0}
                    className="bg-primary text-primary-foreground px-4 lg:px-6 py-2 lg:py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>🎯</span>
                    <span>Seleccionar Nominados</span>
                  </button>
                <button 
                  onClick={() => handleConfirmAction(
                    'Resetear Nominaciones',
                    '¿Estás seguro de que quieres resetear todas las nominaciones de la temporada actual? Esta acción no se puede deshacer.',
                      () => resetSeasonNominations()
                  )}
                  className="bg-destructive text-destructive-foreground px-4 lg:px-6 py-2 lg:py-3 rounded-lg font-medium hover:bg-destructive/90 transition-colors flex items-center justify-center space-x-2"
                >
                  <span>🔄</span>
                  <span>Resetear Nominaciones</span>
                </button>
                </div>
              </div>

              {/* Loading State */}
              {loadingWeeks ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Cargando semanas...</p>
                  </div>
                </div>
              ) : weeks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">📅</div>
                  <p className="text-lg font-medium text-foreground mb-2">No hay semanas</p>
                  <p className="text-muted-foreground">Crea semanas primero para gestionar nominaciones</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {(selectedWeek ? weeks.filter(w => w._id === selectedWeek) : weeks).map((week) => (
                    <div key={week._id} className="bg-card rounded-lg lg:rounded-xl p-4 lg:p-6 border border-border/40">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-foreground">Semana {week.weekNumber}</h4>
                          <p className="text-muted-foreground text-sm">
                            {new Date(week.votingStartDate).toLocaleDateString('es-ES')} - {new Date(week.votingEndDate).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          week.status === 'voting' || week.status === 'active'
                              ? 'bg-green-500/10 text-green-500'
                            : week.status === 'completed'
                              ? 'bg-muted text-muted-foreground'
                              : 'bg-blue-500/10 text-blue-500'
                          }`}>
                          {week.status === 'voting' || week.status === 'active' ? '🟢 Votando' : week.status === 'completed' ? '✅ Cerrada' : '⏳ Programada'}
                          </span>
                        </div>

                      {week.nominees.length === 0 ? (
                        <div className="text-center py-8 bg-muted/20 rounded-lg">
                          <div className="text-2xl mb-2">🎯</div>
                          <p className="text-muted-foreground">No hay nominados en esta semana</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {week.nominees.map((nominee) => (
                            <div key={nominee.candidateId._id} className="bg-muted/30 rounded-lg p-4 flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                {nominee.candidateId.photo && (
                                  <div className="w-10 h-10 rounded-full overflow-hidden bg-muted/50 flex-shrink-0">
                                    <img 
                                      src={nominee.candidateId.photo} 
                                      alt={nominee.candidateId.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-foreground">{nominee.candidateId.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Nominado el {new Date(nominee.nominatedAt).toLocaleDateString('es-ES')}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => removeNominee(week._id, nominee.candidateId._id)}
                                className="text-red-500 hover:text-red-700 transition-colors"
                                title="Remover nominado"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Modal de Selección de Nominados */}
              {showNomineesModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-card rounded-xl p-6 max-w-2xl w-full border border-border/40 max-h-[90vh] overflow-y-auto">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Seleccionar Nominados</h3>
                    
                    <div className="mb-4">
                        <p className="text-muted-foreground text-sm">
                        Selecciona los candidatos que quieres nominar para la semana seleccionada. 
                        Solo se muestran candidatos activos de la temporada seleccionada.
                      </p>
                      {selectedWeek && (
                        <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                          <p className="text-sm text-blue-600">
                            <strong>Semana seleccionada:</strong> {weeks.find(w => w._id === selectedWeek)?.weekNumber}
                        </p>
                      </div>
                      )}
                    </div>

                    {candidates.filter(c => c.status === 'active').length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-2xl mb-2">👥</div>
                        <p className="text-muted-foreground">No hay candidatos activos para nominar</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 max-h-96 overflow-y-auto">
                        {candidates
                          .filter(c => c.status === 'active')
                          .map((candidate) => (
                            <label key={candidate._id} className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                              <input
                                type="checkbox"
                                checked={selectedNominees.includes(candidate._id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedNominees(prev => [...prev, candidate._id]);
                                  } else {
                                    setSelectedNominees(prev => prev.filter(id => id !== candidate._id));
                                  }
                                }}
                                className="rounded border-border text-primary focus:ring-primary"
                              />
                              <div className="flex items-center space-x-3 flex-1">
                                {candidate.photo && (
                                  <div className="w-8 h-8 rounded-full overflow-hidden bg-muted/50 flex-shrink-0">
                                    <img 
                                      src={candidate.photo} 
                                      alt={candidate.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                      </div>
                                )}
                                <div>
                                  <p className="font-medium text-foreground">{candidate.name}</p>
                                  {candidate.bio && (
                                    <p className="text-xs text-muted-foreground line-clamp-1">{candidate.bio}</p>
                                  )}
                    </div>
                              </div>
                            </label>
                          ))}
                      </div>
                    )}

                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          setShowNomineesModal(false);
                          setSelectedNominees([]);
                        }}
                        disabled={submittingNominees}
                        className="flex-1 bg-muted text-muted-foreground py-2 px-4 rounded-lg font-medium hover:bg-muted/80 transition-colors disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={addNomineesToWeek}
                        disabled={submittingNominees || selectedNominees.length === 0}
                        className="flex-1 bg-primary text-primary-foreground py-2 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                      >
                        {submittingNominees ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Agregando...</span>
                          </>
                        ) : (
                          <span>Agregar {selectedNominees.length} Nominado(s)</span>
                        )}
                        </button>
                    </div>
                  </div>
              </div>
              )}
            </div>
          )}

          {/* Votaciones Tab */}
          {activeTab === 'votes' && (
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

              {/* Selector de Semana */}
              <div className="bg-card rounded-lg lg:rounded-xl p-4 lg:p-6 border border-border/40">
                <h3 className="text-base lg:text-lg font-semibold text-foreground mb-3 lg:mb-4">Semana Seleccionada</h3>
                <select
                  value={selectedWeek}
                  onChange={(e) => handleWeekChange(e.target.value)}
                  disabled={!selectedSeason || weeks.length === 0}
                  className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Selecciona una semana</option>
                  {weeks.map(week => (
                    <option key={week._id} value={week._id}>
                      Semana {week.weekNumber} - {week.status === 'voting' || week.status === 'active' ? '🟢 Votando' : week.status === 'completed' ? '✅ Cerrada' : '⏳ Programada'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Botón de Resetear Votaciones */}
              {selectedWeek && (
                <div className="bg-card rounded-lg lg:rounded-xl p-4 lg:p-6 border border-border/40">
                  <h3 className="text-base lg:text-lg font-semibold text-foreground mb-3 lg:mb-4">Acciones de Votación</h3>
                  <button 
                    onClick={() => handleConfirmAction(
                      'Resetear Votaciones',
                      `¿Estás seguro de que quieres resetear todos los votos de la semana seleccionada? Esta acción no se puede deshacer y eliminará todos los votos registrados.`,
                      resetWeekVotes
                    )}
                    className="w-full flex items-center justify-between bg-destructive text-destructive-foreground p-3 lg:p-4 rounded-lg font-medium hover:bg-destructive/90 transition-colors group"
                  >
                    <div className="flex items-center space-x-2 lg:space-x-3">
                      <span className="text-lg lg:text-xl">🔄</span>
                      <span className="text-sm lg:text-base">Resetear Votaciones de la Semana</span>
                    </div>
                    <svg className="w-4 h-4 lg:w-5 lg:h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}

              {selectedWeek ? (
                (() => {
                  const selectedWeekData = weeks.find(w => w._id === selectedWeek);
                  if (!selectedWeekData) return null;

                  const sortedNominees = [...selectedWeekData.nominees].sort((a, b) => {
                    const aVotes = selectedWeekData.results.votingStats.find(v => v.candidateId === a.candidateId._id)?.votes || 0;
                    const bVotes = selectedWeekData.results.votingStats.find(v => v.candidateId === b.candidateId._id)?.votes || 0;
                    return bVotes - aVotes;
                  });

                  return (
                    <div className="space-y-6 lg:space-y-8">
                      {/* Resumen de la Semana */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                        <div className="bg-card rounded-lg lg:rounded-xl p-4 lg:p-6 border border-border/40">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <h4 className="font-semibold text-foreground">Votos Totales</h4>
                          </div>
                          <p className="text-2xl lg:text-3xl font-bold text-foreground">{selectedWeekData.results.totalVotes.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">Semana {selectedWeekData.weekNumber}</p>
                        </div>

                        <div className="bg-card rounded-lg lg:rounded-xl p-4 lg:p-6 border border-border/40">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <h4 className="font-semibold text-foreground">Nominados</h4>
                          </div>
                          <p className="text-2xl lg:text-3xl font-bold text-foreground">{selectedWeekData.nominees.length}</p>
                          <p className="text-sm text-muted-foreground">Candidatos nominados</p>
                        </div>

                        <div className="bg-card rounded-lg lg:rounded-xl p-4 lg:p-6 border border-border/40">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                            <h4 className="font-semibold text-foreground">Estado</h4>
                          </div>
                          <p className="text-2xl lg:text-3xl font-bold text-foreground">
                            {selectedWeekData.status === 'voting' || selectedWeekData.status === 'active' ? '🟢' : selectedWeekData.status === 'completed' ? '✅' : '⏳'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {selectedWeekData.status === 'voting' || selectedWeekData.status === 'active' ? 'Votando' : selectedWeekData.status === 'completed' ? 'Cerrada' : 'Programada'}
                          </p>
                        </div>
                      </div>

                      {/* Top de Nominados */}
                      <div className="bg-card rounded-lg lg:rounded-xl p-4 lg:p-6 border border-border/40">
                        <h3 className="text-lg lg:text-xl font-semibold text-foreground mb-4 lg:mb-6">Top de Nominados - Semana {selectedWeekData.weekNumber}</h3>
                        
                        {selectedWeekData.nominees.length === 0 ? (
                          <div className="text-center py-8">
                            <div className="text-4xl mb-4">🎯</div>
                            <p className="text-lg font-medium text-foreground mb-2">No hay nominados</p>
                            <p className="text-muted-foreground">Esta semana aún no tiene candidatos nominados</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {sortedNominees.map((nominee, index) => {
                              const voteStats = selectedWeekData.results.votingStats.find(v => v.candidateId === nominee.candidateId._id);
                              const votes = voteStats?.votes || 0;
                              const percentage = voteStats?.percentage || 0;
                              const isWinner = selectedWeekData.results.winner?.candidateId === nominee.candidateId._id;

                              return (
                                <div key={nominee.candidateId._id} className={`flex items-center space-x-4 p-4 rounded-lg border ${
                                  isWinner ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-muted/30 border-border/40'
                                }`}>
                                  {/* Posición */}
                                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                    index === 0 ? 'bg-yellow-500 text-yellow-900' :
                                    index === 1 ? 'bg-gray-400 text-gray-900' :
                                    index === 2 ? 'bg-orange-600 text-white' :
                                    'bg-muted text-muted-foreground'
                                  }`}>
                                    {index + 1}
                                  </div>

                                  {/* Foto del candidato */}
                                  <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-muted/30">
                                    {nominee.candidateId.photo ? (
                                      <img 
                                        src={nominee.candidateId.photo} 
                                        alt={nominee.candidateId.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                        }}
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                        👤
                                      </div>
                                    )}
                                  </div>

                                  {/* Información del candidato */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2">
                                      <h4 className="font-semibold text-foreground truncate">{nominee.candidateId.name}</h4>
                                      {isWinner && (
                                        <span className="px-2 py-1 bg-yellow-500 text-yellow-900 text-xs font-bold rounded-full">
                                          🏆 GANADOR
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      Nominado el {new Date(nominee.nominatedAt).toLocaleDateString('es-ES')}
                                    </p>
                                  </div>

                                  {/* Estadísticas de votos */}
                                  <div className="flex-shrink-0 text-right">
                                    <div className="text-lg font-bold text-foreground">{votes.toLocaleString()}</div>
                                    <div className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</div>
                                    <div className="text-xs text-muted-foreground">votos</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Detalles de Votación */}
                      {selectedWeekData.results.totalVotes > 0 && (
                        <div className="bg-card rounded-lg lg:rounded-xl p-4 lg:p-6 border border-border/40">
                          <h3 className="text-lg lg:text-xl font-semibold text-foreground mb-4 lg:mb-6">Detalles de Votación</h3>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                            <div>
                              <h4 className="font-medium text-foreground mb-3">Período de Votación</h4>
                              <div className="space-y-2 text-sm text-muted-foreground">
                                <div>Inicio: {new Date(selectedWeekData.votingStartDate).toLocaleString('es-ES')}</div>
                                <div>Fin: {new Date(selectedWeekData.votingEndDate).toLocaleString('es-ES')}</div>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium text-foreground mb-3">Configuración</h4>
                              <div className="space-y-2 text-sm text-muted-foreground">
                                <div>Máx. votos por usuario: {selectedWeekData.settings.maxVotesPerUser}</div>
                                <div>Votos múltiples: {selectedWeekData.settings.allowMultipleVotes ? 'Sí' : 'No'}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🗳️</div>
                  <p className="text-lg font-medium text-foreground mb-2">Selecciona una semana</p>
                  <p className="text-muted-foreground">Elige una semana para ver las estadísticas de votación</p>
                </div>
              )}
            </div>
          )}

          {/* Usuarios Tab */}
          {activeTab === 'users' && (
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

              {/* Header */}
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
                <div>
                  <h3 className="text-lg lg:text-xl font-semibold text-foreground">Gestión de Usuarios</h3>
                  <p className="text-muted-foreground text-sm lg:text-base">
                    Total: {userTotal.toLocaleString()} usuarios
                  </p>
                </div>
                <button 
                  onClick={refreshUsers}
                  disabled={loadingUsers}
                  className="bg-primary text-primary-foreground px-4 lg:px-6 py-2 lg:py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{loadingUsers ? '⏳' : '🔄'}</span>
                  <span>{loadingUsers ? 'Cargando...' : 'Actualizar'}</span>
                </button>
              </div>

              {/* Search and Filters */}
              <div className="bg-card rounded-lg lg:rounded-xl p-4 lg:p-6 border border-border/40">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Search */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Buscar por nombre o email
                    </label>
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => handleUserSearch(e.target.value)}
                      placeholder="Buscar usuarios..."
                      className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Sort */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Ordenar por
                    </label>
                    <div className="flex space-x-2">
                      <select
                        value={userSortBy}
                        onChange={(e) => handleUserSort(e.target.value, userSortOrder)}
                        className="flex-1 bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                      >
                        <option value="createdAt">Fecha de Registro</option>
                        <option value="lastVoteDate">Último Voto</option>
                        <option value="name">Nombre</option>
                        <option value="totalVotes">Cantidad de Votos</option>
                      </select>
                      <button
                        onClick={() => handleUserSort(userSortBy, userSortOrder === 'asc' ? 'desc' : 'asc')}
                        className="bg-muted text-muted-foreground px-3 py-2 rounded-lg hover:bg-muted/80 transition-colors"
                      >
                        {userSortOrder === 'asc' ? '↑' : '↓'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* DataTable */}
              <div className="bg-card rounded-lg lg:rounded-xl border border-border/40 overflow-hidden">
                {/* Loading State */}
                {loadingUsers ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Cargando usuarios...</p>
                    </div>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">👤</div>
                    <p className="text-lg font-medium text-foreground mb-2">No hay usuarios</p>
                    <p className="text-muted-foreground">
                      {userSearch ? 'No se encontraron usuarios con esa búsqueda' : 'No se encontraron usuarios en el sistema'}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/30">
                          <tr>
                            <th className="text-left p-4 font-medium text-foreground">Usuario</th>
                            <th className="text-left p-4 font-medium text-foreground">Email</th>
                            <th className="text-left p-4 font-medium text-foreground">Estado</th>
                            <th className="text-left p-4 font-medium text-foreground">Votos</th>
                            <th className="text-left p-4 font-medium text-foreground">Último Voto</th>
                            <th className="text-left p-4 font-medium text-foreground">Registro</th>
                            <th className="text-left p-4 font-medium text-foreground">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {users.map((user) => (
                            <tr key={user._id} className="hover:bg-muted/20 transition-colors">
                              <td className="p-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                    <span className="text-primary font-medium text-sm">
                                      {user.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <div className="font-medium text-foreground">{user.name}</div>
                                    {user.isAdmin && (
                                      <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-1 rounded-full">
                                        👑 Admin
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 text-sm text-muted-foreground">{user.email}</td>
                              <td className="p-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  user.isBlocked
                                    ? 'bg-red-500/10 text-red-500'
                                    : user.isActive
                                      ? 'bg-green-500/10 text-green-500'
                                      : 'bg-muted text-muted-foreground'
                                }`}>
                                  {user.isBlocked ? '🚫 Bloqueado' : user.isActive ? '🟢 Activo' : '⚪ Inactivo'}
                                </span>
                                {user.isBlocked && user.blockReason && (
                                  <div className="mt-1 text-xs text-red-500">
                                    {user.blockReason}
                                  </div>
                                )}
                              </td>
                              <td className="p-4 text-sm font-medium text-foreground">
                                {user.totalVotes.toLocaleString()}
                              </td>
                              <td className="p-4 text-sm text-muted-foreground">
                                {user.lastVoteDate 
                                  ? new Date(user.lastVoteDate).toLocaleDateString('es-ES')
                                  : 'Nunca'
                                }
                              </td>
                              <td className="p-4 text-sm text-muted-foreground">
                                {new Date(user.createdAt).toLocaleDateString('es-ES')}
                              </td>
                              <td className="p-4">
                                <div className="flex flex-wrap gap-2">
                                  {/* Admin Toggle */}
                                  <button
                                    onClick={() => toggleAdminStatus(user._id, user.name)}
                                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                      user.isAdmin
                                        ? 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20'
                                        : 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'
                                    }`}
                                  >
                                    {user.isAdmin ? '❌ Quitar Admin' : '👑 Hacer Admin'}
                                  </button>

                                  {/* Block/Unblock */}
                                  {user.isBlocked ? (
                                    <button 
                                      onClick={() => handleConfirmAction(
                                        'Desbloquear Usuario',
                                        `¿Estás seguro de que quieres desbloquear a ${user.name}?`,
                                        () => unblockUser(user._id, user.name)
                                      )}
                                      className="px-2 py-1 bg-green-500/10 text-green-500 rounded text-xs font-medium hover:bg-green-500/20 transition-colors"
                                    >
                                      🔓 Desbloquear
                                    </button>
                                  ) : (
                                    <button 
                                      onClick={() => openBlockModal(user)}
                                      className="px-2 py-1 bg-red-500/10 text-red-500 rounded text-xs font-medium hover:bg-red-500/20 transition-colors"
                                    >
                                      🚫 Bloquear
                                    </button>
                                  )}

                                  {/* Delete */}
                                  <button
                                    onClick={() => handleConfirmAction(
                                      'Eliminar Usuario',
                                      `¿Estás seguro de que quieres eliminar a ${user.name}? Esta acción no se puede deshacer.`,
                                      () => deleteUser(user._id, user.name)
                                    )}
                                    className="px-2 py-1 bg-destructive/10 text-destructive rounded text-xs font-medium hover:bg-destructive/20 transition-colors"
                                  >
                                    🗑️ Eliminar
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {userPages > 1 && (
                      <div className="border-t border-border/40 p-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            Página {userPage} de {userPages} ({userTotal.toLocaleString()} usuarios)
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleUserPageChange(userPage - 1)}
                              disabled={userPage <= 1}
                              className="px-3 py-1 bg-muted text-muted-foreground rounded hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              ← Anterior
                            </button>
                            <button
                              onClick={() => handleUserPageChange(userPage + 1)}
                              disabled={userPage >= userPages}
                              className="px-3 py-1 bg-muted text-muted-foreground rounded hover:bg-muted/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Siguiente →
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Otras pestañas */}
          {activeTab !== 'dashboard' && activeTab !== 'seasons' && activeTab !== 'weeks' && activeTab !== 'candidates' && activeTab !== 'nominees' && activeTab !== 'votes' && activeTab !== 'users' && (
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