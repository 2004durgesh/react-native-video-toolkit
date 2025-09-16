'use client';

import * as React from 'react';
import * as TabsComponents from 'fumadocs-ui/components/tabs';
import { PreviewCard } from './preview-card';

const { Tabs, TabsList, TabsTrigger, TabsContent } = TabsComponents;

interface CodePreviewTabsProps {
  /**
   * The preview component to render in the preview tab
   */
  preview: React.ReactNode;
  /**
   * The children content (should contain the code content for the code tab)
   */
  children: React.ReactNode;
}

/**
 * A reusable component that renders tabs with preview and code content.
 * This component combines the common pattern of showing both a live preview
 * and the source code in separate tabs.
 */
export function CodePreviewTabs({ preview, children }: CodePreviewTabsProps) {
  return (
    <Tabs defaultValue="preview">
      <TabsList>
        <TabsTrigger value="preview">preview</TabsTrigger>
        <TabsTrigger value="code">code</TabsTrigger>
      </TabsList>
      <TabsContent value="preview">
        {/* <div id="preview" className="*:hidden scroll-m-20" aria-hidden>
          ## Preview
        </div> */}
        <PreviewCard preview={preview} />
      </TabsContent>
      <TabsContent value="code">{children}</TabsContent>
    </Tabs>
  );
}
