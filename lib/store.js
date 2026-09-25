import { get, put, BlobNotFoundError, BlobPreconditionFailedError } from "@vercel/blob";

// The whole dibs list lives in one private JSON file in Vercel Blob.
const FILE = "dibs.json";

export async function readDibs() {
  try {
    const r = await get(FILE, { access: "private", useCache: false });
    return { items: await new Response(r.stream).json(), etag: r.blob.etag };
  } catch (e) {
    if (e instanceof BlobNotFoundError) return { items: [], etag: null };
    throw e;
  }
}

// Read-modify-write; `change` returns the new list, or null to skip writing.
// ifMatch makes a concurrent write fail instead of silently overwriting, so we retry.
export async function updateDibs(change) {
  let lastError;
  for (let attempt = 0; attempt < 5; attempt++) {
    const { items, etag } = await readDibs();
    const next = change(items);
    if (!next) return;
    try {
      await put(FILE, JSON.stringify(next), {
        access: "private",
        contentType: "application/json",
        addRandomSuffix: false,
        allowOverwrite: etag !== null,
        ...(etag && { ifMatch: etag }),
      });
      return;
    } catch (e) {
      // With no etag, a concurrent first write shows up as "already exists" instead.
      if (!(e instanceof BlobPreconditionFailedError) && etag !== null) throw e;
      lastError = e;
    }
  }
  throw lastError;
}
