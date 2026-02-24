import { Readable } from 'stream';
import { isPromise } from 'util/types';

export type Streamable = string | Readable | Promise<string> | Promise<Readable> | Promise<string | Readable>;
export type StreamableFactory = () => (string | Readable | Promise<string> | Promise<Readable> | Promise<string | Readable>);
export type StreamSource = Streamable | StreamableFactory;

/**
 * Builder class for creating a Readable stream from a collection of sources.
 */
export class ReadablePromiseStreamBuilder {
    private _sources: StreamSource[];

    /**
     * Create a new instance of the builder.
     * THe constructor accepts an array of initial sources, which is really just a shorthand way of instantiating the builder then calling `push()`.
     * 
     * @example
     * ```ts
     * const title = 'What up dawg!';
     * const builder = new ReadablePromiseStreamBuilder([
     *     '<html>',
     *     '<head><title>',
     *     title,
     *     '</title></head>',
     * ]);
     * 
     * builder.push('<body>');
     * ```
     */
    constructor(initialSources: Array<StreamSource> = []) {
        this._sources = [...(initialSources || [])];
    }

    /**
     * Add sources to the builder prior to calling `build()`.
     * Sources can be strings, `Readable` streams, `Promise` that resolve to a string or `Readable` stream, or factory functions that return one of those types.
     */
    push(...sources: StreamSource[]) {
        this._sources.push(...sources);
    }

    /**
     * Returns a new `Readable` stream. This is typically only called once per instance and any calls to `push()` after this will not be included in this `Readable` stream.
     */
    build() {
        return Readable.from(promiseStream([...this._sources]));
    }    
}

/**
 * Generator function that invokes all of the sources async and then resolves them in order to the `Readable` stream.
 */
async function* promiseStream(sources: StreamSource[]) {
    const initializedSources = sources.map(async (source) => {
        if (typeof source === 'string' || source instanceof Readable) {
            return source;
        }
        else if (isPromise(source)) {
            return source.then((result) => {
                if (typeof result === 'string' || result instanceof Readable) {
                    return result;
                }

                return undefined;
            });
        }
        else if (typeof source === 'function') {
            const innerSource = source();

            if (typeof innerSource === 'string' || innerSource instanceof Readable) {
                return innerSource;
            }
            else if (isPromise(innerSource)) {
                return innerSource.then((result) => {
                    if (typeof result === 'string' || result instanceof Readable) {
                        return result;
                    }

                    return undefined;
                });
            }
        }
    });

    for (const source of initializedSources) {
        const content = await source;

        if (typeof content === 'string') {
            yield content;
        }
        else if (content instanceof Readable) {
            // we need to pipe each chunk from a source Readable
            for await (const chunk of content) {
                yield chunk;
            }
        }
    }
}
