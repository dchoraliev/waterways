/* global HTMLTextAreaElement */
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { WaveIcon } from '../components/WaveIcon';
import { useEffect, useState, useRef } from 'react';
import { fetchObservationCategories } from '../api/observations';
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

export function AdminPage({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();

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

  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRow, setEditingRow] = useState<CategoryRow | null>(null);
  const [modalFields, setModalFields] = useState<{
    editKeywords: string;
    editColor: string;
    editActive: boolean;
    is_fallback?: boolean;
    type?: string;
    id?: number;
  }>({ editKeywords: '', editColor: '#000000', editActive: true });

  const keywordsRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const ta = keywordsRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.max(48, ta.scrollHeight)}px`;
  }, [modalFields.editKeywords, editingRow]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchObservationCategories();
        if (cancelled) return;

        const rows: CategoryRow[] = data.map((c) => ({
          ...c,
          editKeywords: (c.keywords || []).join(', '),
          editColor: c.color || '#000000',
          editActive: !!c.is_active,
        }));

        // Move fallback category (is_fallback) to the end
        rows.sort((a, b) => (a.is_fallback ? 1 : 0) - (b.is_fallback ? 1 : 0));
        setCategories(rows);
      } catch (err) {
        console.error('Failed to load categories', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async (row: CategoryRow) => {
    try {
      // Do not allow editing the fallback category at all
      if (row.is_fallback) {
        window.alert('Fallback category cannot be edited');
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
        window.alert('Failed to save category');
        return;
      }

      // Refresh categories from backend to reflect canonical state
      try {
        const data = await fetchObservationCategories();
        const rows: CategoryRow[] = data.map((c) => ({
          ...c,
          editKeywords: (c.keywords || []).join(', '),
          editColor: c.color || '#000000',
          editActive: !!c.is_active,
        }));
        rows.sort((a, b) => (a.is_fallback ? 1 : 0) - (b.is_fallback ? 1 : 0));
        setCategories(rows);
      } catch (refreshErr) {
        console.warn(
          'Failed to refresh categories after save; applying optimistic update',
          refreshErr
        );

        setCategories((prev) =>
          prev.map((r) =>
            r.id === row.id
              ? {
                  ...r,
                  ...payload,
                  editKeywords:
                    payload.keywords !== undefined
                      ? (payload.keywords || []).join(', ')
                      : r.editKeywords,
                  editColor: payload.color !== undefined ? payload.color : r.editColor,
                  editActive: payload.is_active !== undefined ? payload.is_active : r.editActive,
                }
              : r
          )
        );
      }
    } catch (err) {
      console.error('Error saving category:', err);
      window.alert('Error saving category');
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

    await handleSave(updated);
    setEditingRow(null);
  };

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
        {!user || user.role !== 'admin' ? (
          <div className="max-w-3xl bg-white rounded-md shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-2">Admin</h2>
            <p className="mb-4">You are not authorized to view this page.</p>
            <Button onClick={onClose}>Back</Button>
          </div>
        ) : (
          <div className="max-w-6xl bg-white rounded-md shadow-sm p-6">
            <section className="mt-6">
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
                    {loading && (
                      <tr>
                        <td colSpan={5} className="px-3 py-4 text-sm text-muted-foreground">
                          Loading…
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
                                    type: row.type,
                                    id: row.id,
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
              <label className="block text-sm text-muted-foreground mb-1">Keywords</label>
              <textarea
                ref={keywordsRef}
                value={modalFields.editKeywords}
                onChange={(e) => setModalFields((m) => ({ ...m, editKeywords: e.target.value }))}
                disabled={!!modalFields.is_fallback}
                placeholder="comma separated keywords"
                className="w-full min-h-[48px] resize-none file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-input rounded-md border px-3 py-2 bg-input-background text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">Pin Color</label>
              <input
                type="color"
                value={modalFields.editColor}
                onChange={(e) => setModalFields((m) => ({ ...m, editColor: e.target.value }))}
                className="w-16 h-10 p-0 border rounded"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm text-muted-foreground">Active</label>
              <Checkbox
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
