import React, { useMemo, useRef, useState } from 'react';
import { Pressable, Text, View, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { styles } from '../styles/CameraCaptureScreen.styles';
import { showToast } from '../utils/toast';
import { attachLocalMediaToObservation } from '../services/CameraMediaService';
import { useDraftJourneys } from '../hooks/useDraftJourneys';

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
  const { markObservationHasMedia } = useDraftJourneys();

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const [mode, setMode] = useState<Mode>('picture');
  const [_busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Animation for capture button press
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Animation for recording pulse
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const cameraRef = useRef<CameraView>(null);

  const canUseCamera = useMemo(() => cameraPermission?.granted === true, [cameraPermission]);

  // Animate button press
  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Start recording pulse animation
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Stop recording pulse animation
  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

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
      setProcessing(true);
      animatePress();

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

      markObservationHasMedia(observationId);

      showToast('Photo attached');
      router.back();
    } catch (e) {
      console.warn(e);
      showToast('Photo failed');
    } finally {
      setBusy(false);
      setProcessing(false);
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
      setRecording(true);
      setBusy(true);
      startPulseAnimation();

      // Start recording (this will wait until stopRecording is called)
      const vid = await cameraRef.current?.recordAsync();

      // Recording has stopped, now process the video
      stopPulseAnimation();
      setRecording(false);
      setProcessing(true);

      if (!vid?.uri) {
        showToast('No video recorded.');
        return;
      }

      const { destUri, size } = await persistToDocuments(
        vid.uri,
        `obs_${observationId}_${Date.now()}.mp4`
      );

      await attachLocalMediaToObservation({
        observationId,
        localUri: destUri,
        type: 'video',
        fileSize: size,
      });

      markObservationHasMedia(observationId);

      showToast('Video attached');
      router.back();
    } catch (e) {
      console.warn(e);
      showToast('Video failed');
      stopPulseAnimation();
    } finally {
      setRecording(false);
      setBusy(false);
      setProcessing(false);
    }
  }

  function stopVideo() {
    try {
      console.log('[Camera] Stopping video recording...');
      cameraRef.current?.stopRecording();
      // Note: cleanup happens in startVideo's finally block after recordAsync resolves
    } catch (e) {
      console.warn('Stop recording error:', e);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            // If recording, stop it first
            if (recording) {
              stopVideo();
            }
            // Go back to previous screen (journey screen)
            router.back();
          }}
          style={styles.closeBtn}
        >
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
        <Text style={styles.title}>Camera</Text>
        <View style={styles.placeholder} />
      </View>

      {!canUseCamera ? (
        <View style={styles.permissionWrap}>
          <Text style={styles.permissionText}>Camera access is required.</Text>
          <Pressable onPress={requestCameraPermission} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Grant Permission</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.cameraWrap}>
          {/* Camera View */}
          <CameraView ref={cameraRef} style={styles.camera} facing="back" mode={mode} />

          {/* Bottom Controls */}
          <View style={styles.controls}>
            {/* Mode Labels */}
            <View style={styles.modeLabelRow}>
              <Pressable
                onPress={() => setMode('picture')}
                disabled={recording || processing}
                style={styles.modeLabelBtn}
              >
                <Text style={[styles.modeLabelText, mode === 'picture' && styles.modeLabelActive]}>
                  PHOTO
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setMode('video')}
                disabled={recording || processing}
                style={styles.modeLabelBtn}
              >
                <Text style={[styles.modeLabelText, mode === 'video' && styles.modeLabelActive]}>
                  VIDEO
                </Text>
              </Pressable>
            </View>

            {/* Capture Buttons */}
            <View style={styles.captureRow}>
              {/* Left spacer */}
              <View style={styles.sideSpace} />

              {/* Main Capture Button */}
              <Pressable
                disabled={processing}
                onPress={mode === 'picture' ? takePhoto : recording ? stopVideo : startVideo}
                style={styles.captureButtonContainer}
              >
                <Animated.View
                  style={[
                    styles.captureButtonOuter,
                    mode === 'video' && recording && styles.recordingOuter,
                    { transform: [{ scale: mode === 'picture' ? scaleAnim : pulseAnim }] },
                  ]}
                >
                  <View
                    style={[
                      styles.captureButtonInner,
                      mode === 'video' && recording && styles.recordingInner,
                    ]}
                  />
                </Animated.View>
              </Pressable>

              {/* Right side - Mode indicator */}
              <View style={styles.sideSpace}>
                {mode === 'video' && recording && (
                  <View style={styles.recordingIndicator}>
                    <View style={styles.recordingDot} />
                    <Text style={styles.recordingText}>REC</Text>
                  </View>
                )}
                {processing && <Text style={styles.processingText}>Saving...</Text>}
              </View>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
