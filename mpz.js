'use strict'

/**
 * Helper to convert value to BigInt
 */
function toBigInt (v) {
  if (typeof v === 'bigint') return v
  if (typeof v === 'number') return BigInt(v)
  if (typeof v === 'string') return BigInt(v)
  return v
}

/**
 * Absolute value for BigInt
 */
function bigAbs (v) {
  v = toBigInt(v)
  return v < 0n ? -v : v
}

/**
 * Return the size of op measured in number of digits in the given base. base
 * can vary from 2 to 62. The sign of op is ignored, just the absolute value is
 * used. The result will be either exact or 1 too big. If base is a power of 2,
 * the result is always exact. If op is zero the return value is always 1.
 *
 * This function can be used to determine the space required when converting op
 * to a string. The right amount of allocation is normally two more than the
 * value returned by mpz_sizeinbase, one extra for a minus sign and one for the
 * null-terminator. */
export function sizeinbase (v, b) {
  return bigAbs(v).toString(b).length
}

export function sizeinbits (v) {
  const n = toBigInt(v)
  return n === 0n ? 0 : sizeinbase(n, 2)
}

/** Compare op1 and op2. Return a positive value if op1 > op2, zero if op1 =
 * op2, or a negative value if op1 < op2. */
export function cmp_ui (v, i) {
  v = toBigInt(v)
  i = toBigInt(i)
  if (v > i) return 1
  if (v < i) return -1
  return 0
}

/** Return a new BigInt whose value is 'v * 2^bitCount'. This operation
 * can also be defined as a left shift by bitCnt bits. */
export function lshift (v, bitCnt) {
  v = toBigInt(v)
  return v << toBigInt(bitCnt)
}

export const mul_2exp = lshift

/** Swap 2 values:
 * a = mpz.swap(b, b=a);
 */
export function swap (x) {
  return x
}

/** Returns a new BigInt that "looks" like a 2's complement of the given
 * number. Non-negative numbers are returned unchanged. For negative inputs,
 * when the returned value is converted to binary using toString(2), and the
 * most-significant "1" is sign extended to the desired number of bits, the
 * value will be a proper 2's complement representation of the input value.
 * Negative values will retain the negative sign.
 *
 * For example:
 *  -1 => -1
 *  -2 => -10
 *  -3 => -101
 *  -6 => -1010
 *  */
export function two_compl (v) {
  v = toBigInt(v)

  if (v >= 0n) { return v }
  if (v === -1n) { return v } // Otherwise we return -11

  const min1 = bigAbs(v) - 1n
  const inv = min1.toString(2).split('').map(function (c) {
    return c === '0' ? '1' : '0'
  })
  // BigInt doesn't support -0b... syntax, so we negate after parsing
  return -BigInt('0b1' + inv.join(''))
}

/** Test bit bit_index in op and return 0 or 1 accordingly. Assumes 2's
 * complement representation. */
export function tstbit (v, bitIdx) {
  if (bitIdx < 0) { throw new Error('Negative bit index') }
  v = two_compl(v)
  const bits = bigAbs(v).toString(2)

  if (bitIdx >= bits.length) {
    // negative values are sign-extended
    return v < 0n ? 1 : 0
  }

  // Instead of reversing the string/bits, reverse the index
  bitIdx = (bits.length - 1) - bitIdx
  return bits.charAt(bitIdx) === '0' ? 0 : 1
}

/** Returns a new BigInt created by calling fn() with pairs of bits from a
 * and b (starting with bit-0) and setting the corresponding bit in the new
 * number to the value returned by fn() which must be a "0" or "1". If one of
 * the numbers has fewer bits than the other, the shorter number is extended
 * with 0's (or 1's if it's a negative number) to match the length of the
 * longer one. */
function bin_map (a, b, fn) {
  a = two_compl(a)
  b = two_compl(b)
  let sa = bigAbs(a).toString(2).replace('-', '').split('').reverse()
  let sb = bigAbs(b).toString(2).replace('-', '').split('').reverse()

  // Swap so sa is the longest
  if (sa.length < sb.length) {
    const st = sa; const t = a
    sa = sb; a = b
    sb = st; b = t
  }

  const signExt = b < 0n ? '1' : '0'
  const res = sa.map(function (v, idx) {
    if (idx < sb.length) {
      return fn(v, sb[idx])
    } else {
      return fn(v, signExt)
    }
  })
  return BigInt('0b' + res.reverse().join(''))
}

/** Returns the bitwise or of the arguments. Assumes 2's complement
 * representation. */
export function or (a, b) {
  return bin_map(a, b, function (va, vb) {
    return va === '1' || vb === '1' ? '1' : '0'
  })
}

/** Returns the bitwise exclusive-or of the arguments. Assumes 2's complement
 * representation. */
export function xor (a, b) {
  return bin_map(a, b, function (va, vb) {
    return va === vb ? '0' : '1'
  })
}

/** Sets the specified bit. */
export function setbit (v, bitIdx) {
  if (bitIdx < 0) { throw new Error('Negative bit index') }
  v = toBigInt(v)
  const res = or(v, 1n << toBigInt(bitIdx))
  return v < 0n ? -res : res
}

export function set_str (s, base) {
  if (base === 16) {
    return BigInt('0x' + s)
  } else if (base === 2) {
    return BigInt('0b' + s)
  } else if (base === 8) {
    return BigInt('0o' + s)
  } else {
    // For other bases, parse manually
    return BigInt(parseInt(s, base))
  }
}

export const ORDER_MSB = true // +1 in GMP
export const ORDER_LSB = false // -1 in GMP
export const ENDIAN_MSB = 1
export const ENDIAN_LSB = -1
export const ENDIAN_HOST = 0 // Not supported

/** Returns a BigInt created from buf.
 *
 * The parameters specify the format of the data. Order can be ORDER_MSB for
 * most significant byte/word first or ORDER_LSB for least significant first in
 * the buffer. Within each word in the buffer, endian can be ENDIAN_MSB for
 * most significant byte first, ENDIAN_LSB for least significant first, or
 * ENDIAN_HOST for the native endianness of the host CPU.
 *
 * There is no sign taken from the data, the output will simply be a positive
 * integer.  An application can handle any sign itself.
*/
function mpzImport (orderMSB, endian, buf) {
  if (typeof buf === 'string') {
    const s = new Uint8Array(buf.length); s.forEach(function (v, i, s) { s[i] = buf.charCodeAt(i) }); buf = s
  }

  if (buf.BYTES_PER_ELEMENT > 2) throw new Error('Wrong type')

  // Put least significant word in buf[0]
  if (orderMSB === ORDER_MSB) {
    // Need to make a copy b/c reverse() modifies the input
    if (buf.BYTES_PER_ELEMENT === 1) {
      buf = new Uint8Array(buf)
    } else {
      buf = new Uint16Array(buf)
    }
    buf.reverse()
  }

  let res = 0n
  if (buf.BYTES_PER_ELEMENT === 1) {
    buf.forEach(function (elem, idx) {
      res = res + (toBigInt(elem) << toBigInt(8 * idx))
    })
  } else if (buf.BYTES_PER_ELEMENT === 2) {
    const view = new DataView(buf.buffer)
    const littleEndian = (endian === ENDIAN_LSB)

    for (let i = 0; i < view.byteLength; i = i + 2) {
      const v = view.getUint16(i, littleEndian)
      res = res + (toBigInt(v) << toBigInt(8 * i))
    }
  }
  return res
}

/** Returns a byte array with the contents of BigInt.
 * @param {Boolean} orderMSB
 */
function mpzExport (orderMSB, size, endian, val) {
  val = bigAbs(val)

  const a = []

  if (size === 1) {
    const div = 256n
    while (val !== 0n) {
      a.push(Number(val % div))
      val = val / div
    }
  } else {
    const word = 65536n
    while (val !== 0n) {
      const w = val % word
      a.push(Number(w))
      val = val / word
    }

    if (endian === ENDIAN_MSB) {
      a.forEach(function (val, idx, arr) {
        arr[idx] = (val >>> 8) | ((val & 0x00ff) << 8)
      })
    }
  }

  if (orderMSB === 1 || orderMSB === true) {
    a.reverse()
  }

  if (size === 1) {
    return Uint8Array.from(a)
  } else {
    return Uint16Array.from(a)
  }
}

// Export import/export with their original names (reserved words need this syntax)
export { mpzImport as import, mpzExport as export }
