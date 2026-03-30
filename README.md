# Free Fire API — Production Edition

واجهة API حديثة ومنظمة للتعامل مع خدمات Free Fire بأسلوب احترافي وسهل الدمج.

> مبني بـ **Node.js + Express** مع دعم **JWT auth**, **protobuf encoding/decoding**, وعمليات **AES encrypted request replay**.

---

## Why this project?

هذا المشروع يعمل كـ **Proxy/API Layer** فوق طلبات Free Fire الحقيقية، بحيث يوفّر لك:

- واجهة REST واضحة بدل التعامل المباشر مع الحزم المعقدة.
- توحيد التحقق من المدخلات والأخطاء.
- دعم endpoints جاهزة للحساب والإحصائيات والبحث والـ wishlist وفحص الحظر.
- أدوات إضافية مثل `uid-generator`, `guest-generator`, و`like-spam`.
- **Production hardened** — CORS, rate limiting, API key auth, security headers, caching.

---

## Tech Stack

- **Node.js + Express**
- **helmet** — security headers (CSP, HSTS, etc.)
- **cors** — cross-origin resource sharing
- **express-rate-limit** — request throttling
- **sharp** — HD icon upscaling
- **compression** — gzip responses
- Custom protobuf helpers & AES encryption

---

## Project Structure

```txt
server.js                  # Express app — middleware stack + routes
vercel.json                # Vercel serverless config
config/
  constants.js             # Regions, endpoints, headers
  accounts.json            # Account credentials (gitignored)
  guests.json              # Guest credentials (gitignored)
lib/
  auth.js                  # Garena JWT authentication
  credentials.js           # Credential management
  crypto.js                # AES-128-CBC encryption
  request.js               # FF HTTPS request helpers
  proto.js                 # Protobuf wrapper
  validate.js              # Input validation + error handler
  apiKeyAuth.js            # API key authentication middleware
  rateLimit.js             # Rate limiting middleware
  protobuf/
    varint.js              # Varint codec
    encoder.js             # Protobuf encoder
    decoder.js             # Protobuf decoder
    schemas.js             # FF message schemas
routes/
  health.js                # Health check
  account.js               # Player account info
  playerstats.js           # BR match stats
  playertcstats.js         # CS/Team Clash stats
  search.js                # Fuzzy player search
  bancheck.js              # Ban status checking
  galleryshow.js           # Gallery info
  wishlist.js              # Wishlist items
  uidgenerator.js          # UID generation utility
  guestgenerator.js        # Guest credential provider
  likespam.js              # Like automation
  items.js                 # Item DB + icon upscaling
data/
  items.json               # 30k+ item database
  item-assets.json         # Enriched item metadata
public/
  demo.html                # Interactive dashboard
  styles.css               # Fire theme styles
  assets/                  # Dashboard assets
scripts/
  sync-item-assets.js      # Item metadata sync utility
```

---

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create guest config:

```bash
cp config/guests.example.json config/guests.json
```

3. Fill `config/guests.json` with valid guest credentials per region:

```json
{
  "IND": [
    { "uid": "1234567890", "password": "guest_password_here" }
  ]
}
```

4. Start server:

```bash
npm start
```

Public Demo: `https://fyrelab.vercel.app/api/demo`

---

## Environment Variables

All optional — the API works out of the box with sensible defaults.

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `API_KEYS` | *(none)* | Comma-separated API keys. If unset, all endpoints are public |
| `CORS_ORIGIN` | `*` | Allowed CORS origin (e.g. `https://mysite.com`) |
| `RATE_LIMIT_GLOBAL` | `100` | Max requests per minute per IP (all endpoints) |
| `RATE_LIMIT_STRICT` | `5` | Max requests per minute per IP (like-spam) |
| `UPSTREAM_TIMEOUT_MS` | `15000` | Upstream FF request timeout in ms |
| `NODE_ENV` | *(none)* | Set to `production` to hide internal error details |
| `DOCS_URL` | *(none)* | Link to API docs (shown in landing JSON) |

---

## API Endpoints

Base path: `/api`

### Landing & Dashboard
- `GET /` — JSON API info (version, endpoints, status)
- `GET /api/demo` — Interactive dashboard

### Core
- `GET /api/health`

### Account & Stats
- `GET /api/v1/account?region=IND&uid=1633864660`
- `POST /api/account`
- `GET /api/v1/playerstats?region=IND&uid=1633864660&matchmode=CAREER`
- `POST /api/playerstats`
- `GET /api/v1/playertcstats?region=IND&uid=1633864660&matchmode=CAREER`
- `POST /api/playertcstats`

### Search / Ban Check / Gallery / Wishlist
- `GET /api/v1/search?region=IND&keyword=player`
- `GET /api/v1/bancheck?uid=1633864660`
- `POST /api/galleryshow`
- `GET /api/v1/wishlist?region=IND&uid=1633864660`
- `POST /api/wishlist`

### Utility
- `GET /api/uid-generator?mode=random&count=5&length=10&teamXdarks=1`
- `GET /api/guest-generator?region=IND`
- `POST /api/like-spam`

### Items
- `GET /api/items?id=101000005`
- `GET /api/items?id=101000005,101000006` *(batch)*
- `GET /api/items/search?q=olivia&limit=10`
- `GET /api/items/icon/101000005.png?size=128&upscale=4&engine=ai-fast`

---

## Authentication

If `API_KEYS` is set, include the key in your requests:

```bash
curl -H "x-api-key: YOUR_KEY" "https://fyrelab.vercel.app/api/v1/account?region=IND&uid=123"
```

Exempt endpoints (no key needed): `/api/health`, `/api/demo`

---

## Rate Limiting

- **Global**: 100 requests/min per IP across all endpoints
- **Strict**: 5 requests/min per IP on `/api/like-spam`
- Rate limit info in response headers: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`

---

## Sample Requests

```bash
# Health check
curl http://localhost:3000/api/health

# Landing page (API info)
curl http://localhost:3000/

# Account info
curl "http://localhost:3000/api/v1/account?region=IND&uid=1633864660"

# Ban check
curl "http://localhost:3000/api/v1/bancheck?uid=1633864660"

# Item search
curl "http://localhost:3000/api/items/search?q=katana"

# HD icon (ai-fast engine, 4x upscale)
curl "http://localhost:3000/api/items/icon/101000005.png?size=128&upscale=4&engine=ai-fast" -o icon.png
```

---

## Security Notes

- Never commit real credentials
- Keep `config/accounts.json` and `config/guests.json` local/private
- Rotate guest credentials regularly
- Security headers (helmet) enabled by default
- Set `API_KEYS` in production for access control

---

## Deploy

`vercel.json` is configured to route all traffic to `server.js`. Push to GitHub and Vercel auto-deploys.

Set environment variables in **Vercel Project Settings > Environment Variables**.

---

## Credits

Built for practical request-driven Free Fire API workflows.
