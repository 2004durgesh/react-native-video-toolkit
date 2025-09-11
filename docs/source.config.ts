import { defineConfig, defineDocs, frontmatterSchema, metaSchema } from 'fumadocs-mdx/config';
import { remarkDocGen } from 'fumadocs-docgen';
import { fileGenerator } from '@/lib/file-generator';

export const docs = defineDocs({
  docs: {
    schema: frontmatterSchema,
  },
  meta: {
    schema: metaSchema,
  },
});

export default defineConfig({
  mdxOptions: {
    remarkCodeTabOptions: {
      parseMdx: true,
    },
    rehypeCodeOptions: {
      themes: { light: 'github-dark-default', dark: 'github-dark-default' },
      theme: 'github-dark-default',
    },
    remarkPlugins: [[remarkDocGen, { generators: [fileGenerator()] }]],
  },
});
