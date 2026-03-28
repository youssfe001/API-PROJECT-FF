# Free Fire API (Node.js + Express)

Practical, request-driven Free Fire API proxy built with Node.js and Express.

This project adds endpoints incrementally from real captured requests.

## What This API Provides

- Account profile endpoint
- BR stats endpoint
- CS stats endpoint
- Gallery show endpoint
- Wishlist endpoint
- UID generator endpoint
- JWT auth + region server resolution + 5-minute cache

## Stack

- Node.js
- Express
- `https`, `crypto`, `zlib`
- Custom Protobuf parser/encoder

## Project Structure

```txt
config/
  accounts.example.json
  constants.js
lib/
  auth.js
  crypto.js
  request.js
  proto.js
  validate.js
  protobuf/
routes/
  health.js
  account.js
  playerstats.js
  playertcstats.js
  galleryshow.js
  wishlist.js
  uidgenerator.js
server.js
vercel.json
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create account config from template:

```bash
cp config/accounts.example.json config/accounts.json
```

3. Fill `config/accounts.json` with your own credentials.

4. Start server:

```bash
npm start
```

Server:

- `http://localhost:3000`

## Endpoints

Base: `/api`

- `GET /api/health`
- `GET /api/v1/account?region=IND&uid=1633864660`
- `POST /api/account`
- `GET /api/v1/playerstats?region=IND&uid=1633864660&matchmode=CAREER`
- `POST /api/playerstats`
- `GET /api/v1/playertcstats?region=IND&uid=1633864660&matchmode=CAREER`
- `POST /api/playertcstats`
- `POST /api/galleryshow`
- `POST /api/wishlist`
- `GET /api/uid-generator?mode=random&count=5&length=10&teamXdarks=1`

## Quick Test

```bash
curl http://localhost:3000/api/health
```

```bash
curl "http://localhost:3000/api/v1/account?region=IND&uid=1633864660"
```

## Vercel

`vercel.json` is configured to route all traffic to `server.js`.

## Security Notes

- Do not commit real account credentials.
- `config/accounts.json` is ignored by git.
- Keep tokens and secrets outside source control.
