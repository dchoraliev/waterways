import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },

  // Header
  header: {
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '300',
  },
  placeholder: {
    width: 32,
  },

  // Permission
  permissionWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#000000',
  },
  permissionText: {
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16,
  },

  primaryBtn: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },

  // Camera
  cameraWrap: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
    borderRadius: 0,
  },

  // Controls
  controls: {
    paddingBottom: 40,
    paddingTop: 20,
    paddingHorizontal: 20,
    backgroundColor: '#000000',
  },

  // Mode Labels (PHOTO/VIDEO text above buttons)
  modeLabelRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    gap: 40,
  },
  modeLabelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modeLabelText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  modeLabelActive: {
    color: '#FFD60A',
  },

  // Capture Row (main button area)
  captureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },

  sideSpace: {
    width: 60,
    alignItems: 'center',
  },

  // Main Capture Button (iPhone-style)
  captureButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
  },

  // Recording state styles
  recordingOuter: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    borderColor: '#EF4444',
  },
  recordingInner: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#EF4444',
  },

  // Recording indicator (REC text + dot)
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  recordingText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Processing indicator
  processingText: {
    color: '#FFD60A',
    fontSize: 12,
    fontWeight: '600',
  },
});
