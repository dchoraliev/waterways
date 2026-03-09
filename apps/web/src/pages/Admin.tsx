/* global HTMLTextAreaElement */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { WaveIcon } from '../components/WaveIcon';
import {
  fetchDeletedObservationsForAdmin,
  fetchObservationCategories,
  restoreAllUserObservations,
  restoreObservation,
  type DeletedObservationRecord,
} from '../api/observations';
import { fetchBannedUsers, unbanUser, type BannedUserRecord } from '../api/users';
import { supabase } from '../services/supabase';
import { Checkbox } from '../components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogHeader,
} from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Clock, MapPin, User } from 'lucide-react';
import { toast } from 'sonner';

type AdminTab = 'categories' | 'banned-users' | 'deleted-posts';
type RangeMode = 'last-24h' | 'last-7d' | 'last-3m' | 'last-6m' | 'custom-range';
type DeletedViewMode = 'person' | 'project' | 'all';
type SecondarySort = 'time' | 'count';

type CategoryRow = {
  id: number;
  type: string;
  color: string | null;
  keywords: string[] | null;
  is_fallback?: boolean;
  is_active?: boolean;
  editKeywords?: string;
  editColor?: string | null;
  editActive?: boolean;
};

type GroupedDeletedObservation = {
  key: string;
  label: string;
  count: number;
  lastAt: string;
  observations: DeletedObservationRecord[];
};

function getDeletedTimestamp(value: string | null): number {
  if (!value) {
    return Number.NEGATIVE_INFINITY;
  }

  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : Number.NEGATIVE_INFINITY;
}

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

function nowAsLocalDateTimeInput(): string {
  const now = new Date();
  return (
    [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('-') +
    `T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  );
}

function shiftHours(base: Date, hours: number): string {
  return new Date(base.getTime() - hours * 60 * 60 * 1000).toISOString();
}

function shiftMonths(base: Date, months: number): string {
  const shifted = new Date(base);
  shifted.setMonth(shifted.getMonth() - months);
  return shifted.toISOString();
}

function buildRange(mode: RangeMode, customStart: string, customEnd: string) {
  const now = new Date();

  if (mode === 'last-24h') {
    return { since: shiftHours(now, 24) };
  }

  if (mode === 'last-7d') {
    return { since: shiftHours(now, 24 * 7) };
  }

  if (mode === 'last-3m') {
    return { since: shiftMonths(now, 3) };
  }

  if (mode === 'last-6m') {
    return { since: shiftMonths(now, 6) };
  }

  const start = new Date(customStart);
  const end = new Date(customEnd);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new TypeError('Invalid custom timeframe.');
  }

  if (end.getTime() <= start.getTime()) {
    throw new Error('End time must be after start time.');
  }

  return {
    since: start.toISOString(),
    until: end.toISOString(),
  };
}

function buildDeletedGroups(
  observations: DeletedObservationRecord[],
  sortMode: SecondarySort,
  keySelector: (observation: DeletedObservationRecord) => string,
  labelSelector: (observation: DeletedObservationRecord) => string
): GroupedDeletedObservation[] {
  const grouped = new Map<string, GroupedDeletedObservation>();

  observations.forEach((observation) => {
    const key = keySelector(observation);
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, {
        key,
        label: labelSelector(observation),
        count: 1,
        lastAt: observation.deletedAt ?? '',
        observations: [observation],
      });
      return;
    }

    existing.count += 1;
    existing.observations.push(observation);

    const existingTime = getDeletedTimestamp(existing.lastAt);
    const currentTime = getDeletedTimestamp(observation.deletedAt);
    if (currentTime > existingTime) {
      existing.lastAt = observation.deletedAt ?? '';
    }
  });

  return Array.from(grouped.values())
    .map((group) => ({
      ...group,
      observations: [...group.observations].sort((a, b) => {
        const aTime = getDeletedTimestamp(a.deletedAt);
        const bTime = getDeletedTimestamp(b.deletedAt);
        return bTime - aTime;
      }),
    }))
    .sort((a, b) => {
      if (sortMode === 'count' && a.count !== b.count) {
        return b.count - a.count;
      }

      return getDeletedTimestamp(b.lastAt) - getDeletedTimestamp(a.lastAt);
    });
}

export function AdminPage({ onClose }: Readonly<{ onClose: () => void }>) {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<AdminTab>('categories');

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [editingRow, setEditingRow] = useState<CategoryRow | null>(null);
  const [modalFields, setModalFields] = useState<{
    editKeywords: string;
    editColor: string;
    editActive: boolean;
    is_fallback?: boolean;
  }>({ editKeywords: '', editColor: '#000000', editActive: true });

  const [bannedUsers, setBannedUsers] = useState<BannedUserRecord[]>([]);
  const [bannedLoading, setBannedLoading] = useState(false);
  const [bannedSearch, setBannedSearch] = useState('');
  const [bannedRangeMode, setBannedRangeMode] = useState<RangeMode>('last-7d');
  const [bannedRangeStart, setBannedRangeStart] = useState(() =>
    shiftHours(new Date(), 24 * 7).slice(0, 16)
  );
  const [bannedRangeEnd, setBannedRangeEnd] = useState(() => nowAsLocalDateTimeInput());

  const [deletedObservations, setDeletedObservations] = useState<DeletedObservationRecord[]>([]);
  const [deletedLoading, setDeletedLoading] = useState(false);
  const [deletedSearch, setDeletedSearch] = useState('');
  const [deletedRangeMode, setDeletedRangeMode] = useState<RangeMode>('last-7d');
  const [deletedRangeStart, setDeletedRangeStart] = useState(() =>
    shiftHours(new Date(), 24 * 7).slice(0, 16)
  );
  const [deletedRangeEnd, setDeletedRangeEnd] = useState(() => nowAsLocalDateTimeInput());
  const [deletedViewMode, setDeletedViewMode] = useState<DeletedViewMode>('person');
  const [deletedSort, setDeletedSort] = useState<SecondarySort>('time');

  const keywordsRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const ta = keywordsRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.max(48, ta.scrollHeight)}px`;
  }, [modalFields.editKeywords, editingRow]);

  useEffect(() => {
    if (user?.role !== 'admin') {
      return;
    }

    if (activeTab !== 'categories') {
      return;
    }

    let cancelled = false;

    const loadCategories = async () => {
      setCategoriesLoading(true);
      try {
        const data = await fetchObservationCategories();
        if (cancelled) return;

        const rows: CategoryRow[] = data.map((c) => ({
          ...c,
          editKeywords: (c.keywords || []).join(', '),
          editColor: c.color || '#000000',
          editActive: !!c.is_active,
        }));

        rows.sort((a, b) => (a.is_fallback ? 1 : 0) - (b.is_fallback ? 1 : 0));
        setCategories(rows);
      } catch (err) {
        console.error('Failed to load categories', err);
      } finally {
        if (!cancelled) {
          setCategoriesLoading(false);
        }
      }
    };

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, [activeTab, user]);

  useEffect(() => {
    if (user?.role !== 'admin' || activeTab !== 'banned-users') {
      return;
    }

    const loadBannedUsers = async () => {
      setBannedLoading(true);
      try {
        const range = buildRange(bannedRangeMode, bannedRangeStart, bannedRangeEnd);
        const data = await fetchBannedUsers({
          since: range.since,
          until: range.until,
          search: bannedSearch,
        });
        setBannedUsers(data);
      } catch (error) {
        console.error('Failed to load banned users:', error);
        toast.error('Failed to load banned users.');
      } finally {
        setBannedLoading(false);
      }
    };

    void loadBannedUsers();
  }, [activeTab, user, bannedRangeMode, bannedRangeStart, bannedRangeEnd, bannedSearch]);

  useEffect(() => {
    if (user?.role !== 'admin' || activeTab !== 'deleted-posts') {
      return;
    }

    const loadDeletedPosts = async () => {
      setDeletedLoading(true);
      try {
        const range = buildRange(deletedRangeMode, deletedRangeStart, deletedRangeEnd);
        const data = await fetchDeletedObservationsForAdmin({
          since: range.since,
          until: range.until,
          search: deletedSearch,
        });
        setDeletedObservations(data);
      } catch (error) {
        console.error('Failed to load deleted posts:', error);
        toast.error('Failed to load deleted posts.');
      } finally {
        setDeletedLoading(false);
      }
    };

    void loadDeletedPosts();
  }, [activeTab, user, deletedRangeMode, deletedRangeStart, deletedRangeEnd, deletedSearch]);

  const deletedGroupsByPerson = useMemo(() => {
    return buildDeletedGroups(
      deletedObservations,
      deletedSort,
      (observation) => observation.userId || observation.observerName,
      (observation) => observation.observerName || 'Unknown user'
    );
  }, [deletedObservations, deletedSort]);

  const deletedGroupsByProject = useMemo(() => {
    return buildDeletedGroups(
      deletedObservations,
      deletedSort,
      (observation) => observation.projectName,
      (observation) => observation.projectName
    );
  }, [deletedObservations, deletedSort]);

  const deletedAllSorted = useMemo(() => {
    const items = [...deletedObservations];

    if (deletedSort === 'time') {
      items.sort((a, b) => {
        const aTime = getDeletedTimestamp(a.deletedAt);
        const bTime = getDeletedTimestamp(b.deletedAt);
        return bTime - aTime;
      });
      return items;
    }

    const byUserCount = items.reduce<Record<string, number>>((acc, item) => {
      const key = item.userId || item.observerName;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    items.sort((a, b) => {
      const aKey = a.userId || a.observerName;
      const bKey = b.userId || b.observerName;
      const countDiff = (byUserCount[bKey] ?? 0) - (byUserCount[aKey] ?? 0);
      if (countDiff !== 0) {
        return countDiff;
      }

      const aTime = getDeletedTimestamp(a.deletedAt);
      const bTime = getDeletedTimestamp(b.deletedAt);
      return bTime - aTime;
    });

    return items;
  }, [deletedObservations, deletedSort]);

  const handleSaveCategory = async (row: CategoryRow) => {
    try {
      if (row.is_fallback) {
        globalThis.alert('Fallback category cannot be edited');
        return;
      }

      const payload: Partial<{
        keywords: string[] | null;
        color: string | null;
        is_active: boolean;
      }> = {};

      if (row.editKeywords !== undefined) {
        payload.keywords = row.editKeywords
          ? row.editKeywords
              .split(',')
              .map((k) => k.trim())
              .filter(Boolean)
          : null;
      }

      if (row.editColor !== undefined) payload.color = row.editColor;
      if (row.editActive !== undefined) payload.is_active = !!row.editActive;

      const { error } = await supabase
        .from('observation_categories')
        .update(payload)
        .eq('id', row.id);

      if (error) {
        console.error('Failed to update category:', error);
        globalThis.alert('Failed to save category');
        return;
      }

      const data = await fetchObservationCategories();
      const rows: CategoryRow[] = data.map((c) => ({
        ...c,
        editKeywords: (c.keywords || []).join(', '),
        editColor: c.color || '#000000',
        editActive: !!c.is_active,
      }));
      rows.sort((a, b) => (a.is_fallback ? 1 : 0) - (b.is_fallback ? 1 : 0));
      setCategories(rows);
    } catch (err) {
      console.error('Error saving category:', err);
      globalThis.alert('Error saving category');
    }
  };

  const handleModalSave = async () => {
    if (!editingRow) return;

    const updated: CategoryRow = {
      ...editingRow,
      editKeywords: modalFields.editKeywords,
      editColor: modalFields.editColor,
      editActive: modalFields.editActive,
    };

    await handleSaveCategory(updated);
    setEditingRow(null);
  };

  const handleUnbanUser = async (userId: string) => {
    const result = await unbanUser(userId);

    if (!result.success) {
      toast.error(result.error ?? 'Failed to unban user.');
      return;
    }

    setBannedUsers((previous) => previous.filter((row) => row.id !== userId));
    toast.success('User unbanned.');
  };

  const handleRestorePost = async (observationId: string) => {
    const result = await restoreObservation(observationId);

    if (!result.success) {
      toast.error(result.error ?? 'Failed to restore post.');
      return;
    }

    setDeletedObservations((previous) => previous.filter((row) => row.id !== observationId));
    toast.success('Post restored.');
  };

  const handleRestoreAllFromUser = async (userId: string) => {
    const result = await restoreAllUserObservations(userId);

    if (!result.success) {
      toast.error(result.error ?? 'Failed to restore posts for this user.');
      return;
    }

    setDeletedObservations((previous) => previous.filter((row) => row.userId !== userId));
    toast.success('All deleted posts from this user restored.');
  };

  const deletedGroups =
    deletedViewMode === 'person' ? deletedGroupsByPerson : deletedGroupsByProject;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-blue-200 border-b">
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2 shrink-0 min-w-0">
            <WaveIcon className="size-8 text-blue-700" />
            <h1 className="whitespace-nowrap text-lg font-semibold">
              Waterways Admin Management Console
            </h1>
          </div>
          <div className="ml-auto">
            <Button onClick={onClose} variant="outline">
              Back
            </Button>
          </div>
        </div>
      </header>

      <main className="p-6 flex-1 overflow-auto">
        {user?.role === 'admin' ? (
          <div className="max-w-6xl bg-white rounded-md shadow-sm p-6 space-y-6">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={activeTab === 'categories' ? 'default' : 'outline'}
                onClick={() => setActiveTab('categories')}
              >
                Category Management
              </Button>
              <Button
                variant={activeTab === 'banned-users' ? 'default' : 'outline'}
                onClick={() => setActiveTab('banned-users')}
              >
                Banned Users
              </Button>
              <Button
                variant={activeTab === 'deleted-posts' ? 'default' : 'outline'}
                onClick={() => setActiveTab('deleted-posts')}
              >
                Deleted Posts
              </Button>
            </div>

            {activeTab === 'categories' && (
              <section>
                <h3 className="text-lg font-medium mb-4">Category Management</h3>

                <div className="overflow-x-auto">
                  <table className="w-full table-auto border-collapse">
                    <thead>
                      <tr className="text-left text-sm text-muted-foreground">
                        <th className="px-3 py-2">Category</th>
                        <th className="px-3 py-2">Keywords</th>
                        <th className="px-3 py-2">Pin Color</th>
                        <th className="px-3 py-2">Active</th>
                        <th className="px-3 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoriesLoading && (
                        <tr>
                          <td colSpan={5} className="px-3 py-4 text-sm text-muted-foreground">
                            Loading...
                          </td>
                        </tr>
                      )}

                      {categories.map((row) => (
                        <tr key={row.id} className="border-t">
                          <td className="px-3 py-2 align-top">{capitalize(row.type)}</td>
                          <td className="px-3 py-2">
                            <div className="text-sm">{row.editKeywords}</div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-6 h-6 rounded"
                                style={{ background: row.editColor ?? '#000' }}
                              />
                              <span className="text-sm text-muted-foreground">{row.editColor}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <Checkbox checked={!!row.editActive} disabled />
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              {row.is_fallback ? (
                                <span className="text-sm text-muted-foreground">Read Only</span>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setEditingRow(row);
                                    setModalFields({
                                      editKeywords: row.editKeywords ?? '',
                                      editColor: row.editColor ?? '#000000',
                                      editActive: !!row.editActive,
                                      is_fallback: row.is_fallback,
                                    });
                                  }}
                                >
                                  Edit
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeTab === 'banned-users' && (
              <section className="space-y-4">
                <h3 className="text-lg font-medium">Banned Users</h3>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="w-[220px]">
                    <Select
                      value={bannedRangeMode}
                      onValueChange={(value: RangeMode) => setBannedRangeMode(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Date range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="last-24h">Last 24 hours</SelectItem>
                        <SelectItem value="last-7d">Last 7 days</SelectItem>
                        <SelectItem value="last-3m">Last 3 months</SelectItem>
                        <SelectItem value="last-6m">Last 6 months</SelectItem>
                        <SelectItem value="custom-range">Custom timeframe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {bannedRangeMode === 'custom-range' && (
                    <>
                      <div className="w-[215px]">
                        <Input
                          type="datetime-local"
                          value={bannedRangeStart}
                          onChange={(event) => setBannedRangeStart(event.target.value)}
                          max={bannedRangeEnd || undefined}
                        />
                      </div>
                      <div className="w-[215px]">
                        <Input
                          type="datetime-local"
                          value={bannedRangeEnd}
                          onChange={(event) => setBannedRangeEnd(event.target.value)}
                          min={bannedRangeStart || undefined}
                          max={nowAsLocalDateTimeInput()}
                        />
                      </div>
                    </>
                  )}

                  <Input
                    placeholder="Search name or email"
                    value={bannedSearch}
                    onChange={(event) => setBannedSearch(event.target.value)}
                    className="max-w-[280px]"
                  />
                </div>

                <div className="overflow-x-auto border rounded-md">
                  <table className="w-full table-auto border-collapse">
                    <thead>
                      <tr className="text-left text-sm text-muted-foreground border-b">
                        <th className="px-3 py-2">User</th>
                        <th className="px-3 py-2">Email</th>
                        <th className="px-3 py-2">Banned At</th>
                        <th className="px-3 py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bannedLoading && (
                        <tr>
                          <td colSpan={4} className="px-3 py-4 text-sm text-muted-foreground">
                            Loading banned users...
                          </td>
                        </tr>
                      )}

                      {!bannedLoading && bannedUsers.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-3 py-4 text-sm text-muted-foreground">
                            No banned users for this filter.
                          </td>
                        </tr>
                      )}

                      {bannedUsers.map((row) => (
                        <tr key={row.id} className="border-t">
                          <td className="px-3 py-2">{row.displayName}</td>
                          <td className="px-3 py-2">{row.email ?? '-'}</td>
                          <td className="px-3 py-2">
                            {row.bannedAt
                              ? DATE_TIME_FORMATTER.format(new Date(row.bannedAt))
                              : '-'}
                          </td>
                          <td className="px-3 py-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void handleUnbanUser(row.id)}
                            >
                              Unban
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeTab === 'deleted-posts' && (
              <section className="space-y-4">
                <h3 className="text-lg font-medium">Deleted Posts</h3>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="w-[220px]">
                    <Select
                      value={deletedRangeMode}
                      onValueChange={(value: RangeMode) => setDeletedRangeMode(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Date range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="last-24h">Last 24 hours</SelectItem>
                        <SelectItem value="last-7d">Last 7 days</SelectItem>
                        <SelectItem value="last-3m">Last 3 months</SelectItem>
                        <SelectItem value="last-6m">Last 6 months</SelectItem>
                        <SelectItem value="custom-range">Custom timeframe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {deletedRangeMode === 'custom-range' && (
                    <>
                      <div className="w-[215px]">
                        <Input
                          type="datetime-local"
                          value={deletedRangeStart}
                          onChange={(event) => setDeletedRangeStart(event.target.value)}
                          max={deletedRangeEnd || undefined}
                        />
                      </div>
                      <div className="w-[215px]">
                        <Input
                          type="datetime-local"
                          value={deletedRangeEnd}
                          onChange={(event) => setDeletedRangeEnd(event.target.value)}
                          min={deletedRangeStart || undefined}
                          max={nowAsLocalDateTimeInput()}
                        />
                      </div>
                    </>
                  )}

                  <Input
                    placeholder="Search user, project, text"
                    value={deletedSearch}
                    onChange={(event) => setDeletedSearch(event.target.value)}
                    className="max-w-[280px]"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={deletedViewMode === 'person' ? 'default' : 'outline'}
                    onClick={() => setDeletedViewMode('person')}
                  >
                    Sort by Person
                  </Button>
                  <Button
                    size="sm"
                    variant={deletedViewMode === 'project' ? 'default' : 'outline'}
                    onClick={() => setDeletedViewMode('project')}
                  >
                    Sort by Project
                  </Button>
                  <Button
                    size="sm"
                    variant={deletedViewMode === 'all' ? 'default' : 'outline'}
                    onClick={() => setDeletedViewMode('all')}
                  >
                    Show all
                  </Button>

                  <div className="w-[260px]">
                    <Select
                      value={deletedSort}
                      onValueChange={(value: SecondarySort) => setDeletedSort(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Secondary sort" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="time">Time (most recent)</SelectItem>
                        <SelectItem value="count">Amount of posts (highest count)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {deletedLoading && (
                  <div className="text-sm text-muted-foreground">Loading deleted posts...</div>
                )}

                {!deletedLoading && deletedObservations.length === 0 && (
                  <div className="text-sm text-muted-foreground">
                    No deleted posts for this filter.
                  </div>
                )}

                {!deletedLoading && deletedObservations.length > 0 && deletedViewMode === 'all' && (
                  <div className="space-y-3">
                    {deletedAllSorted.map((row) => (
                      <div key={row.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <Clock className="size-3" />
                            <span>
                              Deleted{' '}
                              {row.deletedAt
                                ? DATE_TIME_FORMATTER.format(new Date(row.deletedAt))
                                : 'Unknown'}
                            </span>
                          </div>
                          <Badge variant="secondary">{row.categories[0] ?? 'Observation'}</Badge>
                        </div>

                        <p className="text-sm">{row.observation || 'No observation text'}</p>

                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="size-3" />
                            {row.observerName}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3" />
                            {row.projectName}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void handleRestorePost(row.id)}
                          >
                            Restore Post
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void handleRestoreAllFromUser(row.userId)}
                          >
                            Restore All From User
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!deletedLoading && deletedObservations.length > 0 && deletedViewMode !== 'all' && (
                  <div className="space-y-3">
                    {deletedGroups.map((group) => (
                      <details key={group.key} className="border rounded-lg bg-background">
                        <summary className="list-none cursor-pointer px-4 py-3 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium text-sm text-foreground truncate">
                              {group.label}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Last deleted:{' '}
                              {group.lastAt
                                ? DATE_TIME_FORMATTER.format(new Date(group.lastAt))
                                : 'Unknown'}
                            </div>
                          </div>
                          <Badge variant="secondary">{group.count} posts</Badge>
                        </summary>

                        <div className="px-4 pb-4 space-y-2 border-t pt-3">
                          <div className="pb-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                void handleRestoreAllFromUser(group.observations[0]?.userId ?? '')
                              }
                            >
                              Restore All From User
                            </Button>
                          </div>

                          {group.observations.map((row) => (
                            <div key={row.id} className="border rounded-md p-3 space-y-2">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="size-3" />
                                  {row.deletedAt
                                    ? DATE_TIME_FORMATTER.format(new Date(row.deletedAt))
                                    : 'Unknown'}
                                </span>
                                <span className="flex items-center gap-1">
                                  {deletedViewMode === 'person' ? (
                                    <>
                                      <MapPin className="size-3" />
                                      {row.projectName}
                                    </>
                                  ) : (
                                    <>
                                      <User className="size-3" />
                                      {row.observerName}
                                    </>
                                  )}
                                </span>
                              </div>
                              <p className="text-sm">{row.observation || 'No observation text'}</p>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => void handleRestorePost(row.id)}
                              >
                                Restore Post
                              </Button>
                            </div>
                          ))}
                        </div>
                      </details>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        ) : (
          <div className="max-w-3xl bg-white rounded-md shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-2">Admin</h2>
            <p className="mb-4">You are not authorized to view this page.</p>
            <Button onClick={onClose}>Back</Button>
          </div>
        )}
      </main>

      <Dialog
        open={!!editingRow}
        onOpenChange={(open) => {
          if (!open) setEditingRow(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>{editingRow ? capitalize(editingRow.type) : ''}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <label
                htmlFor="category-keywords"
                className="block text-sm text-muted-foreground mb-1"
              >
                Keywords
              </label>
              <textarea
                id="category-keywords"
                ref={keywordsRef}
                value={modalFields.editKeywords}
                onChange={(e) => setModalFields((m) => ({ ...m, editKeywords: e.target.value }))}
                disabled={!!modalFields.is_fallback}
                placeholder="comma separated keywords"
                className="w-full min-h-[48px] resize-none file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-input rounded-md border px-3 py-2 bg-input-background text-sm outline-none"
              />
            </div>

            <div>
              <label htmlFor="category-color" className="block text-sm text-muted-foreground mb-1">
                Pin Color
              </label>
              <input
                id="category-color"
                type="color"
                value={modalFields.editColor}
                onChange={(e) => setModalFields((m) => ({ ...m, editColor: e.target.value }))}
                className="w-16 h-10 p-0 border rounded"
              />
            </div>

            <div className="flex items-center gap-3">
              <label htmlFor="category-active" className="text-sm text-muted-foreground">
                Active
              </label>
              <Checkbox
                id="category-active"
                checked={!!modalFields.editActive}
                onCheckedChange={(v) => setModalFields((m) => ({ ...m, editActive: !!v }))}
                disabled={!!modalFields.is_fallback}
              />
            </div>
          </div>

          <DialogFooter>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditingRow(null)}>
                Cancel
              </Button>
              <Button onClick={handleModalSave}>Save</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminPage;

function capitalize(s?: string) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
