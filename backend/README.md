# POS Django Backend

## Features implemented
- Full REST API for users, products, sales (+line items), purchases, expenses, and assets.
- Barcode lookup endpoint for cashier scanning flow:
  - `GET /api/products/lookup-by-barcode/?barcode=<code>`
- Stock updates integrated in backend business logic:
  - Sale creation decreases stock.
  - Purchase creation increases stock and updates last known cost.
- CORS enabled for Expo app integration.

## Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

## Expo integration
Set API URL in app environment:

```bash
export EXPO_PUBLIC_API_BASE_URL=http://<your-machine-ip>:8000/api
```

Then restart Expo.
