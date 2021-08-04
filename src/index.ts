function hexString2Bytes(hexString: string): Uint8Array {
  return new Uint8Array(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)))
}

function getAESCBCAlgo(resp: Response): object {
  const hexKeys = resp.headers.get("x-client-crypto-key")
  let hexIV: string
  if (hexKeys.includes(",")) {
    hexIV = hexKeys.split(",")[1]
  }

  // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/decrypt#syntax
  return {
    name: "AES-CBC",
    iv: hexIV === undefined ? undefined : hexString2Bytes(hexIV),
  }
}

async function getAESCBCKey(resp: Response): Promise<CryptoKey> {
  const hexKeys = resp.headers.get("x-client-crypto-key")
  const parts = hexKeys.split(",")
  const hexKey: string = parts[0]

  // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/importKey
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    hexString2Bytes(hexKey),
    {name: "AES-CBC"},
    false,
    ["decrypt"],
  )

  return cryptoKey
}

class ImageDecrypter {
  constructor(
    public querySelector: string = "img.encrypted",
    public algo: (resp: Response) => object = getAESCBCAlgo,
    public key:  (resp: Response) => Promise<CryptoKey> = getAESCBCKey,
  ) {

  }
}
