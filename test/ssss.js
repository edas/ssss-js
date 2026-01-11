/* global QUnit */
import SSSS from '../ssss.js'

QUnit.test('encode decode short', function (assert) {
  const threshold = 4
  const numKeys = 6
  const foo = new SSSS(threshold, numKeys)
  const secretIn = 'abcdefgh'
  const [keys] = foo.split(secretIn, 'tkn')
  let secretOut = foo.combine(keys.slice(0, threshold))
  assert.equal(secretOut, secretIn)

  // Single argument ctor (only for combining)
  const foo2 = new SSSS(threshold)
  secretOut = foo2.combine(keys.slice(0, threshold))
  assert.equal(secretOut, secretIn)
})

QUnit.test('encode decode long', function (assert) {
  const threshold = 4
  const numKeys = 6
  const foo = new SSSS(threshold, numKeys)
  const secretIn = 'abcdefghijklmnopqrstuvwxyz'
  const [keys] = foo.split(secretIn, 'tkn')
  let secretOut = foo.combine(keys.slice(0, threshold))
  assert.equal(secretOut, secretIn)

  // Single argument ctor (only for combining)
  const foo2 = new SSSS(threshold)
  secretOut = foo2.combine(keys.slice(0, threshold))
  assert.equal(secretOut, secretIn)
})

QUnit.test('encode decode hex', function (assert) {
  const threshold = 3
  const numKeys = 6
  const inputIsHex = true
  const foo = new SSSS(threshold, numKeys, inputIsHex)

  const secretIn = '7bcd123411223344'
  const [keys] = foo.split(secretIn, 'foo')
  let secretOut = foo.combine(keys.slice(0, threshold))
  assert.equal(secretOut, secretIn)

  // When used only for combining, numKeys can be 0.
  const foo2 = new SSSS(threshold, 0, inputIsHex)
  secretOut = foo2.combine(keys.slice(0, threshold))
  assert.equal(secretOut, secretIn)
})

QUnit.test('extend with token', function (assert) {
  const threshold = 4
  const numKeys = 6
  const token = 'mytoken'
  const foo = new SSSS(threshold, numKeys)
  const secretIn = 'abcdefgh'
  const [keys] = foo.split(secretIn, token)

  // Use threshold number of shares to extend
  const sharesToExtend = keys.slice(0, threshold)
  const fooExtend = new SSSS(threshold, 0)
  const newShare = fooExtend.extend(sharesToExtend, threshold, token)

  // Verify the new share has the correct format and index
  const parts = newShare.split('-')
  assert.equal(parts[0], token, 'Token should match')
  const newIndex = parseInt(parts[1])
  assert.ok(newIndex > 0, 'Index should be positive')
  // Verify the new index is not in the original shares (should be threshold + 1 = 5)
  assert.equal(newIndex, threshold + 1, 'New share should have index threshold + 1')

  // Verify the new share can be used to recover the secret
  const fooCombine = new SSSS(threshold, 0)
  // Use the new share plus threshold-1 original shares
  const sharesToCombine = [newShare, ...sharesToExtend.slice(0, threshold - 1)]
  const secretOut = fooCombine.combine(sharesToCombine)
  assert.equal(secretOut, secretIn)
})

QUnit.test('extend without token', function (assert) {
  const threshold = 3
  const numKeys = 5
  const foo = new SSSS(threshold, numKeys)
  const secretIn = 'test secret'
  const [keys] = foo.split(secretIn, '')

  // Use threshold number of shares to extend
  const sharesToExtend = keys.slice(0, threshold)
  const fooExtend = new SSSS(threshold, 0)
  const newShare = fooExtend.extend(sharesToExtend, threshold, '')

  // Verify the new share has the correct format and index (no token, so first part is index)
  const parts = newShare.split('-')
  const newIndex = parseInt(parts[0])
  assert.ok(newIndex > 0, 'Index should be positive')
  // Verify the new index is not in the original shares (should be threshold + 1 = 4)
  assert.equal(newIndex, threshold + 1, 'New share should have index threshold + 1')

  // Verify the new share can be used to recover the secret
  const fooCombine = new SSSS(threshold, 0)
  // Use the new share plus threshold-1 original shares
  const sharesToCombine = [newShare, ...sharesToExtend.slice(0, threshold - 1)]
  const secretOut = fooCombine.combine(sharesToCombine)
  assert.equal(secretOut, secretIn)
})

QUnit.test('regenerate with token at specific index', function (assert) {
  const threshold = 4
  const numKeys = 6
  const token = 'regentoken'
  const foo = new SSSS(threshold, numKeys)
  const secretIn = 'abcdefgh'
  const [keys] = foo.split(secretIn, token)

  // Use threshold number of shares to regenerate at a specific index
  const sharesToRegen = keys.slice(0, threshold)
  const targetIndex = 7
  const fooRegen = new SSSS(threshold, 0)
  const regeneratedShare = fooRegen.regenerate(sharesToRegen, threshold, targetIndex, token)

  // Verify the regenerated share has the correct index
  const parts = regeneratedShare.split('-')
  assert.equal(parts[0], token, 'Token should match')
  assert.equal(parseInt(parts[1]), targetIndex, 'Index should match target')

  // Verify the regenerated share can be used to recover the secret
  const fooCombine = new SSSS(threshold, 0)
  const sharesToCombine = [regeneratedShare, ...sharesToRegen.slice(0, threshold - 1)]
  const secretOut = fooCombine.combine(sharesToCombine)
  assert.equal(secretOut, secretIn)
})

QUnit.test('regenerate without token at specific index', function (assert) {
  const threshold = 3
  const numKeys = 5
  const foo = new SSSS(threshold, numKeys)
  const secretIn = 'regenerate test'
  const [keys] = foo.split(secretIn, '')

  // Use threshold number of shares to regenerate at a specific index
  const sharesToRegen = keys.slice(0, threshold)
  const targetIndex = 10
  const fooRegen = new SSSS(threshold, 0)
  const regeneratedShare = fooRegen.regenerate(sharesToRegen, threshold, targetIndex, '')

  // Verify the regenerated share has the correct index (no token, so first part is index)
  const parts = regeneratedShare.split('-')
  assert.equal(parseInt(parts[0]), targetIndex, 'Index should match target')

  // Verify the regenerated share can be used to recover the secret
  const fooCombine = new SSSS(threshold, 0)
  const sharesToCombine = [regeneratedShare, ...sharesToRegen.slice(0, threshold - 1)]
  const secretOut = fooCombine.combine(sharesToCombine)
  assert.equal(secretOut, secretIn)
})

QUnit.test('regenerate at existing index with token', function (assert) {
  const threshold = 4
  const numKeys = 6
  const token = 'existing'
  const foo = new SSSS(threshold, numKeys)
  const secretIn = 'test secret'
  const [keys] = foo.split(secretIn, token)

  // Test regenerating at multiple existing indices
  const sharesToRegen = keys.slice(0, threshold)
  const fooRegen = new SSSS(threshold, 0)

  // Test index 1
  const existingIndex1 = 1
  const regeneratedShare1 = fooRegen.regenerate(sharesToRegen, threshold, existingIndex1, token)
  const originalShare1 = keys[existingIndex1 - 1] // keys are 1-indexed
  assert.equal(regeneratedShare1, originalShare1, 'Regenerated share at index 1 should match original exactly')

  // Test index 2
  const existingIndex2 = 2
  const regeneratedShare2 = fooRegen.regenerate(sharesToRegen, threshold, existingIndex2, token)
  const originalShare2 = keys[existingIndex2 - 1]
  assert.equal(regeneratedShare2, originalShare2, 'Regenerated share at index 2 should match original exactly')

  // Test index 3
  const existingIndex3 = 3
  const regeneratedShare3 = fooRegen.regenerate(sharesToRegen, threshold, existingIndex3, token)
  const originalShare3 = keys[existingIndex3 - 1]
  assert.equal(regeneratedShare3, originalShare3, 'Regenerated share at index 3 should match original exactly')

  // Verify regenerated shares still work for recovery
  const fooCombine = new SSSS(threshold, 0)
  const sharesToCombine = [regeneratedShare1, regeneratedShare2, regeneratedShare3, sharesToRegen[3]]
  const secretOut = fooCombine.combine(sharesToCombine)
  assert.equal(secretOut, secretIn)
})

QUnit.test('regenerate at existing index without token', function (assert) {
  const threshold = 3
  const numKeys = 5
  const foo = new SSSS(threshold, numKeys)
  const secretIn = 'regenerate test'
  const [keys] = foo.split(secretIn, '')

  // Test regenerating at existing indices without token
  const sharesToRegen = keys.slice(0, threshold)
  const fooRegen = new SSSS(threshold, 0)

  // Test index 1
  const existingIndex1 = 1
  const regeneratedShare1 = fooRegen.regenerate(sharesToRegen, threshold, existingIndex1, '')
  const originalShare1 = keys[existingIndex1 - 1]
  assert.equal(regeneratedShare1, originalShare1, 'Regenerated share at index 1 should match original exactly')

  // Test index 2
  const existingIndex2 = 2
  const regeneratedShare2 = fooRegen.regenerate(sharesToRegen, threshold, existingIndex2, '')
  const originalShare2 = keys[existingIndex2 - 1]
  assert.equal(regeneratedShare2, originalShare2, 'Regenerated share at index 2 should match original exactly')

  // Verify regenerated shares still work for recovery
  const fooCombine = new SSSS(threshold, 0)
  const sharesToCombine = [regeneratedShare1, regeneratedShare2, sharesToRegen[2]]
  const secretOut = fooCombine.combine(sharesToCombine)
  assert.equal(secretOut, secretIn)
})
