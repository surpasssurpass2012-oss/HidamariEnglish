export default async function handler(req, res) {
  // POSTメソッドのみ許可（セキュリティ対策）
  // ブラウザからの「AIへの質問」を受け取ります
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 環境変数からAPIキーを取得
  // Vercelの管理画面で設定した「秘密の鍵」をここで読み込みます
  const apiKey = process.env.GEMINI_API_KEY;
  
  // もし鍵が設定されていなければエラーを返します
  if (!apiKey) {
    return res.status(500).json({ error: 'Server Configuration Error: API Key not found' });
  }

  try {
    // フロントエンド（画面）から送られてきたデータ（プロンプト等）を取り出します
    const payload = req.body;

    // Google Gemini APIの宛先（モデルは gemini-2.5-flash-preview-09-2025 を使用）
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    // ここでサーバーからGoogleへ問い合わせを行います
    // ユーザーにはAPIキーが見えないので安全です
    const googleResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // Googleからの応答がエラーだった場合の処理
    if (!googleResponse.ok) {
      const errorData = await googleResponse.json();
      throw new Error(`Gemini API Error: ${errorData.error?.message || googleResponse.statusText}`);
    }

    // Googleからの返事を受け取ります
    const data = await googleResponse.json();

    // その返事を、待っているフロントエンド（画面）に返します
    return res.status(200).json(data);

  } catch (error) {
    // 何か予期せぬエラーが起きた場合
    console.error("API Route Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
