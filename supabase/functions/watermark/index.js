export default async function handler(req, res) {
  try {
    const { filePath, watermarkType } = await req.json();

    const response = await fetch("https://sora-watermark-processor.onrender.com/watermark", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filePath, watermarkType }),
    });

    const data = await response.json();
    return res.status(response.status).json(data);

  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
