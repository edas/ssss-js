/* global QUnit */
import mpz from '../mpz.js'

QUnit.test('sizeinbase', function (assert) {
  assert.strictEqual(mpz.sizeinbase(0, 2), 1, 'positive binary')
  assert.strictEqual(mpz.sizeinbase(5, 2), 3, 'positive binary')
  assert.strictEqual(mpz.sizeinbase(-5, 2), 3, 'negative binary')
  assert.strictEqual(mpz.sizeinbase(15, 16), 1, 'Single hex')
  assert.strictEqual(mpz.sizeinbase(-15, 16), 1, 'Single hex')
  assert.strictEqual(mpz.sizeinbase(16, 16), 2, 'Single hex')
})

QUnit.test('sizeinbits', function (assert) {
  assert.strictEqual(mpz.sizeinbits(0), 0)
  assert.strictEqual(mpz.sizeinbits(1), 1)
})

QUnit.test('cmp_ui', function (assert) {
  assert.strictEqual(mpz.cmp_ui(2, 1), 1)
  assert.strictEqual(mpz.cmp_ui(1, 2), -1)
  assert.strictEqual(mpz.cmp_ui(2, 2), 0)
})

QUnit.test('mul_2exp', function (assert) {
  assert.strictEqual(mpz.mul_2exp(7, 3), 7n * 8n)
  assert.strictEqual(mpz.lshift(7, 3), 7n * 8n)
  assert.strictEqual(mpz.mul_2exp(7, 3), 56n)
})

QUnit.test('swap', function (assert) {
  let a = 1
  let b = 2
  a = mpz.swap(b, b = a)
  assert.strictEqual(a, 2)
  assert.strictEqual(b, 1)
})

QUnit.test('two_compl', function (assert) {
  assert.strictEqual(mpz.two_compl(0).toString(2), '0')
  assert.strictEqual(mpz.two_compl(10).toString(2), '1010')
  assert.strictEqual(mpz.two_compl(-1).toString(2), '-1')
  assert.strictEqual(mpz.two_compl(-2).toString(2), '-10')
  assert.strictEqual(mpz.two_compl(-6).toString(2), '-1010')
  assert.strictEqual(mpz.two_compl(-9).toString(2), '-10111')
  assert.strictEqual(mpz.two_compl(-10).toString(2), '-10110')
})

QUnit.test('tstbit', function (assert) {
  assert.strictEqual(mpz.tstbit(0, 10), 0)

  assert.strictEqual(mpz.tstbit(4, 0), 0)
  assert.strictEqual(mpz.tstbit(4, 1), 0)
  assert.strictEqual(mpz.tstbit(4, 2), 1)

  assert.strictEqual(mpz.tstbit(-1, 10), 1)
  // -9 => ....110111, 9 => 001001
  assert.strictEqual(mpz.tstbit(-9, 2), 1)
  assert.strictEqual(mpz.tstbit(-9, 3), 0)
})

QUnit.test('or', function (assert) {
  assert.strictEqual(mpz.or(0, 0), 0n)
  assert.strictEqual(mpz.or(1, 2), 3n)
  assert.strictEqual(mpz.or(2, 1), 3n)
  assert.strictEqual(mpz.or(0, 5), 5n)

  //  11 = ...01011
  // -11 = ...10101
  //   3 = ...00011
  //          10111 = -11 | 3 = 23
  //          01011 =  11 | 3 = 11
  assert.strictEqual(mpz.or(-11, 3), 23n)
})

QUnit.test('xor', function (assert) {
  assert.strictEqual(mpz.xor(0, 0), 0n)
  assert.strictEqual(mpz.xor(0, 1), 1n)
  assert.strictEqual(mpz.xor(1, 0), 1n)
  assert.strictEqual(mpz.xor(1, 1), 0n)

  function f (a, b, exp) {
    // Handle negative binary strings (e.g., '-100')
    a = a.startsWith('-') ? -BigInt('0b' + a.slice(1)) : BigInt('0b' + a)
    b = b.startsWith('-') ? -BigInt('0b' + b.slice(1)) : BigInt('0b' + b)
    exp = exp.startsWith('-') ? -BigInt('0b' + exp.slice(1)) : BigInt('0b' + exp)
    return mpz.xor(a, b) === exp && mpz.xor(b, a) === exp
  }

  assert.ok(f('1010', '1100', '0110'))

  assert.ok(f('1010',
    '11100',
    '10110'))

  assert.ok(f('11010',
    '-100', // = -4 = ...1100 in 2's
    '110'))

  assert.ok(f('-110', // = -6 = ..11010 in 2;s
    '-100', // = -4 = ...1100 in 2's
    '110'))

  assert.strictEqual(mpz.xor(5n, 0n), 5n)
})

QUnit.test('setbit', function (assert) {
  assert.strictEqual(mpz.setbit(0, 0), 1n)
  assert.strictEqual(mpz.setbit(1, 0), 1n)
  assert.strictEqual(mpz.setbit(2, 0), 3n)
  assert.strictEqual(mpz.setbit(0, 2), 4n)

  // Not intuitive at all. -4 is -100 in 2's. When we set bit-1 we get -110
  // which is -6 in sign-magnitude notation.
  assert.strictEqual(mpz.setbit(-4, 1), -6n)
})

QUnit.test('import', function (assert) {
  const expected = 0x12345678n
  let imported

  // Try orderMSB and LSB
  imported = mpz.import(mpz.ORDER_MSB, mpz.ENDIAN_MSB,
    new Uint8Array([0x12, 0x34, 0x56, 0x78]))
  assert.strictEqual(imported, expected)
  imported = mpz.import(mpz.ORDER_LSB, mpz.ENDIAN_MSB,
    new Uint8Array([0x78, 0x56, 0x34, 0x12]))
  assert.strictEqual(imported, expected)

  // Ensure endian makes no difference for uint8 arrays
  imported = mpz.import(mpz.ORDER_MSB, mpz.ENDIAN_LSB,
    new Uint8Array([0x12, 0x34, 0x56, 0x78]))
  assert.strictEqual(imported, expected)
  imported = mpz.import(mpz.ORDER_LSB, mpz.ENDIAN_LSB,
    new Uint8Array([0x78, 0x56, 0x34, 0x12]))
  assert.strictEqual(imported, expected)

  // The goad of each import is to get to 0x12345678
  imported = mpz.import(mpz.ORDER_MSB, mpz.ENDIAN_MSB,
    new Uint16Array([0x3412, 0x7856]))
  assert.strictEqual(imported, expected)
  imported = mpz.import(mpz.ORDER_LSB, mpz.ENDIAN_MSB,
    new Uint16Array([0x7856, 0x3412]))
  assert.strictEqual(imported, expected)
  imported = mpz.import(mpz.ORDER_MSB, mpz.ENDIAN_LSB,
    new Uint16Array([0x1234, 0x5678]))
  assert.strictEqual(imported, expected)
  imported = mpz.import(mpz.ORDER_LSB, mpz.ENDIAN_LSB,
    new Uint16Array([0x5678, 0x1234]))
  assert.strictEqual(imported, expected)

  const buf = 'abcdef'
  imported = mpz.import(mpz.ORDER_MSB, mpz.ENDIAN_HOST, buf)
  assert.strictEqual(imported.toString(), '107075202213222')
})

QUnit.test('export', function (assert) {
  const bigVal1 = 0x12345678n

  let exp, act

  exp = Uint8Array.from([0x12, 0x34, 0x56, 0x78])
  act = mpz.export(mpz.ORDER_MSB, 1, mpz.ENDIAN_MSB, bigVal1)
  assert.deepEqual(act, exp)

  exp.reverse()
  act = mpz.export(mpz.ORDER_LSB, 1, mpz.ENDIAN_MSB, bigVal1)
  assert.deepEqual(act, exp)

  exp = Uint16Array.from([0x3412, 0x7856])
  act = mpz.export(mpz.ORDER_MSB, 2, mpz.ENDIAN_MSB, bigVal1)
  assert.deepEqual(act, exp)

  exp.reverse()
  act = mpz.export(mpz.ORDER_LSB, 2, mpz.ENDIAN_MSB, bigVal1)
  assert.deepEqual(act, exp)

  exp = Uint16Array.from([0x1234, 0x5678])
  act = mpz.export(mpz.ORDER_MSB, 2, mpz.ENDIAN_LSB, bigVal1)
  assert.deepEqual(act, exp)

  const bigVal2 = 0x123456n

  exp = Uint16Array.from([0x1200, 0x5634])
  act = mpz.export(mpz.ORDER_MSB, 2, mpz.ENDIAN_MSB, bigVal2)
  assert.deepEqual(act, exp)
})
