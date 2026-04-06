import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { SavedDirectPrinter } from '../../services/printerPreferences';
import type { DiscoveredDirectPrinter } from '../../services/receiptPrinter';
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
  discoveredPrinters: DiscoveredDirectPrinter[];
  savedPrinters: SavedDirectPrinter[];
  defaultPrinterId: string | null;
  onStartDiscovery: () => void;
  onStopDiscovery: () => void;
  onSavePrinter: (device: DiscoveredDirectPrinter) => Promise<void>;
  onSaveUsbPrinter: () => Promise<void>;
  onSaveNetworkPrinter: (printer: {
    name?: string;
    host: string;
    port?: number;
  }) => Promise<void>;
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
  formField: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: ADMIN_COLORS.text,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: ADMIN_COLORS.text,
    backgroundColor: '#FFFFFF',
  },
  portRow: {
    flexDirection: 'row',
    gap: 12,
  },
  portField: {
    width: 120,
  },
});

const getTechnologyLabel = (technology: SavedDirectPrinter['technology']) => {
  switch (technology) {
    case 'bluetooth':
      return 'Bluetooth';
    case 'usb':
      return 'USB';
    case 'network':
      return 'Network';
    default:
      return 'Direct';
  }
};

const getSavedPrinterMeta = (printer: SavedDirectPrinter) => {
  if (printer.technology === 'bluetooth') {
    return `${getTechnologyLabel(printer.technology)} · ${printer.macAddress || printer.identifier}`;
  }

  if (printer.technology === 'usb') {
    if (printer.vendorId && printer.productId) {
      return `${getTechnologyLabel(printer.technology)} · VID ${printer.vendorId} / PID ${printer.productId}`;
    }

    return `${getTechnologyLabel(printer.technology)} · connected by cable`;
  }

  return `${getTechnologyLabel(printer.technology)} · ${printer.host}:${printer.port}`;
};

const getDiscoveredPrinterMeta = (printer: DiscoveredDirectPrinter) => {
  if (printer.technology === 'bluetooth') {
    return `${getTechnologyLabel(printer.technology)} · ${printer.macAddress || printer.identifier}`;
  }

  if (printer.technology === 'usb') {
    return `${getTechnologyLabel(printer.technology)} · VID ${printer.vendorId} / PID ${printer.productId}`;
  }

  return `${getTechnologyLabel(printer.technology)} · ${printer.host}:${printer.port}`;
};

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
  onSaveUsbPrinter,
  onSaveNetworkPrinter,
  onSetDefaultPrinter,
  onRemovePrinter,
}: DirectThermalPrintersModalProps) {
  const [manualName, setManualName] = useState('');
  const [manualHost, setManualHost] = useState('');
  const [manualPort, setManualPort] = useState('9100');
  const [savingPrinterId, setSavingPrinterId] = useState<string | null>(null);
  const [savingManualNetwork, setSavingManualNetwork] = useState(false);
  const [savingUsbPrinter, setSavingUsbPrinter] = useState(false);

  const savedPrinterIds = useMemo(
    () => new Set(savedPrinters.map((printer) => printer.id)),
    [savedPrinters],
  );

  const handleSaveDiscoveredPrinter = async (printer: DiscoveredDirectPrinter) => {
    setSavingPrinterId(printer.id);
    try {
      await onSavePrinter(printer);
    } finally {
      setSavingPrinterId(null);
    }
  };

  const handleSaveManualNetworkPrinter = async () => {
    const host = manualHost.trim();
    const portValue = Number.parseInt(manualPort.trim(), 10);

    if (!host) {
      return;
    }

    setSavingManualNetwork(true);
    try {
      await onSaveNetworkPrinter({
        name: manualName.trim() || undefined,
        host,
        port: Number.isFinite(portValue) && portValue > 0 ? portValue : 9100,
      });
      setManualName('');
      setManualHost('');
      setManualPort('9100');
    } finally {
      setSavingManualNetwork(false);
    }
  };

  const handleSaveUsbPrinter = async () => {
    setSavingUsbPrinter(true);
    try {
      await onSaveUsbPrinter();
    } finally {
      setSavingUsbPrinter(false);
    }
  };

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
              Receipts print straight to the selected default printer without opening the system print sheet first.
            </Text>

            {savedPrinters.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="print-outline" size={42} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No saved direct printers</Text>
                <Text style={styles.emptySubtitle}>
                  Save a Bluetooth, USB, or network receipt printer here and then choose one as the app default.
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
                        {getSavedPrinterMeta(item)}
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
            <Text style={styles.sectionTitle}>Load Paired Bluetooth Printers</Text>
            <Text style={styles.sectionSubtitle}>
              The Sincpro printer module loads Bluetooth printers that are already paired with this Android device. Save LAN printers below by host or IP, and save USB separately.
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
                      <Ionicons name="bluetooth-outline" size={18} color="#ffffff" />
                    )}
                    <Text style={styles.buttonText}>
                      {isDiscovering ? 'Loading...' : 'Load Paired Printers'}
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
                    <Ionicons name="bluetooth-outline" size={42} color="#94A3B8" />
                    <Text style={styles.emptyTitle}>No paired Bluetooth printers found</Text>
                    <Text style={styles.emptySubtitle}>
                      Pair the printer in Android settings first, then load the paired list here and save the printer in the app.
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={discoveredPrinters}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => {
                      const isSaved = savedPrinterIds.has(item.id);
                      const isSaving = savingPrinterId === item.id;

                      return (
                        <View style={styles.printerCard}>
                          <View style={styles.printerHeader}>
                            <Text style={styles.printerName}>{item.name}</Text>
                            <View style={[styles.statusBadge, isSaved && styles.statusBadgeActive]}>
                              <Text style={[styles.statusBadgeText, isSaved && styles.statusBadgeTextActive]}>
                                {isSaved ? 'Saved' : getTechnologyLabel(item.technology)}
                              </Text>
                            </View>
                          </View>

                          <Text style={styles.printerMeta} numberOfLines={3}>
                            {getDiscoveredPrinterMeta(item)}
                          </Text>

                          <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={() => {
                              void handleSaveDiscoveredPrinter(item);
                            }}
                            disabled={isSaving}
                          >
                            <View style={styles.buttonContent}>
                              {isSaving ? (
                                <ActivityIndicator size="small" color={ADMIN_COLORS.primary} />
                              ) : (
                                <Ionicons name="save-outline" size={18} color={ADMIN_COLORS.primary} />
                              )}
                              <Text style={styles.secondaryButtonText}>
                                {isSaving
                                  ? 'Saving...'
                                  : isSaved
                                    ? 'Update Saved Printer'
                                    : 'Save in App'}
                              </Text>
                            </View>
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
                  Direct thermal printer management is only available in a native Android build with the linked printer module included.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Save USB Printer</Text>
            <Text style={styles.sectionSubtitle}>
              USB printers connect directly to the active cable connection, so there is no USB discovery list here. Save the USB route once, then make it the default printer if needed.
            </Text>

            <TouchableOpacity
              style={[styles.primaryButton, (!thermalAvailable || savingUsbPrinter) && styles.primaryButtonDisabled]}
              onPress={() => {
                void handleSaveUsbPrinter();
              }}
              disabled={!thermalAvailable || savingUsbPrinter}
            >
              <View style={styles.buttonContent}>
                {savingUsbPrinter ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Ionicons name="usb-outline" size={18} color="#ffffff" />
                )}
                <Text style={styles.buttonText}>
                  {savingUsbPrinter ? 'Saving...' : 'Save USB Printer'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Add Network Printer Manually</Text>
            <Text style={styles.sectionSubtitle}>
              If discovery does not find your LAN printer, save it manually with its host or IP address and port.
            </Text>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Printer Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Front Counter Printer"
                placeholderTextColor="#94A3B8"
                value={manualName}
                onChangeText={setManualName}
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>Host / IP Address</Text>
              <TextInput
                style={styles.textInput}
                placeholder="192.168.1.120"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                autoCorrect={false}
                value={manualHost}
                onChangeText={setManualHost}
              />
            </View>

            <View style={styles.portRow}>
              <View style={[styles.formField, styles.portField]}>
                <Text style={styles.fieldLabel}>Port</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="9100"
                  placeholderTextColor="#94A3B8"
                  keyboardType="number-pad"
                  value={manualPort}
                  onChangeText={setManualPort}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!manualHost.trim() || savingManualNetwork) && styles.primaryButtonDisabled,
              ]}
              onPress={() => {
                void handleSaveManualNetworkPrinter();
              }}
              disabled={!manualHost.trim() || savingManualNetwork}
            >
              <View style={styles.buttonContent}>
                {savingManualNetwork ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Ionicons name="save-outline" size={18} color="#ffffff" />
                )}
                <Text style={styles.buttonText}>
                  {savingManualNetwork ? 'Saving...' : 'Save Network Printer'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
            <Text style={styles.secondaryButtonText}>Close</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
