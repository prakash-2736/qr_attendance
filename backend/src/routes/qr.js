import express from "express";
import QRCode from "qrcode";

const router = express.Router();

/* ✅ GENERATE QR IMAGE FROM TOKEN */
router.get("/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const qrImage = await QRCode.toBuffer(token);

    res.set("Content-Type", "image/png");
    res.send(qrImage);
  } catch (error) {
    res.status(500).json({ message: "QR generation failed" });
  }
});

export default router;
