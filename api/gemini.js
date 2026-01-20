const https = require('https');

module.exports = async (req, res) => {
  // 1. CORSエラー対策（ブラウザからのアクセスを許可）
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // プリフライトリクエスト（確認通信）への応答
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 2. メソッドチェック
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 3. APIキーチェック
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server Config Error: API Key missing' });
  }

  // 4. Gemini APIへのリクエスト（httpsモジュール使用）
  const payload = JSON.stringify(req.body);
  const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  return new Promise((resolve, reject) => {
    const apiReq = https.request(options, (apiRes) => {
      let data = '';
      apiRes.on('data', (chunk) => { data += chunk; });
      apiRes.on('end', () => {
        if (apiRes.statusCode >= 200 && apiRes.statusCode < 300) {
          try {
            res.status(200).json(JSON.parse(data));
          } catch (e) {
            res.status(500).json({ error: 'JSON Parse Error' });
          }
        } else {
          console.error("Gemini API Error:", data);
          res.status(apiRes.statusCode).json({ error: `Gemini API Error: ${data}` });
        }
        resolve();
      });
    });

    apiReq.on('error', (e) => {
      console.error("Request Error:", e);
      res.status(500).json({ error: e.message });
      resolve();
    });

    apiReq.write(payload);
    apiReq.end();
  });
};
