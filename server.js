const express = require("express");

const app = express();
const PORT = process.env.PORT || 10000;

// URL Google Apps Script chỉ nằm ở biến môi trường trên Render.
// Không đưa URL này vào HTML/JS frontend.
const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;

app.use(express.json({ limit: "100kb" }));
app.use(express.static("public"));

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/submit", async (req, res) => {
  if (!GOOGLE_SCRIPT_URL) {
    return res.status(500).json({
      ok: false,
      message: "GOOGLE_SCRIPT_URL chưa được cấu hình trên Render."
    });
  }

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(req.body)
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { ok: response.ok, raw: text };
    }

    if (!response.ok) {
      return res.status(502).json({
        ok: false,
        message: "Google Apps Script trả về lỗi.",
        upstream: data
      });
    }

    return res.json(data);
  } catch (error) {
    console.error(error);
    return res.status(502).json({
      ok: false,
      message: "Không thể kết nối Google Apps Script."
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
