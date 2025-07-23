"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalCandidates: 0,
    nominatedCandidates: 0,
    totalVotes: 0,
    weeklyVotes: 0,
  });

  // Redirigir si no está logueado o no es admin
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
    // Aquí verificarías si es admin desde la API
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary">Cargando panel de administración...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
    { id: 'season', label: '🏆 Temporada', icon: '🏆' },
    { id: 'candidates', label: '👥 Candidatos', icon: '👥' },
    { id: 'votes', label: '🗳️ Votaciones', icon: '🗳️' },
    { id: 'users', label: '👤 Usuarios', icon: '👤' },
  ];

  return (
    <main className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border/40">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="text-muted-foreground hover:text-foreground"
          >
            ← Inicio
          </button>
          <span className="font-bold text-foreground">Panel Admin</span>
          <div className="w-6"></div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-card/30 border-b border-border/20 overflow-x-auto">
        <div className="flex px-4 py-2 space-x-1 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground mb-4">Dashboard</h2>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-primary">{stats.totalUsers}</div>
                <div className="text-sm text-muted-foreground">Usuarios Totales</div>
              </div>
              <div className="bg-card rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-primary">{stats.activeUsers}</div>
                <div className="text-sm text-muted-foreground">Usuarios Activos</div>
              </div>
              <div className="bg-card rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-primary">{stats.totalCandidates}</div>
                <div className="text-sm text-muted-foreground">Candidatos</div>
              </div>
              <div className="bg-card rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-primary">{stats.weeklyVotes}</div>
                <div className="text-sm text-muted-foreground">Votos Semanales</div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Acciones Rápidas</h3>
              <button className="w-full bg-primary text-primary-foreground p-3 rounded-lg font-medium hover:bg-primary/90 transition-colors">
                🔄 Resetear Votos Semanales
              </button>
              <button className="w-full bg-accent text-accent-foreground p-3 rounded-lg font-medium hover:bg-accent/90 transition-colors">
                📋 Publicar Nominados
              </button>
            </div>
          </div>
        )}

        {activeTab === 'season' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground mb-4">Gestión de Temporada</h2>
            
            <div className="bg-card rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-3">Temporada Actual</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nombre:</span>
                  <span className="text-foreground">Casa Famosos 2025</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Puntos diarios:</span>
                  <span className="text-foreground">60 puntos</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estado:</span>
                  <span className="text-primary">Activa</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Configuración</h3>
              <div className="bg-card rounded-lg p-4 space-y-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Puntos diarios por usuario
                  </label>
                  <input
                    type="number"
                    defaultValue={60}
                    className="w-full bg-input border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <button className="w-full bg-primary text-primary-foreground p-2 rounded-lg font-medium hover:bg-primary/90 transition-colors">
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'candidates' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-foreground">Candidatos</h2>
              <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                + Agregar
              </button>
            </div>

            {/* Mock candidates list */}
            <div className="space-y-3">
              {['Ana García', 'Carlos López', 'María Rodríguez', 'Diego Martín'].map((name, index) => (
                <div key={index} className="bg-card rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                      <span className="text-lg">👤</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {index < 2 ? '🟢 Nominado' : '⚪ No nominado'}
                      </p>
                    </div>
                  </div>
                  <button className="text-muted-foreground hover:text-foreground">
                    ⚙️
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'votes' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground mb-4">Gestión de Votaciones</h2>
            
            <div className="bg-card rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-3">Estado Actual</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Votación:</span>
                  <span className="text-primary">🟢 Activa</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cierre:</span>
                  <span className="text-foreground">Domingo 8:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Votos esta semana:</span>
                  <span className="text-foreground">{stats.weeklyVotes}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <button className="w-full bg-destructive text-destructive-foreground p-3 rounded-lg font-medium hover:bg-destructive/90 transition-colors">
                🔄 Resetear Votos Semanales
              </button>
              <button className="w-full bg-accent text-accent-foreground p-3 rounded-lg font-medium hover:bg-accent/90 transition-colors">
                📊 Exportar Resultados
              </button>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground mb-4">Gestión de Usuarios</h2>
            
            <div className="bg-card rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-3">Estadísticas</h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-xl font-bold text-primary">{stats.totalUsers}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-primary">{stats.activeUsers}</div>
                  <div className="text-xs text-muted-foreground">Activos hoy</div>
                </div>
              </div>
            </div>

            <div className="text-center text-muted-foreground py-8">
              <p>Lista de usuarios próximamente...</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 