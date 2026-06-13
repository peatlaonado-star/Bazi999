# STARVIA Cloudflare Workers (Phase 1)

Workers สำหรับ API ที่ย้ายมา Cloudflare:

## 1. starvia-lottery

จัดการข้อมูลหวยไทย:

| Endpoint | Method | คำอธิบาย |
|---|---|---|
| `/v1/lottery/results` | GET | ดึงผลหวยล่าสุด (จาก KV cache) |
| `/v1/lottery/refresh` | POST | อัปเดตจาก GLO API |
| `/v1/lottery/manual` | POST | ใส่ข้อมูลหวยเอง |

**Setup:**
```bash
cd workers/lottery
wrangler kv namespace create "STARVIA_LOTTERY_KV"
# คัดลอก ID ไปใส่ใน wrangler.toml
wrangler deploy
```

## 2. starvia-agent

Agent Card ตาม A2A Protocol:

| Endpoint | Method | คำอธิบาย |
|---|---|---|
| `/.well-known/agent.json` | GET | Agent Card (metadata) |
| `/v1/agent/tasks` | POST | ส่ง task ให้ agent |

**Setup:**
```bash
cd workers/agent
wrangler deploy
```

## Architecture

```
Frontend (CF Pages)
    │
    ├── /v1/lottery/*  → starvia-lottery.workers.dev
    └── /.well-known/* → starvia-agent.workers.dev

Legacy API (Node.js)
    ├── /v1/premium/*   (ย้ายเฟส 2)
    ├── /v1/admin/*     (ย้ายเฟส 2)
    ├── /v1/payment/*   (เก็บไว้)
    └── /v1/chat/*      (ย้ายไป LLM API)
```

## Testing

```bash
# Local
cd workers/lottery && wrangler dev
cd workers/agent && wrangler dev

# Production
curl https://starvia-lottery.workers.dev/v1/lottery/results
curl https://starvia-agent.workers.dev/.well-known/agent.json
```

## Notes

- KV namespace ต้องสร้างครั้งแรกด้วย `wrangler kv namespace create`
- ใช้ `wrangler secret put` สำหรับ secrets (ถ้ามี)
- Workers บน free tier: 100k requests/day, 10ms CPU time
