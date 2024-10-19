
<div align="center">
  <h1>@figmarine/rest</h1>
  
  <p>
    A fully typed client for the Figma REST API, with quality-of-life features.
  </p>
  
  
  <p>
    <img src="https://img.shields.io/badge/status-experimental-thistle" alt="Status: Experimental" />
    <a href="https://github.com/Sidnioulz/figmarine/commits"><img src="https://img.shields.io/github/commit-activity/m/Sidnioulz/figmarine" alt="commit activity" /></a>
    <a href="https://github.com/Sidnioulz/figmarine/commits"><img src="https://img.shields.io/github/last-commit/Sidnioulz/figmarine" alt="last commit" /></a>
    <a href="https://github.com/Sidnioulz/figmarine/issues?q=is%3Aopen+is%3Aissue+label%3Apkg-rest"><img src="https://img.shields.io/github/issues-search?query=repo%3ASidnioulz%2Ffigmarine%20is%3Aopen%20is%3Aissue%20label%3Apkg-rest&label=issues" alt="open issues" /></a>
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
    <a href="https://github.com/Sidnioulz/figmarine/packages/rest">📗 Documentation</a>
  <span> · </span>
    <a href="https://github.com/Sidnioulz/figmarine/issues/new?labels=bug,pkg-rest">🐛 Report a Bug</a>
  <span> · </span>
    <a href="https://github.com/Sidnioulz/figmarine/issues/new?labels=enhancement,pkg-rest">💡 Request Feature</a>
  </h4>
</div>

<br />

## :notebook_with_decorative_cover: Table of Contents

<!-- no toc -->
  - [Package Details](#star2-package-details)
  - [Usage](#eyes-usage)
    - [Environment Variables](#eyes-environment-variables)
  - [Run Locally](#running-run-locally)
  - [Contributing](#wave-contributing)
  - [License](#warning-license)
  - [Support](#sos-support)
  - [Acknowledgments](#yellow_heart-acknowledgments)

## :star2: Package Details

A fully typed client for the Figma REST API, with quality-of-life features. Used by [figmarine](https://github.com/Sidnioulz/figmarine) as an API client.

- Always up-to-date: generated from Figma's OpenAPI spec and updated by a CI script
- JavaScript client with a fully typed API
- Development mode that automatically caches GET responses, with persistence across runs
- Built-in rate limiting to protect you from an IP ban
- Easy authentication


<!-- Usage -->
## :eyes: Usage

Install the package with the following command:

```bash
 pnpm i @figmarine/rest
```

To use the client, import the package, create a client and call its methods. All methods are asynchronous and return an [Axios response](https://axios-http.com/docs/res_schema) object.

```ts
import { Client, WebhookV2Event } from '@figmarine/rest';

const c = await Client({ mode: 'development' });

// The v1 API contains most methods for manipulating Figma data.
const response = await c.v1.getTeamProjects('1234567890');

// The v2 API contains Webhooks.
await c.v2.postWebhook({
  event_type: WebhookV2Event.PING,
  description: 'This is my custom webhook!',
  team_id: '1234567890',
  endpoint: 'https://myserver.com/endpoint',
  passcode: 'mySecretPasscode',
});
```

### Client Options

The `Client` function exposes the following options.

#### mode `'development' | 'production'`

Defines whether your client is being developed or running in a production environment. At the moment, only used to handle the default behaviour of the built-in cache. May be used to control default logging verbosity in the future.

#### oauthToken `string`

An [OAuth2 token](https://www.figma.com/plugin-docs/oauth-with-plugins/) to authenticate to the client. It is mandatory to either pass this token or a `personalAccessToken`.

#### personalAccessToken `string`

An [Personal Access Token](https://help.figma.com/hc/en-us/articles/8085703771159-Manage-personal-access-tokens) to authenticate to the client. It is mandatory to either pass this token or an `oauthToken`.

#### cache `boolean | object`

See [Built-in Cache](#built-in-cache).

#### rateLimit `boolean | string`

See [Rate Limiting](#rate-limiting).

### Environment Variables

The following environment variables are supported:

* `NODE_ENV`: used to initialise the run mode to `development` or `production`
* `FIGMA_PERSONAL_ACCESS_TOKEN`: used to authenticate with a Personal Access Token
* `FIGMA_OAUTH_TOKEN`: used to authenticate with an OAuth 2.0 Token

### Rate Limiting

Figma applies a rate limit to the number of API requests you can send,  to prevent spam. The rate limiting algorithm is complex and cannot be properly emulated by API clients, so the Figmarine REST client uses two approaches.

**Exponential auto-retry:** When the API returns a `429 Too Many Requests` error, the client waits for however long the API requested, and then automatically retries sending the request. The client at least waits one minute on the initial error, and then waits exponentially longer (two minutes, then four, etc.) on subsequent errors that happen immediately after.

**Proactive rate limiting:** The client sends at most 10 requests per minute when that option is active based on anecdotal information about the limits enforced by Figma. This option is not recommended if you don't have other clients frequently querying the API.

You may choose the behaviour to use with the `rateLimit` option:

|         Value | Behaviour                                          |
| ------------: | -------------------------------------------------- |
|  `'reactive'` | only does auto-retry *[default]*                   |
| `'proactive'` | does *both* auto-retry and proactive rate limiting |
|        `true` | does *both* auto-retry and proactive rate limiting |
|       `false` | does nothing                                       |



### Built-in Cache

This client ships with a disk cache that's enabled by default in `development` `mode` and disabled by default in `production` `mode`. The cache is stored to disk and restored across runs to allow you to quickly write and test Node.js scripts as you would typically develop them prior to running them in a CI.

> [!CAUTION]
> Changes made through the Figma application or other API clients cause the cache to become stale. The cache is intended to speed up development rather than to be used in production. It is your responsibility to decide if stale cache is acceptable for your use cases.
 

```ts
const c = await Client({ mode: 'development' });

// Takes 1 second on the first run, instantaneous on the second run.
await c.v1.getFile('gcW09NWmIPr158bu49ieX8');
```

#### Enabling or Disabling the Cache

You may force-enable the disk cache by passing `true` to the `cache` option, or by passing any configuration object. All options are optional.

```ts
const c = await Client({ cache: { ttl: 6000 } });
```

You may force-disable it by passing `false`.

```ts
const c = await Client({ cache: false });
```

#### autoInvalidate `boolean`

Controls wether the cache content clears automatically when the client knows it may be invalid.

|   Value | Behaviour                                                                                      |
| ------: | ---------------------------------------------------------------------------------------------- |
|  `true` | the whole cache gets cleared whenever a `POST`, `PUT` or `DELETE` request is made  *[default]* |
| `false` | the cache never self-clears and you have to do it yourself                                     |

#### location `string`

Controls where on the disk the cache is written.

|         Value | Behaviour                                                       |
| ------------: | --------------------------------------------------------------- |
|   `undefined` | written to your operating system's temporary folder *[default]* |
| relative path | written to a subfolder in the temporary folder                  |
| absolute path | written to the provided path                                    |

#### ttl `number`

Number of seconds for which a request response will be kept in the cache.

|       Value | Behaviour                                     |
| ----------: | --------------------------------------------- |
| `undefined` | purged after approximately 1 year *[default]* |
|      number | purged after that number of seconds           |


#### Programmatic Access
You can access the cache instance by using the `cacheInstance` property, and you can loop over its content to inspect it.

```ts
for await (const [key] of c.cacheInstance.iterator()) {
  console.log(key);
}
```

> [!NOTE]
> The instance is not designed to be used for arbitrary data, and it is strongly typed for use with Axios data. If you'd like to extend its capabilities, contributions are welcome!

#### Programmatic Clearing

```ts
c.cacheInstance.clear();
```


 
> [!TIP]
> If you use the cache and make edits to the file you're developing on, remember to clear the cache on the next run after editing the file.

## :running: Run Locally

Clone the project

```bash
  git clone https://github.com/Sidnioulz/figmarine.git
```

Go to the project directory

```bash
  cd packages/rest
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

## :wave: Contributing

See [how to contribute](https://github.com/Sidnioulz/figmarine/tree/main?tab=readme-ov-file#package-contributing).

## :warning: License

Distributed under the [MIT License](https://github.com/Sidnioulz/figmarine/tree/main?tab=MIT-1-ov-file).

## :sos: Support

Please open a conversation in the [discussion space](https://github.com/Sidnioulz/figmarine/discussions) to ask a question.

Please [open an issue](https://github.com/Sidnioulz/figmarine/issues/new?labels=pkg-rest) for bug reports or code suggestions.

## :yellow_heart: Acknowledgments

- [@figma/rest-api-spec](https://github.com/figma/rest-api-spec) provides the up-to-date OpenAPI Spec file used by this package
- [swagger-typescript-api](https://github.com/acacode/swagger-typescript-api) is the codegen engine used by this package
