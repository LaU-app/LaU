# LaU: the social network for university students in El Salvador

LaU brings university life into one app:

- **community:** feed, profiles and chat;
- **study tools:** Pomodoro and tasks;
- **marketplace** where **businesses verified by LaU** sell to students and get paid with **PayPal**, helped by an **AI shopping assistant**.

- **Hackathon submission (PayPal + AI):** see [`HACKATHON.md`](HACKATHON.md)
- **Live app:** https://lauapp.es (Marketplace in pre-launch testing on PayPal Sandbox)
- **Backend:** Laravel 12 API in the `LaUapi` repository

## Stack

Vue 3 · Ionic 8 · Vite · Capacitor (Android) · Tailwind CSS · Laravel Echo + Pusher · PayPal JavaScript SDK

## Run locally

```bash
npm ci
# Optional: point to a local API and set the public PayPal client ID
echo "VITE_API_URL=http://127.0.0.1:8000/api" > .env.development.local
echo "VITE_PAYPAL_CLIENT_ID=<your sandbox client id>" >> .env.development.local
npm run dev            # http://localhost:5173
npm run build          # production build in dist/
npx vitest run         # unit tests
```

Everything in `src/`, `public/` and `.env.*` ships to the browser, so never put secrets there. PayPal's client **secret** and the AI provider key live only in the backend.

## License

[MIT](LICENSE)
