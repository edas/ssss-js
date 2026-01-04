'use strict'

const MPZ = function () {}

/**
 * Return the size of op measured in number of digits in the given base. base
 * can vary from 2 to 36. The sign of op is ignored, just the absolute value is
 * used. The result will be either exact or 1 too big. If base is a power of 2,
 * the result is always exact. If op is zero the return value is always 1.
 *
 * This function can be used to determine the space required when converting op
 * to a string. The right amount of allocation is normally two more than the
 * value returned by mpz_sizeinbase, one extra for a minus sign and one for the
 * null-terminator. */
MPZ.prototype.sizeinbase = function (v, b) {
  v = BigInt(v)
  const abs = v < 0n ? -v : v
  return abs.toString(b).length
}

MPZ.prototype.sizeinbits = function (v) {
  v = BigInt(v)
  return v === 0n ? 0 : this.sizeinbase(v, 2)
}

/** Compare op1 and op2. Return a positive value if op1 > op2, zero if op1 =
 * op2, or a negative value if op1 < op2. */
MPZ.prototype.cmp_ui = function (v, i) {
  v = BigInt(v)
  i = BigInt(i)
  return v < i ? -1 : v > i ? 1 : 0
}

/** Return a new BigInt whose value is 'v * 2^bitCount'. This operation
 * can also be defined as a left shift by bitCnt bits. */
MPZ.prototype.lshift = MPZ.prototype.mul_2exp = function (v, bitCnt) {
  v = BigInt(v)
  return v << BigInt(bitCnt)
}

/** Swap 2 values:
 * a = MPZ.swap(b, b=a);
 */
MPZ.prototype.swap = function (x) {
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
MPZ.prototype.two_compl = function (v) {
  v = BigInt(v)

  if (v >= 0n) { return v }
  if (v === -1n) { return v } // Otherwise we return -11

  const abs = v < 0n ? -v : v
  const min1 = abs - 1n
  const inv = min1.toString(2).split('').map(function (bit) {
    return bit === '0' ? '1' : '0'
  })
  return -BigInt('0b1' + inv.join(''))
}

/** Test bit bit_index in op and return 0 or 1 accordingly. Assumes 2's
 * complement representation. */
MPZ.prototype.tstbit = function (v, bitIdx) {
  if (bitIdx < 0) { throw new Error('Negative bit index') }
  v = this.two_compl(v)
  const abs = v < 0n ? -v : v
  const bits = abs.toString(2)

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
MPZ.prototype.bin_map = function (a, b, fn) {
  a = this.two_compl(a)
  b = this.two_compl(b)
  const absA = a < 0n ? -a : a
  const absB = b < 0n ? -b : b
  let sa = absA.toString(2).replace('-', '').split('').reverse()
  let sb = absB.toString(2).replace('-', '').split('').reverse()

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
MPZ.prototype.or = function (a, b) {
  return this.bin_map(a, b, function (va, vb) {
    return va === '1' || vb === '1' ? '1' : '0'
  })
}

/** Returns the bitwise exclusive-or of the arguments. Assumes 2's complement
 * representation. */
MPZ.prototype.xor = function (a, b) {
  return this.bin_map(a, b, function (va, vb) {
    return va === vb ? '0' : '1'
  })
}

/** Sets the specified bit. */
MPZ.prototype.setbit = function (v, bitIdx) {
  if (bitIdx < 0) { throw new Error('Negative bit index') }
  v = BigInt(v)
  const res = this.or(v, 1n << BigInt(bitIdx))
  return v < 0n ? -res : res
}

MPZ.prototype.set_str = function (s, base) {
  if (base === 16) {
    return BigInt('0x' + s)
  } else if (base === 2) {
    return BigInt('0b' + s)
  } else {
    // For other bases, parse manually
    return BigInt(parseInt(s, base))
  }
}

MPZ.prototype.ORDER_MSB = true // +1 in GMP
MPZ.prototype.ORDER_LSB = false // -1 in GMP
MPZ.prototype.ENDIAN_MSB = 1
MPZ.prototype.ENDIAN_LSB = -1
MPZ.prototype.ENDIAN_HOST = 0 // Not supported

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
MPZ.prototype.import = function (orderMSB, endian, buf) {
  if (typeof buf === 'string') {
    const s = new Uint8Array(buf.length)
    for (let i = 0; i < buf.length; i++) {
      s[i] = buf.charCodeAt(i)
    }
    buf = s
  }

  if (buf.BYTES_PER_ELEMENT > 2) throw new Error('Wrong type')

  // Put least significant word in buf[0]
  if (orderMSB === MPZ.prototype.ORDER_MSB) {
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
    for (let idx = 0; idx < buf.length; idx++) {
      res = res + (BigInt(buf[idx]) << BigInt(8 * idx))
    }
  } else if (buf.BYTES_PER_ELEMENT === 2) {
    const view = new DataView(buf.buffer)
    const littleEndian = (endian === MPZ.prototype.ENDIAN_LSB)

    for (let i = 0; i < view.byteLength; i = i + 2) {
      const v = view.getUint16(i, littleEndian)
      res = res + (BigInt(v) << BigInt(8 * i))
    }
  }
  return res
}

/** Returns a byte array with the contents of BigInt.
 * @param {Boolean} orderMSB
 */
MPZ.prototype.export = function (orderMSB, size, endian, val) {
  val = BigInt(val)
  val = val < 0n ? -val : val

  const a = []

  if (size === 1) {
    const div = 256n // 2^8
    while (val !== 0n) {
      a.push(Number(val % div))
      val = val / div
    }
  } else {
    const word = 65536n // 2^16
    while (val !== 0n) {
      const w = val % word
      a.push(Number(w))
      val = val / word
    }

    if (endian === MPZ.prototype.ENDIAN_MSB) {
      for (let idx = 0; idx < a.length; idx++) {
        const v = a[idx]
        a[idx] = (v >>> 8) | ((v & 0x00ff) << 8)
      }
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

module.exports = new MPZ()
