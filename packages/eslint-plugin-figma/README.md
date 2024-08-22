# eslint-plugin-figma

This package is an ESLint plugin that can process JSON representations of Figma files and run rules against them, allowing you to build your own linting logic for your design team's output.

Figma files are identified by their [file keys](https://www.figma.com/developers/api#get-files-endpoint) and fetched with the [Figma REST API](https://www.figma.com/developers/api). The fetched files are stored in a local cache as JSON data, and can be augmented with additional facets like variables, comments, dev resources, as well as special metadata provided by the (upcoming) accompanying [Figma Plugin](#404-not-yet-developed). File content is then exposed as a JSON AST, with modified types so that rules can target Figma-specific concepts like components, frames, canvases, variables and so on.

This project is currently at the Proof-of-Concept stage, attempting to run a few basic rules to demonstrate the feasibility of the approach. Documentation for the rules API will be provided once that stage is completed.

## Contribute

I am not looking for contributors yet.

## Suggest rules

Please open an issue. I am very interested in hearing what rules you want to enforce and why.
