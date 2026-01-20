// Node.jsの標準的な書き方に変更
module.exports = async (req, res) => {
  // POSTメソッドのみ許可
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server Config Error: API Key missing' });
  }

  try {
    const payload = req.body;
    // 安定版モデルを使用
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    // Node.js環境(18以上)ではfetchが使えますが、念のためtry-catch内で実行
    const googleResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!googleResponse.ok) {
      const errorData = await googleResponse.json();
      console.error("Gemini Error:", JSON.stringify(errorData));
      throw new Error(errorData.error?.message || googleResponse.statusText);
    }

    const data = await googleResponse.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: error.message });
  }
};
