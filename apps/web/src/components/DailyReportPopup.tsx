import { useCallback, useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import {
  deleteAllUserObservations,
  deleteObservation,
  fetchObservationsForRangeWithRelations,
} from '../api/observations';
import { Observation } from '../types/observation';
import { Camera, Clock, FileText, Loader2, MapPin, ShieldAlert, User } from 'lucide-react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useAuth } from '../contexts/AuthContext';
import { Input } from './ui/input';
import { ObservationDetails } from './ObservationDetails';
import { toast } from 'sonner';

interface DailyReportPopupProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly selectedUserId?: string | null;
}

type ViewMode = 'person' | 'project' | 'journey' | 'all';
type SecondarySort = 'time' | 'count';
type RangeMode = 'last-24h' | 'last-7d' | 'custom-range';

type GroupedObservation = {
  key: string;
  label: string;
  count: number;
  lastObservationAt: string;
  observations: Observation[];
};

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const OBSERVATION_TIME_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
});

const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const hasMedia = (observation: Observation): boolean => {
  return observation.photos.length > 0 || observation.videos.length > 0;
};

function shouldKeepReportOpenForTarget(target: globalThis.EventTarget | null) {
  const element = target as globalThis.Element | null;

  if (!element?.closest) {
    return false;
  }

  const isObservationDetails = !!element.closest('[data-observation-details-panel="true"]');
  const isSelectContent = !!element.closest('[data-slot="select-content"]');
  const isSelectTrigger = !!element.closest('[data-slot="select-trigger"]');
  const isRadixPopper = !!element.closest('[data-radix-popper-content-wrapper]');

  return isObservationDetails || isSelectContent || isSelectTrigger || isRadixPopper;
}

export function DailyReportPopup({
  open,
  onClose,
  selectedUserId = null,
}: Readonly<DailyReportPopupProps>) {
  const { user } = useAuth();
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('person');
  const [secondarySort, setSecondarySort] = useState<SecondarySort>('time');
  const [rangeMode, setRangeMode] = useState<RangeMode>('last-24h');
  const [rangeEnd, setRangeEnd] = useState(() => {
    const now = new Date();
    return (
      [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
      ].join('-') +
      `T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    );
  });
  const [rangeStart, setRangeStart] = useState(() => {
    const now = new Date();
    const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return (
      [
        start.getFullYear(),
        String(start.getMonth() + 1).padStart(2, '0'),
        String(start.getDate()).padStart(2, '0'),
      ].join('-') +
      `T${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`
    );
  });
  const [selectedObservation, setSelectedObservation] = useState<Observation | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const isAdmin = !!user?.isAdmin;

  const loadDailyObservations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { since, until } = buildRangeFromMode(rangeMode, rangeStart, rangeEnd);
      const data = await fetchObservationsForRangeWithRelations({
        since,
        until,
        userId: selectedUserId ?? undefined,
      });
      setObservations(data);
    } catch (err) {
      console.error('Failed to load daily observations:', err);
      const message =
        err instanceof Error ? err.message : 'Failed to load observations. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [rangeMode, rangeStart, rangeEnd, selectedUserId]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!isAdmin) {
      setObservations([]);
      setError(null);
      setLoading(false);
      return;
    }

    void loadDailyObservations();
  }, [open, isAdmin, loadDailyObservations]);

  useEffect(() => {
    if (!open) {
      setDetailsOpen(false);
      setSelectedObservation(null);
    }
  }, [open]);

  const groupedByPerson = useMemo(() => {
    return buildGroupedObservations(
      observations,
      secondarySort,
      (obs) => obs.userId || obs.observerName,
      (obs) => obs.observerName || 'Unknown person'
    );
  }, [observations, secondarySort]);

  const groupedByProject = useMemo(() => {
    return buildGroupedObservations(
      observations,
      secondarySort,
      (obs) => obs.projectName || 'Untitled Project',
      (obs) => obs.projectName || 'Untitled Project'
    );
  }, [observations, secondarySort]);

  const groupedByJourney = useMemo(() => {
    return buildJourneyGroups(observations, secondarySort);
  }, [observations, secondarySort]);

  const sortedAll = useMemo(() => {
    const items = [...observations];

    if (secondarySort === 'time') {
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return items;
    }

    const countByPerson = observations.reduce<Record<string, number>>((acc, observation) => {
      const key = observation.userId || observation.observerName || 'Unknown person';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    items.sort((a, b) => {
      const aKey = a.userId || a.observerName || 'Unknown person';
      const bKey = b.userId || b.observerName || 'Unknown person';
      const countDelta = (countByPerson[bKey] ?? 0) - (countByPerson[aKey] ?? 0);

      if (countDelta !== 0) {
        return countDelta;
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return items;
  }, [observations, secondarySort]);

  const handleObservationClick = (observation: Observation) => {
    setSelectedObservation(observation);
    setDetailsOpen(true);
  };

  const handleDeleteObservation = async (observationId: string) => {
    const result = await deleteObservation(observationId);

    if (!result.success) {
      toast.error(result.error ?? 'Failed to delete observation.');
      return;
    }

    setObservations((previous) =>
      previous.filter((observation) => observation.id !== observationId)
    );
    setSelectedObservation((previous) => {
      if (previous?.id === observationId) {
        return null;
      }
      return previous;
    });
    toast.success('Observation deleted.');
  };

  const handleDeleteAllUserObservations = async (userId: string) => {
    const result = await deleteAllUserObservations(userId);

    if (!result.success) {
      toast.error(result.error ?? 'Failed to delete observations for this user.');
      return;
    }

    setObservations((previous) =>
      previous.filter((observation) => {
        return observation.userId !== userId;
      })
    );
    setSelectedObservation((previous) => {
      if (previous?.userId === userId) {
        return null;
      }
      return previous;
    });
    toast.success('All observations from this user were deleted.');
  };

  const formatTimeAgo = (createdAt: string) => {
    const observationDate = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - observationDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ${diffMins}m ago`;
    }

    return `${diffMins}m ago`;
  };

  const activeGroups =
    viewMode === 'person'
      ? groupedByPerson
      : viewMode === 'project'
        ? groupedByProject
        : groupedByJourney;
  const rangeLabel = getRangeLabel(rangeMode, rangeStart, rangeEnd);

  const handleDialogOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setDetailsOpen(false);
      setSelectedObservation(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange} modal={false}>
      <DialogContent
        overlayClassName="bg-transparent pointer-events-none"
        className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
        onPointerDownOutside={(event) => {
          if (shouldKeepReportOpenForTarget(event.target)) {
            event.preventDefault();
          }
        }}
        onInteractOutside={(event) => {
          if (shouldKeepReportOpenForTarget(event.target)) {
            event.preventDefault();
          }
        }}
        onFocusOutside={(event) => {
          // Keep report stable while details panel is open; pointer outside still closes report.
          if (detailsOpen || shouldKeepReportOpenForTarget(event.target)) {
            event.preventDefault();
          }
        }}
      >
        <div data-daily-report-content="true" className="contents">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Clock className="size-5 text-blue-600" />
              Daily Report
            </DialogTitle>
            <DialogDescription>{rangeLabel}</DialogDescription>
            {selectedUserId && (
              <p className="text-sm text-muted-foreground">Filtered to selected user</p>
            )}
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {!isAdmin && (
              <div className="text-center py-12 text-muted-foreground">
                <ShieldAlert className="size-10 mx-auto mb-3 text-amber-600" />
                <p className="font-medium text-foreground">Admin access required</p>
                <p className="text-sm mt-1">
                  Only users with an admin role can view the Daily Report.
                </p>
              </div>
            )}

            {isAdmin && (
              <div className="mb-4 px-1">
                <div className="text-sm text-muted-foreground">
                  Total observations ({rangeLabel})
                </div>
                <div className="text-2xl font-semibold text-foreground">{observations.length}</div>
              </div>
            )}

            {isAdmin && (
              <div className="mb-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="w-[220px]">
                    <Select
                      value={rangeMode}
                      onValueChange={(value: RangeMode) => setRangeMode(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Report range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="last-24h">Last 24 hours</SelectItem>
                        <SelectItem value="last-7d">Last 7 days</SelectItem>
                        <SelectItem value="custom-range">Custom timeframe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {rangeMode === 'custom-range' && (
                    <>
                      <div className="w-[215px]">
                        <Input
                          type="datetime-local"
                          value={rangeStart}
                          onChange={(event) => setRangeStart(event.target.value)}
                          max={rangeEnd || undefined}
                        />
                      </div>
                      <div className="w-[215px]">
                        <Input
                          type="datetime-local"
                          value={rangeEnd}
                          onChange={(event) => setRangeEnd(event.target.value)}
                          min={rangeStart || undefined}
                          max={new Date().toISOString().slice(0, 16)}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={viewMode === 'person' ? 'default' : 'outline'}
                    onClick={() => setViewMode('person')}
                  >
                    Sort by Person
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'project' ? 'default' : 'outline'}
                    onClick={() => setViewMode('project')}
                  >
                    Sort by Project
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'journey' ? 'default' : 'outline'}
                    onClick={() => setViewMode('journey')}
                  >
                    Sort by Journey
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'all' ? 'default' : 'outline'}
                    onClick={() => setViewMode('all')}
                  >
                    Show all observations
                  </Button>
                </div>

                <div className="w-[270px]">
                  <Select
                    value={secondarySort}
                    onValueChange={(value: SecondarySort) => setSecondarySort(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Secondary sort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="time">Time (most recent)</SelectItem>
                      <SelectItem value="count">Amount of observations (highest count)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-8 animate-spin text-blue-600" />
                <span className="ml-3 text-muted-foreground">Loading observations...</span>
              </div>
            )}

            {isAdmin && error && (
              <div className="text-center py-12 text-red-600">
                <p>{error}</p>
                <button
                  onClick={() => void loadDailyObservations()}
                  className="mt-2 text-blue-600 hover:underline"
                >
                  Try again
                </button>
              </div>
            )}

            {isAdmin && !loading && !error && observations.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="size-12 mx-auto mb-3 opacity-50" />
                <p>No observations found for this period</p>
              </div>
            )}

            {isAdmin && !loading && !error && observations.length > 0 && viewMode === 'all' && (
              <div className="space-y-3">
                {sortedAll.map((obs) => (
                  <button
                    type="button"
                    key={obs.id}
                    className="bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer w-full text-left"
                    onClick={() => handleObservationClick(obs)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="size-4" />
                        <span>{obs.timestamp}</span>
                        <span className="text-gray-300">•</span>
                        <span>{formatTimeAgo(obs.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasMedia(obs) && (
                          <span title="Has media (photos/videos)">
                            <Camera className="size-4 text-blue-600" />
                          </span>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {obs.type}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-sm text-gray-800 mb-3 line-clamp-2">
                      {obs.observation || 'No observation text'}
                    </p>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="size-3" />
                        <span>{obs.observerName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="size-3" />
                        <span className="truncate max-w-[150px]">{obs.projectName}</span>
                      </div>
                    </div>

                    {obs.keywords.length > 1 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {obs.keywords.slice(1, 4).map((keyword) => (
                          <span
                            key={`${obs.id}-${keyword}`}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                          >
                            {keyword}
                          </span>
                        ))}
                        {obs.keywords.length > 4 && (
                          <span className="text-xs text-gray-400">
                            +{obs.keywords.length - 4} more
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {isAdmin && !loading && !error && observations.length > 0 && viewMode !== 'all' && (
              <div className="space-y-3">
                {activeGroups.map((group) => (
                  <details key={group.key} className="border rounded-lg bg-background">
                    <summary className="list-none cursor-pointer px-4 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-sm text-foreground truncate">
                          {group.label}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Last observation:{' '}
                          {OBSERVATION_TIME_FORMATTER.format(new Date(group.lastObservationAt))}
                        </div>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {group.count} obs
                      </Badge>
                    </summary>

                    <div className="px-4 pb-4 space-y-2 border-t pt-3">
                      {(viewMode === 'project'
                        ? buildJourneyGroups(group.observations, secondarySort)
                        : [
                            {
                              key: group.key,
                              label: '',
                              count: group.count,
                              observations: group.observations,
                            },
                          ]
                      ).map((journeyGroup) => (
                        <div key={`${group.key}-${journeyGroup.key}`} className="space-y-2">
                          {viewMode === 'project' ? (
                            <details className="rounded-md border bg-muted/10">
                              <summary className="list-none cursor-pointer flex items-center justify-between px-3 py-2 gap-2">
                                <div className="text-xs font-medium text-foreground truncate">
                                  {journeyGroup.label}
                                </div>
                                <Badge variant="secondary" className="shrink-0 text-xs">
                                  {journeyGroup.count} obs
                                </Badge>
                              </summary>

                              <div className="space-y-2 px-2 pb-2 border-t pt-2">
                                {journeyGroup.observations.map((obs) => (
                                  <button
                                    type="button"
                                    key={obs.id}
                                    className="bg-muted/20 border rounded-md p-3 cursor-pointer w-full text-left"
                                    onClick={() => handleObservationClick(obs)}
                                  >
                                    <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        <Clock className="size-3" />
                                        {OBSERVATION_TIME_FORMATTER.format(new Date(obs.createdAt))}
                                      </span>
                                      <span className="flex items-center gap-2">
                                        {hasMedia(obs) && (
                                          <span title="Has media (photos/videos)">
                                            <Camera className="size-3 text-blue-600" />
                                          </span>
                                        )}
                                        <>
                                          <User className="size-3" />
                                          {obs.observerName}
                                        </>
                                      </span>
                                    </div>
                                    <p className="text-sm text-foreground">
                                      {obs.observation || 'No observation text'}
                                    </p>
                                  </button>
                                ))}
                              </div>
                            </details>
                          ) : (
                            journeyGroup.observations.map((obs) => (
                              <button
                                type="button"
                                key={obs.id}
                                className="bg-muted/20 border rounded-md p-3 cursor-pointer w-full text-left"
                                onClick={() => handleObservationClick(obs)}
                              >
                                <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="size-3" />
                                    {OBSERVATION_TIME_FORMATTER.format(new Date(obs.createdAt))}
                                  </span>
                                  <span className="flex items-center gap-2">
                                    {hasMedia(obs) && (
                                      <span title="Has media (photos/videos)">
                                        <Camera className="size-3 text-blue-600" />
                                      </span>
                                    )}
                                    {viewMode === 'person' ? (
                                      <>
                                        <MapPin className="size-3" />
                                        {obs.projectName}
                                      </>
                                    ) : (
                                      <>
                                        <MapPin className="size-3" />
                                        {obs.projectName}
                                      </>
                                    )}
                                  </span>
                                </div>
                                <p className="text-sm text-foreground">
                                  {obs.observation || 'No observation text'}
                                </p>
                              </button>
                            ))
                          )}
                        </div>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            )}
          </div>

          {isAdmin && !loading && !error && observations.length > 0 && (
            <div className="pt-4 border-t text-center text-sm text-muted-foreground">
              Showing observations for {rangeLabel.toLowerCase()}
            </div>
          )}
        </div>
      </DialogContent>

      <ObservationDetails
        observation={selectedObservation}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        showBackdrop={false}
        onDeleteObservation={(observationId) => {
          void handleDeleteObservation(observationId);
        }}
        onDeleteAllUserObservations={(userId) => {
          void handleDeleteAllUserObservations(userId);
        }}
      />
    </Dialog>
  );
}

function buildRangeFromMode(mode: RangeMode, customStart: string, customEnd: string) {
  if (mode === 'last-7d') {
    return {
      since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  if (mode === 'custom-range') {
    if (!customStart || !customEnd) {
      throw new Error('Please provide both a start and end time for the custom timeframe.');
    }

    const start = new Date(customStart);
    const end = new Date(customEnd);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new TypeError('The selected timeframe is invalid.');
    }

    if (end.getTime() <= start.getTime()) {
      throw new Error('End time must be after start time.');
    }

    return {
      since: start.toISOString(),
      until: end.toISOString(),
    };
  }

  return {
    since: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  };
}

function getRangeLabel(mode: RangeMode, customStart: string, customEnd: string) {
  if (mode === 'last-7d') {
    return 'Last 7 days';
  }

  if (mode === 'custom-range' && customStart && customEnd) {
    const start = new Date(customStart);
    const end = new Date(customEnd);

    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      return `${DATE_TIME_FORMATTER.format(start)} to ${DATE_TIME_FORMATTER.format(end)}`;
    }

    return 'Custom timeframe';
  }

  return 'Last 24 hours';
}

function buildGroupedObservations(
  observations: Observation[],
  sortMode: SecondarySort,
  groupKeySelector: (observation: Observation) => string,
  groupLabelSelector: (observation: Observation) => string
) {
  const grouped = new Map<string, GroupedObservation>();

  observations.forEach((observation) => {
    const key = groupKeySelector(observation);
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, {
        key,
        label: groupLabelSelector(observation),
        count: 1,
        lastObservationAt: observation.createdAt,
        observations: [observation],
      });
      return;
    }

    existing.count += 1;
    existing.observations.push(observation);

    if (
      new Date(observation.createdAt).getTime() > new Date(existing.lastObservationAt).getTime()
    ) {
      existing.lastObservationAt = observation.createdAt;
    }
  });

  return Array.from(grouped.values())
    .map((group) => ({
      ...group,
      observations: [...group.observations].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    }))
    .sort((a, b) => {
      if (sortMode === 'count' && a.count !== b.count) {
        return b.count - a.count;
      }

      return new Date(b.lastObservationAt).getTime() - new Date(a.lastObservationAt).getTime();
    });
}

function buildJourneyGroups(observations: Observation[], sortMode: SecondarySort) {
  return buildGroupedObservations(
    observations,
    sortMode,
    (obs) => obs.tripId || `${obs.userId || obs.observerName}-${obs.date}`,
    (obs) => {
      const date = new Date(obs.createdAt);
      const dateLabel = Number.isNaN(date.getTime()) ? obs.date : DATE_FORMATTER.format(date);
      return `${obs.observerName || 'Unknown person'} - ${dateLabel}`;
    }
  );
}
