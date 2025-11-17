import { useState, useMemo, useEffect } from 'react';
import { MapView } from '../components/MapView';
import { FilterOptions } from '../components/FilterPanel';
import { ObservationDetails } from '../components/ObservationDetails';
import { Header } from '../components/Header';
import { mockObservations } from '../utils/mockData';
import { exportToCSV } from '../utils/csvExport';
import { Observation } from '../types/observation';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { LoginPage } from './LoginPage';

export function Dashboard() {
  const { user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [observations, setObservations] = useState<Observation[]>(mockObservations);
  const [bannedUsers, setBannedUsers] = useState<Set<string>>(new Set());
  const [filteredUserId, setFilteredUserId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    year: '',
    month: '',
    types: [],
    keywords: '',
    myProjects: '',
  });
  const [selectedObservation, setSelectedObservation] = useState<Observation | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Reset showLogin when user state changes
  useEffect(() => {
    if (user) {
      setShowLogin(false);
    }
  }, [user]);

  const handleAccountClick = () => {
    if (!user) {
      setShowLogin(true);
    }
  };

  // Admin action handlers
  const handleDeleteObservation = (observationId: string) => {
    setObservations((prev) => prev.filter((obs) => obs.id !== observationId));
  };

  const handleDeleteAllUserObservations = (userId: string) => {
    setObservations((prev) => prev.filter((obs) => obs.userId !== userId));
  };

  const handleFilterByUser = (userId: string) => {
    setFilteredUserId(userId);
  };

  const handleBanUser = (userId: string) => {
    setBannedUsers((prev) => new Set([...prev, userId]));
  };

  // Get unique observation types
  const observationTypes = useMemo(() => {
    return Array.from(new Set(observations.map((obs) => obs.type))).sort();
  }, [observations]);

  // Filter observations based on current filters
  const filteredObservations = useMemo(() => {
    return observations.filter((obs) => {
      // Filter out banned users
      if (bannedUsers.has(obs.userId)) {
        return false;
      }

      // Admin filter by specific user
      if (filteredUserId && obs.userId !== filteredUserId) {
        return false;
      }

      // My Projects filter (only show observations by logged-in user)
      if (filters.myProjects && user) {
        // Match observer name with user name
        if (obs.observerName.toLowerCase() !== user.name.toLowerCase()) {
          return false;
        }
      }

      // Year filter
      if (filters.year && !obs.date.startsWith(filters.year)) {
        return false;
      }

      // Month filter
      if (filters.month) {
        const obsMonth = obs.date.split('-')[1];
        if (obsMonth !== filters.month) {
          return false;
        }
      }

      // Types filter (multiple selection)
      if (filters.types.length > 0 && !filters.types.includes(obs.type)) {
        return false;
      }

      // Keywords filter
      if (filters.keywords) {
        const keywords = filters.keywords.toLowerCase();
        const searchableText = [
          obs.observation,
          obs.location.name,
          obs.projectName,
          obs.observerName,
          ...obs.keywords,
        ]
          .join(' ')
          .toLowerCase();

        if (!searchableText.includes(keywords)) {
          return false;
        }
      }

      // My Projects filter
      if (filters.myProjects === 'my' && user) {
        const observerNameLower = obs.observerName.toLowerCase();
        const userNameLower = user.name.toLowerCase();
        if (!observerNameLower.includes(userNameLower)) {
          return false;
        }
      }

      return true;
    });
  }, [observations, bannedUsers, filteredUserId, filters, user]);

  const handleObservationClick = (observation: Observation) => {
    setSelectedObservation(observation);
    setDetailsOpen(true);
  };

  const handleExportCSV = () => {
    exportToCSV(filteredObservations);
    toast.success(
      `Exported ${filteredObservations.length} observation${filteredObservations.length !== 1 ? 's' : ''} to CSV`
    );
  };

  // Show login page if user clicked account button and isn't logged in
  if (showLogin && !user) {
    return (
      <LoginPage
        onSuccess={() => setShowLogin(false)}
        onNavigateToHome={() => setShowLogin(false)}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header
        filters={filters}
        onFilterChange={setFilters}
        observationTypes={observationTypes}
        filteredCount={filteredObservations.length}
        totalCount={observations.length}
        onExportCSV={handleExportCSV}
        onAccountClick={handleAccountClick}
        filteredUserId={filteredUserId}
        filteredUserName={
          filteredUserId
            ? observations.find((o) => o.userId === filteredUserId)?.observerName
            : undefined
        }
        onClearUserFilter={() => setFilteredUserId(null)}
      />

      <main className="flex-1 relative overflow-hidden">
        <MapView observations={filteredObservations} onObservationClick={handleObservationClick} />
      </main>

      <ObservationDetails
        observation={selectedObservation}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        onDeleteObservation={handleDeleteObservation}
        onDeleteAllUserObservations={handleDeleteAllUserObservations}
        onFilterByUser={handleFilterByUser}
        onBanUser={handleBanUser}
      />
    </div>
  );
}
