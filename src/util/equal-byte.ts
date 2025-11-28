export function equalByte(a1: ArrayBuffer | Buffer | Uint8Array, b1: ArrayBuffer | Buffer | Uint8Array): boolean {
  let a: Uint8Array;
  let b: Uint8Array;
  if (a1 instanceof ArrayBuffer) {
    a = new Uint8Array(a1, 0);
  } else {
    a = a1;
  }
  if (b1 instanceof ArrayBuffer) {
    b = new Uint8Array(b1, 0);
  } else {
    b = b1;
  }
  if (a.byteLength !== b.byteLength) {
    return false;
  }
  const ua = new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
  const ub = new Uint8Array(b.buffer, b.byteOffset, b.byteLength);
  for (let i = ua.length; i > -1; i -= 1) {
    if (ua[i] !== ub[i]) {
      return false;
    }
  }
  return true;
}
