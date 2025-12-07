import { createClient } from "@supabase/supabase-js";
import { execFile } from "child_process";
import express from "express";
import fs from "fs";
import path from "path";

const app = express();
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const FFMPEG_PATH = "/usr/bin/ffmpeg";

function runFFmpeg(args) {
  return new Promise((resolve, reject) => {
    execFile(FFMPEG_PATH, args, (err, stdout, stderr) => {
      if (err) return reject(stderr || err.message);
      resolve(stdout);
    });
  });
}

app.post("/watermark", async (req, res) => {
  try {
    const { filePath, watermarkType } = req.body;
    if (!filePath) throw new Error("filePath required");

    const ext = path.extname(filePath) || ".mp4";
    const inputPath = `/tmp/input${ext}`;
    const outputPath = `/tmp/output${ext}`;

    const { data, error } = await supabase.storage.from("videos").download(filePath);
    if (error) throw error;

    fs.writeFileSync(inputPath, Buffer.from(await data.arrayBuffer()));

    // ---------------- WATERMARK MODE ----------------
    if (watermarkType === "add") {
      const watermarkFile = path.resolve("./sorawatermark.gif");
      if (!fs.existsSync(watermarkFile)) throw new Error("Watermark file missing");

      const overlayX = "if(lt(mod(t\\,9.9)\\,3.3)\\,50\\,if(lt(mod(t\\,9.9)\\,6.6)\\,main_w-overlay_w-50\\,50))";
      const overlayY = "if(lt(mod(t\\,9.9)\\,3.3)\\,50\\,if(lt(mod(t\\,9.9)\\,6.6)\\,(main_h-overlay_h)/2\\,main_h-overlay_h-50))";

      const args = [
        "-y","-i",inputPath,"-ignore_loop","0","-i",watermarkFile,
        "-filter_complex",
        `[1:v] scale=-1:50 [ov]; [0:v][ov] overlay=x='${overlayX}':y='${overlayY}':shortest=1,format=yuv420p`,
        "-c:v","libx264","-crf","18","-preset","veryfast",
        "-c:a","copy",
        outputPath
      ];

      await runFFmpeg(args);
    } 

    // ---------------- NO WATERMARK MODE ----------------
    else {
      fs.copyFileSync(inputPath, outputPath);
    }

    const outBuffer = fs.readFileSync(outputPath);

    await supabase.storage.from("videos").upload(filePath, outBuffer, { upsert: true });

    // Generate **public downloadable url**
    const { data: urlData } = supabase.storage.from("videos").getPublicUrl(filePath);

    return res.json({
      success: true,
      url: urlData.publicUrl
    });

  } catch (err) {
    console.error("Watermark Error:", err);
    return res.status(500).json({ success: false, error: String(err) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Watermark server running on port ${PORT}`));
