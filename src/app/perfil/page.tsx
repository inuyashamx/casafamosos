'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import TeamBadge from '@/components/TeamBadge';
import Navbar from '@/components/Navbar';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  image?: string;
  nickname?: string;
  isAdmin: boolean;
  createdAt: string;
  team?: 'DIA' | 'NOCHE' | 'ECLIPSE' | null;
}

export default function PerfilPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Estados para edición
  const [editName, setEditName] = useState('');
  const [editNickname, setEditNickname] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Estados para historial de votos
  const [voteHistory, setVoteHistory] = useState<any[]>([]);
  const [loadingVoteHistory, setLoadingVoteHistory] = useState(false);
  const [voteHistoryError, setVoteHistoryError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalWeeks: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 5
  });

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    fetchProfile();
    fetchVoteHistory();
  }, [session, status, router]);


  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/profile');
      
      if (!response.ok) {
        throw new Error('Error al cargar el perfil');
      }
      
      const userProfile = await response.json();
      setProfile(userProfile);
      setEditName(userProfile.name || '');
      setEditNickname(userProfile.nickname || '');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setSaveError('Solo se permiten archivos de imagen');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setSaveError('La imagen debe ser menor a 5MB');
      return;
    }

    setSelectedImage(file);
    setSaveError(null);

    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setSaveError(null);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSaveError(null);

      let imageData = null;

      // Si hay una imagen seleccionada, subirla primero
      if (selectedImage) {
        const formData = new FormData();
        formData.append('file', selectedImage);
        formData.append('type', 'image');

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Error al subir la imagen');
        }

        const uploadResult = await uploadResponse.json();
        imageData = {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
        };
      }

      // Actualizar perfil
      const updateResponse = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editName.trim(),
          nickname: editNickname.trim(),
          image: imageData?.url,
          imagePublicId: imageData?.publicId,
        }),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(errorData.error || 'Error al actualizar el perfil');
      }

      const updatedProfile = await updateResponse.json();
      setProfile(updatedProfile);
      setIsEditing(false);
      setSelectedImage(null);
      setImagePreview(null);

      // Actualizar la sesión para reflejar los cambios
      window.location.reload();
    } catch (error: any) {
      setSaveError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditName(profile?.name || '');
    setEditNickname(profile?.nickname || '');
    setSelectedImage(null);
    setImagePreview(null);
    setSaveError(null);
  };

  const fetchVoteHistory = async (page = 1) => {
    try {
      setLoadingVoteHistory(true);
      setVoteHistoryError(null);
      
      const response = await fetch(`/api/user/vote-history?page=${page}&limit=5`);
      
      if (!response.ok) {
        throw new Error('Error al cargar el historial de votos');
      }
      
      const data = await response.json();
      setVoteHistory(data.voteHistory || []);
      setPagination(data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalWeeks: 0,
        hasNextPage: false,
        hasPrevPage: false,
        limit: 5
      });
    } catch (error: any) {
      setVoteHistoryError(error.message);
    } finally {
      setLoadingVoteHistory(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchVoteHistory(newPage);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/3"></div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary">MI PERFIL</h1>
        </div>
        
        {error ? (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
            <h3 className="text-destructive font-medium">Error</h3>
            <p className="text-destructive/80 text-sm mt-1">{error}</p>
            <button
              onClick={fetchProfile}
              className="bg-destructive text-destructive-foreground px-3 py-1 rounded-lg text-sm hover:bg-destructive/90 transition-colors mt-2"
            >
              Reintentar
            </button>
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* Header del perfil */}
            <div className="bg-card rounded-xl p-6 border border-border/20">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex items-center space-x-4 min-w-0 flex-1">
                  <div className="relative flex-shrink-0">
                    {isEditing && imagePreview ? (
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-muted">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-muted">
                        {profile.image ? (
                          <Image
                            src={profile.image}
                            alt={profile.name}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-2xl text-muted-foreground">
                              {profile.name?.[0] || 'U'}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-semibold text-foreground truncate flex items-center gap-2">
                      {isEditing ? editName : profile.name}
                      <TeamBadge team={profile.team} />
                    </h2>
                    {profile.nickname && (
                      <p className="text-muted-foreground truncate">
                        @{isEditing ? editNickname : profile.nickname}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground truncate">
                      {profile.email}
                    </p>
                  </div>
                </div>
                
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors w-full sm:w-auto flex-shrink-0"
                  >
                    Editar
                  </button>
                )}
              </div>
            </div>

            {/* Formulario de edición */}
            {isEditing && (
              <div className="bg-card rounded-xl p-6 border border-border/20 space-y-6">
                <h3 className="text-lg font-semibold text-foreground">Editar Perfil</h3>
                
                {saveError && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                    <p className="text-destructive text-sm">{saveError}</p>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Cambiar foto de perfil */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Foto de Perfil
                    </label>
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        {imagePreview ? (
                          <div className="w-16 h-16 rounded-full overflow-hidden bg-muted">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-full overflow-hidden bg-muted">
                            {profile.image ? (
                              <Image
                                src={profile.image}
                                alt={profile.name}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-lg text-muted-foreground">
                                  {profile.name?.[0] || 'U'}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="file"
                          id="profile-image"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                        <label
                          htmlFor="profile-image"
                          className="bg-primary text-primary-foreground px-3 py-1 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer"
                        >
                          Cambiar Foto
                        </label>
                        {imagePreview && (
                          <button
                            onClick={removeSelectedImage}
                            className="bg-destructive text-destructive-foreground px-3 py-1 rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Nombre */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                      Nombre
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:border-primary focus:outline-none"
                      placeholder="Tu nombre"
                    />
                  </div>

                  {/* Nickname */}
                  <div>
                    <label htmlFor="nickname" className="block text-sm font-medium text-foreground mb-2">
                      Nickname (opcional)
                    </label>
                    <input
                      type="text"
                      id="nickname"
                      value={editNickname}
                      onChange={(e) => setEditNickname(e.target.value)}
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg text-foreground focus:border-primary focus:outline-none"
                      placeholder="@tu_nickname"
                    />
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border/20">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 text-foreground hover:bg-muted/30 transition-colors rounded-lg"
                    disabled={isSaving}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving || (!editName.trim() && !selectedImage)}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            )}

            {/* Información adicional */}
            <div className="bg-card rounded-xl p-6 border border-border/20">
              <h3 className="text-lg font-semibold text-foreground mb-4">Información de la Cuenta</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Miembro desde:</span>
                  <span className="text-foreground">
                    {new Date(profile.createdAt).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Rol:</span>
                  <span className="text-foreground">
                    {profile.isAdmin ? 'Administrador' : 'Usuario'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Team:</span>
                  <span className="text-foreground">
                    <TeamBadge team={profile.team} withLabel />
                  </span>
                </div>
              </div>
            </div>

            {/* Historial de Votos */}
            <div className="bg-card rounded-xl p-6 border border-border/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Historial de Votos</h3>
                                 <div className="flex items-center space-x-2">
                   {voteHistoryError && (
                     <button
                       onClick={() => fetchVoteHistory(pagination.currentPage)}
                       className="text-sm text-primary hover:text-primary/80 transition-colors"
                     >
                       Reintentar
                     </button>
                   )}
                   {pagination.totalWeeks > 0 && (
                     <span className="text-sm text-muted-foreground">
                       {pagination.totalWeeks} {pagination.totalWeeks === 1 ? 'semana' : 'semanas'}
                     </span>
                   )}
                 </div>
              </div>

              {loadingVoteHistory ? (
                <div className="space-y-4">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-muted rounded w-1/3"></div>
                    <div className="h-16 bg-muted rounded"></div>
                    <div className="h-16 bg-muted rounded"></div>
                  </div>
                </div>
              ) : voteHistoryError ? (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <p className="text-destructive text-sm">{voteHistoryError}</p>
                </div>
              ) : voteHistory.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">🗳️</div>
                  <p className="text-muted-foreground">Aún no has votado</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Cuando votes por tus candidatos favoritos, aparecerán aquí
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {voteHistory.map((season) => (
                    <div key={season.seasonId} className="space-y-4">
                      <div className="border-b border-border/20 pb-2">
                        <h4 className="font-medium text-foreground">
                          {season.seasonName} ({season.seasonYear})
                        </h4>
                      </div>
                      
                      <div className="space-y-3">
                        {season.weeks.map((week: any) => (
                          <div key={week.weekNumber} className="bg-muted/30 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-medium text-foreground">
                                {week.weekName}
                              </h5>
                              <div className="text-sm text-muted-foreground">
                                {new Date(week.weekDate).toLocaleDateString('es-ES', {
                                  day: 'numeric',
                                  month: 'short'
                                })}
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              {week.votes.map((vote: any, index: number) => (
                                <div key={index} className="flex items-center justify-between bg-background/50 rounded-lg p-3">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
                                      {vote.candidatePhoto ? (
                                        <Image
                                          src={vote.candidatePhoto}
                                          alt={vote.candidateName}
                                          width={32}
                                          height={32}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                          <span className="text-xs text-muted-foreground">
                                            {vote.candidateName?.[0] || '?'}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-medium text-foreground text-sm">
                                        {vote.candidateName}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {new Date(vote.voteDate).toLocaleDateString('es-ES', {
                                          day: 'numeric',
                                          month: 'short',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-semibold text-primary">
                                      {vote.points} {vote.points === 1 ? 'punto' : 'puntos'}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            <div className="mt-3 pt-3 border-t border-border/20">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Total de puntos:</span>
                                <span className="font-semibold text-foreground">
                                  {week.totalPoints} {week.totalPoints === 1 ? 'punto' : 'puntos'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                                     ))}
                 </div>
               )}

               {/* Controles de paginación */}
               {pagination.totalPages > 1 && (
                 <div className="flex items-center justify-between pt-6 border-t border-border/20">
                   <div className="text-sm text-muted-foreground">
                     Página {pagination.currentPage} de {pagination.totalPages}
                   </div>
                   
                   <div className="flex items-center space-x-2">
                     <button
                       onClick={() => handlePageChange(pagination.currentPage - 1)}
                       disabled={!pagination.hasPrevPage}
                       className="px-3 py-1 text-sm bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                     >
                       ← Anterior
                     </button>
                     
                     <button
                       onClick={() => handlePageChange(pagination.currentPage + 1)}
                       disabled={!pagination.hasNextPage}
                       className="px-3 py-1 text-sm bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                     >
                       Siguiente →
                     </button>
                   </div>
                 </div>
               )}
             </div>
          </div>
        ) : null}
      </div>
    </main>
  );
} 