/* global QUnit */
import { splitString, splitHexString, splitBuffer, combineToText, combineToHexString, combineToBuffer, resplit, parseShare } from '../ssss.js'

QUnit.test('splitString - basic functionality', function (assert) {
  const secret = 'test secret'
  const threshold = 3
  const numberOfKeys = 5
  const prefix = 'myprefix'

  const keys = splitString(secret, { threshold, numberOfKeys, prefix })

  assert.equal(keys.length, numberOfKeys, 'Should generate correct number of keys')
  
  // Verify all keys have the prefix
  keys.forEach((key, index) => {
    assert.ok(key.startsWith(prefix + '-'), `Key ${index + 1} should have prefix`)
  })
})

QUnit.test('splitString and combineToText - round trip', function (assert) {
  const secret = 'abcdefgh'
  const threshold = 4
  const numberOfKeys = 6
  const prefix = 'test'

  const keys = splitString(secret, { threshold, numberOfKeys, prefix })
  
  // Combine using threshold number of shares
  const recovered = combineToText(keys.slice(0, threshold), { threshold })
  
  assert.equal(recovered, secret, 'Should recover original secret')
})

QUnit.test('splitString and combineToText - different threshold shares', function (assert) {
  const secret = 'my secret message'
  const threshold = 3
  const numberOfKeys = 5

  const keys = splitString(secret, { threshold, numberOfKeys })
  
  // Test with first threshold shares
  const recovered1 = combineToText(keys.slice(0, threshold), { threshold })
  assert.equal(recovered1, secret, 'Should recover with first shares')
  
  // Test with different threshold shares
  const recovered2 = combineToText(keys.slice(1, threshold + 1), { threshold })
  assert.equal(recovered2, secret, 'Should recover with different shares')
  
  // Test with last threshold shares
  const recovered3 = combineToText(keys.slice(-threshold), { threshold })
  assert.equal(recovered3, secret, 'Should recover with last shares')
})

QUnit.test('splitHexString and combineToHexString - hex mode', function (assert) {
  const secret = '7bcd123411223344'
  const threshold = 3
  const numberOfKeys = 6
  const prefix = 'hex'

  const keys = splitHexString(secret, { threshold, numberOfKeys, prefix })
  
  const recovered = combineToHexString(keys.slice(0, threshold), { threshold })
  
  assert.equal(recovered, secret, 'Should recover original hex secret')
})

QUnit.test('splitBuffer and combineToBuffer - buffer mode', function (assert) {
  const secret = new Uint8Array([0x7b, 0xcd, 0x12, 0x34, 0x11, 0x22, 0x33, 0x44])
  const threshold = 3
  const numberOfKeys = 6
  const prefix = 'buffer'

  const keys = splitBuffer(secret, { threshold, numberOfKeys, prefix })
  
  assert.equal(keys.length, numberOfKeys, 'Should generate correct number of keys')
  
  const recovered = combineToBuffer(keys.slice(0, threshold), { threshold })
  
  assert.ok(recovered instanceof Uint8Array, 'Should return Uint8Array')
  assert.equal(recovered.length, secret.length, 'Should have same length')
  for (let i = 0; i < secret.length; i++) {
    assert.equal(recovered[i], secret[i], `Byte ${i} should match`)
  }
})

QUnit.test('splitBuffer and combineToBuffer - round trip with different shares', function (assert) {
  const secret = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a])
  const threshold = 3
  const numberOfKeys = 5

  const keys = splitBuffer(secret, { threshold, numberOfKeys })
  
  // Test with first threshold shares
  const recovered1 = combineToBuffer(keys.slice(0, threshold), { threshold })
  assert.ok(recovered1 instanceof Uint8Array, 'Should return Uint8Array')
  for (let i = 0; i < secret.length; i++) {
    assert.equal(recovered1[i], secret[i], `Byte ${i} should match with first shares`)
  }
  
  // Test with different threshold shares
  const recovered2 = combineToBuffer(keys.slice(1, threshold + 1), { threshold })
  for (let i = 0; i < secret.length; i++) {
    assert.equal(recovered2[i], secret[i], `Byte ${i} should match with different shares`)
  }
})

QUnit.test('splitString and combineToText - without prefix', function (assert) {
  const secret = 'no prefix secret'
  const threshold = 3
  const numberOfKeys = 4

  const keys = splitString(secret, { threshold, numberOfKeys })
  
  const recovered = combineToText(keys.slice(0, threshold), { threshold })
  
  assert.equal(recovered, secret, 'Should work without prefix')
})

QUnit.test('splitString and combineToText - without prefix (undefined)', function (assert) {
  const secret = 'no prefix secret'
  const threshold = 3
  const numberOfKeys = 4

  // Prefix is optional - can be omitted entirely
  const keys = splitString(secret, { threshold, numberOfKeys })
  
  // Keys should not have prefix
  keys.forEach((key) => {
    assert.ok(!key.includes('-') || key.match(/^\d+-/), 'Keys should not have prefix')
  })
  
  const recovered = combineToText(keys.slice(0, threshold), { threshold })
  
  assert.equal(recovered, secret, 'Should work without prefix parameter')
})

QUnit.test('resplit - basic functionality', function (assert) {
  const secret = 'original secret'
  const threshold = 3
  const numberOfKeys = 5
  const prefix = 'original'

  // Create original shares
  const originalKeys = splitString(secret, { threshold, numberOfKeys, prefix })

  // Resplit to create new shares
  const newNumberOfKeys = 7
  const newPrefix = 'newprefix'
  const newKeys = resplit(originalKeys.slice(0, threshold), {
    threshold,
    numberOfKeys: newNumberOfKeys,
    prefix: newPrefix
  })

  assert.equal(newKeys.length, newNumberOfKeys, 'Should generate correct number of new keys')
  
  // Verify all new keys have the new prefix
  newKeys.forEach((key) => {
    assert.ok(key.startsWith(newPrefix + '-'), 'New keys should have new prefix')
  })

  // Verify new keys can recover the secret
  const recovered = combineToText(newKeys.slice(0, threshold), { threshold })
  assert.equal(recovered, secret, 'New keys should recover original secret')
})

QUnit.test('resplit - without prefix', function (assert) {
  const secret = 'test secret'
  const threshold = 3
  const numberOfKeys = 4

  // Test without prefix
  const originalKeys = splitString(secret, { threshold, numberOfKeys })

  const newNumberOfKeys = 6
  const newKeys = resplit(originalKeys.slice(0, threshold), {
    threshold,
    numberOfKeys: newNumberOfKeys
  })

  assert.equal(newKeys.length, newNumberOfKeys, 'Should generate correct number of keys')
  
  const recovered = combineToText(newKeys.slice(0, threshold), { threshold })
  assert.equal(recovered, secret, 'Should recover original secret')
})

QUnit.test('resplit - without prefix (undefined)', function (assert) {
  const secret = 'test secret'
  const threshold = 3
  const numberOfKeys = 4

  // Prefix can be omitted
  const originalKeys = splitString(secret, { threshold, numberOfKeys })

  const newNumberOfKeys = 6
  // Prefix can be omitted in resplit too
  const newKeys = resplit(originalKeys.slice(0, threshold), {
    threshold,
    numberOfKeys: newNumberOfKeys
  })

  assert.equal(newKeys.length, newNumberOfKeys, 'Should generate correct number of keys')
  
  const recovered = combineToText(newKeys.slice(0, threshold), { threshold })
  assert.equal(recovered, secret, 'Should recover original secret')
})

QUnit.test('resplit - hex mode', function (assert) {
  const secret = 'aabbccdd11223344'
  const threshold = 3
  const numberOfKeys = 5
  const inputIsHex = true
  const prefix = 'hex'

  const originalKeys = splitHexString(secret, { threshold, numberOfKeys, prefix })

  const newNumberOfKeys = 7
  const newKeys = resplit(originalKeys.slice(0, threshold), {
    threshold,
    numberOfKeys: newNumberOfKeys,
    inputIsHex,
    prefix: 'hexnew'
  })

  const recovered = combineToHexString(newKeys.slice(0, threshold), { threshold })
  assert.equal(recovered, secret, 'Should recover original hex secret')
})

QUnit.test('resplit - numberOfKeys must be greater than threshold', function (assert) {
  const secret = 'test'
  const threshold = 3
  const numberOfKeys = 5
  const prefix = 'test'

  const originalKeys = splitString(secret, { threshold, numberOfKeys, prefix })

  assert.throws(
    () => {
      resplit(originalKeys.slice(0, threshold), {
        threshold,
        numberOfKeys: threshold, // Same as threshold, should fail
        prefix: 'new'
      })
    },
    /numberOfKeys must be greater than threshold/,
    'Should throw error when numberOfKeys equals threshold'
  )

  assert.throws(
    () => {
      resplit(originalKeys.slice(0, threshold), {
        threshold,
        numberOfKeys: threshold - 1, // Less than threshold, should fail
        prefix: 'new'
      })
    },
    /numberOfKeys must be greater than threshold/,
    'Should throw error when numberOfKeys is less than threshold'
  )
})

QUnit.test('splitString, combineToText, and resplit - complete workflow', function (assert) {
  const secret = 'complete workflow test'
  const threshold = 4
  const numberOfKeys = 6
  const prefix = 'workflow'

  // Step 1: Split secret
  const originalKeys = splitString(secret, { threshold, numberOfKeys, prefix })
  assert.equal(originalKeys.length, numberOfKeys, 'Original keys count should match')

  // Step 2: Combine original keys
  const recovered1 = combineToText(originalKeys.slice(0, threshold), { threshold })
  assert.equal(recovered1, secret, 'Should recover from original keys')

  // Step 3: Resplit to create more keys
  const newNumberOfKeys = 8
  const newPrefix = 'resplit'
  const newKeys = resplit(originalKeys.slice(0, threshold), {
    threshold,
    numberOfKeys: newNumberOfKeys,
    prefix: newPrefix
  })
  assert.equal(newKeys.length, newNumberOfKeys, 'New keys count should match')

  // Step 4: Combine new keys
  const recovered2 = combineToText(newKeys.slice(0, threshold), { threshold })
  assert.equal(recovered2, secret, 'Should recover from new keys')

  // Step 5: Mix original and new keys (both from same polynomial, but different indices)
  // resplit generates shares at indices 1 through newNumberOfKeys (8)
  // originalKeys are at indices 1 through numberOfKeys (6)
  // To avoid duplicate indices, use originalKeys at higher indices and newKeys at the highest indices
  const mixedShares = [
    originalKeys[3], // index 4
    originalKeys[4], // index 5
    newKeys[6],      // index 7
    newKeys[7]       // index 8
  ]
  const recovered3 = combineToText(mixedShares, { threshold })
  assert.equal(recovered3, secret, 'Should recover from mixed shares')
})

QUnit.test('parseShare - with prefix', function (assert) {
  const share = 'myprefix-01-abc123def456'
  const parsed = parseShare(share)
  
  assert.equal(parsed.prefix, 'myprefix', 'Prefix should be extracted correctly')
  assert.equal(parsed.index, 1, 'Index should be parsed as number')
  assert.equal(parsed.value, 'abc123def456', 'Value should be extracted correctly')
})

QUnit.test('parseShare - without prefix', function (assert) {
  const share = '01-abc123def456'
  const parsed = parseShare(share)
  
  assert.equal(parsed.prefix, undefined, 'Prefix should be undefined when not present')
  assert.equal(parsed.index, 1, 'Index should be parsed as number')
  assert.equal(parsed.value, 'abc123def456', 'Value should be extracted correctly')
})

QUnit.test('parseShare - different index values', function (assert) {
  const share1 = 'prefix-1-value123'
  const parsed1 = parseShare(share1)
  assert.equal(parsed1.index, 1, 'Should parse index 1')
  
  const share2 = 'prefix-42-value456'
  const parsed2 = parseShare(share2)
  assert.equal(parsed2.index, 42, 'Should parse index 42')
  
  const share3 = 'prefix-999-value789'
  const parsed3 = parseShare(share3)
  assert.equal(parsed3.index, 999, 'Should parse index 999')
})

QUnit.test('parseShare - with hex value', function (assert) {
  const share = 'test-03-7bcd1234112233445566778899aabbcc'
  const parsed = parseShare(share)
  
  assert.equal(parsed.prefix, 'test', 'Prefix should be extracted')
  assert.equal(parsed.index, 3, 'Index should be parsed')
  assert.equal(parsed.value, '7bcd1234112233445566778899aabbcc', 'Hex value should be extracted correctly')
})

QUnit.test('parseShare - invalid share (less than 2 parts)', function (assert) {
  assert.throws(
    () => parseShare('invalid'),
    /invalid share/,
    'Should throw error for invalid share format'
  )
  
  assert.throws(
    () => parseShare(''),
    /invalid share/,
    'Should throw error for empty share'
  )
  
  assert.throws(
    () => parseShare('onlyonepart'),
    /invalid share/,
    'Should throw error for share with only one part'
  )
})

QUnit.test('parseShare - round trip with splitString', function (assert) {
  const secret = 'test secret'
  const threshold = 3
  const numberOfKeys = 5
  const prefix = 'roundtrip'
  
  const keys = splitString(secret, { threshold, numberOfKeys, prefix })
  
  // Parse each generated key
  keys.forEach((key) => {
    const parsed = parseShare(key)
    assert.equal(parsed.prefix, prefix, 'Parsed prefix should match original prefix')
    assert.ok(parsed.index >= 1 && parsed.index <= numberOfKeys, 'Index should be in valid range')
    assert.ok(parsed.value.length > 0, 'Value should not be empty')
  })
})

QUnit.test('parseShare - round trip without prefix', function (assert) {
  const secret = 'test secret'
  const threshold = 3
  const numberOfKeys = 4
  
  const keys = splitString(secret, { threshold, numberOfKeys })
  
  // Parse each generated key
  keys.forEach((key) => {
    const parsed = parseShare(key)
    assert.equal(parsed.prefix, undefined, 'Parsed prefix should be undefined when no prefix used')
    assert.ok(parsed.index >= 1 && parsed.index <= numberOfKeys, 'Index should be in valid range')
    assert.ok(parsed.value.length > 0, 'Value should not be empty')
  })
})

QUnit.test('splitString and combineToBuffer - string to buffer round trip', function (assert) {
  const secret = 'Hello, World! This is a test string.'
  const threshold = 3
  const numberOfKeys = 5
  const prefix = 'test'

  // Split the string
  const keys = splitString(secret, { threshold, numberOfKeys, prefix })
  
  assert.equal(keys.length, numberOfKeys, 'Should generate correct number of keys')
  
  // Recover as buffer
  const recoveredBuffer = combineToBuffer(keys.slice(0, threshold), { threshold })
  
  assert.ok(recoveredBuffer instanceof Uint8Array, 'Should return Uint8Array')
  
  // Convert buffer back to string
  const decoder = new TextDecoder('utf-8')
  const recoveredString = decoder.decode(recoveredBuffer)
  
  assert.equal(recoveredString, secret, 'Recovered string should match original secret')
})
