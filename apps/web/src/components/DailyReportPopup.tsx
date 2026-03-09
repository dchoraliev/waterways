import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Badge } from './ui/badge';
import { fetchDailyObservations } from '../api/observations';
import { Observation } from '../types/observation';
import { Clock, MapPin, User, FileText, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface DailyReportPopupProps {
  open: boolean;
  onClose: () => void;
  selectedUserId?: string | null;
}

export function DailyReportPopup({ open, onClose, selectedUserId = null }: DailyReportPopupProps) {
  const { user, refreshSession } = useAuth();
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const filteredUserId = user?.isAdmin ? (selectedUserId ?? undefined) : undefined;

  const loadDailyObservations = useCallback(
    async (refreshAuth = false) => {
      setLoading(true);
      setError(null);
      try {
        if (refreshAuth) {
          await refreshSession();
        }

        const data = await fetchDailyObservations({ userId: filteredUserId });
        setObservations(data);
      } catch (err) {
        console.error('Failed to load daily observations:', err);
        setError('Failed to load observations. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [filteredUserId, refreshSession]
  );

  useEffect(() => {
    if (open) {
      void loadDailyObservations(true);
    }
  }, [loadDailyObservations, open]);

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

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Clock className="size-5 text-blue-600" />
            Daily Report
          </DialogTitle>
          <DialogDescription>Observations added in the last 24 hours</DialogDescription>
          {filteredUserId && (
            <p className="text-sm text-muted-foreground">Filtered to the selected user</p>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-blue-600" />
              <span className="ml-3 text-muted-foreground">Loading observations...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-12 text-red-600">
              <p>{error}</p>
              <button
                onClick={() => void loadDailyObservations(true)}
                className="mt-2 text-blue-600 hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && observations.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="size-12 mx-auto mb-3 opacity-50" />
              <p>No observations added in the last 24 hours</p>
            </div>
          )}

          {!loading && !error && observations.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground px-1 mb-4">
                {observations.length} observation{observations.length !== 1 ? 's' : ''} found
              </div>

              {observations.map((obs) => (
                <div
                  key={obs.id}
                  className="bg-white border rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  {/* Header row: time and type */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="size-4" />
                      <span>{obs.timestamp}</span>
                      <span className="text-gray-300">•</span>
                      <span>{formatTimeAgo(obs.createdAt)}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {obs.type}
                    </Badge>
                  </div>

                  {/* Observation text */}
                  <p className="text-sm text-gray-800 mb-3 line-clamp-2">
                    {obs.observation || 'No observation text'}
                  </p>

                  {/* Footer row: observer and project */}
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

                  {/* Keywords/categories */}
                  {obs.keywords.length > 1 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {obs.keywords.slice(1, 4).map((keyword, idx) => (
                        <span
                          key={idx}
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
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer summary */}
        {!loading && !error && observations.length > 0 && (
          <div className="pt-4 border-t text-center text-sm text-muted-foreground">
            Showing all observations from{' '}
            {new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString()} to{' '}
            {new Date().toLocaleDateString()}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
