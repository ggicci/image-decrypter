# js-encrypted-image

Decrypt images in the browser.

## Quick View

See [Demo](https://ggicci.github.io/image-decrypter/)

```html
<img
  class="encrypted"
  src="https://via.placeholder.com/320x320/888888/000000?text=Placeholder"
  crypto-src="./Lenna.png.encrypted"
  crypto-iv="44122879D2A5371AC4D9AE85ECFA794E"
  crypto-key="98F7C27155698508057CC4650DF1A827"
  style="height: 320px; width: 320px"
/>

<script type="module" src="lib/index.js"></script>
<script type="module">
  import { ImageDecrypter } from 'lib/index.js'
  new ImageDecryptor().decrypt()
</script>
```
