import { ActivityIndicator, Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { ReceiptPaperWidth } from '../../services/printerPreferences';
import {
  ADMIN_BUTTON_CONTENT,
  ADMIN_BUTTON_TEXT,
  ADMIN_COLORS,
  ADMIN_MODAL_HEADER,
  ADMIN_PRIMARY_BUTTON,
  ADMIN_PRIMARY_BUTTON_DISABLED,
  ADMIN_SECONDARY_BUTTON,
  ADMIN_SECONDARY_BUTTON_TEXT,
  ADMIN_SECTION_CARD,
} from '../../theme/adminUi';

interface PrinterSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  paperWidth: ReceiptPaperWidth;
  onPaperWidthChange: (value: ReceiptPaperWidth) => void;
  autoPrintReceipts: boolean;
  onAutoPrintReceiptsChange: (value: boolean) => void;
  showBusinessHeader: boolean;
  onShowBusinessHeaderChange: (value: boolean) => void;
  saving: boolean;
  defaultPrinterLabel: string;
  routeDescription: string;
  onSave: () => void;
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: ADMIN_COLORS.background,
  },
  modalHeader: {
    ...ADMIN_MODAL_HEADER,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ADMIN_COLORS.text,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  modalContent: {
    padding: 20,
    gap: 16,
  },
  card: {
    ...ADMIN_SECTION_CARD,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ADMIN_COLORS.text,
  },
  sectionSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: ADMIN_COLORS.secondaryText,
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: 10,
  },
  segmentButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  segmentButtonActive: {
    backgroundColor: ADMIN_COLORS.primary,
    borderColor: ADMIN_COLORS.primary,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: ADMIN_COLORS.text,
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#FFFFFF',
  },
  toggleCopy: {
    flex: 1,
    gap: 4,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: ADMIN_COLORS.text,
  },
  toggleHint: {
    fontSize: 12,
    lineHeight: 18,
    color: ADMIN_COLORS.secondaryText,
  },
  infoPanel: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#F8FAFC',
    gap: 6,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: ADMIN_COLORS.text,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 18,
    color: ADMIN_COLORS.secondaryText,
  },
  primaryButton: {
    ...ADMIN_PRIMARY_BUTTON,
  },
  primaryButtonDisabled: {
    ...ADMIN_PRIMARY_BUTTON_DISABLED,
  },
  primaryButtonText: {
    ...ADMIN_BUTTON_TEXT,
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
});

export function PrinterSettingsModal({
  visible,
  onClose,
  paperWidth,
  onPaperWidthChange,
  autoPrintReceipts,
  onAutoPrintReceiptsChange,
  showBusinessHeader,
  onShowBusinessHeaderChange,
  saving,
  defaultPrinterLabel,
  routeDescription,
  onSave,
}: PrinterSettingsModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Receipt Settings</Text>
          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
            <Ionicons name="close" size={22} color={ADMIN_COLORS.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Printer Defaults</Text>
            <Text style={styles.sectionSubtitle}>
              Choose how receipts are sized and whether completed sales should print immediately. Saved direct printers can send receipts straight over Bluetooth, USB, or network, while this width still shapes the fallback document print layout.
            </Text>

            <View>
              <Text style={styles.infoTitle}>Paper Width</Text>
              <View style={styles.segmentedRow}>
                {(['58mm', '80mm'] as const).map((value) => {
                  const active = paperWidth === value;
                  return (
                    <TouchableOpacity
                      key={value}
                      style={[styles.segmentButton, active && styles.segmentButtonActive]}
                      onPress={() => onPaperWidthChange(value)}
                    >
                      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{value}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleCopy}>
                <Text style={styles.toggleTitle}>Auto-print after checkout</Text>
                <Text style={styles.toggleHint}>When enabled, a completed sale opens the print flow automatically.</Text>
              </View>
              <Switch
                value={autoPrintReceipts}
                onValueChange={onAutoPrintReceiptsChange}
                trackColor={{ false: '#CBD5E1', true: '#C7D2FE' }}
                thumbColor={autoPrintReceipts ? ADMIN_COLORS.primary : '#FFFFFF'}
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleCopy}>
                <Text style={styles.toggleTitle}>Include business header</Text>
                <Text style={styles.toggleHint}>Show store name and contact details at the top of the receipt.</Text>
              </View>
              <Switch
                value={showBusinessHeader}
                onValueChange={onShowBusinessHeaderChange}
                trackColor={{ false: '#CBD5E1', true: '#FDE68A' }}
                thumbColor={showBusinessHeader ? ADMIN_COLORS.accent : '#FFFFFF'}
              />
            </View>

            <View style={styles.infoPanel}>
              <Text style={styles.infoTitle}>Fallback Printer</Text>
              <Text style={styles.infoText}>{defaultPrinterLabel}</Text>
            </View>

            <View style={styles.infoPanel}>
              <Text style={styles.infoTitle}>Routing</Text>
              <Text style={styles.infoText}>{routeDescription}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, saving && styles.primaryButtonDisabled]}
            onPress={onSave}
            disabled={saving}
          >
            <View style={styles.buttonContent}>
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons name="save-outline" size={18} color="#ffffff" />
              )}
              <Text style={styles.primaryButtonText}>{saving ? 'Saving...' : 'Save Printer Settings'}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
