import type { PropsWithChildren, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';

import { AppScreen } from './AppScreen';
import { ADMIN_COLORS } from '../../theme/adminUi';

interface AuthScaffoldProps extends PropsWithChildren {
  title: string;
  subtitle: string;
  footer?: ReactNode;
  icon?: keyof typeof Feather.glyphMap;
  iconLabel?: string;
  keyboard?: boolean;
  formBorder?:number;
  formPadding?:number;
}

export function AuthScaffold({
  children,
  title,
  subtitle,
  footer,
  icon = 'shopping-bag',
  iconLabel = 'Shop Manager',
  keyboard = true,
  formBorder = 1,
  formPadding = 16,
}: AuthScaffoldProps) {
  return (
    <AppScreen keyboard={keyboard} edges={['top', 'bottom']} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <View style={styles.iconBadge}>
          <Feather name={icon} size={28} color="#ffffff" />
        </View>
        <Text style={styles.eyebrow}>{iconLabel}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={[styles.formCard, { borderWidth: formBorder, padding: formPadding }]}>{children}</View>

      {footer ? <View style={styles.footerWrap}>{footer}</View> : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    gap: 18,
  },
  heroCard: {
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingVertical: 26,
    backgroundColor: ADMIN_COLORS.primary,
    gap: 8,
    alignItems: 'center',
    justifyContent:"center"
  },
  iconBadge: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: ADMIN_COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#cbd5e1',
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: '#cbd5e1',
    textAlign: 'center',
  },
  formCard: {
    borderWidth: 1,
    borderColor: ADMIN_COLORS.border,
    borderRadius: 22,
    padding: 16,
    backgroundColor: ADMIN_COLORS.surface,
    gap: 14,
  },
  footerWrap: {
    alignItems: 'center',
  },
});
