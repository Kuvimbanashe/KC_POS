import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useAppSelector } from '../../../store/hooks';
import {
  ADMIN_COLORS,
  ADMIN_LIST_CARD,
  ADMIN_PAGE_SUBTITLE,
  ADMIN_PAGE_TITLE,
  ADMIN_SECTION_CARD,
  ADMIN_SECTION_SUBTITLE,
  ADMIN_SECTION_TITLE,
} from '../../../theme/adminUi';

type MoreRoute =
  | '/(admin)/(more)/expenses'
  | '/(admin)/(more)/purchases'
  | '/(admin)/(more)/assets'
  | '/(admin)/(more)/users'
  | '/(admin)/(more)/profile';

interface MoreItem {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: MoreRoute;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ADMIN_COLORS.background,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 28,
  },
  headerCard: {
    ...ADMIN_SECTION_CARD,
    backgroundColor: ADMIN_COLORS.primary,
    borderColor: ADMIN_COLORS.primary,
  },
  headerTitle: {
    ...ADMIN_PAGE_TITLE,
    color: '#ffffff',
  },
  headerSubtitle: {
    ...ADMIN_PAGE_SUBTITLE,
    color: '#cbd5e1',
    marginTop: 6,
  },
  sectionCard: {
    ...ADMIN_SECTION_CARD,
  },
  sectionTitle: {
    ...ADMIN_SECTION_TITLE,
    marginBottom: 4,
  },
  sectionSubtitle: {
    ...ADMIN_SECTION_SUBTITLE,
    marginBottom: 12,
  },
  actionCard: {
    ...ADMIN_LIST_CARD,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  actionLeft: {
    flex: 1,
    gap: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: ADMIN_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: ADMIN_COLORS.text,
  },
  actionDescription: {
    fontSize: 12,
    color: ADMIN_COLORS.secondaryText,
    marginTop: 4,
    lineHeight: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionsList: {
    gap: 10,
  },
  summaryCard: {
    ...ADMIN_LIST_CARD,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
    color: ADMIN_COLORS.text,
  },
  summaryLabel: {
    marginTop: 4,
    fontSize: 12,
    color: ADMIN_COLORS.secondaryText,
  },
});

export default function AdminMoreScreen() {
  const router = useRouter();
  const { expenses, purchases } = useAppSelector((state) => state.user);
  const { user } = useAppSelector((state) => state.auth);
  const { assets } = useAppSelector((state) => state.assets);

  const operations = useMemo<MoreItem[]>(
    () => [
      {
        title: 'Purchases',
        description: 'Track procurement, supplier activity, and restocking work.',
        icon: 'cart-outline',
        route: '/(admin)/(more)/purchases',
      },
      {
        title: 'Expenses',
        description: 'Review spending, vendor payments, and operating costs.',
        icon: 'cash-outline',
        route: '/(admin)/(more)/expenses',
      },
      {
        title: 'Assets',
        description: 'Manage equipment, asset values, and locations.',
        icon: 'briefcase-outline',
        route: '/(admin)/(more)/assets',
      },
      {
        title: 'Users',
        description: 'Control staff accounts, roles, and business access.',
        icon: 'people-outline',
        route: '/(admin)/(more)/users',
      },
    ],
    [],
  );

  const account = useMemo<MoreItem[]>(
    () => [
      {
        title: 'Profile',
        description: 'Update your personal details, password, and account settings.',
        icon: 'person-outline',
        route: '/(admin)/(more)/profile',
      },
    ],
    [],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
       

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{purchases.length}</Text>
            <Text style={styles.summaryLabel}>Purchases</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{expenses.length}</Text>
            <Text style={styles.summaryLabel}>Expenses</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{assets.length}</Text>
            <Text style={styles.summaryLabel}>Assets</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Operations</Text>
          <Text style={styles.sectionSubtitle}>Everything that supports the business beyond day-to-day selling and reporting.</Text>

          <View style={styles.actionsList}>
            {operations.map((item) => (
              <TouchableOpacity key={item.title} style={styles.actionCard} onPress={() => router.push(item.route)}>
                <View style={styles.actionLeft}>
                  <View style={styles.iconWrap}>
                    <Ionicons name={item.icon} size={20} color="#F8FAFC" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.actionTitle}>{item.title}</Text>
                    <Text style={styles.actionDescription}>{item.description}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward-outline" size={20} color={ADMIN_COLORS.tertiaryText} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Text style={styles.sectionSubtitle}>
            Signed in as {user?.name ?? 'Admin'}{user?.businessName ? ` for ${user.businessName}` : ''}.
          </Text>

          {account.map((item) => (
            <TouchableOpacity key={item.title} style={styles.actionCard} onPress={() => router.push(item.route)}>
              <View style={styles.actionLeft}>
                <View style={styles.iconWrap}>
                  <Ionicons name={item.icon} size={20} color="#F8FAFC" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionTitle}>{item.title}</Text>
                  <Text style={styles.actionDescription}>{item.description}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward-outline" size={20} color={ADMIN_COLORS.tertiaryText} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
