import { Observation } from '../types/observation';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { Calendar, Clock, MapPin, User, X, UserX, Trash2, Trash } from 'lucide-react';
import { ImageWithFallback } from './ImageWithFallback';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

interface ObservationDetailsProps {
  observation: Observation | null;
  open: boolean;
  onClose: () => void;
  showBackdrop?: boolean;
  onDeleteObservation?: (observationId: string) => void;
  onDeleteAllUserObservations?: (userId: string) => void;
  onBanUser?: (userId: string) => void;
}

export function ObservationDetails({
  observation,
  open,
  onClose,
  showBackdrop = false,
  onDeleteObservation,
  onDeleteAllUserObservations,
  onBanUser,
}: Readonly<ObservationDetailsProps>) {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin || false;

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioMimeType, setAudioMimeType] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let objectUrl: string | null = null;

    async function downloadAudioFromSignedUrl(
      signedUrl: string,
      fallbackMimeType: string | null
    ): Promise<string> {
      const resp = await globalThis.fetch(signedUrl);

      if (!resp.ok) {
        throw new Error(`Failed to download audio. Status: ${resp.status}`);
      }

      const downloadedBlob = await resp.blob();
      const responseMimeType = resp.headers.get('content-type')?.split(';')[0] ?? null;
      const effectiveMimeType = responseMimeType || downloadedBlob.type || fallbackMimeType;

      // Some browsers are stricter when playing blob URLs. If the fetched blob has
      // no type, recreate it with the mime_type saved in audio_recordings.
      const playableBlob = effectiveMimeType
        ? new globalThis.Blob([downloadedBlob], { type: effectiveMimeType })
        : downloadedBlob;

      if (mounted) {
        setAudioMimeType(effectiveMimeType);
      }

      return globalThis.URL.createObjectURL(playableBlob);
    }

    async function loadAudioFromId() {
      const audioRecordingId = observation?.audioRecordingId;

      setAudioUrl(null);
      setAudioMimeType(null);
      setAudioError(null);

      if (!open || !observation || !audioRecordingId) {
        setAudioLoading(false);
        return;
      }

      setAudioLoading(true);

      try {
        const { data: audioRow, error: audioRowError } = await supabase
          .from('audio_recordings')
          .select('file_path, bucket, mime_type')
          .eq('id', audioRecordingId)
          .maybeSingle();

        if (audioRowError || !audioRow?.file_path) {
          throw audioRowError ?? new Error('Audio metadata is missing.');
        }

        const bucketName = audioRow.bucket || 'Audios';

        const { data: signed, error: signedError } = await supabase.storage
          .from(bucketName)
          .createSignedUrl(audioRow.file_path, 60 * 60);

        if (signedError || !signed?.signedUrl) {
          throw signedError ?? new Error('Could not create signed audio URL.');
        }

        objectUrl = await downloadAudioFromSignedUrl(signed.signedUrl, audioRow.mime_type ?? null);

        if (mounted) {
          setAudioUrl(objectUrl);
        }
      } catch (err) {
        console.warn('Failed to load observation audio:', err);

        if (mounted) {
          setAudioUrl(null);
          setAudioMimeType(null);
          setAudioError('You do not have access to this audio recording.');
        }
      } finally {
        if (mounted) {
          setAudioLoading(false);
        }
      }
    }

    loadAudioFromId();

    return () => {
      mounted = false;

      if (objectUrl) {
        globalThis.URL.revokeObjectURL(objectUrl);
      }
    };
  }, [open, observation]);

  const hasAudio = Boolean(observation?.audioRecordingId);
  const hasMedia = (observation?.photos?.length ?? 0) > 0 || (observation?.videos?.length ?? 0) > 0;

  if (!observation || !open) return null;

  const handleBanUser = () => {
    if (globalThis.confirm(`Are you sure you want to ban ${observation.observerName}?`)) {
      onBanUser?.(observation.userId);
      // Only show the specific user banned toast
      toast.success(`User ${observation.observerName} has been banned`);
      onClose();
    }
  };

  const handleDeletePost = () => {
    if (globalThis.confirm('Are you sure you want to delete this observation?')) {
      onDeleteObservation?.(observation.id);
      onClose();
    }
  };

  const handleDeleteAllUserPosts = () => {
    if (
      globalThis.confirm(
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
      {showBackdrop && (
        <button
          type="button"
          aria-label="Close observation details"
          className="fixed inset-0 bg-black/50 z-[1000]"
          onClick={onClose}
        />
      )}

      {/* Side panel */}
      <div
        data-observation-details-panel="true"
        className="fixed left-4 top-4 bottom-4 w-[400px] bg-white rounded-lg shadow-2xl z-[1001] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="font-semibold text-lg text-neutral-950">{observation.type}</h2>
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
          {observation.tripId && (
            <div className="flex items-start gap-2">
              <MapPin className="size-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Journey ID</p>
                <p className="text-sm font-mono">{observation.tripId}</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <Calendar className="size-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="text-sm">
                  {(() => {
                    const [year, month, day] = observation.date.split('-');
                    return `${month}/${day}/${year}`;
                  })()}
                </p>
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
                <p className="text-sm">
                  {observation.location.lat.toFixed(4)}, {observation.location.lng.toFixed(4)}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {observation.projectName &&
            observation.projectName.toLowerCase() !== 'untitled project' && (
              <div>
                <h3 className="font-medium mb-2">Project</h3>
                <p className="text-sm">{observation.projectName}</p>
              </div>
            )}

          <div>
            <h3 className="font-medium mb-2">Description</h3>
            <p className="text-sm">{observation.observation}</p>
          </div>

          {hasAudio && (
            <div>
              <h3 className="font-medium mb-2">Audio Recording</h3>

              {audioLoading && <p className="text-sm text-muted-foreground">Loading audio...</p>}

              {audioError && <p className="text-sm text-red-600">{audioError}</p>}

              {audioUrl && !audioError && (
                <audio
                  key={audioUrl}
                  src={audioUrl}
                  controls
                  preload="metadata"
                  className="w-full"
                  onError={(event) => {
                    console.warn('Audio element failed to load/play:', {
                      error: event.currentTarget.error,
                      audioMimeType,
                    });
                    setAudioError(
                      'This audio file could not be played. Your browser may not support this audio format.'
                    );
                  }}
                >
                  Your browser does not support audio playback.
                </audio>
              )}
            </div>
          )}

          {hasMedia && (
            <div>
              <h3 className="font-medium mb-2">Media</h3>
              <div className="space-y-2">
                {observation.photos.map((photo, index) => (
                  <ImageWithFallback
                    key={`${photo}-${index}`}
                    src={photo}
                    alt={`Observation photo ${index + 1}`}
                    className="rounded-lg object-cover w-full h-48"
                  />
                ))}
                {observation.videos.map((video, index) => (
                  <video
                    key={`${video}-${index}`}
                    controls
                    preload="metadata"
                    className="rounded-lg w-full h-48 bg-black"
                  >
                    <source src={video} />
                    Your browser does not support this video format.
                  </video>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
