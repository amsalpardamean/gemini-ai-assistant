import "dotenv/config";
import express from "express";
import multer from "multer";
import fs from "fs/promises";
import {GoogleGenAI} from "@google/genai";

const app = express();
const upload = multer();
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

const GEMINI_MODELS = "gemini-2.5-flash";

app.use(express.json());

const PORT = 3000;

app.listen(PORT, () => {console.log(`server ready on http://localhost:${PORT}`)});

app.post("/generate-text", async (req, res) => {
  const {prompt} = req.body;
  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODELS,
      contents: prompt
    });
    res.status(200).json({result: response.text});
  } catch (e) {
    console.error(e);
    res.status(500).json({message: e.message || "Error generating text" });
  }
});

app.post("/generate-from-image", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Image file is required" });
  }
  const {prompt} = req.body;
  const base64Image = req.file.buffer.toString("base64");
  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODELS,
      contents: [
        {text: prompt, type: "text"},
        {inlineData: { data: base64Image, mimeType: req.file.mimetype }}
      ]
    });
    res.status(200).json({result: response.text});
  } catch (e) {
    console.error(e);
    res.status(500).json({message: e.message || "Error generating image"});
  }
});

app.post("/generate-from-document", upload.single("document"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Document file is required" });
  }
  const {prompt} = req.body;
  const base64document = req.file.buffer.toString("base64");

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODELS,
      contents: [
        {text: prompt ?? "Tolong buat ringkasan dari dokumen berikut.", type: "text"},
        {inlineData: { data: base64document, mimeType: req.file.mimetype }}
      ],
    });
    res.status(200).json({result: response.text});
  } catch (e) {
    console.error(e);
    res.status(500).json({message: e.message || "Error generating content from document"});
  }
});

app.post("/generate-from-audio", upload.single("audio"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Audio file is required" });
  }
  const {prompt} = req.body;
  const base64Audio = req.file.buffer.toString("base64");

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODELS,
      contents: [
        {text: prompt ?? "Tolong buat transkripsi dari rekaman berikut.", type: "text"},
        {inlineData: { data: base64Audio, mimeType: req.file.mimetype }}
      ]
    });
    res.status(200).json({result: response.text});
  } catch (e) {
    console.error(e);
    res.status(500).json({message: e.message || "Error generating content from audio"});
  }
});
