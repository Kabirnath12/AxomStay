# AxomStay deployment

## Current secure starter

1. Create a GitHub repository and push this folder.
2. Create a Render Web Service from the repository. Render can read `render.yaml` automatically.
3. Add the values marked `sync: false` in Render's Environment settings.
4. Set `GOOGLE_REDIRECT_URI` to `https://YOUR-RENDER-DOMAIN/api/auth/google/callback` and add that exact URI in Google Cloud OAuth settings.
5. Set Stripe's webhook/success URL to the deployed domain before accepting live payments.
6. Add your Twilio sender number or Messaging Service SID.

## Before real bookings

The local JSON file and `uploads/` directory are development fallbacks. Render disks are ephemeral on the free/starter web service. Move users, properties, bookings, and payments to Supabase PostgreSQL, and move property photos to Cloudinary or S3 before production traffic.

Never commit `.env`, Stripe keys, Twilio tokens, Google secrets, or real customer data.

## Run locally

```powershell
npm install
npm start
```

Health check: `http://localhost:3000/health`
