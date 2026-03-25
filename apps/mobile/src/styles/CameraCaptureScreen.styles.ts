import { StyleSheet } from 'react-native';
import { AppColors, colors } from './colors';

export const createCameraCaptureScreenStyles = (themeColors: AppColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: themeColors.background },

    header: {
      paddingTop: 14,
      paddingHorizontal: 16,
      paddingBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: { color: themeColors.textPrimary, fontSize: 18, fontWeight: '800' },
    closeBtn: {
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 10,
      backgroundColor: themeColors.surface,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    closeText: { color: themeColors.textPrimary, fontWeight: '700' },
    placeholder: { width: 32, height: 32 },

    permissionWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    permissionText: { color: themeColors.textMuted, marginBottom: 12, textAlign: 'center' },

    primaryBtn: {
      backgroundColor: themeColors.primary,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 14,
    },
    primaryBtnText: { color: '#fff', fontWeight: '800' },

    cameraWrap: { flex: 1 },
    camera: { flex: 1, marginHorizontal: 12 },
    controls: { padding: 14 },

    modeRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    modeLabelRow: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginBottom: 16 },
    modeLabelBtn: { paddingVertical: 6, paddingHorizontal: 4 },
    modeLabelText: { color: themeColors.textMuted, fontWeight: '700', fontSize: 12 },
    modeLabelActive: { color: themeColors.textPrimary },
    modeBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 14,
      backgroundColor: themeColors.surface,
      borderWidth: 1,
      borderColor: themeColors.border,
      alignItems: 'center',
    },
    modeBtnActive: { backgroundColor: themeColors.primarySoft, borderColor: themeColors.primary },
    modeBtnText: { color: themeColors.textPrimary, fontWeight: '800' },

    captureBtn: {
      backgroundColor: themeColors.primary,
      paddingVertical: 12,
      borderRadius: 16,
      alignItems: 'center',
    },
    captureBtnText: { color: '#fff', fontWeight: '900' },

    captureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    sideSpace: { width: 70, minHeight: 24, alignItems: 'center', justifyContent: 'center' },
    captureButtonContainer: { alignItems: 'center', justifyContent: 'center' },
    captureButtonOuter: {
      width: 78,
      height: 78,
      borderRadius: 39,
      borderWidth: 4,
      borderColor: '#ffffff',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.12)',
    },
    captureButtonInner: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: '#ffffff',
    },
    recordingOuter: {
      borderColor: '#ef4444',
    },
    recordingInner: {
      width: 32,
      height: 32,
      borderRadius: 6,
      backgroundColor: '#ef4444',
    },

    recordingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.55)',
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 4,
      gap: 6,
    },
    recordingDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#ef4444',
    },
    recordingText: {
      color: '#ffffff',
      fontWeight: '700',
      fontSize: 11,
    },
    zoomIndicator: {
      backgroundColor: 'rgba(0,0,0,0.55)',
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    zoomText: {
      color: '#ffffff',
      fontWeight: '700',
      fontSize: 12,
    },
    processingText: {
      color: themeColors.textMuted,
      fontSize: 11,
      fontWeight: '600',
    },

    videoRow: { flexDirection: 'row', gap: 10 },
    secondaryBtn: {
      paddingVertical: 12,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      backgroundColor: themeColors.surface,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    secondaryBtnText: { color: themeColors.textPrimary, fontWeight: '800' },
  });

const styles = createCameraCaptureScreenStyles(colors);

export { styles };
