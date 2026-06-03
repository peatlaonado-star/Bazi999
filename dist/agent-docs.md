# 🤖 Starvia Agent Card (A2A Protocol)

Starvia เป็น **AI Agent** ที่ agent อื่นเรียกใช้ได้ผ่าน [A2A Protocol](https://a2a-protocol.org/)

## 📍 Endpoints

| URL | Method | Purpose |
|-----|--------|---------|
| `/.well-known/agent.json` | GET | Agent Card (metadata) |
| `/v1/agent/tasks` | POST | A2A task send |

## 🎯 Skills (5)

1. **birthday_reading** — คำทำนายจากวันเกิด
2. **daily_fortune** — ดวงวันนี้ (love/work/money/general)
3. **lottery_results** — ผลหวยไทยงวดล่าสุด
4. **premium_verify** — ตรวจ PIN Premium
5. **chat_consultation** — แชทกับ "ดารา" AI

## 🚀 Quick Test

### 1. Get Agent Card
```bash
curl https://starvia.website/.well-known/agent.json | jq
```

### 2. Call a Skill
```bash
# Lottery results
curl -X POST https://starvia.website/v1/agent/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "id": "1",
    "params": {
      "skillId": "lottery_results",
      "input": {}
    }
  }'
```

### 3. Response Format
```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "result": {
    "id": "task_xxx",
    "status": { "state": "completed" },
    "artifacts": [{
      "parts": [{
        "type": "application/json",
        "data": { "success": true, "results": { ... } }
      }]
    }]
  }
}
```

## 🐍 Python Example

```python
import requests

BASE = "https://starvia.website"

# 1. Discover Starvia
card = requests.get(f"{BASE}/.well-known/agent.json").json()
print(f"Starvia: {card['description']}")
print(f"Skills: {[s['id'] for s in card['skills']]}")

# 2. Call lottery
resp = requests.post(f"{BASE}/v1/agent/tasks", json={
    "id": "1",
    "params": {
        "skillId": "lottery_results",
        "input": {}
    }
})
data = resp.json()["result"]["artifacts"][0]["parts"][0]["data"]
print(f"Latest: {data['results']['firstPrize']}")
```

## 🌐 Integration Ideas

- **Chatbot platform** (LINE, Messenger) → เรียก lottery_results ตอนลูกค้าถาม
- **AI Assistant** (Claude, ChatGPT) → เรียก chat_consultation เป็น fallback
- **Multi-agent workflow** → Starvia + Banking agent → ตอบคำถามการเงิน + ดวง
- **Mobile app** → ใช้ premium_verify ใน app ตัวเอง

## 📜 Spec

ตาม [A2A Protocol v0.2.0](https://github.com/google/A2A):
- ✅ `name`, `description`, `version`
- ✅ `skills[]` with `id`, `name`, `description`, `examples`, `inputSchema`, `outputSchema`
- ✅ `endpoints` (base + paths)
- ✅ `authentication` (schemes)
- ✅ `capabilities` (streaming, push, state history)
- ✅ `defaultInputModes`, `defaultOutputModes`
- ✅ `pricing` (optional)
- ✅ A2A JSON-RPC 2.0 task format
