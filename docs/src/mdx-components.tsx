import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Callout } from 'fumadocs-ui/components/callout';
import { Card, Cards } from 'fumadocs-ui/components/card';
import * as TabsComponents from 'fumadocs-ui/components/tabs';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import { TypeTable } from 'fumadocs-ui/components/type-table';
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';
import type { MDXComponents } from 'mdx/types';
import { LoadingSpinner } from 'react-native-video-toolkit';
import { cn } from './lib/utils';

// use this function to get MDX components, you will need it for rendering MDX
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    Callout,
    Card,
    Cards,
    ...TabsComponents,
    CodeBlock,
    pre: ({ ref: _ref, className, ...props }) => (
      <CodeBlock
        {...props}
        className={cn(
          className,
          'bg-fd-foreground/95 dark:bg-fd-secondary/50 text-background dark:text-foreground *:dark relative'
        )}>
        <Pre>{props.children}</Pre>
      </CodeBlock>
    ),
    Step,
    Steps,
    TypeTable,
    LoadingSpinner,
    ...components,
  };
}
