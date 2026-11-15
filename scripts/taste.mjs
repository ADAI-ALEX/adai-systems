// Serves the taste vault at http://localhost:4319/taste. Local only.
// The vault is not part of the Next.js app, so it can never be linked or deployed.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const types = { ".html": "text/html; charset=utf-8", ".json": "application/json", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

createServer(async (req, res) => {
  const url = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  const rel = url === "/taste" || url === "/taste/" ? "taste/index.html" : url.slice(1);
  const file = path.resolve(root, rel);
  const allowed = [path.join(root, "taste") + path.sep, path.join(root, "references") + path.sep];
  if (!allowed.some((dir) => file.startsWith(dir))) return res.writeHead(404).end("Not found");
  try {
    const body = await readFile(file);
    res.writeHead(200, { "content-type": types[path.extname(file)] ?? "application/octet-stream", "x-robots-tag": "noindex" }).end(body);
  } catch {
    res.writeHead(404).end("Not found");
  }
}).listen(4319, "127.0.0.1", () => console.log("Taste vault: http://localhost:4319/taste"));
