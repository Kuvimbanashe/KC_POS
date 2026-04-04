import Constants from 'expo-constants';
import { NativeModules, Platform } from 'react-native';
import * as Print from 'expo-print';

import type { SaleRecord, UnitType } from '../store/types';
import {
  DEFAULT_RECEIPT_PRINTER_PREFERENCES,
  getDefaultDirectPrinter,
  getPrinterPreferences,
  type ReceiptPrinterPreferences,
  type SavedDirectPrinter,
  type SavedSystemPrinter,
} from './printerPreferences';

import type {
  DeviceInfo,
  DiscoveryStartParams,
  Printer as EscPosPrinter,
} from 'react-native-esc-pos-printer';

export interface ReceiptBusinessInfo {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
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
  business?: ReceiptBusinessInfo;
  customer?: string | null;
}

interface PrintReceiptOptions {
  preferenceScope?: string;
  preferences?: ReceiptPrinterPreferences;
}

export interface DirectThermalAvailability {
  available: boolean;
  message: string;
}

export interface DirectPrinterDiscoveryCallbacks {
  onPrinters?: (printers: DeviceInfo[]) => void;
  onStatusChange?: (isDiscovering: boolean) => void;
  onError?: (error: Error) => void;
}

export interface DirectPrinterDiscoveryHandle {
  stop: () => Promise<void>;
}

type EscPosModule = typeof import('react-native-esc-pos-printer');
const PRINT_START_TIMEOUT_MS = 15_000;

let escPosModulePromise: Promise<EscPosModule | null> | null = null;
const expoExecutionEnvironment = Constants.executionEnvironment;
const isExpoGoRuntime = expoExecutionEnvironment === 'storeClient';

export class PrintStartTimeoutError extends Error {
  constructor() {
    super('Printing did not start within 15 seconds.');
    this.name = 'PrintStartTimeoutError';
  }
}

export const isSilentPrintFailure = (error: unknown): boolean =>
  error instanceof PrintStartTimeoutError;

const hasEscPosNativeModule = () => {
  if (Platform.OS === 'web') {
    return false;
  }

  const legacyModulePresent =
    Boolean(NativeModules.EscPosPrinter) &&
    Boolean(NativeModules.EscPosPrinterDiscovery);

  const turboModuleProxy = (
    global as typeof globalThis & {
      __turboModuleProxy?: (name: string) => unknown;
    }
  ).__turboModuleProxy;

  const turboModulePresent =
    typeof turboModuleProxy === 'function' &&
    Boolean(turboModuleProxy('EscPosPrinter')) &&
    Boolean(turboModuleProxy('EscPosPrinterDiscovery'));

  return legacyModulePresent || turboModulePresent;
};

const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

const formatDateTime = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? `${value}` : date.toLocaleString();
};

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const resolvePreferences = async (options?: PrintReceiptOptions) =>
  options?.preferences ??
  (await getPrinterPreferences(options?.preferenceScope));

const openWebPrintPreview = (html: string) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Unable to open the browser print preview.');
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};

const getEscPosModule = async (): Promise<EscPosModule | null> => {
  if (Platform.OS === 'web' || isExpoGoRuntime || !hasEscPosNativeModule()) {
    return null;
  }

  if (!escPosModulePromise) {
    escPosModulePromise = import('react-native-esc-pos-printer')
      .then((module) => module)
      .catch(() => null);
  }

  return escPosModulePromise;
};

const withPrintStartTimeout = async <T>(operation: Promise<T>): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      operation,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new PrintStartTimeoutError()), PRINT_START_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

const getPrinterIdentity = (device: Pick<DeviceInfo, 'target'>) =>
  `epson_epos:${device.target}`;

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
      message: 'Direct thermal printing is not available on web. The app will use browser printing there.',
    };
  }

  if (isExpoGoRuntime) {
    return {
      available: false,
      message:
        'Direct thermal printing is disabled in Expo Go. Use a development build or production build to enable saved Epson receipt printers.',
    };
  }

  if (!hasEscPosNativeModule()) {
    return {
      available: false,
      message:
        'This app build does not include the native Epson printer module yet. Rebuild the app natively to enable direct thermal printing.',
    };
  }

  const module = await getEscPosModule();
  if (!module) {
    return {
      available: false,
      message:
        'Direct thermal printing requires a native development or production build with the Epson printer module installed. Expo Go will fall back to the print sheet.',
    };
  }

  return {
    available: true,
    message: 'Direct thermal printing is available for supported Epson TM printers on this build.',
  };
};

export const buildSavedDirectPrinter = (device: DeviceInfo): SavedDirectPrinter => ({
  id: getPrinterIdentity(device),
  technology: 'epson_epos',
  name: device.deviceName || device.ipAddress || device.target,
  target: device.target,
  deviceName: device.deviceName || 'Epson TM Printer',
  deviceType: device.deviceType,
  ipAddress: device.ipAddress,
  macAddress: device.macAddress,
  bdAddress: device.bdAddress,
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

const writeDirectReceiptBody = async (
  printer: EscPosPrinter,
  receipt: PrintableReceiptData,
  preferences: ReceiptPrinterPreferences,
  module: EscPosModule,
) => {
  const { Printer, TextAlignType, PrinterAddCutType } = module;

  await printer.clearCommandBuffer();
  await printer.addTextAlign(TextAlignType.ALIGN_CENTER);

  if (preferences.showBusinessHeader) {
    if (receipt.business?.name) {
      await printer.addText(`${receipt.business.name}\n`);
    }
    if (receipt.business?.address) {
      await printer.addText(`${receipt.business.address}\n`);
    }
    if (receipt.business?.phone) {
      await printer.addText(`${receipt.business.phone}\n`);
    }
    if (receipt.business?.email) {
      await printer.addText(`${receipt.business.email}\n`);
    }
    await printer.addFeedLine(1);
  }

  await printer.addText(`${receipt.receiptNumber}\n`);
  await printer.addFeedLine(1);

  await printer.addTextAlign(TextAlignType.ALIGN_LEFT);
  await Printer.addTextLine(printer, { left: 'Date', right: formatDateTime(receipt.date) });
  await Printer.addTextLine(printer, { left: 'Cashier', right: receipt.cashier });
  await Printer.addTextLine(printer, { left: 'Payment', right: receipt.paymentMethod });
  if (receipt.customer) {
    await Printer.addTextLine(printer, { left: 'Customer', right: receipt.customer });
  }

  await printer.addFeedLine(1);
  await printer.addText('--------------------------------\n');

  for (const item of receipt.items) {
    await printer.addText(`${item.name}\n`);
    await Printer.addTextLine(printer, {
      left: `${item.quantity} x ${formatReceiptUnitLabel(item.unitType, item.packSize)}`,
      right: formatCurrency(item.amount),
    });
  }

  await printer.addText('--------------------------------\n');
  await Printer.addTextLine(printer, { left: 'TOTAL', right: formatCurrency(receipt.total) });
  await printer.addFeedLine(3);
  await printer.addCut(PrinterAddCutType.CUT_FEED);
  await printer.sendData();
};

export const printReceiptWithDirectThermalPrinter = async (
  receipt: PrintableReceiptData,
  directPrinter: SavedDirectPrinter,
  preferences: ReceiptPrinterPreferences = DEFAULT_RECEIPT_PRINTER_PREFERENCES,
) => {
  const module = await getEscPosModule();
  if (!module) {
    throw new Error(
      'Direct thermal printing is unavailable in this runtime. Use a native dev or production build to print to saved Epson TM printers.',
    );
  }

  const { Printer } = module;
  const printer = new Printer({
    target: directPrinter.target,
    deviceName: directPrinter.deviceName,
  });

  await printer.connect();
  try {
    await writeDirectReceiptBody(printer, receipt, preferences, module);
  } finally {
    try {
      await printer.disconnect();
    } catch {
      // Ignore disconnect failures after printing.
    }
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

export const startDirectThermalPrinterDiscovery = async (
  callbacks: DirectPrinterDiscoveryCallbacks,
  params?: DiscoveryStartParams,
): Promise<DirectPrinterDiscoveryHandle> => {
  const module = await getEscPosModule();
  if (!module) {
    throw new Error(
      'Direct printer discovery is unavailable in this runtime. Build the app natively to discover Epson TM printers.',
    );
  }

  const { PrintersDiscovery } = module;
  const removeDiscoveryListener = PrintersDiscovery.onDiscovery((printers) => {
    callbacks.onPrinters?.(printers);
  });
  const removeStatusListener = PrintersDiscovery.onStatusChange((status) => {
    callbacks.onStatusChange?.(status === 'discovering');
  });
  const removeErrorListener = PrintersDiscovery.onError((error) => {
    callbacks.onError?.(error);
  });

  await PrintersDiscovery.start(params);

  return {
    stop: async () => {
      removeDiscoveryListener();
      removeStatusListener();
      removeErrorListener();
      await PrintersDiscovery.stop();
    },
  };
};
