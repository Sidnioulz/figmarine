<div align="center">
  <picture style="display: flex; flex-direction: column; align-items: center;">
    <source src="./static/Carpobrotus_edulis.avif" type="image/avif" />
    <img style="border-radius: 1rem;"
      src="./static/Carpobrotus_edulis.jpg"
      alt="The flower of the sour fig is a large Pseudanthium inflorescence that contrasts in size with its small, elongated succulent leaves."
      loading="lazy"
      decoding="async"
      height="200"
    />
  </picture>

  <h1>Figmarine</h1>
  
  <p>
    Figue marine, Carpobrotus Edulis. Tools for frontend and DevOps engineers who use Figma.
  </p>
  
  <p>
    <img src="https://img.shields.io/badge/status-initial_stages-orange" alt="Status: Initial stages" />
    <a href="https://github.com/Sidnioulz/figmarine/commits"><img src="https://img.shields.io/github/commit-activity/m/Sidnioulz/figmarine" alt="commit activity" /></a>
    <a href="https://github.com/Sidnioulz/figmarine/commits"><img src="https://img.shields.io/github/last-commit/Sidnioulz/figmarine" alt="last commit" /></a>
    <a href="https://github.com/Sidnioulz/figmarine/issues/"><img src="https://img.shields.io/github/issues/Sidnioulz/figmarine" alt="open issues" /></a>
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
    <a href="https://github.com/Sidnioulz/figmarine">📗 Documentation</a>
  <span> · </span>
    <a href="https://github.com/Sidnioulz/figmarine/issues/new?labels=bug">🐛 Report a Bug</a>
  <span> · </span>
    <a href="https://github.com/Sidnioulz/figmarine/discussions/new?category=linting-rules">💡 Suggest Linting Rule</a>
  </h4>
</div>

---

> [!IMPORTANT]
> This is a community open-source project. It is not affiliated with Figma.
> This project is in its infancy. Get in touch with me before using it in production.

## :notebook_with_decorative_cover: Table of Contents

<!-- no toc -->
- [Key Projects](#star2-key-projects)
  - [Nursery](#nursery)
  - [REST API Client](#rest-api-client)
  - [GraphQL Client](#graphql-client)
  - [ESLint Plugin](#eslint-plugin)
- [Contributing](#woman_technologist-contributing)
  - [Code of Conduct](#code-of-conduct)
  - [Contributor License Agreement](#contributor-license-agreement)
  - [Getting Started](#getting-started)
  - [Pull Requests](#pull-requests)
  - [Release System](#release-system)
- [Support](#sos-support)
- [Contact](#envelope-contact)
- [Acknowledgments](#yellow_heart-acknowledgments)
  - [Thanks](#thanks)
  - [Built With](#built-with)

## :star2: Key Projects

<table>
  <tr>
    <td>
      <h3><a href="./packages/rest/">REST API Client</a></h3>
      <div>A fully-typed JS client for the REST API, generated from an OpenAPI Spec.</div>
    </td>
    <td>
      <h3><a href="./packages/cuttings/">Cuttings</a></h3>
      <div>A library that creates JSON representations of Figma content (files, styles, etc.).</div>
    </td>
    <td>
      <h3><a href="./apps/nursery/">Nursery</a></h3>
      <div>A library for fetching, storing and rehydrating cuttings automatically.</div>
    </td>
    <td>
      <h3><a href="./packages/eslint-plugin-figma/">ESLint Plugin</a></h3>
      <div>An ESLint plugin that can parse Figma cutting files and run rules against them.</div>
    </td>
  </tr>
</table>

<!-- linum (Linum usitatissimum) -->
<!-- oauth server -->
<!-- oauth helper lib -->
<!-- graphql -->

## :woman_technologist: Contributing

### Code of Conduct

Please read the [Code of Conduct](https://github.com/Sidnioulz/figmarine/blob/main/CODE_OF_CONDUCT.md) first.

### Developer Certificate of Origin

To ensure that contributors are legally allowed to share the content they contribute under the license terms of this project, contributors must adhere to the [Developer Certificate of Origin](https://developercertificate.org/) (DCO). All contributions made must be signed to satisfy the DCO. This is handled by a Pull Request check.

> By signing your commits, you attest to the following:
>
> 1. The contribution was created in whole or in part by you and you have the right to submit it under the open source license indicated in the file; or
> 2. The contribution is based upon previous work that, to the best of your knowledge, is covered under an appropriate open source license and you have the right under that license to submit that work with modifications, whether created in whole or in part by you, under the same open source license (unless you are permitted to submit under a different license), as indicated in the file; or
> 3. The contribution was provided directly to you by some other person who certified 1., 2. or 3. and you have not modified it.
> 4. You understand and agree that this project and the contribution are public and that a record of the contribution (including all personal information you submit with it, including your sign-off) is maintained indefinitely and may be redistributed consistent with this project or the open source license(s) involved.

### Getting Started

This project uses PNPM as a package manager, and Turbo as a monorepo provider.

- See the [installation instructions for PNPM](https://pnpm.io/installation)
- Clone the whole repository; all published projects depend on internal utility and config packages
- Run `pnpm i` at the root of the monorepo to have everything installed
- You can now switch to the package you're interested in working on and check its `README.md`

### Pull Requests

> [!CAUTION]
> TODO

### Release System

> [!CAUTION]
> TODO

## :sos: Support

Please open a conversation in the [discussion space](https://github.com/Sidnioulz/figmarine/discussions) to propose a new linting rule or ask a question.

Please [open an issue](https://github.com/Sidnioulz/figmarine/issues/new) for bug reports or code suggestions.

## :envelope: Contact

Steve Dodier-Lazaro · `@Frog` on the [Friends of Figma Discord](https://discord.gg/figma) - [LinkedIn](https://www.linkedin.com/in/stevedodierlazaro/)

Project Link: [https://github.com/Sidnioulz/figmarine](https://github.com/Sidnioulz/figmarine)

## :yellow_heart: Acknowledgments

### Thanks

- Photo by Michal Klajban, under a [Creative Commons BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.en) license
- Thanks to [Nicholas C. Zakas](https://github.com/nzakas) for his help in bootstrapping the ESLint plugin
- Thanks to [Louis3797](https://github.com/Louis3797) for his Readme template

### Built With

[![Axios](https://img.shields.io/badge/Axios-5a29e4?logo=axios&logoColor=white)](https://axios-http.com/)
[![Dependabot](https://img.shields.io/badge/Dependabot-025E8C?logo=dependabot&logoColor=white)](https://github.com/dependabot)
[![ESLint](https://img.shields.io/badge/ESLint-4b32c3?logo=eslint&logoColor=white)](https://eslint.org/)
[![Figma](https://img.shields.io/badge/Figma-a259ff?logo=figma&logoColor=white)](https://github.com/figma/rest-api-spec/)
[![GitHub](https://img.shields.io/badge/GitHub-0d1117?logo=github&logoColor=white)](https://github.com/solutions/ci-cd)
[![Prettier](https://img.shields.io/badge/Prettier-f8bc45?logo=prettier&logoColor=black)](https://prettier.io/)
[![tsup](https://img.shields.io/badge/tsup-fde047)](https://tsup.egoist.dev/)
[![Turbo](https://img.shields.io/badge/Turbo-0096ff?logo=turbo&logoColor=white)](https://turbo.build/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/Vitest-acd268?logo=vitest&logoColor=black)](https://https://vitest.dev/)
