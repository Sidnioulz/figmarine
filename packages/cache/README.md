
<div align="center">
  <h1>@figmarine/cache</h1>
  
  <p>
    A disk cache Node.js library for Figmarine packages.
  </p>
  
  
  <p>
    <img src="https://img.shields.io/badge/status-experimental-thistle" alt="Status: Experimental" />
    <a href="https://github.com/Sidnioulz/figmarine/commits"><img src="https://img.shields.io/github/commit-activity/m/Sidnioulz/figmarine" alt="commit activity" /></a>
    <a href="https://github.com/Sidnioulz/figmarine/commits"><img src="https://img.shields.io/github/last-commit/Sidnioulz/figmarine" alt="last commit" /></a>
    <a href="https://github.com/Sidnioulz/figmarine/issues?q=is%3Aopen+is%3Aissue+label%3Apkg-cache"><img src="https://img.shields.io/github/issues-search?query=repo%3ASidnioulz%2Ffigmarine%20is%3Aopen%20is%3Aissue%20label%3Apkg-cache&label=issues" alt="open issues" /></a>
    <a href="https://github.com/Sidnioulz/figmarine/actions/workflows/github-code-scanning/codeql"><img src="https://github.com/Sidnioulz/figmarine/actions/workflows/github-code-scanning/codeql/badge.svg?branch=main" alt="CodeQL status" /></a>
    <a href="https://github.com/Sidnioulz/figmarine/actions/workflows/continuous-integration.yml"><img src="https://github.com/Sidnioulz/figmarine/actions/workflows/continuous-integration.yml/badge.svg?branch=main" alt="CI status" /></a>
    <a href="https://codecov.io/gh/Sidnioulz/figmarine"><img src="https://codecov.io/gh/Sidnioulz/figmarine/graph/badge.svg?token=4SX3N57XH3" alt="code coverage" /></a>
    <a href="https://github.com/Sidnioulz/figmarine/graphs/contributors"><img src="https://img.shields.io/github/contributors/Sidnioulz/figmarine" alt="contributors" /></a>
    <a href="https://github.com/Sidnioulz/figmarine/blob/main/CODE_OF_CONDUCT.md"><img src="https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg" alt="code of conduct: contributor covenant 2.1" /></a>
    <a href="https://github.com/Sidnioulz/figmarine/blob/main/LICENSE"><img src="https://img.shields.io/github/license/Sidnioulz/figmarine.svg" alt="license" /></a>
    <a href="https://github.com/Sidnioulz/figmarine/network/members"><img src="https://img.shields.io/github/forks/Sidnioulz/figmarine" alt="forks" /></a>
    <a href="https://github.com/Sidnioulz/figmarine/stargazers"><img src="https://img.shields.io/github/stars/Sidnioulz/figmarine" alt="stars" /></a>
    <a href="https://github.com/sponsors/Sidnioulz"><img src="https://img.shields.io/badge/sponsor-30363D?logo=GitHub-Sponsors&logoColor=#EA4AAA" alt="sponsor this project" /></a>
  </p>
   
  <h4>
    <a href="https://github.com/Sidnioulz/figmarine/packages/cache">📗 Documentation</a>
  <span> · </span>
    <a href="https://github.com/Sidnioulz/figmarine/issues/new?labels=bug,pkg-cache">🐛 Report a Bug</a>
  <span> · </span>
    <a href="https://github.com/Sidnioulz/figmarine/issues/new?labels=enhancement,pkg-cache">💡 Request Feature</a>
  </h4>
</div>

<br />

## :notebook_with_decorative_cover: Table of Contents

<!-- no toc -->
  - [Package Details](#star2-package-details)
  - [Usage](#eyes-usage)
  - [Run Locally](#running-run-locally)
  - [Roadmap](#dart-roadmap)
  - [Contributing](#wave-contributing)
  - [License](#warning-license)
  - [Support](#sos-support)
  - [Acknowledgments](#yellow_heart-acknowledgments)

## :star2: Package Details

A Node.js library for caching arbitrary data to disk and restoring cache in between runs. Used by [figmarine](https://github.com/Sidnioulz/figmarine) to cache REST API return values.

- Disk-based memory store
- Configurable store location
- Configurable TTL, cache size and refresh rate
- Allows you to wrap functions for automatic caching


<!-- Usage -->
## :eyes: Usage

Install the package with the following command:

```bash
 pnpm i @figmarine/cache
```

Then, import `makeCache` and call it:


```javascript
import { makeCache, type MakeCacheOptions } from '@figmarine/cache';

const { diskCache, cacheWrapper } = makeCache({
  // A relative path creates a subfolder in /tmp/@figmarine/cache.
  location: 'rest',
  // Pass -1 to push the TTL to its limit (one year TTL).
  ttl: -1,
});
```

You can use the disk cache directly if you want to write into it and handle it manually.

```javascript
await diskCache.set('myKey', 'My value');

const value = await diskCache.get<string>('myKey');
console.log(value); // 'My value'

await diskCache.del(key);
const value = await diskCache.get<string>('myKey');
console.log(value); // 'undefined'
```

You can also wrap existing functions with `cacheWrapper`. When a wrapped function is called,
its return value is cached using the function parameters as a cache key. On the second call
with the same parameters, the cached value will be returned instantly and the function body
won't need to be called ( provided the cached content hasn't expired).

```javascript
const queryFoo = (key) => axios.get(`/foo?ID=${key}`);
const cachedQueryFoo = cacheWrapper('foo', queryFoo);

console.time('First call');
const first = cachedQueryFoo('1234');
console.timeEnd('First call');
// First call: 1081.284912109375 ms

console.time('Second call');
const second = cachedQueryFoo('1234');
console.timeEnd('Second call');
// Second call: 0.108056640625 ms
```

## :running: Run Locally

Clone the project

```bash
  git clone https://github.com/Sidnioulz/figmarine.git
```

Go to the project directory

```bash
  cd packages/cache
```

Install dependencies

```bash
  pnpm install
```

Build the code as you make changes

```bash
  pnpm dev
```

Check that tests run as you make changes

```bash
  pnpm test:dev
```

## :dart: Roadmap

- [x] Make typedoc compatible
- [ ] Add manual invalidator for the wrapper function
- [ ] Add unit tests
- [ ] Document package

## :wave: Contributing

See [how to contribute](https://github.com/Sidnioulz/figmarine/tree/main?tab=readme-ov-file#package-contributing).

## :warning: License

Distributed under the [MIT License](https://github.com/Sidnioulz/figmarine/tree/main?tab=MIT-1-ov-file).

## :sos: Support

Please open a conversation in the [discussion space](https://github.com/Sidnioulz/figmarine/discussions) to ask a question.

Please [open an issue](https://github.com/Sidnioulz/figmarine/issues/new?labels=pkg-cache) for bug reports or code suggestions.

## :yellow_heart: Acknowledgments

- [cache-manager](https://github.com/jaredwray/cacheable/tree/main/packages/cache-manager)
- [cache-manager store for filesystem](https://github.com/rolandstarke/node-cache-manager-fs-hash)
