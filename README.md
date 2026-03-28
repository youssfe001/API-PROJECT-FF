# 🎮 Free Fire API — Awesome Interface Edition

واجهة API حديثة ومنظمة للتعامل مع خدمات Free Fire بأسلوب احترافي وسهل الدمج.

> مبني بـ **Node.js + Express** مع دعم **JWT auth**, **protobuf encoding/decoding**, وعمليات **AES encrypted request replay**.

---

## ✨ Why this project?

هذا المشروع يعمل كـ **Proxy/API Layer** فوق طلبات Free Fire الحقيقية، بحيث يوفّر لك:

- واجهة REST واضحة بدل التعامل المباشر مع الحزم المعقدة.
- توحيد التحقق من المدخلات والأخطاء.
- دعم endpoints جاهزة للحساب والإحصائيات والبحث والـ wishlist.
- أدوات إضافية مثل `uid-generator`, `guest-generator`, و`like-spam`.

---

## 🧱 Tech Stack

- **Node.js**
- **Express**
- Native modules: `https`, `crypto`, `zlib`
- Custom protobuf helpers

---

## 📁 Project Structure

```txt
config/
  accounts.example.json
  guests.example.json
  constants.js
lib/
  auth.js
  credentials.js
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
  search.js
  galleryshow.js
  wishlist.js
  uidgenerator.js
  guestgenerator.js
  likespam.js
public/
server.js
vercel.json
```

---

## 🚀 Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create guest config (recommended):

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

Server URL:

- `http://localhost:3000`

---

## 🌐 API Endpoints

Base path: `/api`

### Core
- `GET /api/health`
- `GET /api/demo`

### Account & Stats
- `GET /api/v1/account?region=IND&uid=1633864660`
- `POST /api/account`
- `GET /api/v1/playerstats?region=IND&uid=1633864660&matchmode=CAREER`
- `POST /api/playerstats`
- `GET /api/v1/playertcstats?region=IND&uid=1633864660&matchmode=CAREER`
- `POST /api/playertcstats`

### Search / Gallery / Wishlist
- `GET /api/v1/search?region=IND&keyword=player`
- `POST /api/galleryshow`
- `GET /api/v1/wishlist?region=IND&uid=1633864660`
- `POST /api/wishlist`

### Utility
- `GET /api/uid-generator?mode=random&count=5&length=10&teamXdarks=1`
- `GET /api/guest-generator?region=IND`
- `POST /api/like-spam`

---

## 🧪 Sample Requests

Health check:

```bash
curl http://localhost:3000/api/health
```

Account info:

```bash
curl "http://localhost:3000/api/v1/account?region=IND&uid=1633864660"
```

Like spam (encrypted replay):

```bash
curl -X POST http://localhost:3000/api/like-spam \
  -H "Content-Type: application/json" \
  -d '{
    "region":"IND",
    "endpoint":"/LikeProfile",
    "encryptedHexBody":"abcdef0123456789",
    "count":10,
    "delayMs":100
  }'
```

---

## 🔐 Security Notes

- Never commit real credentials.
- Keep `config/accounts.json` and `config/guests.json` local/private.
- Rotate guest credentials regularly.

---

## ☁️ Deploy

`vercel.json` is already configured to route all traffic to `server.js`.

---

## ❤️ Credits

Built for practical request-driven Free Fire API workflows.
