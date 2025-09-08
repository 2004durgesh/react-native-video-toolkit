/**
 * @ Author: Redon Alla
 * @ Create Time: 2024-10-07 23:05:22
 * @ Modified by: Redon Alla
 * @ Modified time: 2024-10-17 20:27:59
 * @ Description: Examples Wrapper component for showing components preview.
 */

import React from 'react';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import CodeBlock from '@theme/CodeBlock';

type Props = {
  children: React.ReactNode;
  codeExample: string;
};

export default class extends React.PureComponent<Props, {}> {
  render() {
    return (
      <Tabs className="demo-tabs">
        <TabItem value="preview" label="Preview" default>
          {this.props.children}
        </TabItem>

        <TabItem value="code" label="Code">
          <CodeBlock showLineNumbers={true} language="tsx">
            {this.props.codeExample}
          </CodeBlock>
        </TabItem>
      </Tabs>
    );
  }
}
