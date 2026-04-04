import { ActivityIndicator, FlatList, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { DeviceInfo } from 'react-native-esc-pos-printer';

import type { SavedDirectPrinter } from '../../services/printerPreferences';
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

interface DirectThermalPrintersModalProps {
  visible: boolean;
  onClose: () => void;
  thermalAvailable: boolean;
  availabilityMessage: string;
  isDiscovering: boolean;
  discoveryError: string | null;
  discoveredPrinters: DeviceInfo[];
  savedPrinters: SavedDirectPrinter[];
  defaultPrinterId: string | null;
  onStartDiscovery: () => void;
  onStopDiscovery: () => void;
  onSavePrinter: (device: DeviceInfo) => void;
  onSetDefaultPrinter: (printerId: string) => void;
  onRemovePrinter: (printerId: string) => void;
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
  modalBody: {
    padding: 20,
    gap: 16,
  },
  card: {
    ...ADMIN_SECTION_CARD,
    gap: 12,
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
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: ADMIN_COLORS.text,
  },
  primaryButton: {
    ...ADMIN_PRIMARY_BUTTON,
  },
  primaryButtonDisabled: {
    ...ADMIN_PRIMARY_BUTTON_DISABLED,
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
  printerList: {
    gap: 12,
  },
  printerCard: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 14,
    gap: 10,
  },
  printerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
  },
  printerName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: ADMIN_COLORS.text,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#DBEAFE',
  },
  statusBadgeActive: {
    backgroundColor: '#D1FAE5',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  statusBadgeTextActive: {
    color: '#047857',
  },
  printerMeta: {
    fontSize: 12,
    lineHeight: 18,
    color: ADMIN_COLORS.secondaryText,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionPill: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  actionPillDanger: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  actionPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: ADMIN_COLORS.text,
  },
  actionPillDangerText: {
    color: ADMIN_COLORS.danger,
  },
  listContent: {
    gap: 12,
    paddingBottom: 12,
  },
  emptyState: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: ADMIN_COLORS.text,
  },
  emptySubtitle: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    color: ADMIN_COLORS.secondaryText,
  },
});

export function DirectThermalPrintersModal({
  visible,
  onClose,
  thermalAvailable,
  availabilityMessage,
  isDiscovering,
  discoveryError,
  discoveredPrinters,
  savedPrinters,
  defaultPrinterId,
  onStartDiscovery,
  onStopDiscovery,
  onSavePrinter,
  onSetDefaultPrinter,
  onRemovePrinter,
}: DirectThermalPrintersModalProps) {
  const savedPrinterTargets = new Set(savedPrinters.map((printer) => printer.target));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Thermal Printers</Text>
          <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
            <Ionicons name="close" size={22} color={ADMIN_COLORS.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
          <View style={styles.infoPanel}>
            <Text style={styles.infoTitle}>Support Status</Text>
            <Text style={styles.infoText}>{availabilityMessage}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Saved App Printers</Text>
            <Text style={styles.sectionSubtitle}>
              Receipts print straight to the default saved thermal printer without opening the system print sheet.
            </Text>

            {savedPrinters.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="print-outline" size={42} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No saved thermal printers</Text>
                <Text style={styles.emptySubtitle}>
                  Discover or connect a supported Epson TM printer, then save it here as the app default.
                </Text>
              </View>
            ) : (
              <FlatList
                data={savedPrinters}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => {
                  const isDefault = item.id === defaultPrinterId;
                  return (
                    <View style={styles.printerCard}>
                      <View style={styles.printerHeader}>
                        <Text style={styles.printerName}>{item.name}</Text>
                        <View style={[styles.statusBadge, isDefault && styles.statusBadgeActive]}>
                          <Text style={[styles.statusBadgeText, isDefault && styles.statusBadgeTextActive]}>
                            {isDefault ? 'Default' : 'Saved'}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.printerMeta} numberOfLines={2}>
                        {item.deviceName} · {item.target}
                      </Text>

                      <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.actionPill} onPress={() => onSetDefaultPrinter(item.id)}>
                          <Text style={styles.actionPillText}>
                            {isDefault ? 'Default Selected' : 'Set as Default'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionPill, styles.actionPillDanger]}
                          onPress={() => onRemovePrinter(item.id)}
                        >
                          <Text style={[styles.actionPillText, styles.actionPillDangerText]}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                }}
              />
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Discover Epson TM Printers</Text>
            <Text style={styles.sectionSubtitle}>
              Search the network or paired connections for supported Epson TM printers and save them into the app.
            </Text>

            {thermalAvailable ? (
              <>
                <TouchableOpacity
                  style={[styles.primaryButton, isDiscovering && styles.primaryButtonDisabled]}
                  onPress={isDiscovering ? onStopDiscovery : onStartDiscovery}
                >
                  <View style={styles.buttonContent}>
                    {isDiscovering ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Ionicons name="search-outline" size={18} color="#ffffff" />
                    )}
                    <Text style={styles.buttonText}>
                      {isDiscovering ? 'Stop Discovery' : 'Discover Printers'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {discoveryError ? (
                  <View style={styles.infoPanel}>
                    <Text style={styles.infoTitle}>Discovery Issue</Text>
                    <Text style={styles.infoText}>{discoveryError}</Text>
                  </View>
                ) : null}

                {discoveredPrinters.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="wifi-outline" size={42} color="#94A3B8" />
                    <Text style={styles.emptyTitle}>No printers discovered yet</Text>
                    <Text style={styles.emptySubtitle}>
                      Start discovery to scan for Epson TM printers available to this device.
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={discoveredPrinters}
                    keyExtractor={(item) => item.target}
                    scrollEnabled={false}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => {
                      const isSaved = savedPrinterTargets.has(item.target);
                      return (
                        <View style={styles.printerCard}>
                          <View style={styles.printerHeader}>
                            <Text style={styles.printerName}>
                              {item.deviceName || item.ipAddress || item.target}
                            </Text>
                            <View style={[styles.statusBadge, isSaved && styles.statusBadgeActive]}>
                              <Text style={[styles.statusBadgeText, isSaved && styles.statusBadgeTextActive]}>
                                {isSaved ? 'Saved' : 'Discovered'}
                              </Text>
                            </View>
                          </View>

                          <Text style={styles.printerMeta} numberOfLines={3}>
                            {item.target}
                            {item.ipAddress ? `\nIP: ${item.ipAddress}` : ''}
                            {item.macAddress ? `\nMAC: ${item.macAddress}` : ''}
                          </Text>

                          <TouchableOpacity style={styles.secondaryButton} onPress={() => onSavePrinter(item)}>
                            <Text style={styles.secondaryButtonText}>
                              {isSaved ? 'Update Saved Printer' : 'Save in App'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      );
                    }}
                  />
                )}
              </>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="build-outline" size={42} color="#94A3B8" />
                <Text style={styles.emptyTitle}>Native build required</Text>
                <Text style={styles.emptySubtitle}>
                  Direct thermal discovery is only available in a native dev or production build with the Epson module included.
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
            <Text style={styles.secondaryButtonText}>Close</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
