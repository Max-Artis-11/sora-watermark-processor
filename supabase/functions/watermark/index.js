export default async function handler(req, res) {
  try {
    const { filePath, watermarkType } = await req.json();

    const response = await fetch("https://sora-watermark-processor.onrender.com/watermark", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filePath, watermarkType }),
    });

    const data = await response.json();
    if (!data.success) return res.status(500).json(data);

    return res.status(200).json(data);  // returns { success:true, url:"..." }

  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
