# POS Django Backend (Modular Apps)

## App structure
Each entity is split into its own Django app (no single bundled app):
- `users` → staff users
- `products` → catalog + barcode lookup
- `sales` → sales + sale items + stock decrement logic
- `purchases` → purchases + stock increment logic
- `expenses` → expenses
- `assets_mgmt` → fixed assets

## REST endpoints
- `/api/users/`
- `/api/products/`
- `/api/products/lookup-by-barcode/?barcode=<code>`
- `/api/sales/`
- `/api/purchases/`
- `/api/expenses/`
- `/api/assets/`

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
