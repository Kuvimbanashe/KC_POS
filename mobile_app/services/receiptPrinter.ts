import Constants from 'expo-constants';
import { NativeModulesProxy } from 'expo-modules-core';
import * as Print from 'expo-print';
import { NativeModules, PermissionsAndroid, Platform } from 'react-native';

import type {
  BluetoothDevice,
  MediaPreset,
  PrinterConfig,
  Receipt,
  ReceiptLine,
} from '@sincpro/printer-expo';

import type { SaleRecord, UnitType } from '../store/types';
import {
  DEFAULT_RECEIPT_PRINTER_PREFERENCES,
  getDefaultDirectPrinter,
  getPrinterPreferences,
  type ReceiptPrinterPreferences,
  type SavedDirectPrinter,
  type SavedSystemPrinter,
} from './printerPreferences';

export interface ReceiptBusinessInfo {
  name?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface PrintableReceiptItem {
  name: string;
  quantity: number;
  amount: number;
  unitType?: UnitType | 'single' | 'pack';
  packSize?: number;
}

export interface PrintableReceiptData {
  receiptNumber: string;
  date: string | Date;
  cashier: string;
  paymentMethod: string;
  total: number;
  items: PrintableReceiptItem[];
  customer?: string | null;
  business?: ReceiptBusinessInfo;
}

export interface PrintReceiptOptions {
  preferenceScope?: string;
  preferences?: ReceiptPrinterPreferences;
}

export interface DirectThermalAvailability {
  available: boolean;
  message: string;
}

export interface DiscoveredDirectPrinter {
  id: string;
  technology: SavedDirectPrinter['technology'];
  name: string;
  identifier: string;
  deviceName?: string;
  macAddress?: string;
  vendorId?: string;
  productId?: string;
  host?: string;
  port?: number;
}

export interface DirectPrinterDiscoveryCallbacks {
  onPrinters?: (printers: DiscoveredDirectPrinter[]) => void;
  onStatusChange?: (discovering: boolean) => void;
  onError?: (error: Error) => void;
}

export interface DirectPrinterDiscoveryHandle {
  stop: () => Promise<void>;
}

interface DiscoveryStartParams {
  autoStop?: boolean;
  timeout?: number;
}

type SincproPrinterModule = typeof import('@sincpro/printer-expo');

const PRINT_START_TIMEOUT_MS = 15000;
const NETWORK_DISCOVERY_PORT = 9100;
const DISCOVERY_TIMEOUT_MS = 8000;
const PRINTER_CONNECT_TIMEOUT_MS = 6000;

const executionEnvironment =
  'executionEnvironment' in Constants ? Constants.executionEnvironment : undefined;
const isExpoGoRuntime =
  executionEnvironment === 'storeClient' || Constants.appOwnership === 'expo';

const hasSincproNativeModule = () =>
  Boolean(
    (NativeModulesProxy as Record<string, unknown> | undefined)?.SincproPrinter ||
      (NativeModules as Record<string, unknown> | undefined)?.SincproPrinter,
  );

const ensureAndroidPrinterDiscoveryPermissions = async () => {
  if (Platform.OS !== 'android') {
    return;
  }

  const permissions = new Set<string>([
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
  ]);

  if (Platform.Version >= 31) {
    permissions.add(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN);
    permissions.add(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);
  } else {
    permissions.add(PermissionsAndroid.PERMISSIONS.BLUETOOTH);
    permissions.add(PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADMIN);
  }

  const requiredPermissions = Array.from(permissions).filter(Boolean);
  const missingPermissions: string[] = [];

  for (const permission of requiredPermissions) {
    const granted = await PermissionsAndroid.check(permission);
    if (!granted) {
      missingPermissions.push(permission);
    }
  }

  if (!missingPermissions.length) {
    return;
  }

  const results = await PermissionsAndroid.requestMultiple(missingPermissions);
  const deniedPermissions = missingPermissions.filter(
    (permission) => results[permission] !== PermissionsAndroid.RESULTS.GRANTED,
  );

  if (deniedPermissions.length) {
    throw new Error(
      'Bluetooth permissions are required to load paired receipt printers on this device.',
    );
  }
};

let sincproModulePromise: Promise<SincproPrinterModule | null> | null = null;

export class PrintStartTimeoutError extends Error {
  constructor() {
    super('Printing took too long to start.');
    this.name = 'PrintStartTimeoutError';
  }
}

export const isSilentPrintFailure = (error: unknown): boolean =>
  error instanceof PrintStartTimeoutError;

const getSincproPrinterModule = async (): Promise<SincproPrinterModule | null> => {
  if (
    Platform.OS !== 'android' ||
    isExpoGoRuntime ||
    !hasSincproNativeModule()
  ) {
    return null;
  }

  if (!sincproModulePromise) {
    sincproModulePromise = import('@sincpro/printer-expo')
      .then((module) => module)
      .catch(() => null);
  }

  return sincproModulePromise;
};

const withTimeout = async <T>(
  operation: Promise<T>,
  timeoutMs: number,
  errorFactory: () => Error,
): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      operation,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(errorFactory()), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

const withPrintStartTimeout = async <T>(operation: Promise<T>) =>
  withTimeout(operation, PRINT_START_TIMEOUT_MS, () => new PrintStartTimeoutError());

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const formatCurrency = (value: number) => `$${Number(value || 0).toFixed(2)}`;

const formatDateTime = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString();
};

const openWebPrintPreview = (html: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  const previewWindow = window.open('', '_blank', 'noopener,noreferrer');
  if (!previewWindow) {
    return;
  }

  previewWindow.document.open();
  previewWindow.document.write(html);
  previewWindow.document.close();
  previewWindow.focus();
  previewWindow.print();
};

const createPrinterId = (
  technology: SavedDirectPrinter['technology'],
  identifier: string,
) => `${technology}:${identifier}`;

const mapBluetoothPrinter = (
  printer: { address: string; name?: string | null } | BluetoothDevice,
): DiscoveredDirectPrinter => {
  const macAddress = printer.address;
  const deviceName = printer.name?.trim() || undefined;
  const identifier = macAddress;

  return {
    id: createPrinterId('bluetooth', identifier),
    technology: 'bluetooth',
    name: deviceName || macAddress,
    identifier,
    deviceName,
    macAddress,
  };
};

const getMediaPreset = (
  preferences: ReceiptPrinterPreferences,
): MediaPreset =>
  preferences.paperWidth === '58mm' ? 'continuous58mm' : 'continuous80mm';

const getPrinterConfig = (
  preferences: ReceiptPrinterPreferences,
): PrinterConfig => ({
  density: preferences.paperWidth === '58mm' ? 'dark' : 'medium',
  speed: 'medium',
  orientation: 'top_to_bottom',
  autoCutter: { enabled: true, fullCut: true },
});

const createSeparatorLine = (): ReceiptLine => ({
  type: 'separator',
  char: '-',
  length: 32,
});

export const supportsPrinterSelection = Platform.OS === 'ios';

export const formatReceiptUnitLabel = (
  unitType?: UnitType | 'single' | 'pack',
  packSize?: number,
) => {
  if (unitType === 'pack') {
    return packSize ? `Pack x${packSize}` : 'Pack';
  }

  return 'Single';
};

export const getDirectThermalAvailability = async (): Promise<DirectThermalAvailability> => {
  if (Platform.OS === 'web') {
    return {
      available: false,
      message:
        'Direct thermal printing is not available on web. The app will use browser printing there.',
    };
  }

  if (Platform.OS !== 'android') {
    return {
      available: false,
      message:
        '@sincpro/printer-expo direct printing is Android-only. iOS will keep using the system print route.',
    };
  }

  if (isExpoGoRuntime) {
    return {
      available: false,
      message:
        'Direct thermal printing is disabled in Expo Go. Use a native development or production build to enable saved Bluetooth, USB, and network receipt printers.',
    };
  }

  if (!hasSincproNativeModule()) {
    return {
      available: false,
      message:
        'This app build does not include the Sincpro printer module yet. Rebuild the app natively to enable direct receipt printing.',
    };
  }

  const module = await getSincproPrinterModule();
  if (!module) {
    return {
      available: false,
      message:
        'The Sincpro thermal printer library could not be loaded in this runtime. Rebuild the native app after installing the package.',
    };
  }

  return {
    available: true,
    message:
      'Direct thermal printing is available on this Android build for paired Bluetooth printers, manually saved network printers, and connected USB printers.',
  };
};

export const buildSavedDirectPrinter = (
  printer: DiscoveredDirectPrinter,
): SavedDirectPrinter => ({
  id: printer.id,
  technology: printer.technology,
  name: printer.name,
  identifier: printer.identifier,
  deviceName: printer.deviceName,
  macAddress: printer.macAddress,
  vendorId: printer.vendorId,
  productId: printer.productId,
  host: printer.host,
  port: printer.port,
  addedAt: new Date().toISOString(),
});

export const buildSavedNetworkPrinter = ({
  host,
  port,
  name,
}: {
  host: string;
  port?: number;
  name?: string;
}): SavedDirectPrinter => {
  const normalizedHost = host.trim();
  const normalizedPort = port && Number.isFinite(port) ? Math.trunc(port) : NETWORK_DISCOVERY_PORT;
  const identifier = `${normalizedHost}:${normalizedPort}`;

  return {
    id: createPrinterId('network', identifier),
    technology: 'network',
    name: name?.trim() || `Network Printer ${normalizedHost}`,
    identifier,
    host: normalizedHost,
    port: normalizedPort,
    addedAt: new Date().toISOString(),
  };
};

export const buildSavedUsbPrinter = ({
  name,
}: {
  name?: string;
} = {}): SavedDirectPrinter => ({
  id: createPrinterId('usb', 'default'),
  technology: 'usb',
  name: name?.trim() || 'USB Receipt Printer',
  identifier: 'usb-default',
  addedAt: new Date().toISOString(),
});

export const buildPrintableReceiptFromSale = (
  sale: SaleRecord,
  options?: {
    business?: ReceiptBusinessInfo;
    fallbackCashier?: string;
  },
): PrintableReceiptData => {
  const items = sale.items?.length
    ? sale.items.map((item) => ({
        name: item.productName,
        quantity: item.quantity,
        amount: item.subtotal ?? item.quantity * item.price,
        unitType: item.unitType,
        packSize: item.packSize,
      }))
    : [
        {
          name: sale.productName ?? 'Item',
          quantity: sale.quantity ?? 0,
          amount: sale.total ?? 0,
          unitType: 'single' as const,
        },
      ];

  return {
    receiptNumber: sale.invoiceNumber || `Receipt #${sale.id}`,
    date: sale.date,
    cashier: sale.cashier ?? options?.fallbackCashier ?? 'Unknown',
    paymentMethod: sale.paymentMethod,
    total: sale.total,
    items,
    customer: sale.customer ?? null,
    business: options?.business,
  };
};

export const buildReceiptHtml = (
  receipt: PrintableReceiptData,
  preferences: ReceiptPrinterPreferences = DEFAULT_RECEIPT_PRINTER_PREFERENCES,
) => {
  const width = preferences.paperWidth;
  const businessLines = [
    receipt.business?.name,
    receipt.business?.address,
    receipt.business?.phone,
    receipt.business?.email,
  ].filter(Boolean) as string[];

  const businessHeader =
    preferences.showBusinessHeader && businessLines.length
      ? `
        <div class="business">
          ${businessLines
            .map((line, index) =>
              index === 0
                ? `<div class="business-name">${escapeHtml(line)}</div>`
                : `<div>${escapeHtml(line)}</div>`,
            )
            .join('')}
        </div>
      `
      : '';

  const itemRows = receipt.items
    .map(
      (item) => `
        <tr>
          <td class="item-name">
            <div class="item-title">${escapeHtml(item.name)}</div>
            <div class="item-meta">${escapeHtml(
              `${item.quantity} x ${formatReceiptUnitLabel(item.unitType, item.packSize)}`,
            )}</div>
          </td>
          <td class="item-amount">${escapeHtml(formatCurrency(item.amount))}</td>
        </tr>
      `,
    )
    .join('');

  const customerBlock = receipt.customer
    ? `
      <div class="meta-row">
        <span>Customer</span>
        <strong>${escapeHtml(receipt.customer)}</strong>
      </div>
    `
    : '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(receipt.receiptNumber)}</title>
        <style>
          @page {
            margin: 6mm;
            size: auto;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            font-family: "Courier New", monospace;
            background: #ffffff;
            color: #0f172a;
          }

          .receipt {
            width: ${width};
            max-width: 100%;
            margin: 0 auto;
            padding: 4mm 0;
          }

          .business {
            text-align: center;
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px dashed #cbd5e1;
            font-size: 11px;
            line-height: 1.5;
          }

          .business-name {
            font-size: 15px;
            font-weight: 700;
            margin-bottom: 4px;
          }

          .title {
            text-align: center;
            font-size: 14px;
            font-weight: 700;
            margin-bottom: 12px;
          }

          .meta-row,
          .summary-row {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            font-size: 11px;
            line-height: 1.5;
            margin-bottom: 4px;
          }

          .meta-row strong,
          .summary-row strong {
            text-align: right;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0;
          }

          thead th {
            text-align: left;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            padding: 0 0 6px 0;
            border-bottom: 1px dashed #cbd5e1;
          }

          thead th:last-child {
            text-align: right;
          }

          tbody td {
            font-size: 11px;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: top;
          }

          .item-name {
            padding-right: 10px;
          }

          .item-title {
            font-weight: 700;
            margin-bottom: 2px;
          }

          .item-meta {
            font-size: 10px;
            color: #475569;
          }

          .item-amount {
            text-align: right;
            white-space: nowrap;
          }

          .summary {
            border-top: 1px dashed #cbd5e1;
            padding-top: 10px;
            margin-top: 10px;
          }

          .total {
            font-size: 13px;
            font-weight: 700;
          }

          .footer {
            border-top: 1px dashed #cbd5e1;
            padding-top: 10px;
            margin-top: 14px;
            text-align: center;
            font-size: 10px;
            color: #475569;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          ${businessHeader}
          <div class="title">${escapeHtml(receipt.receiptNumber)}</div>
          <div class="meta-row">
            <span>Date</span>
            <strong>${escapeHtml(formatDateTime(receipt.date))}</strong>
          </div>
          <div class="meta-row">
            <span>Cashier</span>
            <strong>${escapeHtml(receipt.cashier)}</strong>
          </div>
          <div class="meta-row">
            <span>Payment</span>
            <strong>${escapeHtml(receipt.paymentMethod)}</strong>
          </div>
          ${customerBlock}

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
          </table>

          <div class="summary">
            <div class="summary-row total">
              <span>Total</span>
              <strong>${escapeHtml(formatCurrency(receipt.total))}</strong>
            </div>
          </div>

          <div class="footer">Printed from KC POS</div>
        </div>
      </body>
    </html>
  `;
};

const buildDirectReceiptDocument = (
  receipt: PrintableReceiptData,
  preferences: ReceiptPrinterPreferences,
): Receipt => {
  const businessLines = [
    receipt.business?.name,
    receipt.business?.address,
    receipt.business?.phone,
    receipt.business?.email,
  ].filter(Boolean) as string[];

  const header: ReceiptLine[] = [];
  if (preferences.showBusinessHeader && businessLines.length) {
    businessLines.forEach((line, index) => {
      header.push({
        type: 'text',
        content: line,
        alignment: 'center',
        fontSize: index === 0 ? 'large' : 'medium',
        bold: index === 0,
      });
    });
    header.push(createSeparatorLine());
  }

  const body: ReceiptLine[] = [
    {
      type: 'text',
      content: receipt.receiptNumber,
      alignment: 'center',
      fontSize: 'large',
      bold: true,
    },
    { type: 'space', lines: 1 },
    {
      type: 'keyValue',
      key: 'Date',
      value: formatDateTime(receipt.date),
    },
    {
      type: 'keyValue',
      key: 'Cashier',
      value: receipt.cashier,
    },
    {
      type: 'keyValue',
      key: 'Payment',
      value: receipt.paymentMethod,
    },
  ];

  if (receipt.customer) {
    body.push({
      type: 'keyValue',
      key: 'Customer',
      value: receipt.customer,
    });
  }

  body.push(createSeparatorLine());

  receipt.items.forEach((item) => {
    body.push({
      type: 'text',
      content: item.name,
      bold: true,
    });
    body.push({
      type: 'keyValue',
      key: `${item.quantity} x ${formatReceiptUnitLabel(item.unitType, item.packSize)}`,
      value: formatCurrency(item.amount),
    });
  });

  body.push(createSeparatorLine());
  body.push({
    type: 'keyValue',
    key: 'TOTAL',
    value: formatCurrency(receipt.total),
    bold: true,
  });

  const footer: ReceiptLine[] = [
    { type: 'space', lines: 1 },
    {
      type: 'text',
      content: 'Printed from KC POS',
      alignment: 'center',
    },
    { type: 'space', lines: 2 },
  ];

  return { header, body, footer };
};

const safelyDisconnectPrinter = async (module: SincproPrinterModule) => {
  try {
    if (module.connection.isConnected()) {
      await module.connection.disconnect();
    }
  } catch {
    // Ignore disconnect failures after printing.
  }
};

const connectToDirectPrinter = async (
  module: SincproPrinterModule,
  directPrinter: SavedDirectPrinter,
) => {
  if (directPrinter.technology === 'bluetooth') {
    if (!directPrinter.macAddress) {
      throw new Error('The saved Bluetooth printer is missing its MAC address.');
    }

    await module.connection.connectBluetooth(
      directPrinter.macAddress,
      PRINTER_CONNECT_TIMEOUT_MS,
    );
    return;
  }

  if (directPrinter.technology === 'usb') {
    await module.connection.connectUsb();
    return;
  }

  if (!directPrinter.host || !directPrinter.port) {
    throw new Error('The saved network printer is missing its host or port.');
  }

  await module.connection.connectWifi(
    directPrinter.host,
    directPrinter.port,
    PRINTER_CONNECT_TIMEOUT_MS,
  );
};

export const printReceiptWithDirectThermalPrinter = async (
  receipt: PrintableReceiptData,
  directPrinter: SavedDirectPrinter,
  preferences: ReceiptPrinterPreferences = DEFAULT_RECEIPT_PRINTER_PREFERENCES,
) => {
  const module = await getSincproPrinterModule();
  if (!module) {
    throw new Error(
      'Direct thermal printing is unavailable in this runtime. Use a native Android dev or production build to print to saved printers.',
    );
  }

  const receiptDocument = buildDirectReceiptDocument(receipt, preferences);
  const mediaPreset = getMediaPreset(preferences);

  await connectToDirectPrinter(module, directPrinter);

  try {
    await module.config.set(getPrinterConfig(preferences));
    await module.print.receipt(receiptDocument, {
      media: { preset: mediaPreset },
      copies: 1,
    });
  } finally {
    await safelyDisconnectPrinter(module);
  }
};

const printReceiptWithSystemPrinter = async (
  html: string,
  defaultSystemPrinter: SavedSystemPrinter | null,
) => {
  if (Platform.OS === 'web') {
    openWebPrintPreview(html);
    return;
  }

  if (Platform.OS === 'ios' && defaultSystemPrinter?.url) {
    try {
      await Print.printAsync({ html, printerUrl: defaultSystemPrinter.url });
      return;
    } catch {
      await Print.printAsync({ html });
      return;
    }
  }

  await Print.printAsync({ html });
};

const resolvePreferences = async (
  options?: PrintReceiptOptions,
): Promise<ReceiptPrinterPreferences> => {
  if (options?.preferences) {
    return options.preferences;
  }

  return getPrinterPreferences(options?.preferenceScope);
};

export const printReceiptDocument = async (
  receipt: PrintableReceiptData,
  options?: PrintReceiptOptions,
) => {
  const preferences = await resolvePreferences(options);
  const html = buildReceiptHtml(receipt, preferences);
  const defaultDirectPrinter = getDefaultDirectPrinter(preferences);

  if (defaultDirectPrinter) {
    try {
      await withPrintStartTimeout(
        printReceiptWithDirectThermalPrinter(
          receipt,
          defaultDirectPrinter,
          preferences,
        ),
      );
      return { html, preferences, route: 'direct' as const };
    } catch (directError) {
      if (isSilentPrintFailure(directError)) {
        throw directError;
      }

      const availability = await getDirectThermalAvailability();
      if (availability.available) {
        throw directError;
      }
    }
  }

  await withPrintStartTimeout(
    printReceiptWithSystemPrinter(html, preferences.defaultSystemPrinter),
  );
  return { html, preferences, route: 'system' as const };
};

export const generateReceiptPdf = async (
  receipt: PrintableReceiptData,
  options?: PrintReceiptOptions,
) => {
  const preferences = await resolvePreferences(options);
  const html = buildReceiptHtml(receipt, preferences);

  if (Platform.OS === 'web') {
    openWebPrintPreview(html);
    return { html, preferences, uri: null };
  }

  const file = await Print.printToFileAsync({ html });
  return { html, preferences, uri: file.uri };
};

export const selectDefaultSystemPrinter = async (): Promise<SavedSystemPrinter | null> => {
  if (!supportsPrinterSelection) {
    return null;
  }

  const printer = await Print.selectPrinterAsync();
  if (!printer?.url) {
    return null;
  }

  return {
    name: printer.name ?? 'Selected printer',
    url: printer.url,
  };
};

export const selectDefaultPrinter = selectDefaultSystemPrinter;

const loadPairedBluetoothPrinters = async (
  module: SincproPrinterModule,
  timeoutMs: number,
) =>
  withTimeout(
    Promise.resolve(
      module.bluetooth
        .getPairedPrinters()
        .map(mapBluetoothPrinter)
        .sort((left, right) => left.name.localeCompare(right.name)),
    ),
    timeoutMs,
    () => new Error('Loading paired Bluetooth printers timed out.'),
  );

export const startDirectThermalPrinterDiscovery = async (
  callbacks: DirectPrinterDiscoveryCallbacks,
  params?: DiscoveryStartParams,
): Promise<DirectPrinterDiscoveryHandle> => {
  await ensureAndroidPrinterDiscoveryPermissions();

  const module = await getSincproPrinterModule();
  if (!module) {
    throw new Error(
      'Direct printer discovery is unavailable in this runtime. Build the app natively on Android to load paired Bluetooth printers.',
    );
  }

  let stopped = false;
  const timeoutMs = params?.timeout ?? DISCOVERY_TIMEOUT_MS;

  callbacks.onStatusChange?.(true);

  void (async () => {
    try {
      const printers = await loadPairedBluetoothPrinters(module, timeoutMs);

      if (stopped) {
        return;
      }

      callbacks.onPrinters?.(printers);
      callbacks.onStatusChange?.(false);
    } catch (error) {
      if (stopped) {
        return;
      }

      callbacks.onError?.(
        error instanceof Error
          ? error
          : new Error('Failed to load paired Bluetooth printers.'),
      );
      callbacks.onStatusChange?.(false);
    }
  })();

  return {
    stop: async () => {
      stopped = true;
      callbacks.onStatusChange?.(false);
    },
  };
};
