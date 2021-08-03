# js-encrypted-image

Decrypt images in the browser.

```html
<img
  src="https://example.com/images/placeholder.png"
  encrypted-src="https://example.com/images/encrypted.png"
  class="encrypted"
/>

<script src="https://example.com/js/js-encrypted-image.js"></script>
<script>
  const decryptor = new ImageDecryptor({
    querySelctor: "img.encrypted",
    decryptionKey: () => Promise, // returns the decryption key
  });

  decryptor.decrypt();
</script>
```

TODO(ggicci): think about the `<picture>` tag?

## Server API

The image URL used in the attribute `encrypted-url` should return both the image and the decryption key.
