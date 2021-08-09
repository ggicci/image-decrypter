# image-decrypter

[![npm version](https://badge.fury.io/js/%40ggicci%2Fimage-decrypter.svg)](https://badge.fury.io/js/%40ggicci%2Fimage-decrypter)

Decrypt images in the browser.

## Install

```bash
npm i @ggicci/image-decrypter
```

## Quick View

See [Demo](https://ggicci.github.io/image-decrypter/)

```html
<img
  class="encrypted"
  src="https://via.placeholder.com/320x320/888888/000000?text=Placeholder"
  crypto-src="docs/Lenna.png.encrypted"
  crypto-iv="44122879D2A5371AC4D9AE85ECFA794E"
  crypto-key="98F7C27155698508057CC4650DF1A827"
/>

<script type="module">
  import { ImageDecrypter } from 'dist/index.js'
  new ImageDecryptor().decrypt()
</script>
```
