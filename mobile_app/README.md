# KC POS Mobile App

Expo / React Native mobile client for KC POS.

## Main folders

- `app/` — Expo Router screens and layouts
- `components/` — reusable UI
- `services/` — API, printer, and sync logic
- `store/` — Redux state
- `theme/` — shared UI tokens
- `assets/` — app images and static assets

## Local development

```bash
cd mobile_app
npm install
npx expo start
```

## Environment

Create `mobile_app/.env` with:

```bash
EXPO_PUBLIC_API_BASE_URL=http://<your-ip>:8000/api
EXPO_PUBLIC_ENABLE_BACKEND_SYNC=true
EXPO_PUBLIC_WEBSOCKET_URL=
```

## Native builds

This app uses prebuild/native Android configuration.

```bash
cd mobile_app
npx expo prebuild
eas build --platform android --profile preview
```

## Notes

- The active mobile app lives entirely inside `mobile_app/`.
- Root-level duplicate mobile folders were removed so imports and tooling only target this directory.
