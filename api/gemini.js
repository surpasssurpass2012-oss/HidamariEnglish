const https = require('https');

module.exports = async (req, res) => {
  // 1. CORSエラー対策（ブラウザからのアクセスを許可）
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // プリフライトリクエストへの応答
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  // 2. メソッドチェック
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  // 3. APIキーチェック
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Server Config Error: API Key missing' }));
    return;
  }

  // 4. リクエストデータの準備
  let payloadStr;
  try {
    // Vercelが既にパースしている場合はオブジェクト、そうでなければ文字列として処理
    payloadStr = (typeof req.body === 'object') ? JSON.stringify(req.body) : req.body;
    
    if (!payloadStr) throw new Error("Empty Body");
  } catch (e) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Invalid Request Body' }));
    return;
  }

  // 5. Gemini APIへのリクエスト設定
  const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payloadStr)
    }
  };

  // 6. Gemini APIへの送信実行
  const apiReq = https.request(options, (apiRes) => {
    let data = '';

    apiRes.on('data', (chunk) => {
      data += chunk;
    });

    apiRes.on('end', () => {
      // Geminiからの応答をそのままフロントエンドに返す
      res.statusCode = apiRes.statusCode;
      res.setHeader('Content-Type', 'application/json');
      res.end(data);
    });
  });

  apiReq.on('error', (e) => {
    console.error("Gemini API Request Error:", e);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: e.message }));
  });

  // データを送信
  apiReq.write(payloadStr);
  apiReq.end();
};
