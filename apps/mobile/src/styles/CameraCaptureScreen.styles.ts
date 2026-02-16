import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0B1220' },

  header: {
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  closeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#1E2A3A',
  },
  closeText: { color: 'rgba(255,255,255,0.85)', fontWeight: '700' },

  permissionWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  permissionText: { color: 'rgba(255,255,255,0.8)', marginBottom: 12, textAlign: 'center' },

  primaryBtn: {
    backgroundColor: '#2F80ED',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  primaryBtnText: { color: '#fff', fontWeight: '800' },

  cameraWrap: { flex: 1 },
  camera: { flex: 1, marginHorizontal: 12 },
  controls: { padding: 14 },

  modeRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#1E2A3A',
    alignItems: 'center',
  },
  modeBtnActive: { backgroundColor: '#2B3D57' },
  modeBtnText: { color: 'rgba(255,255,255,0.85)', fontWeight: '800' },

  captureBtn: {
    backgroundColor: '#2F80ED',
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  captureBtnText: { color: '#fff', fontWeight: '900' },

  videoRow: { flexDirection: 'row', gap: 10 },
  secondaryBtn: {
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    backgroundColor: '#1E2A3A',
  },
  secondaryBtnText: { color: 'rgba(255,255,255,0.85)', fontWeight: '800' },
});
