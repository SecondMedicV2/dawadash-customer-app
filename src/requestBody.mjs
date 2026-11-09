const JSON_REQUEST_MAX_BYTES = 64 * 1024;

export class RequestBodyError extends Error {
  constructor(status) {
    super('Request body unavailable.');
    this.status = status;
  }
}

function mediaType(request) {
  return request.headers.get('Content-Type')?.split(';', 1)[0].trim().toLowerCase();
}

export async function readBodyBytes(request, maxBytes) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes <= 0) throw new RequestBodyError(503);
  const length = request.headers.get('Content-Length');
  if (length !== null) {
    if (!/^\d+$/.test(length)) throw new RequestBodyError(400);
    if (Number(length) > maxBytes) throw new RequestBodyError(413);
  }
  if (!request.body) return new Uint8Array();

  const reader = request.body.getReader();
  let bytes = new Uint8Array(0);
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const nextSize = size + value.byteLength;
      if (nextSize > maxBytes) {
        // Stop reading but don't cancel: cancelling a FormData-backed body makes the runtime's
        // body generator enqueue into a closed stream, raising an uncatchable unhandled rejection.
        // The unread remainder is discarded with the request once the 413 response is sent.
        throw new RequestBodyError(413);
      }
      if (nextSize > bytes.length) {
        const expanded = new Uint8Array(Math.min(maxBytes, Math.max(4096, nextSize, bytes.length * 2)));
        expanded.set(bytes);
        bytes = expanded;
      }
      bytes.set(value, size);
      size = nextSize;
    }
  } finally {
    reader.releaseLock();
  }

  return bytes.subarray(0, size);
}

export async function readJsonObject(request) {
  if (mediaType(request) !== 'application/json') throw new RequestBodyError(415);
  const bytes = await readBodyBytes(request, JSON_REQUEST_MAX_BYTES);
  let value;
  try {
    value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    throw new RequestBodyError(400);
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new RequestBodyError(400);
  return value;
}

export async function readMultipart(request, maxBytes) {
  if (mediaType(request) !== 'multipart/form-data') throw new RequestBodyError(415);
  const bytes = await readBodyBytes(request, maxBytes);
  try {
    return await new Response(bytes, { headers: { 'Content-Type': request.headers.get('Content-Type') } }).formData();
  } catch {
    throw new RequestBodyError(400);
  }
}
