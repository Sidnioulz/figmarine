/** @type {Partial<import('typedoc').TypeDocOptions>} */
export default {
  entryPoints: [
    'src/index.ts'
  ],
  out: 'typedoc',
  plugin: ['typedoc-plugin-markdown', 'typedoc-vitepress-theme'],
};