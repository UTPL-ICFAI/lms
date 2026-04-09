const fs = require("fs");
const path = require("path");

const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const Tesseract = require("tesseract.js");
const JSZip = require("jszip");
const { XMLParser } = require("fast-xml-parser");

function inferExt(originalName = "", mimeType = "") {
  const ext = (path.extname(originalName) || "").toLowerCase();
  if (ext) return ext.replace(".", "");
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    return "docx";
  if (mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation")
    return "pptx";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("text/")) return "txt";
  return "other";
}

async function extractPdf(buffer) {
  const data = await pdfParse(buffer);
  return (data.text || "").trim();
}

async function extractDocx(buffer) {
  const res = await mammoth.extractRawText({ buffer });
  return (res.value || "").trim();
}

async function extractPptx(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const slidePaths = Object.keys(zip.files)
    .filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p))
    .sort((a, b) => {
      const na = Number(a.match(/slide(\d+)\.xml/)[1]);
      const nb = Number(b.match(/slide(\d+)\.xml/)[1]);
      return na - nb;
    });

  const parser = new XMLParser({ ignoreAttributes: false });
  const texts = [];

  for (const p of slidePaths) {
    const xml = await zip.files[p].async("string");
    const json = parser.parse(xml);
    // Pptx text nodes are often in a:t elements under a:r (runs)
    const collected = [];
    const stack = [json];
    while (stack.length) {
      const node = stack.pop();
      if (!node || typeof node !== "object") continue;
      for (const [k, v] of Object.entries(node)) {
        if (k === "a:t") {
          if (typeof v === "string") collected.push(v);
          else if (Array.isArray(v)) v.forEach((x) => typeof x === "string" && collected.push(x));
        } else if (typeof v === "object") {
          stack.push(v);
        }
      }
    }
    const slideText = collected.join(" ").replace(/\s+/g, " ").trim();
    if (slideText) texts.push(slideText);
  }

  return texts.join("\n\n").trim();
}

async function extractImageOcr(buffer) {
  const { data } = await Tesseract.recognize(buffer, "eng");
  return (data?.text || "").trim();
}

async function extractTextFromUpload({ filePath, originalName, mimeType }) {
  const buffer = fs.readFileSync(filePath);
  const kind = inferExt(originalName, mimeType);

  if (kind === "pdf") return { text: await extractPdf(buffer), kind };
  if (kind === "docx") return { text: await extractDocx(buffer), kind };
  if (kind === "pptx") return { text: await extractPptx(buffer), kind };
  if (kind === "image") return { text: await extractImageOcr(buffer), kind };
  if (kind === "txt") return { text: buffer.toString("utf8").trim(), kind };

  return { text: "", kind };
}

module.exports = { extractTextFromUpload, inferExt };

