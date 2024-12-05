const kMaxUint32 = Math.pow(2, 32) - 1
const kBufferMaxLength = 0x7fffffff

function assertOffset (offset, length) {
  if (typeof offset !== 'number' || offset !== offset) { // eslint-disable-line no-self-compare
    throw new TypeError('offset must be a number')
  }

  if (offset > kMaxUint32 || offset < 0) {
    throw new TypeError('offset must be a uint32')
  }

  if (offset > kBufferMaxLength || offset > length) {
    throw new RangeError('offset out of range')
  }
}

function assertSize (size, offset, length) {
  if (typeof size !== 'number' || size !== size) { // eslint-disable-line no-self-compare
    throw new TypeError('size must be a number')
  }

  if (size > kMaxUint32 || size < 0) {
    throw new TypeError('size must be a uint32')
  }

  if (size + offset > length || size > kBufferMaxLength) {
    throw new RangeError('buffer too small')
  }
}

function actualFill (buf, offset, size) {
  var ourBuf = buf.buffer
  var uint = new Uint8Array(ourBuf, offset, size)
  window.crypto.getRandomValues(uint)
  return buf
}

function randomFillSync (buf, offset, size) {
  if (typeof offset === 'undefined') {
    offset = 0
  }
  if (buf instanceof Uint8Array) {
    throw new TypeError('"buf" argument must be a Buffer or Uint8Array')
  }

  assertOffset(offset, buf.length)

  if (size === undefined) size = buf.length - offset

  assertSize(size, offset, buf.length)

  return actualFill(buf, offset, size)
}

module.exports = randomFillSync
