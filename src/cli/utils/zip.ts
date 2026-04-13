import archiver from "archiver";
import { Writable } from "node:stream";

export async function buildZip(
  buffers: Buffer[],
  names: string[],
  level = 6,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    const writable = new Writable({
      write(chunk: Buffer, _encoding, callback) {
        chunks.push(chunk);
        callback();
      },
    });

    const clampedLevel = Math.max(0, Math.min(9, level));
    const archive = archiver("zip", { zlib: { level: clampedLevel } });

    archive.on("error", reject);
    writable.on("finish", () => resolve(Buffer.concat(chunks)));

    archive.pipe(writable);

    for (let i = 0; i < buffers.length; i++) {
      const buf = buffers[i];
      const name = names[i];
      if (buf && name) {
        archive.append(buf, { name });
      }
    }

    archive.finalize();
  });
}
