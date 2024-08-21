# Figmarine TODO List

## SHORT TERM

* [ ] Fix up READMEs
* [ ] Progress on cache opts
* [ ] Dependabot automation
* [ ] Clean up REST API package
* [ ] Release REST API package

## Root

* [ ] Dependabot automation
* [ ] Implement all badges
* [ ] CLA
* [ ] PR templates
* [ ] Versioning system

## packages/cache
* [ ] Decide how to allow cache enabling/disabling in dev mode
* [ ] Disable cache in test mode, except for cache-related tests
* [ ] Provide options to control TTL?
* [ ] Add repository and homepage to manifest

## packages/rest
* [ ] `figma-rest-ts-client`
* [ ] Document the REST API
* [ ] Add Renovate to auto-update the figma-rest-api project
* [ ] Add unit tests
* [ ] Write a README
* [ ] Write CD code to release the package
* [ ] Decide on how to expose cache options to the REST library users
* [ ] Iterate on the cache key generator and cache invalidation strategy
* [ ] Add repository and homepage to manifest

## packages/cuttings

* [ ] Build vFile node library to generate a file from a key and facets
* [ ] Create and document the `figcutting.json` file format
* [ ] Add repository and homepage to manifest
* [ ] Add README
* [ ] Add UTs
* [ ] Add NPM release


## apps/nursery

* [ ] Build nursery app
* [ ] Create and document the `figorder.json` file format
* [ ] Use the cuttings package to support passing orders
* [ ] Ensure all retrieved cuttings are long-term stored by default
* [ ] Include versioning in cache keys / file keys in the nursery storage
* [ ] Add repository and homepage to manifest
* [ ] Add README
* [ ] Add UTs
* [ ] Add NPM release

## packages/config-eslint

* [ ] Add import order

## apps/lint

* [ ] Add repository and homepage to manifest
* [ ] `eslint-plugin-figma` NPM

### Core
* [ ] Write the lint engine that reads rules and runs them *OR* subdue ESLint
* [ ] Extract concepts for the engine (components, component sets, variables, fills, borders, texts, effects, props, description, node names, node types, children, parents, etc.)
* [ ] Try to run a rule by visiting the appropriate concept and drawing conclusions
* [ ] Write `publishConfig`

### Config and running in projects
* [ ] Write the linter config format and type it
* [ ] Add to https://github.com/SchemaStore/schemastore/blob/master/CONTRIBUTING.md
* [ ] Add tooling to read config files from projects using this app

### QA and Release
* [ ] Build an integration test
* [ ] Add unit tests
* [ ] Write a README
* [ ] Add full-blown examples
* [ ] Write CD code to release the package

## packages/graphql

* [ ] `figma-rest-graphql-client`
* [ ] Write the integration with https://the-guild.dev/graphql/mesh
* [ ] Add cache support
* [ ] Add unit tests
* [ ] Write a README
* [ ] Write CD code to release the package
* [ ] Add repository and homepage to manifest