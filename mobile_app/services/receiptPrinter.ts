import Constants from 'expo-constants';
import * as Print from 'expo-print';
import { NativeModules, Platform } from 'react-native';

import type {
  IBLEPrinter,
  INetPrinter,
  IUSBPrinter,
} from '@conodene/react-native-thermal-receipt-printer-image-qr';

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

type ThermalPrinterModule = typeof import('@conodene/react-native-thermal-receipt-printer-image-qr');

const PRINT_START_TIMEOUT_MS = 15000;
const NETWORK_DISCOVERY_PORT = 9100;
const DISCOVERY_TIMEOUT_MS = 8000;
const NETWORK_CONNECT_TIMEOUT_MS = 6000;

const executionEnvironment =
  'executionEnvironment' in Constants ? Constants.executionEnvironment : undefined;
const isExpoGoRuntime =
  executionEnvironment === 'storeClient' || Constants.appOwnership === 'expo';

const hasThermalPrinterNativeModule = () =>
  Boolean(
    NativeModules.RNBLEPrinter ||
      NativeModules.RNUSBPrinter ||
      NativeModules.RNNetPrinter,
  );

let thermalModulePromise: Promise<ThermalPrinterModule | null> | null = null;

export class PrintStartTimeoutError extends Error {
  constructor() {
    super('Printing took too long to start.');
    this.name = 'PrintStartTimeoutError';
  }
}

export const isSilentPrintFailure = (error: unknown): boolean =>
  error instanceof PrintStartTimeoutError;

const getThermalPrinterModule = async (): Promise<ThermalPrinterModule | null> => {
  if (Platform.OS === 'web' || isExpoGoRuntime || !hasThermalPrinterNativeModule()) {
    return null;
  }

  if (!thermalModulePromise) {
    thermalModulePromise = import('@conodene/react-native-thermal-receipt-printer-image-qr')
      .then((module) => module)
      .catch(() => null);
  }

  return thermalModulePromise;
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

const truncateReceiptText = (value: string, maxLength: number) => {
  if (value.length <= maxLength) {
    return value;
  }

  if (maxLength <= 3) {
    return value.slice(0, maxLength);
  }

  return `${value.slice(0, maxLength - 3)}...`;
};

const padReceiptLine = (left: string, right: string, lineWidth: number) => {
  const safeRight = right.trim();
  const minimumGap = 2;
  const maxLeftLength = Math.max(4, lineWidth - safeRight.length - minimumGap);
  const safeLeft = truncateReceiptText(left.trim(), maxLeftLength);
  const gap = Math.max(minimumGap, lineWidth - safeLeft.length - safeRight.length);
  return `${safeLeft}${' '.repeat(gap)}${safeRight}`;
};

const getReceiptLineWidth = (preferences: ReceiptPrinterPreferences) =>
  preferences.paperWidth === '58mm' ? 30 : 46;

const createPrinterId = (
  technology: SavedDirectPrinter['technology'],
  identifier: string,
) => `${technology}:${identifier}`;

const mapBluetoothPrinter = (printer: IBLEPrinter): DiscoveredDirectPrinter => {
  const macAddress = printer.inner_mac_address;
  const identifier = macAddress;
  return {
    id: createPrinterId('bluetooth', identifier),
    technology: 'bluetooth',
    name: printer.device_name || macAddress,
    identifier,
    deviceName: printer.device_name,
    macAddress,
  };
};

const mapUsbPrinter = (printer: IUSBPrinter): DiscoveredDirectPrinter => {
  const identifier = `${printer.vendor_id}:${printer.product_id}`;
  return {
    id: createPrinterId('usb', identifier),
    technology: 'usb',
    name: printer.device_name || `USB Printer ${identifier}`,
    identifier,
    deviceName: printer.device_name,
    vendorId: printer.vendor_id,
    productId: printer.product_id,
  };
};

const mapNetworkPrinter = (printer: INetPrinter): DiscoveredDirectPrinter => {
  const host = printer.host;
  const port = printer.port || NETWORK_DISCOVERY_PORT;
  const identifier = `${host}:${port}`;
  return {
    id: createPrinterId('network', identifier),
    technology: 'network',
    name: `Network Printer ${host}`,
    identifier,
    host,
    port,
  };
};

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

  if (isExpoGoRuntime) {
    return {
      available: false,
      message:
        'Direct thermal printing is disabled in Expo Go. Use a native development or production build to enable saved Bluetooth, USB, and network receipt printers.',
    };
  }

  if (!hasThermalPrinterNativeModule()) {
    return {
      available: false,
      message:
        'This app build does not include the native thermal printer module yet. Rebuild the app natively to enable direct receipt printing.',
    };
  }

  const module = await getThermalPrinterModule();
  if (!module) {
    return {
      available: false,
      message:
        'The thermal printer library could not be loaded in this runtime. Rebuild the native app after prebuild so the direct printer modules are linked.',
    };
  }

  return {
    available: true,
    message:
      'Direct thermal printing is available for saved Bluetooth, USB, and network receipt printers on this build.',
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

const buildDirectReceiptText = (
  receipt: PrintableReceiptData,
  preferences: ReceiptPrinterPreferences,
  commands: ThermalPrinterModule['COMMANDS'],
) => {
  const businessLines = [
    receipt.business?.name,
    receipt.business?.address,
    receipt.business?.phone,
    receipt.business?.email,
  ].filter(Boolean) as string[];
  const lineWidth = getReceiptLineWidth(preferences);
  const hr =
    preferences.paperWidth === '58mm'
      ? commands.HORIZONTAL_LINE.HR_58MM
      : commands.HORIZONTAL_LINE.HR_80MM;
  const alignLeft = commands.TEXT_FORMAT.TXT_ALIGN_LT;
  const alignCenter = commands.TEXT_FORMAT.TXT_ALIGN_CT;
  const boldOn = commands.TEXT_FORMAT.TXT_BOLD_ON;
  const boldOff = commands.TEXT_FORMAT.TXT_BOLD_OFF;

  let output = `${commands.HARDWARE.HW_INIT}${alignCenter}`;

  if (preferences.showBusinessHeader && businessLines.length) {
    businessLines.forEach((line, index) => {
      if (index === 0) {
        output += `${boldOn}${line}\n${boldOff}`;
      } else {
        output += `${line}\n`;
      }
    });
    output += '\n';
  }

  output += `${boldOn}${receipt.receiptNumber}\n${boldOff}`;
  output += `${alignLeft}`;
  output += `${padReceiptLine('Date', formatDateTime(receipt.date), lineWidth)}\n`;
  output += `${padReceiptLine('Cashier', receipt.cashier, lineWidth)}\n`;
  output += `${padReceiptLine('Payment', receipt.paymentMethod, lineWidth)}\n`;

  if (receipt.customer) {
    output += `${padReceiptLine('Customer', receipt.customer, lineWidth)}\n`;
  }

  output += `${hr}\n`;

  receipt.items.forEach((item) => {
    output += `${truncateReceiptText(item.name, lineWidth)}\n`;
    output += `${padReceiptLine(
      `${item.quantity} x ${formatReceiptUnitLabel(item.unitType, item.packSize)}`,
      formatCurrency(item.amount),
      lineWidth,
    )}\n`;
  });

  output += `${hr}\n`;
  output += `${boldOn}${padReceiptLine('TOTAL', formatCurrency(receipt.total), lineWidth)}${boldOff}\n\n`;
  output += `${alignCenter}Printed from KC POS\n`;

  return output;
};

const printWithBluetoothPrinter = async (
  module: ThermalPrinterModule,
  printer: SavedDirectPrinter,
  receiptText: string,
) => {
  if (!printer.macAddress) {
    throw new Error('The saved Bluetooth printer is missing its MAC address.');
  }

  await module.BLEPrinter.init();
  await module.BLEPrinter.connectPrinter(printer.macAddress);

  try {
    module.BLEPrinter.printBill(receiptText, {
      cut: true,
      tailingLine: true,
      encoding: 'UTF8',
    });
  } finally {
    try {
      await module.BLEPrinter.closeConn();
    } catch {
      // Ignore disconnect failures after printing.
    }
  }
};

const printWithUsbPrinter = async (
  module: ThermalPrinterModule,
  printer: SavedDirectPrinter,
  receiptText: string,
) => {
  if (!printer.vendorId || !printer.productId) {
    throw new Error('The saved USB printer is missing its vendor or product id.');
  }

  await module.USBPrinter.init();
  await module.USBPrinter.connectPrinter(printer.vendorId, printer.productId);

  try {
    module.USBPrinter.printBill(receiptText, {
      cut: true,
      tailingLine: true,
      encoding: 'UTF8',
    });
  } finally {
    try {
      await module.USBPrinter.closeConn();
    } catch {
      // Ignore disconnect failures after printing.
    }
  }
};

const printWithNetworkPrinter = async (
  module: ThermalPrinterModule,
  printer: SavedDirectPrinter,
  receiptText: string,
) => {
  if (!printer.host || !printer.port) {
    throw new Error('The saved network printer is missing its host or port.');
  }

  await module.NetPrinter.init();
  await module.NetPrinter.connectPrinter(
    printer.host,
    printer.port,
    NETWORK_CONNECT_TIMEOUT_MS,
  );

  try {
    module.NetPrinter.printBill(receiptText, {
      cut: true,
      tailingLine: true,
      encoding: 'UTF8',
    });
  } finally {
    try {
      await module.NetPrinter.closeConn();
    } catch {
      // Ignore disconnect failures after printing.
    }
  }
};

export const printReceiptWithDirectThermalPrinter = async (
  receipt: PrintableReceiptData,
  directPrinter: SavedDirectPrinter,
  preferences: ReceiptPrinterPreferences = DEFAULT_RECEIPT_PRINTER_PREFERENCES,
) => {
  const module = await getThermalPrinterModule();
  if (!module) {
    throw new Error(
      'Direct thermal printing is unavailable in this runtime. Use a native dev or production build to print to saved printers.',
    );
  }

  const receiptText = buildDirectReceiptText(receipt, preferences, module.COMMANDS);

  if (directPrinter.technology === 'bluetooth') {
    await printWithBluetoothPrinter(module, directPrinter, receiptText);
    return;
  }

  if (directPrinter.technology === 'usb') {
    await printWithUsbPrinter(module, directPrinter, receiptText);
    return;
  }

  await printWithNetworkPrinter(module, directPrinter, receiptText);
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

const discoverBluetoothPrinters = async (
  module: ThermalPrinterModule,
  timeoutMs: number,
) =>
  withTimeout(
    (async () => {
      await module.BLEPrinter.init();
      return module.BLEPrinter.getDeviceList();
    })(),
    timeoutMs,
    () => new Error('Bluetooth printer discovery timed out.'),
  );

const discoverUsbPrinters = async (
  module: ThermalPrinterModule,
  timeoutMs: number,
) =>
  withTimeout(
    (async () => {
      await module.USBPrinter.init();
      return module.USBPrinter.getDeviceList();
    })(),
    timeoutMs,
    () => new Error('USB printer discovery timed out.'),
  );

const discoverNetworkPrinters = async (
  module: ThermalPrinterModule,
  timeoutMs: number,
) =>
  withTimeout(
    (async () => {
      await module.NetPrinter.init();
      return module.NetPrinter.getDeviceList();
    })(),
    timeoutMs,
    () => new Error('Network printer discovery timed out.'),
  );

export const startDirectThermalPrinterDiscovery = async (
  callbacks: DirectPrinterDiscoveryCallbacks,
  params?: DiscoveryStartParams,
): Promise<DirectPrinterDiscoveryHandle> => {
  const module = await getThermalPrinterModule();
  if (!module) {
    throw new Error(
      'Direct printer discovery is unavailable in this runtime. Build the app natively to discover Bluetooth, USB, and network printers.',
    );
  }

  let stopped = false;
  const timeoutMs = params?.timeout ?? DISCOVERY_TIMEOUT_MS;

  callbacks.onStatusChange?.(true);

  void (async () => {
    const discovered = new Map<string, DiscoveredDirectPrinter>();
    const errors: string[] = [];

    const register = (printer: DiscoveredDirectPrinter) => {
      discovered.set(printer.id, printer);
    };

    const tasks: Promise<void>[] = [
      (async () => {
        try {
          const printers = await discoverBluetoothPrinters(module, timeoutMs);
          printers.map(mapBluetoothPrinter).forEach(register);
        } catch (error) {
          errors.push(
            error instanceof Error
              ? error.message
              : 'Bluetooth printer discovery failed.',
          );
        }
      })(),
      (async () => {
        if (Platform.OS !== 'android') {
          return;
        }

        try {
          const printers = await discoverUsbPrinters(module, timeoutMs);
          printers.map(mapUsbPrinter).forEach(register);
        } catch (error) {
          errors.push(
            error instanceof Error ? error.message : 'USB printer discovery failed.',
          );
        }
      })(),
      (async () => {
        try {
          const printers = await discoverNetworkPrinters(module, timeoutMs);
          printers.map(mapNetworkPrinter).forEach(register);
        } catch (error) {
          errors.push(
            error instanceof Error
              ? error.message
              : 'Network printer discovery failed.',
          );
        }
      })(),
    ];

    await Promise.all(tasks);

    if (stopped) {
      return;
    }

    const printers = Array.from(discovered.values()).sort((left, right) =>
      left.name.localeCompare(right.name),
    );

    callbacks.onPrinters?.(printers);

    if (!printers.length && errors.length) {
      callbacks.onError?.(new Error(errors[0]));
    }

    callbacks.onStatusChange?.(false);
  })().catch((error) => {
    if (stopped) {
      return;
    }

    callbacks.onError?.(
      error instanceof Error ? error : new Error('Failed to discover direct printers.'),
    );
    callbacks.onStatusChange?.(false);
  });

  return {
    stop: async () => {
      stopped = true;
      callbacks.onStatusChange?.(false);
    },
  };
};
