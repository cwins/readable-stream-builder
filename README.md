# readable-stream-builder

Basic utility to create a `Readable` stream from other strings or streams. Under the hood, this just uses an async generator function with a little bit of logic, and returns a `Readable` that can be piped into a `Response` (or whatever else).

## Why?

When dealing with server-side rendering, stitching together the final HTML can often be awkward, ugly, and brittle. Many times it can lead to mixed async data fetching, string concatenation, and response-handling logic. That leads to several pain points:

- Hard-to-follow control flow: data fetching patterns and string concatenation patterns tend to influence each other in bad ways.
- Tight coupling to `Response`: many solutions write directly to the response, scattering I/O logic across rendering code.

`readable-stream-builder` exists to make composition of streamed HTML (or any streamed text) simple and explicit. It accepts a mixed list of sources — plain strings, Node `Readable` streams, promises that resolve to either a string or `Readable` stream. It also accepts factory functions (which can be sync or async) that ultimately resolve to a string or `Readable` stream.

These sources can be passed in during instantiation, added later with the `push()` method, or a mix of both.

**Benefits:**

- Compose synchronously and asynchronously without manual orchestration.
- Keep most of your render code server and framework agnostic by interacting with the stream builder instead of the response.
- Keep rendering logic declarative and local to components.
- Stream content as it becomes available to reduce latency and memory usage.
