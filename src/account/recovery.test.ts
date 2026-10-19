import test from 'node:test'
import assert from 'node:assert/strict'
import { createRecoveryGate } from './recovery.ts'
test('password recovery requires the SDK recovery event for the same verified user', () => {
  const gate = createRecoveryGate()
  gate.onEvent('SIGNED_IN', 'a')
  assert.equal(gate.allows('a'), false)
  gate.onEvent('PASSWORD_RECOVERY', 'a')
  assert.equal(gate.allows('a'), true)
  assert.equal(gate.allows('b'), false)
  gate.onEvent('TOKEN_REFRESHED', 'a')
  assert.equal(gate.allows('a'), true)
  gate.onEvent('USER_UPDATED', 'a')
  assert.equal(gate.allows('a'), false)
  gate.onEvent('PASSWORD_RECOVERY', 'a')
  gate.onEvent('SIGNED_OUT', null)
  assert.equal(gate.allows('a'), false)
  gate.onEvent('PASSWORD_RECOVERY', 'a')
  gate.onEvent('SIGNED_IN', 'b')
  assert.equal(gate.allows('a'), false)
  assert.equal(gate.allows('b'), false)
})

test('refocusing the same account preserves recovery but another identity invalidates it', () => {
  const gate = createRecoveryGate()
  gate.onEvent('PASSWORD_RECOVERY', 'a')
  gate.onEvent('SIGNED_IN', 'a')
  assert.equal(gate.allows('a'), true)
  gate.onEvent('TOKEN_REFRESHED', 'b')
  assert.equal(gate.allows('a'), false)
  gate.onEvent('SIGNED_IN', 'a')
  assert.equal(gate.allows('a'), false)
})
