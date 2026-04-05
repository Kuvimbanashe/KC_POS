import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const SAVED_PRINTERS_KEY = 'saved_printers_v1';
const DEFAULT_PRINTER_KEY = 'default_printer_id_v1';

export type PrinterConnectionType = 'ble' | 'usb';

export interface SavedPrinter {
  id: string;
  name: string;
  type: PrinterConnectionType;
}

interface NativePrinterModule {
  BLEPrinter?: {
    init?: () => Promise<void>;
    getDeviceList?: () => Promise<Array<{ inner_mac_address?: string; macAddress?: string; device_name?: string; name?: string }>>;
    connectPrinter?: (address: string) => Promise<void>;
    printText?: (text: string) => Promise<void>;
  };
  USBPrinter?: {
    init?: () => Promise<void>;
    getDeviceList?: () => Promise<Array<{ vendor_id?: string; product_id?: string; device_name?: string; name?: string }>>;
    connectPrinter?: (vendorId: string, productId: string) => Promise<void>;
    printText?: (text: string) => Promise<void>;
  };
}

const loadPrinterModule = (): NativePrinterModule | null => {
  if (Platform.OS === 'web') return null;

  try {
    // Prefer canonical package.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('react-native-thermal-receipt-printer-image-qr') as NativePrinterModule;
  } catch {
    try {
      // Fallback in case legacy/forked package is installed.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require('@conodene/react-native-thermal-receipt-printer-image-qr') as NativePrinterModule;
    } catch {
      return null;
    }
  }
};

export const getSavedPrinters = async (): Promise<SavedPrinter[]> => {
  const raw = await AsyncStorage.getItem(SAVED_PRINTERS_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as SavedPrinter[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const setSavedPrinters = async (printers: SavedPrinter[]): Promise<void> => {
  await AsyncStorage.setItem(SAVED_PRINTERS_KEY, JSON.stringify(printers));
};

export const savePrinter = async (printer: SavedPrinter): Promise<void> => {
  const current = await getSavedPrinters();
  const next = [...current.filter((item) => item.id !== printer.id), printer];
  await setSavedPrinters(next);
};

export const removePrinter = async (printerId: string): Promise<void> => {
  const current = await getSavedPrinters();
  const next = current.filter((item) => item.id !== printerId);
  await setSavedPrinters(next);

  const defaultPrinterId = await getDefaultPrinterId();
  if (defaultPrinterId === printerId) {
    await AsyncStorage.removeItem(DEFAULT_PRINTER_KEY);
  }
};

export const setDefaultPrinterId = async (printerId: string): Promise<void> => {
  await AsyncStorage.setItem(DEFAULT_PRINTER_KEY, printerId);
};

export const getDefaultPrinterId = async (): Promise<string | null> =>
  AsyncStorage.getItem(DEFAULT_PRINTER_KEY);

export const discoverPrinters = async (): Promise<SavedPrinter[]> => {
  const printerModule = loadPrinterModule();
  if (!printerModule) return [];

  const discovered: SavedPrinter[] = [];

  if (printerModule.BLEPrinter?.init) {
    await printerModule.BLEPrinter.init();
  }
  if (printerModule.USBPrinter?.init) {
    await printerModule.USBPrinter.init();
  }

  if (printerModule.BLEPrinter?.getDeviceList) {
    const bleDevices = await printerModule.BLEPrinter.getDeviceList();
    bleDevices.forEach((device) => {
      const id = device.inner_mac_address ?? device.macAddress;
      if (!id) return;
      discovered.push({
        id,
        name: device.device_name ?? device.name ?? `BLE ${id}`,
        type: 'ble',
      });
    });
  }

  if (printerModule.USBPrinter?.getDeviceList) {
    const usbDevices = await printerModule.USBPrinter.getDeviceList();
    usbDevices.forEach((device) => {
      const vendorId = device.vendor_id;
      const productId = device.product_id;
      if (!vendorId || !productId) return;
      const id = `${vendorId}:${productId}`;
      discovered.push({
        id,
        name: device.device_name ?? device.name ?? `USB ${id}`,
        type: 'usb',
      });
    });
  }

  return discovered;
};

export const printWithDefaultPrinter = async (text: string): Promise<boolean> => {
  const printerModule = loadPrinterModule();
  if (!printerModule) return false;

  const defaultPrinterId = await getDefaultPrinterId();
  if (!defaultPrinterId) return false;

  const printers = await getSavedPrinters();
  const targetPrinter = printers.find((printer) => printer.id === defaultPrinterId);
  if (!targetPrinter) return false;

  if (targetPrinter.type === 'ble') {
    if (!printerModule.BLEPrinter?.connectPrinter || !printerModule.BLEPrinter?.printText) return false;
    await printerModule.BLEPrinter.connectPrinter(targetPrinter.id);
    await printerModule.BLEPrinter.printText(`${text}\n\n\n`);
    return true;
  }

  const [vendorId, productId] = targetPrinter.id.split(':');
  if (!vendorId || !productId) return false;
  if (!printerModule.USBPrinter?.connectPrinter || !printerModule.USBPrinter?.printText) return false;
  await printerModule.USBPrinter.connectPrinter(vendorId, productId);
  await printerModule.USBPrinter.printText(`${text}\n\n\n`);
  return true;
};
