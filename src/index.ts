type AlgoParams = AlgorithmIdentifier | RsaOaepParams | AesCtrParams | AesCbcParams | AesGcmParams
type Ciphertext = Int8Array | Int16Array | Int32Array | Uint8Array | Uint16Array | Uint32Array | Uint8ClampedArray | Float32Array | Float64Array | DataView | ArrayBuffer

class Context {
  constructor(public encryptedImage: Element, public lastResponse: Response = undefined) { }
}

function hexString2Bytes(hexString: string): Uint8Array {
  return new Uint8Array(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)))
}

function getAESCBCAlgoFromElementAttributes(ctx: Context, attrName = 'crypto-iv'): AesCbcParams {
  const hexIV = ctx.encryptedImage.getAttribute(attrName)
  // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/decrypt#syntax
  return {
    name: 'AES-CBC',
    iv: hexIV === undefined ? undefined : hexString2Bytes(hexIV),
  }
}

async function getAESCBCKeyFromElementAttributes(ctx: Context, attrName = 'crypto-key'): Promise<CryptoKey> {
  const hexKey = ctx.encryptedImage.getAttribute(attrName)
  // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/importKey
  const cryptoKey = await crypto.subtle.importKey('raw', hexString2Bytes(hexKey), { name: 'AES-CBC' }, false, [
    'decrypt',
  ])

  return cryptoKey
}

async function fetchWithCredentials(ctx: Context, attrName = 'crypto-src'): Promise<ArrayBuffer> {
  const dataURL = ctx.encryptedImage.getAttribute(attrName)
  const resp = await fetch(dataURL, { credentials: 'same-origin' })
  ctx.lastResponse = resp // update ctx.lastResponse
  return await resp.arrayBuffer()
}

class ImageDecrypter {
  constructor(
    public querySelector: string = 'img.encrypted',
    public algo: (ctx: Context) => AlgoParams = getAESCBCAlgoFromElementAttributes,
    public key: (ctx: Context) => Promise<CryptoKey> = getAESCBCKeyFromElementAttributes,
    public ciphertext: (ctx: Context) => Promise<Ciphertext> = fetchWithCredentials,
  ) { }

  /**
   * Fetch encrypted images from the secure URL, decrypt them, and replace them
   * with the decrypted version of data.
   */
  public async decrypt(): Promise<void> {
    const nodeList = document.querySelectorAll(this.querySelector)
    for (const encryptedImage of nodeList) {
      try {
        const plaintext = await this.decryptImage(encryptedImage)
        // https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL
        const decryptedImageURL = window.URL.createObjectURL(new Blob([plaintext]))
        const newImage = document.createElement('img')
        this.cloneAttributes(newImage, encryptedImage)
        newImage.src = decryptedImageURL
        encryptedImage.parentNode.replaceChild(newImage, encryptedImage)
      } catch (error) {
        console.error('ImageDecrypter: decrypt image error:', error)
      }
    }
  }

  protected async decryptImage(encrypteImage: Element): Promise<ArrayBuffer> {
    const ctx = new Context(encrypteImage)
    const key = await this.key(ctx)
    const ciphertext = await this.ciphertext(ctx)
    return await window.crypto.subtle.decrypt(this.algo(ctx), key, ciphertext)
  }

  protected cloneAttributes(target: Element, source: Element): void {
    [...source.attributes].forEach((attr) => {
      target.setAttribute(attr.nodeName, attr.nodeValue)
    })
  }
}

export { ImageDecrypter }
