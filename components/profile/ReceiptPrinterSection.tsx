import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Platform } from 'react-native';

import type { DeviceInfo } from 'react-native-esc-pos-printer';

import type { StoreInfo, UserProfile } from '../../store/types';
import {
  getDefaultDirectPrinter,
  getPrinterPreferenceScope,
  getPrinterPreferences,
  removeDirectPrinter,
  savePrinterPreferences,
  setDefaultDirectPrinter,
  updatePrinterPreferences,
  upsertDirectPrinter,
  type ReceiptPaperWidth,
  type ReceiptPrinterPreferences,
} from '../../services/printerPreferences';
import {
  buildSavedDirectPrinter,
  getDirectThermalAvailability,
  printReceiptDocument,
  selectDefaultSystemPrinter,
  startDirectThermalPrinterDiscovery,
  type DirectPrinterDiscoveryHandle,
} from '../../services/receiptPrinter';
import { PrinterManagementCard } from './PrinterManagementCard';
import { PrinterSettingsModal } from './PrinterSettingsModal';
import { DirectThermalPrintersModal } from './DirectThermalPrintersModal';

interface ReceiptPrinterSectionProps {
  user: UserProfile;
  currentStore: StoreInfo;
}

export function ReceiptPrinterSection({
  user,
  currentStore,
}: ReceiptPrinterSectionProps) {
  const [printerSettingsOpen, setPrinterSettingsOpen] = useState(false);
  const [thermalPrintersOpen, setThermalPrintersOpen] = useState(false);
  const [printerPreferences, setPrinterPreferences] = useState<ReceiptPrinterPreferences | null>(null);
  const [printerSettingsLoading, setPrinterSettingsLoading] = useState(true);
  const [savingPrinterSettings, setSavingPrinterSettings] = useState(false);
  const [selectingSystemPrinter, setSelectingSystemPrinter] = useState(false);
  const [printingTestReceipt, setPrintingTestReceipt] = useState(false);
  const [thermalAvailable, setThermalAvailable] = useState(false);
  const [thermalAvailabilityMessage, setThermalAvailabilityMessage] = useState(
    'Checking direct thermal printing support...',
  );
  const [discoveredPrinters, setDiscoveredPrinters] = useState<DeviceInfo[]>([]);
  const [isDiscoveringThermal, setIsDiscoveringThermal] = useState(false);
  const [thermalDiscoveryError, setThermalDiscoveryError] = useState<string | null>(null);
  const [paperWidth, setPaperWidth] = useState<ReceiptPaperWidth>('80mm');
  const [autoPrintReceipts, setAutoPrintReceipts] = useState(true);
  const [showBusinessHeader, setShowBusinessHeader] = useState(true);

  const discoveryHandleRef = useRef<DirectPrinterDiscoveryHandle | null>(null);
  const printerScope = getPrinterPreferenceScope(user.businessId, user.id);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setPrinterSettingsLoading(true);
      try {
        const [preferences, availability] = await Promise.all([
          getPrinterPreferences(printerScope),
          getDirectThermalAvailability(),
        ]);
        if (!active) return;

        setPrinterPreferences(preferences);
        setPaperWidth(preferences.paperWidth);
        setAutoPrintReceipts(preferences.autoPrintReceipts);
        setShowBusinessHeader(preferences.showBusinessHeader);
        setThermalAvailable(availability.available);
        setThermalAvailabilityMessage(availability.message);
      } finally {
        if (active) {
          setPrinterSettingsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      active = false;
      if (discoveryHandleRef.current) {
        void discoveryHandleRef.current.stop();
        discoveryHandleRef.current = null;
      }
    };
  }, [printerScope]);

  const defaultDirectPrinter = useMemo(
    () => (printerPreferences ? getDefaultDirectPrinter(printerPreferences) : null),
    [printerPreferences],
  );

  const routeDescription = defaultDirectPrinter
    ? `Receipts will go directly to ${defaultDirectPrinter.name} when direct thermal printing is available. If that route is unavailable, the system print fallback will be used.`
    : 'Receipts currently use the system print route until you save and select a direct thermal printer.';

  const openPrinterSettings = () => {
    const preferences = printerPreferences;
    if (!preferences) {
      return;
    }

    setPaperWidth(preferences.paperWidth);
    setAutoPrintReceipts(preferences.autoPrintReceipts);
    setShowBusinessHeader(preferences.showBusinessHeader);
    setPrinterSettingsOpen(true);
  };

  const handleSavePrinterSettings = async () => {
    if (!printerPreferences) {
      return;
    }

    setSavingPrinterSettings(true);
    try {
      const next = await savePrinterPreferences(
        {
          ...printerPreferences,
          paperWidth,
          autoPrintReceipts,
          showBusinessHeader,
        },
        printerScope,
      );
      setPrinterPreferences(next);
      setPrinterSettingsOpen(false);
      Alert.alert('Success', 'Receipt settings saved successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save receipt settings';
      Alert.alert('Error', message);
    } finally {
      setSavingPrinterSettings(false);
    }
  };

  const handleSelectSystemPrinter = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert(
        'System-managed printers',
        'On this platform, the fallback document printer is still chosen by the system print sheet.',
      );
      return;
    }

    setSelectingSystemPrinter(true);
    try {
      const printer = await selectDefaultSystemPrinter();
      if (!printer) {
        return;
      }

      const next = await updatePrinterPreferences(
        { defaultSystemPrinter: printer },
        printerScope,
      );
      setPrinterPreferences(next);
      Alert.alert('Fallback Printer Saved', `${printer.name} was saved for the document-print fallback route.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to select the fallback printer';
      Alert.alert('Error', message);
    } finally {
      setSelectingSystemPrinter(false);
    }
  };

  const handleClearSystemPrinter = async () => {
    try {
      const next = await updatePrinterPreferences(
        { defaultSystemPrinter: null },
        printerScope,
      );
      setPrinterPreferences(next);
      Alert.alert('Fallback Printer Cleared', 'The system print sheet will choose the fallback printer again.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to clear the fallback printer';
      Alert.alert('Error', message);
    }
  };

  const handlePrintTestReceipt = async () => {
    setPrintingTestReceipt(true);
    try {
      const result = await printReceiptDocument(
        {
          receiptNumber: `TEST-${user.id}-${Date.now()}`,
          date: new Date(),
          cashier: user.name,
          paymentMethod: 'Printer Test',
          total: 0,
          items: [
            {
              name: 'Printer alignment check',
              quantity: 1,
              amount: 0,
              unitType: 'single',
            },
          ],
          business: {
            name: currentStore.name || user.businessName || 'KC POS',
            address: currentStore.address,
            phone: currentStore.phone,
            email: currentStore.email,
          },
        },
        { preferenceScope: printerScope },
      );

      Alert.alert(
        'Print Requested',
        result.route === 'direct'
          ? 'The test receipt was sent directly to the saved thermal printer.'
          : Platform.OS === 'web'
            ? 'The browser print preview was opened for the test receipt.'
            : 'The receipt was sent through the system print route.',
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to print the test receipt';
      Alert.alert('Error', message);
    } finally {
      setPrintingTestReceipt(false);
    }
  };

  const stopDiscovery = async () => {
    if (!discoveryHandleRef.current) {
      setIsDiscoveringThermal(false);
      return;
    }

    await discoveryHandleRef.current.stop();
    discoveryHandleRef.current = null;
    setIsDiscoveringThermal(false);
  };

  const handleStartDiscovery = async () => {
    setThermalDiscoveryError(null);
    setDiscoveredPrinters([]);

    try {
      await stopDiscovery();
      discoveryHandleRef.current = await startDirectThermalPrinterDiscovery(
        {
          onPrinters: (printers) => setDiscoveredPrinters(printers),
          onStatusChange: (discovering) => {
            setIsDiscoveringThermal(discovering);
            if (!discovering && discoveryHandleRef.current) {
              discoveryHandleRef.current = null;
            }
          },
          onError: (error) => {
            setThermalDiscoveryError(error.message);
          },
        },
        { autoStop: true, timeout: 8000 },
      );
      setIsDiscoveringThermal(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start printer discovery';
      setThermalDiscoveryError(message);
      setIsDiscoveringThermal(false);
    }
  };

  const handleSaveDirectPrinter = async (device: DeviceInfo) => {
    try {
      const next = await upsertDirectPrinter(
        buildSavedDirectPrinter(device),
        printerScope,
      );
      setPrinterPreferences(next);
      Alert.alert('Printer Saved', `${device.deviceName || device.target} was saved for direct receipt printing.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save the printer';
      Alert.alert('Error', message);
    }
  };

  const handleSetDefaultDirectPrinter = async (printerId: string) => {
    try {
      const next = await setDefaultDirectPrinter(printerId, printerScope);
      setPrinterPreferences(next);
      const printerName =
        next.savedDirectPrinters.find((printer) => printer.id === printerId)?.name ??
        'The selected printer';
      Alert.alert('Default Printer Updated', `${printerName} will now receive receipts directly.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to set the default printer';
      Alert.alert('Error', message);
    }
  };

  const handleRemoveDirectPrinter = async (printerId: string) => {
    try {
      const printerName =
        printerPreferences?.savedDirectPrinters.find((printer) => printer.id === printerId)?.name ??
        'The selected printer';
      const next = await removeDirectPrinter(printerId, printerScope);
      setPrinterPreferences(next);
      Alert.alert('Printer Removed', `${printerName} was removed from the app printer list.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove the printer';
      Alert.alert('Error', message);
    }
  };

  return (
    <>
      <PrinterManagementCard
        preferences={printerPreferences}
        loading={printerSettingsLoading}
        printingTest={printingTestReceipt}
        selectingSystemPrinter={selectingSystemPrinter}
        thermalAvailable={thermalAvailable}
        thermalAvailabilityMessage={thermalAvailabilityMessage}
        onOpenSettings={openPrinterSettings}
        onOpenThermalPrinters={() => setThermalPrintersOpen(true)}
        onPrintTest={handlePrintTestReceipt}
        onSelectSystemPrinter={handleSelectSystemPrinter}
        onClearSystemPrinter={handleClearSystemPrinter}
      />

      <PrinterSettingsModal
        visible={printerSettingsOpen}
        onClose={() => setPrinterSettingsOpen(false)}
        paperWidth={paperWidth}
        onPaperWidthChange={setPaperWidth}
        autoPrintReceipts={autoPrintReceipts}
        onAutoPrintReceiptsChange={setAutoPrintReceipts}
        showBusinessHeader={showBusinessHeader}
        onShowBusinessHeaderChange={setShowBusinessHeader}
        saving={savingPrinterSettings}
        defaultPrinterLabel={
          printerPreferences?.defaultSystemPrinter?.name ??
          (Platform.OS === 'ios'
            ? 'No fallback printer selected yet. The iOS print sheet will choose it.'
            : 'Fallback printers are managed by the system print sheet on this platform.')
        }
        routeDescription={routeDescription}
        onSave={handleSavePrinterSettings}
      />

      <DirectThermalPrintersModal
        visible={thermalPrintersOpen}
        onClose={() => {
          setThermalPrintersOpen(false);
          void stopDiscovery();
        }}
        thermalAvailable={thermalAvailable}
        availabilityMessage={thermalAvailabilityMessage}
        isDiscovering={isDiscoveringThermal}
        discoveryError={thermalDiscoveryError}
        discoveredPrinters={discoveredPrinters}
        savedPrinters={printerPreferences?.savedDirectPrinters ?? []}
        defaultPrinterId={printerPreferences?.defaultDirectPrinterId ?? null}
        onStartDiscovery={handleStartDiscovery}
        onStopDiscovery={() => {
          void stopDiscovery();
        }}
        onSavePrinter={handleSaveDirectPrinter}
        onSetDefaultPrinter={handleSetDefaultDirectPrinter}
        onRemovePrinter={handleRemoveDirectPrinter}
      />
    </>
  );
}
