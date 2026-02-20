import { useState, useMemo, useEffect } from 'react';
import { MapView } from '../components/MapView';
import { FilterOptions } from '../components/FilterPanel';
import { ObservationDetails } from '../components/ObservationDetails';
import { Header } from '../components/Header';
import { DailyReportPopup } from '../components/DailyReportPopup';
import {
  fetchObservations,
  deleteObservation,
  deleteAllUserObservations,
} from '../api/observations';
import { banUser } from '../api/users';
import { exportToCSV } from '../utils/csvExport';
import { Observation } from '../types/observation';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { LoginPage } from './LoginPage';

export function Dashboard() {
  const { user } = useAuth();
  console.log('Dashboard auth user:', user);
  const [showLogin, setShowLogin] = useState(false);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [, setLoading] = useState(true);
  const [bannedUsers, setBannedUsers] = useState<Set<string>>(new Set());
  const [filteredUserId, setFilteredUserId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    year: '',
    month: '',
    types: [],
    keywords: '',
    myProjects: 'all',
  });
  const [selectedObservation, setSelectedObservation] = useState<Observation | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [dailyReportOpen, setDailyReportOpen] = useState(false);

  // Load observations from Supabase
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const data = await fetchObservations();
        console.log('Supabase observations:', data);

        if (!cancelled) {
          // Optional: fall back to mock data if nothing in DB
          // setObservations(data.length ? data : mockObservations);
          setObservations(data);
        }
      } catch (err) {
        console.error('Failed to load observations:', err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Reset showLogin when user state changes
  useEffect(() => {
    if (user) {
      // schedule async to avoid synchronous setState inside effect
      globalThis.setTimeout(() => setShowLogin(false), 0);
    }
  }, [user]);

  const handleAccountClick = () => {
    if (!user) {
      setShowLogin(true);
    }
  };

  // Admin action handlers
  const handleDeleteObservation = async (observationId: string) => {
    try {
      const res = await deleteObservation(observationId);
      if (res.success) {
        setObservations((prev) => prev.filter((obs) => obs.id !== observationId));
        toast.success('Observation deleted successfully');
      } else {
        console.error('Supabase delete failed:', res.error, res.data);
        toast.error(res.error ?? 'Failed to delete observation');
      }
    } catch (err) {
      console.error('Error deleting observation:', err);
      toast.error('Error deleting observation');
    }
  };

  const handleDeleteAllUserObservations = async (userId: string) => {
    try {
      const res = await deleteAllUserObservations(userId);
      if (res.success) {
        setObservations((prev) => prev.filter((obs) => obs.userId !== userId));
        toast.success('All user observations deleted successfully');
      } else {
        console.error('Supabase delete all failed:', res.error, res.data);
        toast.error(res.error ?? 'Failed to delete user observations');
      }
    } catch (err) {
      console.error('Error deleting user observations:', err);
      toast.error('Error deleting user observations');
    }
  };

  const handleFilterByUser = (userId: string) => {
    setFilteredUserId(userId);
  };

  const handleBanUser = async (userId: string) => {
    try {
      const res = await banUser(userId);
      if (res.success) {
        setBannedUsers((prev) => new Set([...prev, userId]));
        // Optionally remove their observations from view immediately
        setObservations((prev) => prev.filter((obs) => obs.userId !== userId));
        //toast.success('User has been banned');
      } else {
        console.error('Failed to ban user:', res.error, res.data);
        toast.error(res.error ?? 'Failed to ban user');
      }
    } catch (err) {
      console.error('Error banning user:', err);
      toast.error('Error banning user');
    }
  };

  // Get unique observation types
  const observationTypes = useMemo(() => {
    return Array.from(new Set(observations.map((obs) => obs.type))).sort();
  }, [observations]);

  // projects are provided via AuthContext on `user.projects`

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

      // Project / My Projects filter
      if (filters.myProjects === 'my' && user) {
        const observerNameLower = obs.observerName.toLowerCase();
        const userNameLower = user.name.toLowerCase();
        if (!observerNameLower.includes(userNameLower)) {
          return false;
        }
      } else if (
        filters.myProjects &&
        filters.myProjects !== 'all' &&
        filters.myProjects !== 'my'
      ) {
        // filter by specific project name
        if (obs.projectName !== filters.myProjects) {
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

  if (user) console.log('Dashboard passing projects:', user.projects);
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
        onDailyReportClick={() => setDailyReportOpen(true)}
        projects={user?.projects || []}
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

      <DailyReportPopup open={dailyReportOpen} onClose={() => setDailyReportOpen(false)} />
    </div>
  );
}
