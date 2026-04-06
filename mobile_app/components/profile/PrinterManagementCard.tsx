import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { ReceiptPrinterPreferences } from '../../services/printerPreferences';
import {
  ADMIN_BUTTON_CONTENT,
  ADMIN_BUTTON_TEXT,
  ADMIN_COLORS,
  ADMIN_DETAIL_LABEL,
  ADMIN_DETAIL_ROW,
  ADMIN_DETAIL_VALUE,
  ADMIN_PRIMARY_BUTTON,
  ADMIN_PRIMARY_BUTTON_DISABLED,
  ADMIN_SECONDARY_BUTTON,
  ADMIN_SECONDARY_BUTTON_TEXT,
  ADMIN_SECTION_CARD,
  ADMIN_SECTION_TITLE,
} from '../../theme/adminUi';

interface PrinterManagementCardProps {
  preferences: ReceiptPrinterPreferences | null;
  loading: boolean;
  printingTest: boolean;
  selectingSystemPrinter: boolean;
  thermalAvailable: boolean;
  thermalAvailabilityMessage: string;
  onOpenSettings: () => void;
  onOpenThermalPrinters: () => void;
  onPrintTest: () => void;
  onSelectSystemPrinter: () => void;
  onClearSystemPrinter: () => void;
}

const styles = StyleSheet.create({
  card: {
    ...ADMIN_SECTION_CARD,
    gap: 12,
  },
  sectionTitle: {
    ...ADMIN_SECTION_TITLE,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: ADMIN_COLORS.secondaryText,
    lineHeight: 20,
  },
  detailRow: {
    ...ADMIN_DETAIL_ROW,
  },
  detailRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  detailLabel: {
    ...ADMIN_DETAIL_LABEL,
    flex: 1,
  },
  detailValue: {
    ...ADMIN_DETAIL_VALUE,
    flex: 1,
    textAlign: 'right',
  },
  actionButton: {
    ...ADMIN_PRIMARY_BUTTON,
  },
  actionButtonDisabled: {
    ...ADMIN_PRIMARY_BUTTON_DISABLED,
  },
  settingsButton: {
    backgroundColor: ADMIN_COLORS.accent,
  },
  thermalButton: {
    backgroundColor: ADMIN_COLORS.primary,
  },
  testButton: {
    backgroundColor: '#0F766E',
  },
  secondaryButton: {
    ...ADMIN_SECONDARY_BUTTON,
  },
  secondaryButtonText: {
    ...ADMIN_SECONDARY_BUTTON_TEXT,
  },
  buttonContent: {
    ...ADMIN_BUTTON_CONTENT,
  },
  buttonText: {
    ...ADMIN_BUTTON_TEXT,
  },
  loadingState: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    color: ADMIN_COLORS.secondaryText,
  },
  infoPanel: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    gap: 6,
  },
  infoPanelTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: ADMIN_COLORS.text,
  },
  infoPanelText: {
    fontSize: 12,
    lineHeight: 18,
    color: ADMIN_COLORS.secondaryText,
  },
});

export function PrinterManagementCard({
  preferences,
  loading,
  printingTest,
  selectingSystemPrinter,
  thermalAvailable,
  thermalAvailabilityMessage,
  onOpenSettings,
  onOpenThermalPrinters,
  onPrintTest,
  onSelectSystemPrinter,
  onClearSystemPrinter,
}: PrinterManagementCardProps) {
  const details = preferences
    ? [
        {
          label: 'Receipt Route',
          value: preferences.defaultDirectPrinterId ? 'Direct thermal first' : 'System print fallback',
        },
        { label: 'Paper Width', value: preferences.paperWidth },
        { label: 'Store Header', value: preferences.showBusinessHeader ? 'Included' : 'Hidden' },
        { label: 'Auto Print', value: preferences.autoPrintReceipts ? 'Enabled' : 'Manual only' },
        {
          label: 'Default Thermal',
          value:
            preferences.savedDirectPrinters.find(
              (printer) => printer.id === preferences.defaultDirectPrinterId,
            )?.name ?? 'Not selected',
        },
        {
          label: 'Fallback Printer',
          value:
            preferences.defaultSystemPrinter?.name ??
            (Platform.OS === 'ios' ? 'Select one for fallback' : 'Managed by device print sheet'),
        },
      ]
    : [];

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Receipt Printing</Text>
      <Text style={styles.sectionSubtitle}>
        Manage paired Bluetooth, saved USB, and manual network printers for instant receipt output, while keeping system printing as a fallback path.
      </Text>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="small" color={ADMIN_COLORS.primary} />
          <Text style={styles.loadingText}>Loading printer settings...</Text>
        </View>
      ) : (
        <>
          {details.map((detail, index) => (
            <View
              key={detail.label}
              style={[styles.detailRow, index === details.length - 1 && styles.detailRowLast]}
            >
              <Text style={styles.detailLabel}>{detail.label}</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                {detail.value}
              </Text>
            </View>
          ))}

          <View style={styles.infoPanel}>
            <Text style={styles.infoPanelTitle}>Direct Thermal Status</Text>
            <Text style={styles.infoPanelText}>{thermalAvailabilityMessage}</Text>
          </View>

          <TouchableOpacity style={[styles.actionButton, styles.settingsButton]} onPress={onOpenSettings}>
            <View style={styles.buttonContent}>
              <Ionicons name="settings-outline" size={18} color="#ffffff" />
              <Text style={styles.buttonText}>Receipt Settings</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.thermalButton]} onPress={onOpenThermalPrinters}>
            <View style={styles.buttonContent}>
              <Ionicons name={thermalAvailable ? 'print-outline' : 'alert-circle-outline'} size={18} color="#ffffff" />
              <Text style={styles.buttonText}>Manage Thermal Printers</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.testButton, printingTest && styles.actionButtonDisabled]}
            onPress={onPrintTest}
            disabled={printingTest}
          >
            <View style={styles.buttonContent}>
              {printingTest ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons name="receipt-outline" size={18} color="#ffffff" />
              )}
              <Text style={styles.buttonText}>{printingTest ? 'Printing Test...' : 'Print Test Receipt'}</Text>
            </View>
          </TouchableOpacity>

          {Platform.OS === 'ios' ? (
            <TouchableOpacity
              style={[styles.secondaryButton, selectingSystemPrinter && styles.actionButtonDisabled]}
              onPress={onSelectSystemPrinter}
              disabled={selectingSystemPrinter}
            >
              <View style={styles.buttonContent}>
                {selectingSystemPrinter ? (
                  <ActivityIndicator size="small" color={ADMIN_COLORS.primary} />
                ) : (
                  <Ionicons name="print" size={18} color={ADMIN_COLORS.primary} />
                )}
                <Text style={styles.secondaryButtonText}>
                  {selectingSystemPrinter ? 'Opening Printer List...' : 'Select Fallback Printer'}
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <Text style={styles.infoPanelText}>
              On Android and web, the document-print fallback still uses the device print sheet when no direct thermal printer is selected.
            </Text>
          )}

          {preferences?.defaultSystemPrinter ? (
            <TouchableOpacity style={styles.secondaryButton} onPress={onClearSystemPrinter}>
              <View style={styles.buttonContent}>
                <Ionicons name="close-circle-outline" size={18} color={ADMIN_COLORS.primary} />
                <Text style={styles.secondaryButtonText}>Clear Fallback Printer</Text>
              </View>
            </TouchableOpacity>
          ) : null}
        </>
      )}
    </View>
  );
}
