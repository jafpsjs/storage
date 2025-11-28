/* node:coverage disable */
import type { Buffer } from "node:buffer";
import type { Readable } from "node:stream";

/* node:coverage enable */

function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  if (arrays.length === 0) {
    return new Uint8Array(0);
  }
  const totalLength = arrays.reduce((accumulator, currentValue) => accumulator + currentValue.length, 0);
  const returnValue = new Uint8Array(totalLength);
  let offset = 0;
  for (const array of arrays) {
    returnValue.set(array, offset);
    offset += array.length;
  }
  return returnValue;
}

export async function readableToUint8Array(stream: Readable): Promise<Uint8Array> {
  return concatUint8Arrays(await Array.fromAsync<Buffer>(stream));
}
