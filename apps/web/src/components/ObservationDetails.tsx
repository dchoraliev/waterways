import { Observation } from '../types/observation';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { Calendar, Clock, MapPin, User, X, UserX, Trash2, Filter, Trash } from 'lucide-react';
import { ImageWithFallback } from './ImageWithFallback';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface ObservationDetailsProps {
  observation: Observation | null;
  open: boolean;
  onClose: () => void;
  onDeleteObservation?: (observationId: string) => void;
  onDeleteAllUserObservations?: (userId: string) => void;
  onFilterByUser?: (userId: string) => void;
  onBanUser?: (userId: string) => void;
}

export function ObservationDetails({
  observation,
  open,
  onClose,
  onDeleteObservation,
  onDeleteAllUserObservations,
  onFilterByUser,
  onBanUser,
}: ObservationDetailsProps) {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin || false;

  if (!observation || !open) return null;

  const handleBanUser = () => {
    if (window.confirm(`Are you sure you want to ban ${observation.observerName}?`)) {
      onBanUser?.(observation.userId);
      // Only show the specific user banned toast
      toast.success(`User ${observation.observerName} has been banned`);
      onClose();
    }
  };

  const handleDeletePost = () => {
    if (window.confirm('Are you sure you want to delete this observation?')) {
      onDeleteObservation?.(observation.id);
      onClose();
    }
  };

  const handleFilterByUser = () => {
    onFilterByUser?.(observation.userId);
    toast.success(`Filtering observations by ${observation.observerName}`);
    onClose();
  };

  const handleDeleteAllUserPosts = () => {
    if (
      window.confirm(
        `Are you sure you want to delete ALL observations by ${observation.observerName}? This action cannot be undone.`
      )
    ) {
      onDeleteAllUserObservations?.(observation.userId);
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-[1000]" onClick={onClose} />

      {/* Side panel */}
      <div className="fixed left-4 top-4 bottom-4 w-[400px] bg-white rounded-lg shadow-2xl z-[1001] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="font-semibold text-lg text-neutral-950">{observation.location.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {observation.type} recorded by {observation.observerName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg size-9 hover:bg-gray-100 transition-colors flex items-center justify-center shrink-0 ml-2"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Admin Actions */}
        {isAdmin && (
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <p className="text-xs text-muted-foreground mb-2">Admin Actions</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleFilterByUser}
                className="w-full justify-start"
              >
                <Filter className="size-4 mr-2" />
                Filter by User
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDeletePost}
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="size-4 mr-2" />
                Delete Post
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDeleteAllUserPosts}
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash className="size-4 mr-2" />
                Delete All Posts
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleBanUser}
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <UserX className="size-4 mr-2" />
                Ban User
              </Button>
            </div>
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{observation.type}</Badge>
            {observation.keywords.map((keyword) => (
              <Badge key={keyword} variant="outline">
                {keyword}
              </Badge>
            ))}
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Calendar className="size-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="text-sm">{observation.date}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Clock className="size-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="text-sm">{observation.timestamp}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <User className="size-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Observer</p>
                <p className="text-sm">{observation.observerName}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="size-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="text-sm">{observation.location.name}</p>
                <p className="text-xs text-muted-foreground">
                  {observation.location.lat.toFixed(4)}, {observation.location.lng.toFixed(4)}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-medium mb-2">Project</h3>
            <p className="text-sm">{observation.projectName}</p>
          </div>

          <div>
            <h3 className="font-medium mb-2">Observation</h3>
            <p className="text-sm">{observation.observation}</p>
          </div>

          {observation.photos.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Media</h3>
              <div className="space-y-2">
                {observation.photos.map((photo, index) => (
                  <ImageWithFallback
                    key={index}
                    src={photo}
                    alt={`Observation photo ${index + 1}`}
                    className="rounded-lg object-cover w-full h-48"
                  />
                ))}
              </div>
            </div>
          )}

          {observation.videos.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Videos</h3>
              <div className="space-y-2">
                {observation.videos.map((_, index) => (
                  <div key={index} className="text-sm text-muted-foreground">
                    Video clip {index + 1}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
