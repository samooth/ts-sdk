import { sign, verify, magicHash } from '../BSM'
import { toArray } from '../../primitives/utils'
import PrivateKey from '../../primitives/PrivateKey'
import PublicKey from '../../primitives/PublicKey'
import Signature from '../../primitives/Signature'
import BigNumber from '../../primitives/BigNumber'

describe('BSM', () => {
  describe('magicHash', () => {
    it('should return a hash', () => {
      const buf = toArray('001122', 'hex')
      const hashBuf = magicHash(buf)
      expect(hashBuf.length).toEqual(32)
    })
  })
  describe('sign', () => {
    const messageBuf = toArray('this is my message', 'utf8')
    const privateKey = new PrivateKey(42)

    it('should return a signature', () => {
      const sig = sign(messageBuf, privateKey, 'raw')

      if (sig instanceof Signature) { // ✅ Explicitly check if `sig` is a Signature instance
        const derSignature = sig.toDER()
        expect(derSignature.length).toEqual(70)
      } else {
        throw new Error('Expected a Signature object, but got a different type')
      }
    })

    it('Creates the correct base64 signature', () => {
      const privateKey = PrivateKey.fromWif(
        'L211enC224G1kV8pyyq7bjVd9SxZebnRYEzzM3i7ZHCc1c5E7dQu'
      )
      const sig = sign(toArray('hello world', 'utf8'), privateKey, 'base64')
      expect(sig).toEqual(
        'H4T8Asr0WkC6wYfBESR6pCAfECtdsPM4fwiSQ2qndFi8dVtv/mrOFaySx9xQE7j24ugoJ4iGnsRwAC8QwaoHOXk='
      )
    })
  })
  describe('verify', () => {
    const messageBuf = toArray('this is my message', 'utf8')
    const privateKey = new PrivateKey(42)

    it('should verify a signed message', () => {
      const sig = sign(messageBuf, privateKey, 'raw')
      if (typeof sig !== 'string') {
        expect(verify(messageBuf, sig, privateKey.toPublicKey())).toEqual(true)
      } else {
        throw new Error('Expected a Signature object, but got a string')
      }
    })
    it('Should verify a signed message in base64', () => {
      const message = toArray('Texas', 'utf8')
      const signature = Signature.fromCompact(
        'IAV89EkfHSzAIA8cEWbbKHUYzJqcShkpWaXGJ5+mf4+YIlf3XNlr0bj9X60sNe1A7+x9qyk+zmXropMDY4370n8=',
        'base64'
      )
      const publicKey = PublicKey.fromString(
        '03d4d1a6c5d8c03b0e671bc1891b69afaecb40c0686188fe9019f93581b43e8334'
      )
      expect(verify(message, signature, publicKey)).toBe(true)
    })
    it('Should be able to calculate the recovery number for a signature and public key', () => {
      const message = toArray('Texas', 'utf8')
      const signature = Signature.fromCompact(
        'IAV89EkfHSzAIA8cEWbbKHUYzJqcShkpWaXGJ5+mf4+YIlf3XNlr0bj9X60sNe1A7+x9qyk+zmXropMDY4370n8=',
        'base64'
      )
      const publicKey = PublicKey.fromString(
        '03d4d1a6c5d8c03b0e671bc1891b69afaecb40c0686188fe9019f93581b43e8334'
      )
      const msgHash = new BigNumber(magicHash(message))
      const recovery = signature.CalculateRecoveryFactor(publicKey, msgHash)
      expect(recovery).toBe(1)
      const recoveredPubkey = signature.RecoverPublicKey(recovery, msgHash)
      expect(recoveredPubkey.toDER()).toEqual(publicKey.toDER())
    })
  })
})
