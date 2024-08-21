import fs from 'node:fs';

import type {
	File,
  LanguageOptions,
  OkParseResult,
  ParseResult,
  SourceCode,
} from "@eslint/core";
import { DocumentNode, JSONLanguage, JSONNode, JSONSourceCode } from "@eslint/json";

import { isNonArrayObject } from './utils';


const manifest = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));

interface FigmaFileNode extends JSONNode {
	type: 'FigmaFile';
}

/**
 * Language object for the Figmarine API virtual document.
 * @implements {Language}
 */
export class FigLanguage {
  /* TODO */
  // visitorKeys?: Record<string, string[]> | undefined;

  parse(file: File): ParseResult<FigmaFileNode> {
    const result: ParseResult<DocumentNode> = new JSONLanguage({ mode: 'json' }).parse(file);
		console.log(result)
		return result as ParseResult<FigmaFileNode>;
		
		// TODO
		// const convertedResult: ParseResult<FigmaFileNode> = {}
		// return convertedResult;
  }
	/**
	 * Validates the language options.
	 * @param {Object} languageOptions The language options to validate.
	 * @returns {void}
	 * @throws {Error} When the language options are invalid.
	 */
  validateLanguageOptions(languageOptions: LanguageOptions): void {
    if (!isNonArrayObject(languageOptions)) {
      throw new TypeError(`Expected a non-array object, received ${typeof languageOptions}.`);
    }

    const {
      facets,
      ...otherOptions
  } = languageOptions;

    if (facets !== undefined) {
      // TODO: validate that facets requested for each file match the facet API
      // TODO: support facets like "nodes", "variables", "media", etc.
    }

    const otherOptionKeys = Object.keys(otherOptions);

    if (otherOptionKeys.length > 0) {
      throw new TypeError(`Unexpected key "${otherOptionKeys[0]}" found.`);
    }
  }

  /**
	 * Creates a new `FigSourceCode` object from the given information.
	 * @param {File}            file The virtual file to create a `FigSourceCode` object from.
	 * @param {OkParseResult}   input The result returned from `parse()`.
	 * @returns {FigSourceCode} The new `FigSourceCode` object.
	 */
  createSourceCode(file: File, input: OkParseResult<FigmaFileNode>): SourceCode {
		return new JSONSourceCode({
			// FIXME/TODO: explore whether this is ok.
			text: file.body as string,
			// FIXME/TODO: explore whether this is ok.
			ast: input.ast as unknown as DocumentNode,
		});
  }
}

export const plugin = {
	meta: {
		name: "eslint-plugin-figma",
		version: manifest.version,
	},
	languages: {
		fig: new FigLanguage(),
	},
	rules: {
	},
	configs: {
  },
};
