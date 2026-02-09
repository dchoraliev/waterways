import React, { useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy'; // Use legacy API during transition
import { useLocalSearchParams, useRouter } from 'expo-router';

import { styles } from '../styles/CameraCaptureScreen.styles';
import { showToast } from '../utils/toast';
import { attachLocalMediaToObservation } from '../services/CameraMediaService';

type Mode = 'picture' | 'video';

function normalizeParam(value: string | string[] | undefined): string | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

async function persistToDocuments(srcUri: string, fileName: string) {
  const destUri = `${FileSystem.documentDirectory}${fileName}`;

  await FileSystem.copyAsync({ from: srcUri, to: destUri });

  const info = await FileSystem.getInfoAsync(destUri);
  const size = info.exists && 'size' in info ? info.size : null;

  return { destUri, size };
}

export default function CameraCaptureScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ observationId?: string | string[] }>();
  const observationId = normalizeParam(params.observationId);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const [mode, setMode] = useState<Mode>('picture');
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);

  const cameraRef = useRef<CameraView>(null);

  const canUseCamera = useMemo(() => cameraPermission?.granted === true, [cameraPermission]);

  async function ensureCameraPermission() {
    if (cameraPermission?.granted) return true;
    const res = await requestCameraPermission();
    return res.granted;
  }

  async function ensureMicPermission() {
    if (micPermission?.granted) return true;
    const res = await requestMicPermission();
    return res.granted;
  }

  async function takePhoto() {
    if (!observationId) {
      showToast('No observation selected.');
      return;
    }

    const ok = await ensureCameraPermission();
    if (!ok) {
      showToast('Camera permission denied.');
      return;
    }

    try {
      setBusy(true);

      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.9 });
      if (!photo?.uri) {
        showToast('Failed to take photo.');
        return;
      }

      const { destUri, size } = await persistToDocuments(
        photo.uri,
        `obs_${observationId}_${Date.now()}.jpg`
      );

      await attachLocalMediaToObservation({
        observationId,
        localUri: destUri,
        type: 'photo',
        fileSize: size,
      });

      showToast('Photo attached');
      router.back();
    } catch (e) {
      console.warn(e);
      showToast('Photo failed');
    } finally {
      setBusy(false);
    }
  }

  async function startVideo() {
    if (!observationId) {
      showToast('No observation selected.');
      return;
    }

    const camOk = await ensureCameraPermission();
    if (!camOk) {
      showToast('Camera permission denied.');
      return;
    }

    const micOk = await ensureMicPermission();
    if (!micOk) {
      showToast('Microphone permission denied.');
      return;
    }

    try {
      setBusy(true);
      setRecording(true);

      const video = await cameraRef.current?.recordAsync({ maxDuration: 30 });

      if (!video?.uri) {
        showToast('No video captured.');
        return;
      }

      const { destUri, size } = await persistToDocuments(
        video.uri,
        `obs_${observationId}_${Date.now()}.mp4`
      );

      await attachLocalMediaToObservation({
        observationId,
        localUri: destUri,
        type: 'video',
        fileSize: size,
      });

      showToast('Video attached');
      router.back();
    } catch (e) {
      console.warn(e);
      showToast('Video failed');
    } finally {
      setRecording(false);
      setBusy(false);
    }
  }

  function stopVideo() {
    try {
      cameraRef.current?.stopRecording();
    } catch (e) {
      console.warn('Stop recording error:', e);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Capture</Text>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Text style={styles.closeText}>Close</Text>
        </Pressable>
      </View>

      {!canUseCamera ? (
        <View style={styles.permissionWrap}>
          <Text style={styles.permissionText}>Camera access is required.</Text>
          <Pressable onPress={requestCameraPermission} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Grant permission</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.cameraWrap}>
          <CameraView ref={cameraRef} style={styles.camera} facing="back" mode={mode} />

          <View style={styles.controls}>
            <View style={styles.modeRow}>
              <Pressable
                onPress={() => setMode('picture')}
                style={[styles.modeBtn, mode === 'picture' ? styles.modeBtnActive : null]}
                disabled={busy || recording}
              >
                <Text style={styles.modeBtnText}>Photo</Text>
              </Pressable>
              <Pressable
                onPress={() => setMode('video')}
                style={[styles.modeBtn, mode === 'video' ? styles.modeBtnActive : null]}
                disabled={busy || recording}
              >
                <Text style={styles.modeBtnText}>Video</Text>
              </Pressable>
            </View>

            {mode === 'picture' ? (
              <Pressable
                disabled={busy || recording}
                onPress={takePhoto}
                style={[styles.captureBtn, busy || recording ? { opacity: 0.6 } : null]}
              >
                <Text style={styles.captureBtnText}>{busy ? 'Working…' : 'Take Photo'}</Text>
              </Pressable>
            ) : (
              <View style={styles.videoRow}>
                <Pressable
                  disabled={busy}
                  onPress={startVideo}
                  style={[styles.captureBtn, busy ? { opacity: 0.6 } : null]}
                >
                  <Text style={styles.captureBtnText}>
                    {recording ? 'Recording…' : busy ? 'Working…' : 'Start Video'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={stopVideo}
                  style={[styles.secondaryBtn, !recording ? { opacity: 0.6 } : null]}
                  disabled={!recording}
                >
                  <Text style={styles.secondaryBtnText}>Stop</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
