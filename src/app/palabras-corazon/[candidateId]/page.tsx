"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import DedicationsFeed from '@/components/DedicationsFeed';
import CreateDedication from '@/components/CreateDedication';

interface Candidate {
  _id: string;
  name: string;
  photo?: string;
  status: string;
}

export default function CandidateDedicationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const candidateId = params.candidateId as string;

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!session && status !== 'loading') {
      router.push('/palabras-corazon');
      return;
    }

    if (candidateId) {
      fetchCandidate();
    }
  }, [candidateId, session, status]);

  const fetchCandidate = async () => {
    try {
      const response = await fetch('/api/public/candidates');
      if (!response.ok) throw new Error('Error al cargar candidato');

      const data = await response.json();
      const foundCandidate = data.candidates.find(
        (c: Candidate) => c._id === candidateId
      );

      if (foundCandidate) {
        setCandidate(foundCandidate);
      } else {
        router.push('/palabras-corazon');
      }
    } catch (error) {
      console.error('Error fetching candidate:', error);
      router.push('/palabras-corazon');
    } finally {
      setLoading(false);
    }
  };

  const handleDedicationCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!candidate) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-4 sm:py-8">
        {/* Back button */}
        <button
          onClick={() => router.push('/palabras-corazon')}
          className="mb-4 sm:mb-6 flex items-center text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Volver
        </button>

        {/* Candidate Header */}
        <div className="bg-card rounded-xl border border-border/20 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-4">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-primary/20">
              {candidate.photo ? (
                <Image
                  src={candidate.photo}
                  alt={candidate.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10
                              flex items-center justify-center">
                  <span className="text-2xl text-primary/50">
                    {candidate.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
                {candidate.name}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Si alguna vez lees esto... estos son los mensajes de amor, apoyo y
                admiración que tus fans han dejado para ti ❤️
              </p>
            </div>
          </div>
        </div>

        {/* Create Dedication */}
        <CreateDedication
          candidateId={candidateId}
          candidateName={candidate.name}
          onDedicationCreated={handleDedicationCreated}
        />

        {/* Dedications Feed */}
        <DedicationsFeed
          candidateId={candidateId}
          refreshKey={refreshKey}
        />
      </div>
    </main>
  );
}