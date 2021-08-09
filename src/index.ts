type AlgoParams = AlgorithmIdentifier | RsaOaepParams | AesCtrParams | AesCbcParams | AesGcmParams

type Ciphertext =
  | Int8Array
  | Int16Array
  | Int32Array
  | Uint8Array
  | Uint16Array
  | Uint32Array
  | Uint8ClampedArray
  | Float32Array
  | Float64Array
  | DataView
  | ArrayBuffer

class Context {
  public ciphertext: Ciphertext
  public plaintext: ArrayBuffer
  public lastResponse: Response

  constructor(public encryptedImage: Element) {
    this.lastResponse = undefined
    this.plaintext = undefined
  }
}

class ImageDecrypter {
  constructor(
    public querySelector: string = 'img.encrypted',
    public algo: (ctx: Context) => AlgoParams = ImageDecrypter.getAESCBCAlgoFromElementAttributes,
    public key: (ctx: Context) => Promise<CryptoKey> = ImageDecrypter.getAESCBCKeyFromElementAttributes,
    public ciphertext: (ctx: Context) => Promise<Ciphertext> = ImageDecrypter.fetchWithCredentials,
    public onSuccess: (ctx: Context) => void = ImageDecrypter.replaceWithNewImage,
    public onError: (ctx: Context, error: Error) => void,
  ) {}

  /**
   * Fetch encrypted images from the secure URL, decrypt them, and replace them
   * with the decrypted version of data.
   */
  public async decrypt(): Promise<void> {
    const nodeList = document.querySelectorAll(this.querySelector)
    for (const encryptedImage of nodeList) {
      const ctx = new Context(encryptedImage)
      try {
        const plaintext = await this.decryptImage(ctx)
        ctx.plaintext = plaintext
        this.onSuccess(ctx)
      } catch (error) {
        if (this.onError) {
          this.onError(ctx, error)
        } else {
          console.error('ImageDecrypter: decrypt image failed, node:', ctx.encryptedImage, 'error:', error)
        }
      }
    }
  }

  protected async decryptImage(ctx: Context): Promise<ArrayBuffer> {
    const key = await this.key(ctx)
    const ciphertext = await this.ciphertext(ctx)
    ctx.ciphertext = ciphertext
    return await window.crypto.subtle.decrypt(this.algo(ctx), key, ciphertext)
  }

  static cloneAttributes(target: Element, source: Element): void {
    ;[...source.attributes].forEach((attr) => {
      target.setAttribute(attr.nodeName, attr.nodeValue)
    })
  }

  static hexString2Bytes(hexString: string): Uint8Array {
    return new Uint8Array(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)))
  }

  static getAESCBCAlgoFromElementAttributes(ctx: Context, attrName = 'crypto-iv'): AesCbcParams {
    const hexIV = ctx.encryptedImage.getAttribute(attrName)
    // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/decrypt#syntax
    return {
      name: 'AES-CBC',
      iv: hexIV === undefined ? undefined : ImageDecrypter.hexString2Bytes(hexIV),
    }
  }

  static async getAESCBCKeyFromElementAttributes(ctx: Context, attrName = 'crypto-key'): Promise<CryptoKey> {
    const hexKey = ctx.encryptedImage.getAttribute(attrName)
    // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/importKey
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      ImageDecrypter.hexString2Bytes(hexKey),
      { name: 'AES-CBC' },
      false,
      ['decrypt'],
    )

    return cryptoKey
  }

  static async fetchWithCredentials(ctx: Context, attrName = 'crypto-src'): Promise<ArrayBuffer> {
    const dataURL = ctx.encryptedImage.getAttribute(attrName)
    const resp = await fetch(dataURL, { credentials: 'same-origin' })
    ctx.lastResponse = resp // update ctx.lastResponse
    return await resp.arrayBuffer()
  }

  static replaceWithNewImage(ctx: Context): void {
    const encryptedImage = ctx.encryptedImage
    // https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL
    const decryptedImageURL = window.URL.createObjectURL(new Blob([ctx.plaintext]))
    const newImage = document.createElement('img')
    ImageDecrypter.cloneAttributes(newImage, encryptedImage)
    newImage.src = decryptedImageURL
    newImage.classList.remove('encrypted')
    newImage.classList.add('decrypted')
    encryptedImage.parentNode.replaceChild(newImage, encryptedImage)
  }
}

export { ImageDecrypter }
