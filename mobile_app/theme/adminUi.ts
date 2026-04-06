import type { TextStyle, ViewStyle } from 'react-native';

export const ADMIN_COLORS = {
  background: '#ffffff',
  surface: '#ffffff',
  surfaceMuted: '#f8fafc',
  surfaceTint: '#fff7ed',
  surfaceTintStrong: '#ffedd5',
  navyTint: '#f8fafc',
  navyTintStrong: '#e2e8f0',
  border: '#e2e8f0',
  line: '#f1f5f9',
  text: '#0f172a',
  secondaryText: '#64748b',
  tertiaryText: '#94a3b8',
  primary: '#0f172a',
  accent: '#f97316',
  accentStrong: '#ea580c',
  success: '#16a34a',
  warning: '#f59e0b',
  danger: '#dc2626',
  info: '#2563eb',
} as const;

export const ADMIN_SHADOW: ViewStyle = {
  shadowColor: '#0f172a',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.04,
  shadowRadius: 18,
  elevation: 2,
};

export const ADMIN_CARD: ViewStyle = {
  backgroundColor: ADMIN_COLORS.surface,
  borderWidth: 1,
  borderColor: ADMIN_COLORS.border,
  borderRadius: 16,

};

export const ADMIN_SECTION_CARD: ViewStyle = {
  ...ADMIN_CARD,
  padding: 16,
};

export const ADMIN_STAT_CARD: ViewStyle = {
  ...ADMIN_CARD,
  borderRadius: 14,
  padding: 14,
};

export const ADMIN_LIST_CARD: ViewStyle = {
  ...ADMIN_CARD,
  padding: 16,
};

export const ADMIN_MODAL_SECTION: ViewStyle = {
  ...ADMIN_CARD,
  padding: 16,
  gap: 12,
};

const INPUT_SHARED = {
  backgroundColor: ADMIN_COLORS.surfaceMuted,
  borderWidth: 1,
  borderColor: ADMIN_COLORS.border,
  borderRadius: 12,
  paddingHorizontal: 14,
  paddingVertical: 12,
};

export const ADMIN_INPUT_SURFACE: ViewStyle = {
  ...INPUT_SHARED,
};

export const ADMIN_INPUT_FIELD: TextStyle = {
  ...INPUT_SHARED,
};

export const ADMIN_MODAL_HEADER: ViewStyle = {
  borderBottomWidth: 1,
  borderBottomColor: ADMIN_COLORS.border,
};

export const ADMIN_PAGE_TITLE: TextStyle = {
  fontSize: 28,
  fontWeight: '700',
  color: ADMIN_COLORS.text,
};

export const ADMIN_PAGE_SUBTITLE: TextStyle = {
  fontSize: 14,
  color: ADMIN_COLORS.secondaryText,
};

export const ADMIN_SECTION_TITLE: TextStyle = {
  fontSize: 18,
  fontWeight: '700',
  color: ADMIN_COLORS.text,
};

export const ADMIN_SECTION_SUBTITLE: TextStyle = {
  fontSize: 13,
  color: ADMIN_COLORS.secondaryText,
};

export const ADMIN_DETAIL_ROW: ViewStyle = {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  paddingVertical: 12,
  borderBottomWidth: 1,
  borderBottomColor: ADMIN_COLORS.line,
};

export const ADMIN_DETAIL_LABEL: TextStyle = {
  fontSize: 14,
  color: ADMIN_COLORS.secondaryText,
};

export const ADMIN_DETAIL_VALUE: TextStyle = {
  flexShrink: 1,
  textAlign: 'right',
  fontSize: 14,
  fontWeight: '600',
  color: ADMIN_COLORS.text,
};

export const ADMIN_PRIMARY_BUTTON: ViewStyle = {
  minHeight: 48,
  borderRadius: 12,
  paddingVertical: 14,
  paddingHorizontal: 16,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: ADMIN_COLORS.primary,
};

export const ADMIN_PRIMARY_BUTTON_DISABLED: ViewStyle = {
  backgroundColor: '#94a3b8',
};

export const ADMIN_SECONDARY_BUTTON: ViewStyle = {
  minHeight: 48,
  borderRadius: 12,
  paddingVertical: 14,
  paddingHorizontal: 16,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: ADMIN_COLORS.surfaceMuted,
  borderWidth: 1,
  borderColor: ADMIN_COLORS.border,
};

export const ADMIN_BUTTON_CONTENT: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
};

export const ADMIN_BUTTON_TEXT: TextStyle = {
  color: '#ffffff',
  fontSize: 16,
  fontWeight: '600',
};

export const ADMIN_SECONDARY_BUTTON_TEXT: TextStyle = {
  color: ADMIN_COLORS.text,
  fontSize: 16,
  fontWeight: '600',
};

export const ADMIN_DANGER_OUTLINE_BUTTON: ViewStyle = {
  minHeight: 52,
  borderRadius: 16,
  paddingVertical: 14,
  paddingHorizontal: 16,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: ADMIN_COLORS.surface,
  borderWidth: 1,
  borderColor: '#fecaca',
};

export const ADMIN_DANGER_OUTLINE_TEXT: TextStyle = {
  color: ADMIN_COLORS.danger,
  fontSize: 16,
  fontWeight: '700',
};

export const ADMIN_GRID_2X2: ViewStyle = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  marginHorizontal: -6,
  marginVertical: -6,
};

export const ADMIN_GRID_ITEM: ViewStyle = {
  width: '50%',
  paddingHorizontal: 6,
  paddingVertical: 6,
};
