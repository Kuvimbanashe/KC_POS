# KC POS Monorepo

This repository now keeps the frontend mobile code under `mobile_app/` and the Django backend under `backend/`.

## Project Layout

- `mobile_app/` — Expo / React Native app.
- `backend/` — Django REST backend.

## Run the Mobile App

1. Go to the mobile app folder.

   ```bash
   cd mobile_app
   ```

2. Install dependencies.

   ```bash
   npm install
   ```

3. Start Expo.

   ```bash
   npx expo start
   ```

## Run the Backend

1. Go to backend folder.

   ```bash
   cd backend
   ```

2. Create venv, install requirements, run migrations, start server.

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
