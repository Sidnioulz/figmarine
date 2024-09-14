
This package is an ESLint plugin that can process JSON representations of Figma files and run rules against them, allowing you to build your own linting logic for your design team's output.

Figma files are identified by their [file keys](https://www.figma.com/developers/api#get-files-endpoint) and fetched with the [Figma REST API](https://www.figma.com/developers/api). The fetched files are stored in a local cache as JSON data, and can be augmented with additional facets like variables, comments, dev resources, as well as special metadata provided by the (upcoming) accompanying [Figma Plugin](#404-not-yet-developed). File content is then exposed as a JSON AST, with modified types so that rules can target Figma-specific concepts like components, frames, canvases, variables and so on.

This project is currently at the Proof-of-Concept stage, attempting to run a few basic rules to demonstrate the feasibility of the approach. Documentation for the rules API will be provided once that stage is completed.



## TODO add section -> Suggest rules

TODO -> Please open an issue. I am very interested in hearing what rules you want to enforce and why.





<div align="center">
  <h1>eslint-plugin-figma</h1>
  
  <p>
    An ESLint plugin that can parse Figmarine cuttings and run rules against them.
  </p>
  
  
  <p>
    <img src="https://img.shields.io/badge/status-experimental-thistle" alt="Status: Experimental" />
    <a href="https://github.com/Sidnioulz/figmarine/commits"><img src="https://img.shields.io/github/commit-activity/m/Sidnioulz/figmarine" alt="commit activity" /></a>
    <a href="https://github.com/Sidnioulz/figmarine/commits"><img src="https://img.shields.io/github/last-commit/Sidnioulz/figmarine" alt="last commit" /></a>
    <a href="https://github.com/Sidnioulz/figmarine/issues?q=is%3Aopen+is%3Aissue+label%3Apkg-eslint-plugin-figma"><img src="https://img.shields.io/github/issues-search?query=repo%3ASidnioulz%2Ffigmarine%20is%3Aopen%20is%3Aissue%20label%3Apkg-eslint-plugin-figma&label=issues" alt="open issues" /></a>
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
    <a href="https://github.com/Sidnioulz/figmarine/packages/eslint-plugin-figma">📗 Documentation</a>
  <span> · </span>
    <a href="https://github.com/Sidnioulz/figmarine/issues/new?labels=bug,pkg-eslint-plugin-figma">🐛 Report a Bug</a>
  <span> · </span>
    <a href="https://github.com/Sidnioulz/figmarine/issues/new?labels=enhancement,pkg-eslint-plugin-figma">💡 Request Feature</a>
  <span> · </span>
    <a href="https://github.com/Sidnioulz/figmarine/discussions/new?category=linting-rules">💡 Suggest Linting Rule</a>
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

TODO


<!-- Usage -->
## :eyes: Usage

Install the package with the following command:

```bash
 pnpm i eslint-plugin-figma
```

Then, TODO:


```javascript
TODO
```

## :running: Run Locally

Clone the project

```bash
  git clone https://github.com/Sidnioulz/figmarine.git
```

Go to the project directory

```bash
  cd packages/eslint-plugin-figma
```

Install dependencies

```bash
  pnpm install
```

TODO -> this one will be harder

## :dart: Roadmap

TODO move roadmap here

## :wave: Contributing

See [how to contribute](https://github.com/Sidnioulz/figmarine/tree/main?tab=readme-ov-file#package-contributing).

## :warning: License

Distributed under the [MIT License](https://github.com/Sidnioulz/figmarine/tree/main?tab=MIT-1-ov-file).

## :sos: Support

Please open a conversation in the [discussion space](https://github.com/Sidnioulz/figmarine/discussions) to ask a question.

Please [open an issue](https://github.com/Sidnioulz/figmarine/issues/new?labels=pkg-eslint-plugin-figma) for bug reports or code suggestions.

## :yellow_heart: Acknowledgments

- TODO
