import React, { useMemo, useRef, useState } from 'react';
import { Pressable, Text, View, Animated, GestureResponderEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { createCameraCaptureScreenStyles } from '../styles/CameraCaptureScreen.styles';
import { showToast } from '../utils/toast';
import { attachLocalMediaToObservation } from '../services/CameraMediaService';
import { useDraftJourneys } from '../hooks/useDraftJourneys';
import { useTheme } from '../contexts/ThemeContext';

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
  const { colors } = useTheme();
  const styles = useMemo(() => createCameraCaptureScreenStyles(colors), [colors]);
  const params = useLocalSearchParams<{
    observationId?: string | string[];
    secondsElapsed?: string | string[];
  }>();
  const observationId = normalizeParam(params.observationId);
  const secondsElapsed = Number(normalizeParam(params.secondsElapsed) ?? '0');
  const { markObservationHasMedia } = useDraftJourneys();

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const [mode, setMode] = useState<Mode>('picture');
  const [_busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [zoom, setZoom] = useState(0);
  const [switching, setSwitching] = useState(false);

  // Animation for capture button press - using useMemo instead of useRef().current
  const scaleAnim = useMemo(() => new Animated.Value(1), []);

  // Animation for recording pulse
  const pulseAnim = useMemo(() => new Animated.Value(1), []);

  // Animation for camera fade during mode switching
  const cameraOpacity = useMemo(() => new Animated.Value(1), []);

  const cameraRef = useRef<CameraView>(null);

  // Pinch-to-zoom tracking
  const initialDistance = useRef<number>(0);
  const initialZoom = useRef<number>(0);

  // Track if recording was cancelled (X button) vs completed normally (stop button)
  const recordingCancelled = useRef<boolean>(false);

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
        setBusy(false);
        setProcessing(false);
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

      markObservationHasMedia(observationId, secondsElapsed, 'photo');

      showToast('Photo attached');

      // Clean up state BEFORE navigating back
      setBusy(false);
      setProcessing(false);

      router.back();
    } catch (e) {
      console.warn(e);
      showToast('Photo failed');
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
      recordingCancelled.current = false;

      const vid = await cameraRef.current?.recordAsync();

      stopPulseAnimation();
      setRecording(false);

      if (recordingCancelled.current) {
        console.log('[Camera] Recording cancelled, not saving video');
        setBusy(false);
        return;
      }

      setProcessing(true);

      if (!vid?.uri) {
        showToast('No video recorded.');
        setBusy(false);
        setProcessing(false);
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

      markObservationHasMedia(observationId, secondsElapsed, 'video');

      showToast('Video attached');

      // Clean up state BEFORE navigating back
      setRecording(false);
      setBusy(false);
      setProcessing(false);
      recordingCancelled.current = false;

      router.back();
    } catch (e) {
      console.warn(e);
      showToast('Video failed');
      stopPulseAnimation();
      setRecording(false);
      setBusy(false);
      setProcessing(false);
      recordingCancelled.current = false;
    }
  }

  function stopVideo() {
    try {
      console.log('[Camera] Stopping video recording...');
      cameraRef.current?.stopRecording();
      // Note: cleanup happens in startVideo after recordAsync resolves
    } catch (e) {
      console.warn('Stop recording error:', e);
    }
  }

  function cancelVideo() {
    try {
      console.log('[Camera] Cancelling video recording...');
      recordingCancelled.current = true; // Mark as cancelled
      cameraRef.current?.stopRecording();
      // Note: startVideo will check recordingCancelled and skip processing
    } catch (e) {
      console.warn('Cancel recording error:', e);
    }
  }

  // Pinch-to-zoom helpers
  function getDistance(touches: { pageX: number; pageY: number }[]) {
    if (touches.length < 2) return 0;
    const [touch1, touch2] = touches;
    const dx = touch1.pageX - touch2.pageX;
    const dy = touch1.pageY - touch2.pageY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function handlePinchStart(event: GestureResponderEvent) {
    if (event.nativeEvent.touches.length === 2) {
      const distance = getDistance(event.nativeEvent.touches);
      initialDistance.current = distance;
      initialZoom.current = zoom;
    }
  }

  function handlePinchMove(event: GestureResponderEvent) {
    if (event.nativeEvent.touches.length === 2 && initialDistance.current > 0) {
      const currentDistance = getDistance(event.nativeEvent.touches);
      const scale = currentDistance / initialDistance.current;
      const sensitivity = 0.5;
      let newZoom = initialZoom.current + (scale - 1) * sensitivity;
      newZoom = Math.max(0, Math.min(1, newZoom));
      setZoom(newZoom);
    }
  }

  function handlePinchEnd() {
    initialDistance.current = 0;
  }

  function handleModeSwitch(newMode: Mode) {
    if (newMode === mode) return; // Already in this mode
    setSwitching(true);

    // Fade out camera
    Animated.timing(cameraOpacity, {
      toValue: 0.4,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      // Switch mode while faded
      setMode(newMode);
      setZoom(0); // ✅ Reset zoom when switching modes

      // Fade back in
      Animated.timing(cameraOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setSwitching(false);
      });
    });
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            // Don't allow closing while processing (video is being saved)
            if (processing) {
              showToast('Saving media...');
              return;
            }
            // If recording, cancel it and stay on camera screen
            if (recording) {
              cancelVideo();
              showToast('Recording cancelled');
              return; // Stay on camera screen
            }
            // Not recording - close camera screen
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
          {/* Camera View with pinch-to-zoom and fade effect */}
          <Animated.View
            style={[{ flex: 1, marginHorizontal: 12 }, { opacity: cameraOpacity }]}
            onTouchStart={handlePinchStart}
            onTouchMove={handlePinchMove}
            onTouchEnd={handlePinchEnd}
          >
            <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" mode={mode} zoom={zoom} />

            {/* Blur overlay during mode switching */}
            {switching && (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                }}
              />
            )}
          </Animated.View>

          {/* Bottom Controls */}
          <View style={styles.controls}>
            {/* Mode Labels */}
            <View style={styles.modeLabelRow}>
              <Pressable
                onPress={() => handleModeSwitch('picture')}
                disabled={recording || processing || switching}
                style={[styles.modeLabelBtn, switching && { opacity: 0.5 }]}
              >
                <Text style={[styles.modeLabelText, mode === 'picture' && styles.modeLabelActive]}>
                  PHOTO
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleModeSwitch('video')}
                disabled={recording || processing || switching}
                style={[styles.modeLabelBtn, switching && { opacity: 0.5 }]}
              >
                <Text style={[styles.modeLabelText, mode === 'video' && styles.modeLabelActive]}>
                  VIDEO
                </Text>
              </Pressable>
            </View>

            {/* Capture Buttons */}
            <View style={styles.captureRow}>
              {/* Left spacer with zoom indicator */}
              <View style={styles.sideSpace}>
                {zoom > 0 && (
                  <View style={styles.zoomIndicator}>
                    <Text style={styles.zoomText}>{(zoom * 10).toFixed(1)}x</Text>
                  </View>
                )}
              </View>

              {/* Main Capture Button */}
              <Pressable
                disabled={processing || switching}
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
