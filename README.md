# Free Fire API (Node.js + Express)

A practical, request-driven Free Fire API proxy built with Node.js and Express.

This project is designed to mirror real game traffic incrementally. Endpoints are added only after capturing real requests/responses.

## Features

- Express API with clean route structure
- AES-256-CBC helpers for game payload handling
- JWT auth flow via Garena login + MajorLogin
- Token cache per region (5 minutes)
- Protobuf encoder/decoder (schema-driven)
- Response shaping for web/Telegram-friendly JSON
- Vercel deployment config with cron health ping

## Tech Stack

- Node.js
- Express
- Built-in `https`, `crypto`, `zlib`
- Custom Protobuf parser (no external protobuf dependency)

## Project Structure

```txt
config/
  accounts.json
  constants.js
lib/
  auth.js
  crypto.js
  request.js
  proto.js
  validate.js
  protobuf/
    encoder.js
    decoder.js
    schemas.js
    varint.js
routes/
  health.js
  account.js
  playerstats.js
  playertcstats.js
  galleryshow.js
server.js
vercel.json
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure accounts in `config/accounts.json`:

```json
{
  "ME": { "uid": "YOUR_UID", "password": "YOUR_PASSWORD" },
  "IND": { "uid": "YOUR_UID", "password": "YOUR_PASSWORD" }
}
```

3. Start server:

```bash
npm start
```

Server runs at:

- `http://localhost:3000`

## Authentication Flow

The server obtains JWT automatically per region:

1. `getGarenaToken(uid, password)`
2. `getMajorLogin(access_token, open_id, region)`
3. Cache `{ jwt, serverUrl }` for 5 minutes

## Encryption

AES mode used in helpers:

- Algorithm: `aes-256-cbc`
- Key seed: `Yg&tc%DEuh6%Zc^8`
- IV: `6oyZDr22E3ychjM%`

Exposed helpers in `lib/crypto.js`:

- `encryptAes(hexData)`
- `decryptAes(hexData)`

## API Endpoints

Base path: `/api`

### Health

- `GET /api/health`

Response example:

```json
{
  "status": "ok",
  "uptimeSec": 123,
  "now": "2026-03-28T00:00:00.000Z"
}
```

### Account (Personal Show)

- `GET /api/v1/account?region=IND&uid=1633864660`
  - Builds protobuf request and calls `/GetPlayerPersonalShow`
- `POST /api/account`
  - For captured encrypted request body

Body (POST):

```json
{
  "region": "ME",
  "bodyHex": "E30ABAC5C5096C75C50769794FE62011"
}
```

### BR Stats

- `GET /api/v1/playerstats?region=IND&uid=1633864660&matchmode=CAREER`
  - Calls `/GetPlayerStats`
- `POST /api/playerstats`
  - For captured encrypted request body

### CS Stats

- `GET /api/v1/playertcstats?region=IND&uid=1633864660&matchmode=CAREER`
  - Calls `/GetPlayerTCStats`
- `POST /api/playertcstats`
  - For captured encrypted request body

### Gallery Show Info

- `POST /api/galleryshow`
  - Calls `/GetPlayerGalleryShowInfo`
  - Returns parsed nested fields and extracted signature (if present)

Body:

```json
{
  "region": "ME",
  "bodyHex": "2931A27E5766218361F7DB81E894F2BB"
}
```

## cURL Quick Tests

```bash
curl http://localhost:3000/api/health
```

```bash
curl "http://localhost:3000/api/v1/account?region=IND&uid=1633864660"
```

```bash
curl "http://localhost:3000/api/v1/playerstats?region=IND&uid=1633864660&matchmode=CAREER"
```

```bash
curl "http://localhost:3000/api/v1/playertcstats?region=IND&uid=1633864660&matchmode=CAREER"
```

```bash
curl -X POST http://localhost:3000/api/galleryshow \
  -H "Content-Type: application/json" \
  -d '{"region":"ME","bodyHex":"2931A27E5766218361F7DB81E894F2BB"}'
```

## Deployment (Vercel)

`vercel.json` is included and routes all traffic to `server.js`.

Also configured:

- Cron ping every 5 minutes to `/api/health`

## Important Notes

- Endpoints in this repo are based on captured real requests.
- Protobuf decoding quality depends on schema coverage for the target game version.
- Keep account credentials private.

## License

Use for educational and interoperability purposes only. Ensure compliance with all applicable terms and laws in your region.
