import { describe, expect, it } from 'vitest';
import { Readable } from 'node:stream';
import { ReadablePromiseStreamBuilder } from '../src';

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

describe('ReadablePromiseStreamBuilder', () => {
  it('can be instantiated with or without initial sources', async () => {
    const streamBuilder1 = new ReadablePromiseStreamBuilder();
    const streamBuilder2 = new ReadablePromiseStreamBuilder(['pizza']);

    expect(streamBuilder1).toBeInstanceOf(ReadablePromiseStreamBuilder);
    expect(streamBuilder2).toBeInstanceOf(ReadablePromiseStreamBuilder);

    const stream1 = streamBuilder1.build();
    const stream2 = streamBuilder2.build();

    const output1 = await streamToString(stream1);
    const output2 = await streamToString(stream2);

    expect(output1).toBe('');
    expect(output2).toBe('pizza');
  });

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
      () => [docType, openingHtml, head, openingBody].join('\n'),
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

  it('ignores sources that are unsupported types', async () => {
    const streamBuilder = new ReadablePromiseStreamBuilder([
      null!,
      'valid in the middle :)',
      { foo: 'bar' } as any
    ]);

    const output = await streamToString(streamBuilder.build());
    expect(output).toBe('valid in the middle :)');
  });

  it('ignores source factory functions that return unsupported types', async () => {
    const streamBuilder = new ReadablePromiseStreamBuilder([
      () => null!,
      'valid in the middle :)',
      () => 4 as any
    ]);

    const output = await streamToString(streamBuilder.build());
    expect(output).toBe('valid in the middle :)');
  });

  it('ignores source promises that resolve to unsupported types', async () => {
    const streamBuilder = new ReadablePromiseStreamBuilder([
      Promise.resolve(123 as any),
      'then valid',
    ]);

    const output = await streamToString(streamBuilder.build());
    expect(output).toBe('then valid');
  });

  it('ignores source factory functions that return promises which resolve to unsupported types', async () => {
    const streamBuilder = new ReadablePromiseStreamBuilder([
      () => Promise.resolve(456 as any),
      'plus content',
    ]);

    const output = await streamToString(streamBuilder.build());
    expect(output).toBe('plus content');
  });

  it('throws an error when initial sources is not an array', async () => {

    expect(() => {
      const streamBuilder = new ReadablePromiseStreamBuilder(null as any);
    }).toThrowErrorMatchingInlineSnapshot(`[Error: Error: Invalid Sources - Initial sources passed to ReadablePromiseStreamBuilder constructor must either be omitted or an Array of sources. Expected an Array, received a(n) object.]`);
  });
});
