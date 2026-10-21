// HL Supply — minimal PDF writer (Phase 9.2). Zero dependencies, Node only.
// Enough for the lookbook: A4 pages, Helvetica / Helvetica-Bold (standard
// fonts, WinAnsi encoding), filled rectangles, hairlines, baseline JPEG
// images (DCTDecode), word-wrapped text. Not a general-purpose library.

const fs = require("fs");

const A4 = { width: 595.28, height: 841.89 };

// Helvetica AFM widths (per 1000 em) for WinAnsi 32..126; bold overrides for letters.
const W_REG = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584];
const W_BOLD_LETTERS = { A:722,B:722,C:722,D:722,E:667,F:611,G:778,H:722,I:278,J:556,K:722,L:611,M:833,N:722,O:778,P:667,Q:778,R:722,S:667,T:611,U:722,V:667,W:944,X:667,Y:667,Z:611,a:556,b:611,c:556,d:611,e:556,f:333,g:611,h:611,i:278,j:278,k:556,l:278,m:889,n:611,o:611,p:611,q:611,r:389,s:556,t:333,u:611,v:556,w:778,x:556,y:556,z:500 };

// Unicode → WinAnsi (cp1252) byte, with sensible fallbacks.
const CP1252 = { "’": 0x92, "‘": 0x91, "“": 0x93, "”": 0x94, "–": 0x96, "—": 0x97, "…": 0x85, "·": 0xb7, "©": 0xa9, "é": 0xe9, "è": 0xe8, "ê": 0xea, "à": 0xe0, "ç": 0xe7, "ô": 0xf4, "ü": 0xfc, "ö": 0xf6, "ä": 0xe4, " ": 0x20, "•": 0x95, "®": 0xae, "™": 0x99, "×": 0xd7 };
function encode(str) {
  const out = [];
  for (const ch of String(str)) {
    const c = ch.codePointAt(0);
    if (c < 128) out.push(c);
    else if (CP1252[ch] != null) out.push(CP1252[ch]);
    else if (c >= 0xa0 && c <= 0xff) out.push(c);
    else out.push(0x3f);
  }
  return Buffer.from(out);
}
function pdfString(str) {
  const b = encode(str);
  let s = "";
  for (const c of b) {
    if (c === 0x28 || c === 0x29 || c === 0x5c) s += "\\" + String.fromCharCode(c);
    else if (c < 32 || c > 126) s += "\\" + c.toString(8).padStart(3, "0");
    else s += String.fromCharCode(c);
  }
  return "(" + s + ")";
}

function charWidth(ch, bold) {
  if (bold && W_BOLD_LETTERS[ch]) return W_BOLD_LETTERS[ch];
  const c = ch.codePointAt(0);
  if (c >= 32 && c <= 126) return W_REG[c - 32];
  if (CP1252[ch] === 0x92 || CP1252[ch] === 0x91) return 222;
  if (CP1252[ch] === 0x93 || CP1252[ch] === 0x94) return 333;
  if (CP1252[ch] === 0x96) return 556;
  if (CP1252[ch] === 0x97) return 1000;
  if (CP1252[ch] === 0x85) return 1000;
  return 556;
}
function textWidth(str, size, bold) {
  let w = 0;
  for (const ch of String(str)) w += charWidth(ch, bold);
  return (w / 1000) * size;
}
function wrap(str, size, maxWidth, bold) {
  const lines = [];
  for (const para of String(str).split(/\n/)) {
    const words = para.split(/\s+/).filter(Boolean);
    let line = "";
    for (const w of words) {
      const next = line ? line + " " + w : w;
      if (textWidth(next, size, bold) <= maxWidth || !line) line = next;
      else { lines.push(line); line = w; }
    }
    lines.push(line);
  }
  return lines;
}

// JPEG header: width, height, components; rejects non-JPEG.
function jpegInfo(buf) {
  if (!(buf[0] === 0xff && buf[1] === 0xd8)) return null;
  let i = 2;
  while (i < buf.length - 9) {
    if (buf[i] !== 0xff) { i++; continue; }
    const marker = buf[i + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
    const len = buf.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7), components: buf[i + 9], progressive: marker === 0xc2 || marker === 0xc6 || marker === 0xca || marker === 0xce };
    }
    i += 2 + len;
  }
  return null;
}

class Doc {
  constructor(opts) {
    opts = opts || {};
    this.objects = []; // strings or {dict, stream}
    this.pages = [];
    this.images = {}; // file → { name, obj }
    this.info = { Title: opts.title || "", Author: opts.author || "", Subject: opts.subject || "", Creator: "HL Supply build" };
    this.fontReg = this._add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
    this.fontBold = this._add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
    this.cur = null;
  }
  _add(obj) { this.objects.push(obj); return this.objects.length; } // 1-based ids

  addPage() {
    this.cur = { ops: [], images: new Set() };
    this.pages.push(this.cur);
    return this.cur;
  }
  get width() { return A4.width; }
  get height() { return A4.height; }

  // colors are [r,g,b] 0..1
  rect(x, y, w, h, fill) {
    this.cur.ops.push(`${fill.map((c) => c.toFixed(3)).join(" ")} rg ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
  }
  line(x1, y1, x2, y2, stroke, width) {
    this.cur.ops.push(`${stroke.map((c) => c.toFixed(3)).join(" ")} RG ${(width || 0.5).toFixed(2)} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
  }
  text(str, x, y, opts) {
    opts = opts || {};
    const size = opts.size || 10, bold = !!opts.bold, color = opts.color || [0, 0, 0];
    const font = bold ? "/F2" : "/F1";
    let tx = x;
    if (opts.align === "center") tx = x - textWidth(str, size, bold) / 2;
    else if (opts.align === "right") tx = x - textWidth(str, size, bold);
    const spacing = opts.letterSpacing ? ` ${opts.letterSpacing.toFixed(2)} Tc` : " 0 Tc";
    this.cur.ops.push(`BT ${font} ${size} Tf${spacing} ${color.map((c) => c.toFixed(3)).join(" ")} rg ${tx.toFixed(2)} ${y.toFixed(2)} Td ${pdfString(str)} Tj ET`);
    return textWidth(str, size, bold) + (opts.letterSpacing || 0) * String(str).length;
  }
  // wrapped paragraph; returns the y after the last line
  paragraph(str, x, y, maxWidth, opts) {
    opts = opts || {};
    const size = opts.size || 10, lead = opts.leading || size * 1.42;
    const lines = wrap(str, size, maxWidth, !!opts.bold);
    let yy = y;
    for (const ln of lines) { this.text(ln, x, yy, opts); yy -= lead; }
    return yy;
  }
  measure(str, size, maxWidth, bold, leading) {
    return wrap(str, size, maxWidth, !!bold).length * (leading || size * 1.42);
  }
  // baseline JPEG from disk, fitted inside a box (contain), centered
  image(file, x, y, boxW, boxH, opts) {
    opts = opts || {};
    if (!fs.existsSync(file)) return null;
    let img = this.images[file];
    if (!img) {
      const buf = fs.readFileSync(file);
      const info = jpegInfo(buf);
      if (!info) return null;
      const cs = info.components === 1 ? "/DeviceGray" : info.components === 4 ? "/DeviceCMYK" : "/DeviceRGB";
      const id = this._add({ dict: `<< /Type /XObject /Subtype /Image /Width ${info.width} /Height ${info.height} /ColorSpace ${cs} /BitsPerComponent 8 /Filter /DCTDecode${info.components === 4 ? " /Decode [1 0 1 0 1 0 1 0]" : ""} /Length ${buf.length} >>`, stream: buf });
      img = this.images[file] = { name: "/Im" + id, id, width: info.width, height: info.height };
    }
    const scale = opts.cover ? Math.max(boxW / img.width, boxH / img.height) : Math.min(boxW / img.width, boxH / img.height);
    const w = img.width * scale, h = img.height * scale;
    const dx = x + (boxW - w) / 2, dy = y + (boxH - h) / 2;
    this.cur.images.add(img.id);
    if (opts.cover) {
      this.cur.ops.push(`q ${x.toFixed(2)} ${y.toFixed(2)} ${boxW.toFixed(2)} ${boxH.toFixed(2)} re W n ${w.toFixed(2)} 0 0 ${h.toFixed(2)} ${dx.toFixed(2)} ${dy.toFixed(2)} cm ${img.name} Do Q`);
    } else {
      this.cur.ops.push(`q ${w.toFixed(2)} 0 0 ${h.toFixed(2)} ${dx.toFixed(2)} ${dy.toFixed(2)} cm ${img.name} Do Q`);
    }
    return { x: dx, y: dy, w, h };
  }

  render() {
    // page objects
    const pageIds = [];
    const pagesId = this.objects.length + 1 + this.pages.length * 2; // reserve: for each page a content + page object, then the Pages node
    for (const p of this.pages) {
      const content = Buffer.from(p.ops.join("\n"), "latin1");
      const cid = this._add({ dict: `<< /Length ${content.length} >>`, stream: content });
      const xo = [...p.images].map((id) => `/Im${id} ${id} 0 R`).join(" ");
      const pid = this._add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${A4.width} ${A4.height}] /Resources << /Font << /F1 ${this.fontReg} 0 R /F2 ${this.fontBold} 0 R >> /XObject << ${xo} >> >> /Contents ${cid} 0 R >>`);
      pageIds.push(pid);
    }
    const realPagesId = this._add(`<< /Type /Pages /Kids [${pageIds.map((i) => i + " 0 R").join(" ")}] /Count ${pageIds.length} >>`);
    if (realPagesId !== pagesId) throw new Error("pdf: pages id mismatch");
    const catalogId = this._add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
    const infoId = this._add(`<< ${Object.entries(this.info).filter(([, v]) => v).map(([k, v]) => `/${k} ${pdfString(v)}`).join(" ")} /CreationDate (D:${new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14)}Z) >>`);

    const parts = [Buffer.from("%PDF-1.4\n%\xe2\xe3\xcf\xd3\n", "latin1")];
    const offsets = [];
    let pos = parts[0].length;
    this.objects.forEach((obj, i) => {
      offsets.push(pos);
      let chunk;
      if (typeof obj === "string") chunk = Buffer.from(`${i + 1} 0 obj\n${obj}\nendobj\n`, "latin1");
      else chunk = Buffer.concat([Buffer.from(`${i + 1} 0 obj\n${obj.dict}\nstream\n`, "latin1"), obj.stream, Buffer.from("\nendstream\nendobj\n", "latin1")]);
      parts.push(chunk);
      pos += chunk.length;
    });
    const xref = ["xref", `0 ${this.objects.length + 1}`, "0000000000 65535 f "];
    for (const o of offsets) xref.push(String(o).padStart(10, "0") + " 00000 n ");
    const trailer = `trailer\n<< /Size ${this.objects.length + 1} /Root ${catalogId} 0 R /Info ${infoId} 0 R >>\nstartxref\n${pos}\n%%EOF\n`;
    parts.push(Buffer.from(xref.join("\n") + "\n" + trailer, "latin1"));
    return Buffer.concat(parts);
  }
}

module.exports = { Doc, A4, textWidth, wrap, jpegInfo };
