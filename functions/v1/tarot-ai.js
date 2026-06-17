// 🔮 AI Tarot Interpretation API
// Uses OpenAI to generate personalized tarot readings

const { json } = require('micro');
const cors = require('micro-cors')({ allowMethods: ['POST', 'OPTIONS'] });

// OpenAI API
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

module.exports = cors(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  try {
    const body = await json(req);
    const { card, category, orientation, spread, question } = body;

    if (!card || !category) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Missing card or category' }));
    }

    // Get OpenAI API key from environment
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Fallback to pre-written meaning
      return res.end(JSON.stringify({
        source: 'fallback',
        interpretation: card.meaning[category]?.[orientation] || card.meaning.general[orientation]
      }));
    }

    // Build prompt for AI interpretation
    const prompt = buildPrompt(card, category, orientation, spread, question);

    // Call OpenAI API
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `คุณเป็นนักทำนายไพ่ทาโร่ที่มีประสบการณ์ 20 ปี 
คุณอ่านไพ่แบบลึกซึ้ง เป็นกันเอง และให้คำแนะนำที่เป็นประโยชน์
ตอบเป็นภาษาไทย ใช้น้ำเสียงอบอุ่น เป็นธรรมชาติ
ไม่เกิน 150 คำ แบ่งเป็น 2-3 ย่อหน้า`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const interpretation = data.choices[0]?.message?.content;

    if (!interpretation) {
      throw new Error('No interpretation generated');
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      source: 'ai',
      interpretation,
      model: 'gpt-4o-mini'
    }));

  } catch (error) {
    console.error('Tarot AI error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ 
      error: 'AI interpretation failed',
      fallback: true
    }));
  }
});

function buildPrompt(card, category, orientation, spread, question) {
  const categoryNames = {
    love: 'ความรักและความสัมพันธ์',
    career: 'การงานและอาชีพ',
    money: 'การเงินและการลงทุน',
    health: 'สุขภาพและพลังงาน',
    general: 'ชีวิตโดยรวม'
  };

  const orientationText = orientation === 'up' ? 'ตั้งตรง' : 'กลับหัว';
  
  let prompt = `ไพ่ที่จั่วได้: ${card.thai} (${card.name}) ${card.emoji}
ลักษณะไพ่: ${orientationText}
หมวดหมู่: ${categoryNames[category] || category}
คำสำคัญ: ${card.keywords.join(', ')}

ความหมายพื้นฐาน:
- ด้านบวก: ${card.meaning[category]?.up || 'N/A'}
- ด้านลบ: ${card.meaning[category]?.down || 'N/A'}`;

  if (spread === 'past_present_future') {
    prompt += `\n\nรูปแบบการอ่าน: อดีต - ปัจจุบัน - อนาคต`;
  }

  if (question) {
    prompt += `\n\nคำถามของผู้ใช้: "${question}"`;
  }

  prompt += `\n\nกรุณาอ่านไพ่และให้คำทำนายที่เฉพาะเจาะจงกับสถานการณ์ของผู้ใช้`;

  return prompt;
}
