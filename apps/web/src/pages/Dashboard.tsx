import { useState, useMemo, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { MapView } from '../components/MapView';
import { Header } from '../components/Header';
import {
  fetchObservations,
  fetchObservationTypes,
  deleteObservation,
  deleteAllUserObservations,
  type ObservationBounds,
} from '../api/observations';
import { banUser, fetchAdminObservationUsers, type AdminObservationUserOption } from '../api/users';
import { exportToCSV } from '../utils/csvExport';
import { Observation } from '../types/observation';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { LoginPage } from './LoginPage';
import { DEFAULT_FILTER_OPTIONS, type FilterOptions } from '@waterways/shared';
import { AdminPage } from './Admin';
import { fetchObservationCategories } from '../api/observations';

const ObservationDetails = lazy(() =>
  import('../components/ObservationDetails').then((module) => ({
    default: module.ObservationDetails,
  }))
);

const DailyReportPopup = lazy(() =>
  import('../components/DailyReportPopup').then((module) => ({
    default: module.DailyReportPopup,
  }))
);

type ObservationCategory = {
  id: number;
  type: string;
  color: string | null;
  keywords: string[] | null;
  is_fallback: boolean;
};

function toUtcStartIso(dateString: string): string | undefined {
  if (!dateString) {
    return undefined;
  }

  const [year, month, day] = dateString.split('-').map((value) => Number.parseInt(value, 10));
  if (!year || !month || !day) {
    return undefined;
  }

  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0)).toISOString();
}

function toUtcNextDayStartIso(dateString: string): string | undefined {
  if (!dateString) {
    return undefined;
  }

  const [year, month, day] = dateString.split('-').map((value) => Number.parseInt(value, 10));
  if (!year || !month || !day) {
    return undefined;
  }

  return new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0)).toISOString();
}

export function Dashboard() {
  const { user, sessionVersion } = useAuth();
  const MIN_QUERY_ZOOM = 4;
  const AGGREGATE_CLUSTER_MAX_ZOOM = 9;
  const DETAILED_QUERY_LIMIT = 500;
  const CACHE_TTL_MS = 60_000;
  const [showLogin, setShowLogin] = useState(false);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);
  const [observationTypes, setObservationTypes] = useState<string[]>([]);
  const [mapBounds, setMapBounds] = useState<ObservationBounds | null>(null);
  const [mapZoom, setMapZoom] = useState(4);
  const [activeRequestLimit, setActiveRequestLimit] = useState(DETAILED_QUERY_LIMIT);
  const [dataDisplayMode, setDataDisplayMode] = useState<'aggregate' | 'detailed'>('detailed');
  const [isResultsTruncated, setIsResultsTruncated] = useState(false);
  const [bannedUsers, setBannedUsers] = useState<Set<string>>(new Set());
  const [adminUserOptions, setAdminUserOptions] = useState<AdminObservationUserOption[]>([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [selectedAdminUserId, setSelectedAdminUserId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTER_OPTIONS);
  const [selectedObservation, setSelectedObservation] = useState<Observation | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [dailyReportOpen, setDailyReportOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [categories, setCategories] = useState<ObservationCategory[]>([]);

  const observationsCacheRef = useRef<
    Map<
      string,
      {
        timestamp: number;
        observations: Observation[];
        isTruncated: boolean;
        mode: 'aggregate' | 'detailed';
        requestLimit: number;
      }
    >
  >(new Map());

  const getDetailedLimitForZoom = (): number => {
    return DETAILED_QUERY_LIMIT;
  };

  const toFixedCoord = (value: number, digits: number): number => Number(value.toFixed(digits));

  const getBoundsPrecision = (zoom: number): number => {
    if (zoom <= 5) return 1;
    if (zoom <= 8) return 2;
    return 3;
  };

  const buildCacheKey = useCallback(
    (
      bounds: ObservationBounds,
      zoom: number,
      activeFilters: FilterOptions,
      mode: 'aggregate' | 'detailed',
      requestLimit: number
    ): string => {
      const precision = getBoundsPrecision(zoom);
      const normalizedBounds = {
        ne: [toFixedCoord(bounds.ne[0], precision), toFixedCoord(bounds.ne[1], precision)] as [
          number,
          number,
        ],
        sw: [toFixedCoord(bounds.sw[0], precision), toFixedCoord(bounds.sw[1], precision)] as [
          number,
          number,
        ],
      };

      return JSON.stringify({
        mode,
        requestLimit,
        precision,
        bounds: normalizedBounds,
        filters: {
          dateFrom: activeFilters.dateFrom,
          dateTo: activeFilters.dateTo,
          types: [...activeFilters.types].sort(),
          keywords: activeFilters.keywords.trim().toLowerCase(),
          myProjects: activeFilters.myProjects,
          hasMedia: activeFilters.hasMedia,
          userId: user?.isAdmin ? selectedAdminUserId : null,
        },
      });
    },
    [selectedAdminUserId, user?.isAdmin]
  );

  // Load category list for the type filter
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await fetchObservationTypes();

        if (!cancelled) {
          setObservationTypes(data);
        }
      } catch (err) {
        console.error('Failed to load observation categories:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user?.isAdmin) {
      setAdminUserOptions([]);
      setAdminUsersLoading(false);
      setSelectedAdminUserId(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setAdminUsersLoading(true);
        const nextUsers = await fetchAdminObservationUsers();

        if (!cancelled) {
          setAdminUserOptions(nextUsers);
          if (
            selectedAdminUserId &&
            !nextUsers.some((option) => option.id === selectedAdminUserId)
          ) {
            setSelectedAdminUserId(null);
          }
        }
      } catch (err) {
        console.error('Failed to load admin observation users:', err);
        if (!cancelled) {
          setAdminUserOptions([]);
        }
      } finally {
        if (!cancelled) {
          setAdminUsersLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedAdminUserId, sessionVersion, user?.id, user?.isAdmin]);

  useEffect(() => {
    observationsCacheRef.current.clear();
  }, [selectedAdminUserId, sessionVersion, user?.id, user?.isAdmin]);

  // Load observations from Supabase using DB-side filtering
  useEffect(() => {
    if (!mapBounds) {
      return;
    }

    if (mapZoom < MIN_QUERY_ZOOM) {
      setObservations([]);
      setActiveRequestLimit(DETAILED_QUERY_LIMIT);
      setDataDisplayMode('detailed');
      setIsResultsTruncated(false);
      return;
    }

    let cancelled = false;

    const timer = globalThis.setTimeout(() => {
      (async () => {
        try {
          const requestMode: 'aggregate' | 'detailed' =
            mapZoom <= AGGREGATE_CLUSTER_MAX_ZOOM ? 'aggregate' : 'detailed';
          const requestLimit = getDetailedLimitForZoom();
          const cacheKey = buildCacheKey(mapBounds, mapZoom, filters, requestMode, requestLimit);
          const cached = observationsCacheRef.current.get(cacheKey);
          const now = Date.now();

          if (cached && now - cached.timestamp <= CACHE_TTL_MS) {
            if (!cancelled) {
              setObservations(cached.observations);
              setIsResultsTruncated(cached.isTruncated);
              setDataDisplayMode(cached.mode);
              setActiveRequestLimit(cached.requestLimit);
              setLoading(false);
            }
            return;
          }

          setLoading(true);
          const commitResult = (
            observationsToRender: Observation[],
            totalCount: number,
            finalHasMore: boolean,
            mode: 'aggregate' | 'detailed',
            finalRequestLimit: number
          ) => {
            if (cancelled) {
              return;
            }

            const isStillTruncated = observationsToRender.length < totalCount || finalHasMore;

            setObservations(observationsToRender);
            setIsResultsTruncated(isStillTruncated);
            setDataDisplayMode(mode);
            setActiveRequestLimit(finalRequestLimit);

            observationsCacheRef.current.set(cacheKey, {
              timestamp: Date.now(),
              observations: observationsToRender,
              isTruncated: isStillTruncated,
              mode,
              requestLimit: finalRequestLimit,
            });
          };

          const page = await fetchObservations({
            bounds: mapBounds,
            since: toUtcStartIso(filters.dateFrom),
            until: toUtcNextDayStartIso(filters.dateTo),
            types: filters.types,
            keywords: filters.keywords,
            projectId: filters.myProjects,
            userId: user?.isAdmin ? (selectedAdminUserId ?? undefined) : undefined,
            limit: requestLimit,
            offset: 0,
          });

          const pageToRender = page;
          const finalRequestLimit = requestLimit;
          const observationsToRender = pageToRender.observations.slice(0, finalRequestLimit);
          commitResult(
            observationsToRender,
            pageToRender.totalCount,
            pageToRender.hasMore,
            requestMode,
            finalRequestLimit
          );
        } catch (err) {
          console.error('Failed to load observations:', err);
          if (!cancelled) {
            setIsResultsTruncated(false);
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      })();
    }, 250);

    return () => {
      cancelled = true;
      globalThis.clearTimeout(timer);
    };
  }, [
    mapBounds,
    filters,
    mapZoom,
    setLoading,
    buildCacheKey,
    selectedAdminUserId,
    sessionVersion,
    user?.id,
    user?.isAdmin,
  ]);

  // Reset showLogin when user state changes
  useEffect(() => {
    if (user && showLogin) {
      setShowLogin(false);
    }
  }, [user, showLogin]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchObservationCategories();
        if (!cancelled) setCategories(data);
      } catch (err) {
        console.error('Failed to load observation categories:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAccountClick = () => {
    if (!user) {
      setShowLogin(true);
    }
  };

  const handleAdminClick = () => {
    setAdminOpen(true);
  };

  // Admin action handlers
  const handleDeleteObservation = async (observationId: string) => {
    try {
      const res = await deleteObservation(observationId);
      if (res.success) {
        observationsCacheRef.current.clear();
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
        observationsCacheRef.current.clear();
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

  const handleBanUser = async (userId: string) => {
    try {
      const res = await banUser(userId);
      if (res.success) {
        observationsCacheRef.current.clear();
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

  // Keep only local moderation visibility on the client side
  const filteredObservations = useMemo(() => {
    return observations.filter((obs) => {
      // Filter out banned users
      if (bannedUsers.has(obs.userId)) {
        return false;
      }

      if (filters.hasMedia && obs.photos.length + obs.videos.length === 0) {
        return false;
      }

      return true;
    });
  }, [observations, bannedUsers, filters.hasMedia]);

  const legendCategories = useMemo(() => {
    return categories
      .filter((cat) => !cat.is_fallback && cat.color)
      .map((cat) => ({
        name: cat.type,
        color: cat.color!,
        keywords: cat.keywords || [],
      }));
  }, [categories]);

  const handleObservationClick = useCallback((observation: Observation) => {
    setSelectedObservation(observation);
    setDetailsOpen(true);
  }, []);

  const handleMapBoundsChange = useCallback((view: ObservationBounds & { zoom: number }) => {
    setMapBounds({ ne: view.ne, sw: view.sw });
    setMapZoom(view.zoom);
  }, []);

  const topMapAlertMessage = useMemo(() => {
    if (!isResultsTruncated || loading || mapZoom < MIN_QUERY_ZOOM) {
      return '';
    }

    if (dataDisplayMode === 'aggregate') {
      return 'Many observations in view. Zoom in for detail.';
    }

    return `Showing first ${activeRequestLimit} observations. Zoom in or filter to see more.`;
  }, [activeRequestLimit, dataDisplayMode, isResultsTruncated, loading, mapZoom]);

  const handleExportCSV = () => {
    exportToCSV(filteredObservations, legendCategories);
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
  if (adminOpen) {
    return (
      <Suspense fallback={null}>
        <AdminPage onClose={() => setAdminOpen(false)} />
      </Suspense>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Header
        filters={filters}
        onFilterChange={setFilters}
        observationTypes={observationTypes}
        mapAlertMessage={topMapAlertMessage}
        onExportCSV={handleExportCSV}
        onAccountClick={handleAccountClick}
        onAdminClick={handleAdminClick}
        adminUserOptions={adminUserOptions}
        selectedAdminUserId={selectedAdminUserId}
        onAdminUserFilterChange={setSelectedAdminUserId}
        adminUserFilterLoading={adminUsersLoading}
        onDailyReportClick={() => setDailyReportOpen(true)}
        projects={user?.projects || []}
        onOwnDataDeleted={(userId) => {
          observationsCacheRef.current.clear();
          setObservations((prev) =>
            prev.map((observation) =>
              observation.userId === userId
                ? {
                    ...observation,
                    userId: '',
                    observerName: 'Anonymous',
                  }
                : observation
            )
          );
        }}
      />

      <main className="flex-1 relative overflow-hidden">
        <MapView
          observations={filteredObservations}
          categories={categories}
          onObservationClick={handleObservationClick}
          onClusterOpen={() => {
            setDetailsOpen(false);
            setSelectedObservation(null);
          }}
          onBoundsChange={handleMapBoundsChange}
          loading={loading}
          zoomTooLow={mapZoom < MIN_QUERY_ZOOM}
          isTruncated={isResultsTruncated}
        />
      </main>

      <Suspense fallback={null}>
        <ObservationDetails
          observation={selectedObservation}
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          onDeleteObservation={handleDeleteObservation}
          onDeleteAllUserObservations={handleDeleteAllUserObservations}
          onBanUser={handleBanUser}
        />

        <DailyReportPopup
          open={dailyReportOpen}
          onClose={() => setDailyReportOpen(false)}
          selectedUserId={selectedAdminUserId}
        />
      </Suspense>
    </div>
  );
}
