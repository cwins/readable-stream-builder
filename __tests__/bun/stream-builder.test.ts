import { describe, expect, it } from 'bun:test';
import { Readable } from 'node:stream';
import { ReadablePromiseStreamBuilder } from '../../dist/index.js';

const htmlFixturePretty = `
<!doctype html>
<html>
  <head>
    <title>Stream Builder</title>
  </head>
  <body>
    <header>
      <h1>Stream Test</h1>
    </header>
      <section id="section_1">
        <p>Apple</p>
        <p>Orange</p>
        <p>Banana</p>
      </section>
      <section id="section_2">
        <p>Potato</p>
        <p>Carrot</p>
      </section>
      <script type="module" src="#"></script>
  </body>
</html>`;

const trimLine = (line: string) => line.trim();
const trimLines = (lines: string[]) => lines.map(trimLine).filter((line) => line.length > 0);
const multiLineToSingleLine = (str: string) => trimLines(str.trim().split('\n')).join('');

const HTML_FIXTURE = multiLineToSingleLine(htmlFixturePretty);

async function streamToString(stream: Readable) {
  const result: string[] = [];

  for await (const chunk of stream) {
    result.push(typeof chunk === 'string' ? chunk : chunk.toString());
  }

  return multiLineToSingleLine(result.join(''));
}

const wait = (ms: number = 100) => new Promise((res) => {
  setTimeout(res, ms);
});

describe('ReadablePromiseStreamBuilder (Bun)', () => {
  it('returns a new stream with each call to build()', async () => {
    const streamBuilder = new ReadablePromiseStreamBuilder(['foo bar']);

    const stream1 = streamBuilder.build();
    const stream2 = streamBuilder.build();

    expect(stream1).not.toBe(stream2);
  });

  it('only process the sources that were present when calling build()', async () => {
    const streamBuilder = new ReadablePromiseStreamBuilder(['foo__', 'bar__']);

    const stream1 = streamBuilder.build();

    streamBuilder.push('baz');
    const stream2 = streamBuilder.build();

    const output1 = await streamToString(stream1);
    const output2 = await streamToString(stream2);

    expect(output1).not.toBe(output2);
    expect(output1).toBe('foo__bar__');
    expect(output2).toBe('foo__bar__baz');
  });

  it('streams string sources in sequence', async () => {
    const streamBuilder = new ReadablePromiseStreamBuilder([
      '<!doctype html>',
      '<html>',
      '<head><title>Stream Builder</title></head>',
      '<body>',
      '<header><h1>Stream Test</h1></header>',
      '<section id="section_1">',
      '<p>Apple</p>',
      '<p>Orange</p>',
      '<p>Banana</p>',
      '</section>',
      `<section id="section_2">
        <p>Potato</p>
        <p>Carrot</p>
      </section>`,
      '<script type="module" src="#"></script>',
      '</body>',
      '</html>'
    ]);

    const stream = streamBuilder.build();
    const output = await streamToString(stream);
    expect(output).toBe(HTML_FIXTURE);
  });

  it('streams promise sources in sequence', async () => {
    const docType = '<!doctype html>';
    const openingHtml = '<html>';
    const head = (`
      <head>
        <title>Stream Builder</title>
      </head>
    `);
    const openingBody = '<body>';
    const header = (`
      <header>
        <h1>Stream Test</h1>
      </header>
    `);
    const section1 = (`
      <section id="section_1">
        <p>Apple</p>
        <p>Orange</p>
        <p>Banana</p>
      </section>  
    `);
    const section2 = (`
      <section id="section_2">
        <p>Potato</p>
        <p>Carrot</p>
      </section>
    `);
    const bottomScript = '<script type="module" src="#"></script>';
    const closingBody = '</body>';
    const closingHtml = '</html>';

    const streamBuilder = new ReadablePromiseStreamBuilder([
      Promise.resolve(docType),
      Promise.resolve(openingHtml),
      head,
      Promise.resolve(openingBody),
      Promise.resolve(header),
      () => section1,
      () => section2,
      wait(100).then(() => bottomScript),
      () => closingBody,
      Promise.resolve(closingHtml)
    ]);

    const stream = streamBuilder.build();
    const output = await streamToString(stream);
    expect(output).toBe(HTML_FIXTURE);
  });

  it('streams syncronous factory function sources in sequence', async () => {
    const docType = '<!doctype html>';
    const openingHtml = '<html>';
    const head = (`
      <head>
        <title>Stream Builder</title>
      </head>
    `);
    const openingBody = '<body>';
    const header = (`
      <header>
        <h1>Stream Test</h1>
      </header>
    `);
    const section1 = (`
      <section id="section_1">
        <p>Apple</p>
        <p>Orange</p>
        <p>Banana</p>
      </section>  
    `);
    const section2 = (`
      <section id="section_2">
        <p>Potato</p>
        <p>Carrot</p>
      </section>
    `);
    const bottomScript = '<script type="module" src="#"></script>';
    const closingBody = '</body>';
    const closingHtml = '</html>';

    const streamBuilder = new ReadablePromiseStreamBuilder([
      () => docType,
      () => openingHtml,
      () => head,
      () => openingBody,
      () => header,
      () => section1,
      () => section2,
      () => bottomScript,
      () => closingBody,
      () => closingHtml
    ]);

    const stream = streamBuilder.build();
    const output = await streamToString(stream);
    expect(output).toBe(HTML_FIXTURE);
  });

  it('streams async factory function sources in sequence', async () => {
    const docType = '<!doctype html>';
    const openingHtml = '<html>';
    const head = (`
      <head>
        <title>Stream Builder</title>
      </head>
    `);
    const openingBody = '<body>';
    const header = (`
      <header>
        <h1>Stream Test</h1>
      </header>
    `);
    const section1 = (`
      <section id="section_1">
        <p>Apple</p>
        <p>Orange</p>
        <p>Banana</p>
      </section>  
    `);
    const section2 = (`
      <section id="section_2">
        <p>Potato</p>
        <p>Carrot</p>
      </section>
    `);
    const bottomScript = '<script type="module" src="#"></script>';
    const closingBody = '</body>';
    const closingHtml = '</html>';

    const streamBuilder = new ReadablePromiseStreamBuilder([
      async () => docType,
      () => Promise.resolve(openingHtml),
      async () => {
        await wait(1000);

        return head;
      },
      () => openingBody,
      () => header,
      async () => {
        await wait(50);

        return section1;
      },
      () => section2,
      () => wait(100).then(() => bottomScript),
      () => closingBody,
      () => closingHtml
    ]);

    const stream = streamBuilder.build();
    const output = await streamToString(stream);
    expect(output).toBe(HTML_FIXTURE);
  });

  it('streams a mix of source types in sequence', async () => {
    const docType = '<!doctype html>';
    const openingHtml = '<html>';
    const head = (`
      <head>
        <title>Stream Builder</title>
      </head>
    `);
    const openingBody = '<body>';
    const header = (`
      <header>
        <h1>Stream Test</h1>
      </header>
    `);
    const section1 = (`
      <section id="section_1">
        <p>Apple</p>
        <p>Orange</p>
        <p>Banana</p>
      </section>  
    `);
    const section2 = (`
      <section id="section_2">
        <p>Potato</p>
        <p>Carrot</p>
      </section>
    `);
    const bottomScript = '<script type="module" src="#"></script>';
    const closingBody = '</body>';
    const closingHtml = '</html>';

    const prefetchedData = wait(500).then(() => ({ foo: 'bar' }));

    const streamBuilder = new ReadablePromiseStreamBuilder([
      () => docType,
      openingHtml,
      Promise.resolve(head),
      () => wait(1000).then(() => openingBody),
      header,
      () => section1,
      async () => {
        await prefetchedData;

        return section2;
      },
      prefetchedData.then(() => bottomScript),
      closingBody,
      closingHtml
    ]);

    const stream = streamBuilder.build();
    const output = await streamToString(stream);
    expect(output).toBe(HTML_FIXTURE);
  });

  it('streams Readable stream sources in sequence', async () => {
    const headerStream = Readable.from([
      '<header>',
      '<h1>Stream Test</h1>',
      '</header>'
    ]);
    const sectionOneStream = Readable.from([
      '<p>Apple</p>',
      '<p>Orange</p>',
      '<p>Banana</p>'
    ]);
    const sectionTwoStream = Readable.from([
      '<p>Potato</p>',
      '<p>Carrot</p>'
    ]);

    const streamBuilder = new ReadablePromiseStreamBuilder([
      '<!doctype html>',
      '<html>',
      '<head><title>Stream Builder</title></head>',
      '<body>',
      headerStream,
      '<section id="section_1">',
      sectionOneStream,
      '</section>',
      '<section id="section_2">',
      sectionTwoStream,
      '</section>',
      '<script type="module" src="#"></script>',
      '</body>',
      '</html>'
    ]);

    const stream = streamBuilder.build();
    const output = await streamToString(stream);
    expect(output).toBe(HTML_FIXTURE);
  });

  it('skips promises that resolve to unsupported values', async () => {
    const streamBuilder = new ReadablePromiseStreamBuilder([
      Promise.resolve(123 as any),
      'then valid',
    ]);

    const output = await streamToString(streamBuilder.build());
    expect(output).toBe('then valid');
  });

  it('ignores factory promises that resolve to unsupported values', async () => {
    const streamBuilder = new ReadablePromiseStreamBuilder([
      () => Promise.resolve(456 as any),
      'plus content',
    ]);

    const output = await streamToString(streamBuilder.build());
    expect(output).toBe('plus content');
  });

  it('accepts falsy initial sources without throwing', async () => {
    const streamBuilder = new ReadablePromiseStreamBuilder(null as any);
    streamBuilder.push('always there', () => Promise.resolve(' after'));

    const output = await streamToString(streamBuilder.build());
    expect(output).toBe('always there after');
  });
});
