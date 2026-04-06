import AsyncStorage from '@react-native-async-storage/async-storage';

export type ReceiptPaperWidth = '58mm' | '80mm';
export type DirectThermalPrinterTechnology = 'bluetooth' | 'usb' | 'network';

export interface SavedSystemPrinter {
  name: string;
  url: string;
}

export interface SavedDirectPrinter {
  id: string;
  technology: DirectThermalPrinterTechnology;
  name: string;
  identifier: string;
  deviceName?: string;
  macAddress?: string;
  vendorId?: string;
  productId?: string;
  host?: string;
  port?: number;
  addedAt: string;
}

export interface ReceiptPrinterPreferences {
  paperWidth: ReceiptPaperWidth;
  autoPrintReceipts: boolean;
  showBusinessHeader: boolean;
  defaultSystemPrinter: SavedSystemPrinter | null;
  savedDirectPrinters: SavedDirectPrinter[];
  defaultDirectPrinterId: string | null;
}

type LegacySavedDirectPrinter = {
  id?: string;
  technology?: string;
  name?: string;
  target?: string;
  deviceName?: string;
  deviceType?: string;
  ipAddress?: string;
  macAddress?: string;
  bdAddress?: string;
  addedAt?: string;
};

const STORAGE_KEY_PREFIX = 'receiptPrinterPreferences';
const DEFAULT_NETWORK_PORT = 9100;

export const DEFAULT_RECEIPT_PRINTER_PREFERENCES: ReceiptPrinterPreferences = {
  paperWidth: '80mm',
  autoPrintReceipts: true,
  showBusinessHeader: true,
  defaultSystemPrinter: null,
  savedDirectPrinters: [],
  defaultDirectPrinterId: null,
};

const parseNumericPort = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.trunc(value);
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
};

const parseLegacyTarget = (target?: string | null) => {
  if (!target) {
    return null;
  }

  const trimmed = target.trim();
  const tcpMatch = trimmed.match(/^(?:tcp:)?([^:]+)(?::(\d+))?$/i);
  if (!tcpMatch) {
    return null;
  }

  const host = tcpMatch[1]?.trim();
  if (!host) {
    return null;
  }

  return {
    host,
    port: parseNumericPort(tcpMatch[2]) ?? DEFAULT_NETWORK_PORT,
  };
};

const migrateLegacyPrinter = (
  printer: LegacySavedDirectPrinter,
): SavedDirectPrinter | null => {
  const addedAt = printer.addedAt || new Date().toISOString();
  const name = printer.name || printer.deviceName || 'Saved printer';
  const bluetoothAddress = printer.bdAddress || printer.macAddress;
  const legacyNetworkTarget = parseLegacyTarget(printer.target);
  const host = printer.ipAddress || legacyNetworkTarget?.host;
  const port = legacyNetworkTarget?.port ?? DEFAULT_NETWORK_PORT;

  if (host) {
    return {
      id: printer.id || `network:${host}:${port}`,
      technology: 'network',
      name,
      identifier: `${host}:${port}`,
      deviceName: printer.deviceName,
      host,
      port,
      addedAt,
    };
  }

  if (bluetoothAddress) {
    return {
      id: printer.id || `bluetooth:${bluetoothAddress}`,
      technology: 'bluetooth',
      name,
      identifier: bluetoothAddress,
      deviceName: printer.deviceName,
      macAddress: bluetoothAddress,
      addedAt,
    };
  }

  return null;
};

const normalizeSavedDirectPrinter = (value: unknown): SavedDirectPrinter | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const printer = value as SavedDirectPrinter & LegacySavedDirectPrinter;
  const addedAt = printer.addedAt || new Date().toISOString();

  if (printer.technology === 'network') {
    const host = typeof printer.host === 'string' ? printer.host.trim() : '';
    const port = parseNumericPort(printer.port);
    if (!printer.id || !printer.name || !host || !port) {
      return null;
    }

    return {
      id: printer.id,
      technology: 'network',
      name: printer.name,
      identifier:
        typeof printer.identifier === 'string' && printer.identifier.trim()
          ? printer.identifier
          : `${host}:${port}`,
      deviceName: printer.deviceName,
      host,
      port,
      addedAt,
    };
  }

  if (printer.technology === 'bluetooth') {
    const macAddress =
      typeof printer.macAddress === 'string'
        ? printer.macAddress.trim()
        : typeof printer.identifier === 'string'
          ? printer.identifier.trim()
          : '';
    if (!printer.id || !printer.name || !macAddress) {
      return null;
    }

    return {
      id: printer.id,
      technology: 'bluetooth',
      name: printer.name,
      identifier:
        typeof printer.identifier === 'string' && printer.identifier.trim()
          ? printer.identifier
          : macAddress,
      deviceName: printer.deviceName,
      macAddress,
      addedAt,
    };
  }

  if (printer.technology === 'usb') {
    const vendorId =
      typeof printer.vendorId === 'string' ? printer.vendorId.trim() : '';
    const productId =
      typeof printer.productId === 'string' ? printer.productId.trim() : '';
    const identifier =
      typeof printer.identifier === 'string' && printer.identifier.trim()
        ? printer.identifier.trim()
        : vendorId && productId
          ? `${vendorId}:${productId}`
          : '';

    if (!printer.id || !printer.name || !identifier) {
      return null;
    }

    return {
      id: printer.id,
      technology: 'usb',
      name: printer.name,
      identifier,
      deviceName: printer.deviceName,
      vendorId: vendorId || undefined,
      productId: productId || undefined,
      addedAt,
    };
  }

  return migrateLegacyPrinter(printer);
};

const normalizeSavedDirectPrinters = (
  value?: SavedDirectPrinter[] | LegacySavedDirectPrinter[] | null,
): SavedDirectPrinter[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const seenIds = new Set<string>();
  const normalized: SavedDirectPrinter[] = [];

  for (const printer of value) {
    const nextPrinter = normalizeSavedDirectPrinter(printer);
    if (!nextPrinter || seenIds.has(nextPrinter.id)) {
      continue;
    }

    seenIds.add(nextPrinter.id);
    normalized.push(nextPrinter);
  }

  return normalized;
};

const normalizePreferences = (
  value?: Partial<ReceiptPrinterPreferences> | null,
): ReceiptPrinterPreferences => ({
  paperWidth:
    value?.paperWidth === '58mm' || value?.paperWidth === '80mm'
      ? value.paperWidth
      : DEFAULT_RECEIPT_PRINTER_PREFERENCES.paperWidth,
  autoPrintReceipts:
    typeof value?.autoPrintReceipts === 'boolean'
      ? value.autoPrintReceipts
      : DEFAULT_RECEIPT_PRINTER_PREFERENCES.autoPrintReceipts,
  showBusinessHeader:
    typeof value?.showBusinessHeader === 'boolean'
      ? value.showBusinessHeader
      : DEFAULT_RECEIPT_PRINTER_PREFERENCES.showBusinessHeader,
  defaultSystemPrinter:
    value?.defaultSystemPrinter?.name && value.defaultSystemPrinter.url
      ? {
          name: value.defaultSystemPrinter.name,
          url: value.defaultSystemPrinter.url,
        }
      : null,
  savedDirectPrinters: normalizeSavedDirectPrinters(value?.savedDirectPrinters),
  defaultDirectPrinterId:
    typeof value?.defaultDirectPrinterId === 'string'
      ? value.defaultDirectPrinterId
      : null,
});

export const getPrinterPreferenceScope = (
  businessId?: number | null,
  userId?: number | null,
) => `${STORAGE_KEY_PREFIX}:${businessId ?? 'default'}:${userId ?? 'default'}`;

export const getPrinterPreferences = async (
  scope = getPrinterPreferenceScope(),
): Promise<ReceiptPrinterPreferences> => {
  const raw = await AsyncStorage.getItem(scope);
  if (!raw) {
    return DEFAULT_RECEIPT_PRINTER_PREFERENCES;
  }

  try {
    return normalizePreferences(JSON.parse(raw) as Partial<ReceiptPrinterPreferences>);
  } catch {
    return DEFAULT_RECEIPT_PRINTER_PREFERENCES;
  }
};

export const savePrinterPreferences = async (
  preferences: ReceiptPrinterPreferences,
  scope = getPrinterPreferenceScope(),
) => {
  const next = normalizePreferences(preferences);
  await AsyncStorage.setItem(scope, JSON.stringify(next));
  return next;
};

export const updatePrinterPreferences = async (
  updates: Partial<ReceiptPrinterPreferences>,
  scope = getPrinterPreferenceScope(),
) => {
  const current = await getPrinterPreferences(scope);
  const mergedDirectPrinters =
    updates.savedDirectPrinters === undefined
      ? current.savedDirectPrinters
      : normalizeSavedDirectPrinters(updates.savedDirectPrinters);
  const mergedDefaultDirectPrinterId =
    updates.defaultDirectPrinterId === undefined
      ? current.defaultDirectPrinterId
      : updates.defaultDirectPrinterId;

  const next = normalizePreferences({
    ...current,
    ...updates,
    defaultSystemPrinter:
      updates.defaultSystemPrinter === undefined
        ? current.defaultSystemPrinter
        : updates.defaultSystemPrinter,
    savedDirectPrinters: mergedDirectPrinters,
    defaultDirectPrinterId: mergedDefaultDirectPrinterId,
  });
  await AsyncStorage.setItem(scope, JSON.stringify(next));
  return next;
};

export const upsertDirectPrinter = async (
  printer: SavedDirectPrinter,
  scope = getPrinterPreferenceScope(),
) => {
  const current = await getPrinterPreferences(scope);
  const existingIndex = current.savedDirectPrinters.findIndex(
    (savedPrinter) => savedPrinter.id === printer.id,
  );
  const nextPrinters =
    existingIndex >= 0
      ? current.savedDirectPrinters.map((savedPrinter, index) =>
          index === existingIndex ? { ...savedPrinter, ...printer } : savedPrinter,
        )
      : [...current.savedDirectPrinters, printer];
  const next = normalizePreferences({
    ...current,
    savedDirectPrinters: nextPrinters,
    defaultDirectPrinterId: current.defaultDirectPrinterId ?? printer.id,
  });
  await AsyncStorage.setItem(scope, JSON.stringify(next));
  return next;
};

export const removeDirectPrinter = async (
  printerId: string,
  scope = getPrinterPreferenceScope(),
) => {
  const current = await getPrinterPreferences(scope);
  const nextPrinters = current.savedDirectPrinters.filter(
    (printer) => printer.id !== printerId,
  );
  const nextDefaultId =
    current.defaultDirectPrinterId === printerId
      ? nextPrinters[0]?.id ?? null
      : current.defaultDirectPrinterId;
  const next = normalizePreferences({
    ...current,
    savedDirectPrinters: nextPrinters,
    defaultDirectPrinterId: nextDefaultId,
  });
  await AsyncStorage.setItem(scope, JSON.stringify(next));
  return next;
};

export const setDefaultDirectPrinter = async (
  printerId: string | null,
  scope = getPrinterPreferenceScope(),
) => {
  const current = await getPrinterPreferences(scope);
  const next = normalizePreferences({
    ...current,
    defaultDirectPrinterId: printerId,
  });
  await AsyncStorage.setItem(scope, JSON.stringify(next));
  return next;
};

export const getDefaultDirectPrinter = (
  preferences: ReceiptPrinterPreferences,
) =>
  preferences.savedDirectPrinters.find(
    (printer) => printer.id === preferences.defaultDirectPrinterId,
  ) ?? null;
