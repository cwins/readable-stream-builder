# readable-stream-builder

Basic utility to create a `Readable` stream from other strings or streams. Under the hood, this just uses an async generator function with a little bit of logic, and returns a `Readable` that can be piped into a `Response` (or whatever else).

## Why?

When dealing with server-side rendering, stitching together the final HTML can often be awkward, ugly, and brittle. The data fetching patterns and string concatenation patterns tend to influence each other in bad ways. Additionally, you end up interacting directly with the `Response` object more than you should.

### Examples without this package

#### Fragmented orchestration
```js
// ...
  res.write('<!DOCTYPE html><html>');

  const renderHeadTemplate = (title, description, scripts, styles) => `
    <head>
      <title>${title}</title>
      <meta name="description" content="${description}">
      ${scripts.map((src) => `<script type="text/javascript" src="${src}"/>`)}
      ${styles.map((href) => `<link rel="stylesheet" href="${href}">`)}
    </head>
  `;

  // oops, someone forgot about non-blocking patterns
  const metaTitle = await fetchTitle(); // 100ms
  const metaDescription = await fetchDescription(); // 150ms
  const headScripts = await getHeadScripts(); // 10ms
  const headStyles = await getHeadStyles(); // 5ms

  res.write(renderHeadTemplate(metaTitle, metaDescription, headScripts, headStyles));
  res.write('<body><div id="app">');

  const appHtml = await renderToString(<App />);

  res.write(appHtml);
  res.write('</body></html>');
  res.end();
// ...
```

 <!-- installation and usage -->