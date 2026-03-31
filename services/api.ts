import type { Product, SaleItem } from '../store/types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000/api';

interface CreateSalePayload {
  cashier: string;
  total: number;
  paymentMethod: 'Cash' | 'Card' | 'Mobile Payment';
  invoiceNumber: string;
  customer?: string;
  items: SaleItem[];
}

const jsonHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

export const apiClient = {
  async lookupProductByBarcode(barcode: string): Promise<Product | null> {
    const response = await fetch(
      `${API_BASE_URL}/products/lookup-by-barcode/?barcode=${encodeURIComponent(barcode)}`,
      { headers: jsonHeaders },
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Lookup failed with status ${response.status}`);
    }

    const data = await response.json();

    return {
      id: data.id,
      name: data.name,
      category: data.category,
      price: Number(data.price),
      cost: Number(data.cost),
      stock: Number(data.stock),
      sku: data.sku,
      barcode: data.barcode ?? undefined,
      supplier: data.supplier,
      unitType: data.unit_type,
      packSize: data.pack_size,
      packPrice: data.pack_price ? Number(data.pack_price) : undefined,
      singlePrice: data.single_price ? Number(data.single_price) : undefined,
      minStockLevel: Number(data.min_stock_level ?? 10),
      description: data.description ?? '',
      createdAt: data.created_at,
    };
  },

  async createSale(payload: CreateSalePayload): Promise<void> {
    const body = {
      cashier: payload.cashier,
      total: payload.total,
      payment_method: payload.paymentMethod,
      invoice_number: payload.invoiceNumber,
      customer: payload.customer ?? '',
      items: payload.items.map((item) => ({
        product: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
        unit_type: item.unitType,
        pack_size: item.packSize,
      })),
    };

    const response = await fetch(`${API_BASE_URL}/sales/`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Create sale failed with status ${response.status}`);
    }
  },
};
