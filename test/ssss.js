/* global QUnit */
const SSSS = require('../ssss.js')

QUnit.test('encode decode short', function (assert) {
  const threshold = 4
  const numKeys = 6
  const foo = new SSSS(threshold, numKeys)
  const secretIn = 'abcdefgh'
  const keys = foo.split(secretIn, 'tkn')
  console.log(keys)
  let secretOut = foo.combine(keys.slice(0, threshold))
  console.log('Combined using same obj: ' + secretOut)
  assert.equal(secretOut, secretIn)

  // Single argument ctor (only for combining)
  const foo2 = new SSSS(threshold)
  secretOut = foo2.combine(keys.slice(0, threshold))
  console.log('Combined using new obj: ' + secretOut)
  assert.equal(secretOut, secretIn)
})

QUnit.test('encode decode long', function (assert) {
  const threshold = 4
  const numKeys = 6
  const foo = new SSSS(threshold, numKeys)
  // var secretIn = "abcdefghiáñòâé";
  const secretIn = 'abcdefghijklmnopqrstuvwxyz'
  const keys = foo.split(secretIn, 'tkn')
  console.log(keys)
  let secretOut = foo.combine(keys.slice(0, threshold))
  console.log('Combined using same obj: ' + secretOut)
  assert.equal(secretOut, secretIn)

  // Single argument ctor (only for combining)
  const foo2 = new SSSS(threshold)
  secretOut = foo2.combine(keys.slice(0, threshold))
  console.log('Combined using new obj: ' + secretOut)
  assert.equal(secretOut, secretIn)
})

QUnit.test('encode decode hex', function (assert) {
  const threshold = 3
  const numKeys = 6
  const inputIsHex = true
  const foo = new SSSS(threshold, numKeys, inputIsHex)

  const secretIn = '7bcd123411223344'
  // var secretIn = "abcd0123";
  const keys = foo.split(secretIn, 'foo')
  // console.log(keys);
  let secretOut = foo.combine(keys.slice(0, threshold))
  // console.log("Combined using same obj: " + secretOut);
  assert.equal(secretOut, secretIn)

  // When used only for combining, numKeys can be 0.
  const foo2 = new SSSS(threshold, 0, inputIsHex)
  secretOut = foo2.combine(keys.slice(0, threshold))
  // console.log("Combined using new obj: " + secretOut);
  assert.equal(secretOut, secretIn)
})
