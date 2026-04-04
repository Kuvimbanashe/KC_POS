import AsyncStorage from '@react-native-async-storage/async-storage';

export type ReceiptPaperWidth = '58mm' | '80mm';
export type DirectThermalPrinterTechnology = 'epson_epos';

export interface SavedSystemPrinter {
  name: string;
  url: string;
}

export interface SavedDirectPrinter {
  id: string;
  technology: DirectThermalPrinterTechnology;
  name: string;
  target: string;
  deviceName: string;
  deviceType?: string;
  ipAddress?: string;
  macAddress?: string;
  bdAddress?: string;
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

const STORAGE_KEY_PREFIX = 'receiptPrinterPreferences';

export const DEFAULT_RECEIPT_PRINTER_PREFERENCES: ReceiptPrinterPreferences = {
  paperWidth: '80mm',
  autoPrintReceipts: true,
  showBusinessHeader: true,
  defaultSystemPrinter: null,
  savedDirectPrinters: [],
  defaultDirectPrinterId: null,
};

const normalizeSavedDirectPrinters = (
  value?: SavedDirectPrinter[] | null,
): SavedDirectPrinter[] =>
  Array.isArray(value)
    ? value
        .filter(
          (printer): printer is SavedDirectPrinter =>
            Boolean(
              printer &&
                printer.id &&
                printer.name &&
                printer.target &&
                printer.deviceName &&
                printer.technology === 'epson_epos',
            ),
        )
        .map((printer) => ({
          id: printer.id,
          technology: 'epson_epos',
          name: printer.name,
          target: printer.target,
          deviceName: printer.deviceName,
          deviceType: printer.deviceType,
          ipAddress: printer.ipAddress,
          macAddress: printer.macAddress,
          bdAddress: printer.bdAddress,
          addedAt: printer.addedAt || new Date().toISOString(),
        }))
    : [];

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
    defaultDirectPrinterId:
      current.defaultDirectPrinterId ?? printer.id,
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
