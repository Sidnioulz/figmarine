# Figmarine TODO List

## SHORT TERM

* [ ] Add typedoc to turbo outputs
* [ ] Add typedoc to gitignore
* [ ] Add typedoc to prettierignore
* [ ] Add typedoc to eslintignore
* [ ] Add typedoc to tsignore

* [ ] Add docs to turbo outputs
* [ ] Add docs to gitignore
* [ ] Add docs to prettierignore
* [ ] Add docs to eslintignore
* [ ] Add docs to tsignore
* [ ] Automate copy of openapi.json to public/ in api-docs

## DOCDOCDOC
* [ ] README for every pkg to avoid pulling the main readme
* [ ] typedoc plugin to rewrite all .MD paths to / for ./static and for _media/#

* [ ]  factory that packages Figma plugins with a given ruleset

## Root

- [ ] Add typedecls to all config files
- [ ] PR templates
- [ ] Versioning system



## packages/graphql

- [ ] `figma-rest-graphql-client`
- [ ] Write the integration with https://the-guild.dev/graphql/mesh
- [ ] Add cache support
- [ ] Add unit tests
- [ ] Write a README
- [ ] Write CD code to release the package
- [ ] Add repository and homepage to manifest

## apps/oauth-helper

- [ ] Implement the server needed
- [ ] And the auth ui?

## apps/nursery

- [ ] Build nursery app
- [ ] Create and document the `figorder.json` file format
- [ ] Use the cuttings package to support passing orders
- [ ] Ensure all retrieved cuttings are long-term stored by default
- [ ] Include versioning in cache keys / file keys in the nursery storage
- [ ] Handle cutting rehydration
- [ ] Add unit tests
- [ ] Write a README
- [ ] Write CD code to release the package
- [ ] Add repository and homepage to manifest

## apps/lint

- [ ] Add repository and homepage to manifest
- [ ] `eslint-plugin-figma` NPM

### Core
- [ ] Write the lint engine that reads rules and runs them _OR_ subdue ESLint
- [ ] Extract concepts for the engine (components, component sets, variables, fills, borders, texts, effects, props, description, node names, node types, children, parents, etc.)

- [ ] Try to run a rule by visiting the appropriate concept and drawing conclusions
- [ ] Write `publishConfig`

### Config and running in projects

- [ ] Write the linter config format and type it
- [ ] Add to https://github.com/SchemaStore/schemastore/blob/master/CONTRIBUTING.md
- [ ] Add tooling to read config files from projects using this app

### QA and Release

- [ ] Build an integration test
- [ ] Add unit tests
- [ ] Write a README
- [ ] Add full-blown examples
- [ ] Write CD code to release the package
