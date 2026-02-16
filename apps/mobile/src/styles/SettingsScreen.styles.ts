import { StyleSheet } from 'react-native';

// Keep colors centralized so they match the existing dark theme.
export const TOKENS = {
  bg: '#020617',
  card: '#0F172A',
  cardBorder: '#1E293B',
  text: '#F9FAFB',
  mutedText: '#94A3B8',
  placeholder: '#64748B',
  primary: '#38BDF8',
  destructive: '#DC2626',
  overlay: 'rgba(0,0,0,0.45)',
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: TOKENS.bg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 28,
  },

  // Header
  headerCentered: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    color: TOKENS.text,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: TOKENS.mutedText,
  },

  // Card
  card: {
    backgroundColor: TOKENS.card,
    borderWidth: 1,
    borderColor: TOKENS.cardBorder,
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TOKENS.text,
  },
  cardBody: {
    marginTop: 12,
  },

  // Profile
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: TOKENS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#001018',
    fontWeight: '800',
    fontSize: 18,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: TOKENS.text,
  },
  profileEmail: {
    fontSize: 13,
    color: TOKENS.mutedText,
    marginTop: 2,
  },

  // Common rows
  separator: {
    height: 1,
    backgroundColor: TOKENS.cardBorder,
    marginVertical: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  metaLabel: {
    fontSize: 13,
    color: TOKENS.mutedText,
  },
  metaValue: {
    fontSize: 13,
    color: TOKENS.text,
  },

  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  navLabel: {
    fontSize: 14,
    color: TOKENS.text,
    fontWeight: '600',
  },
  navSubLabel: {
    marginTop: 2,
    fontSize: 12,
    color: TOKENS.mutedText,
  },
  pressed: {
    opacity: 0.7,
  },

  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowLabel: {
    fontSize: 14,
    color: TOKENS.text,
    fontWeight: '600',
  },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },

  // Buttons
  button: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonSm: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  buttonPrimary: {
    backgroundColor: TOKENS.primary,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: TOKENS.cardBorder,
  },
  buttonDestructive: {
    backgroundColor: TOKENS.destructive,
  },
  buttonText: {
    fontWeight: '800',
    fontSize: 14,
  },
  buttonTextSolid: {
    color: '#001018',
  },
  buttonTextOutline: {
    color: TOKENS.text,
  },

  // Inputs
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: TOKENS.mutedText,
  },
  input: {
    backgroundColor: '#0B1220',
    borderWidth: 1,
    borderColor: TOKENS.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: TOKENS.text,
  },

  errorBox: {
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
    borderColor: 'rgba(220, 38, 38, 0.35)',
    borderWidth: 1,
    padding: 10,
    borderRadius: 12,
    marginTop: 4,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 13,
    fontWeight: '700',
  },

  // Modals
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: TOKENS.overlay,
  },
  sheetWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  sheet: {
    backgroundColor: TOKENS.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: TOKENS.cardBorder,
  },
  sheetHeader: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: TOKENS.cardBorder,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: TOKENS.text,
  },
  sheetDesc: {
    marginTop: 6,
    fontSize: 13,
    color: TOKENS.mutedText,
    lineHeight: 18,
  },
  sheetBody: {
    padding: 14,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 10,
  },

  backdropSolid: {
    flex: 1,
    backgroundColor: TOKENS.overlay,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  confirmBox: {
    backgroundColor: TOKENS.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: TOKENS.cardBorder,
  },
});

export default styles;
