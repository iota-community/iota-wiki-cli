import React, { FC } from 'react';
import { Command } from 'clipanion';
import { render, Box, Text } from 'ink';
import Select from 'ink-select-input';
import { BaseVersioning } from '.';
import { ExternalRepo } from './external';
// import { Wiki } from './wiki';
import {
  parseConfig,
  getDocsPlugins,
  getDocsPluginVersions,
  getDocsPluginId,
  getPlugins,
} from '../../parse';

import { PluginOptions as DocsPluginOptions } from '@docusaurus/plugin-content-docs';
export type VersionOptions =
  DocsPluginOptions['versions'][keyof DocsPluginOptions['versions']];

interface ComponentItem {
  label: string;
  value: [number, number | undefined];
}

interface ComponentProps {
  items: ComponentItem[];
  command: VersioningList;
}

const ExternalRepoComponent: FC<ComponentProps> = (props) => {
  const onSelect = (item) => {
    if (item.value === 'add') {
      if (props.items.length > 1) {
        props.command.context.stderr.write(
          'At the moment the Wiki only supports one version per branch.',
        );
        process.exit();
      }
      props.command.cli.run(['versioning', 'add']);
    }
    props.command.cli.run(['versioning', 'configure', item.value]);
  };

  return (
    <Box flexDirection='column'>
      <Text>What do you want to do?</Text>
      <Box marginTop={1}>
        <Select items={props.items} onSelect={onSelect} />
      </Box>
    </Box>
  );
};

export class VersioningList extends BaseVersioning {
  static paths = [['versioning', 'list']];

  static usage = Command.Usage({
    description: 'Manage versions in your repo or the wiki',
  });

  async execute() {
    const ast = parseConfig('docusaurus.config.js');

    if (this.isWiki) {
      // TODO
    } else {
      const plugins = getPlugins(ast);
      const docsPlugins = getDocsPlugins(plugins);

      // TODO: Just a demo of the data you get back.
      // - Should we choose docs plugin and then version?
      // - We need to check if a `versions` property exists and create it when needed.
      // - We can update the `versions` object below directly to mutate the ast.
      const versionItems = docsPlugins.reduce<ComponentItem[]>(
        (versionItems, plugin, pluginIndex) => {
          const pluginId = getDocsPluginId(plugin) || '<default>';

          const versions = getDocsPluginVersions(plugin);
          if (versions) {
            versions.forEach((version, versionIndex) => {
              const name = ExternalRepo.getVersionName(version);
              versionItems.push({
                label: `${pluginId} - ${name}`,
                value: [pluginIndex, versionIndex],
              });
            });
          } else {
            versionItems.push({
              label: `${pluginId} - <default>`,
              value: [pluginIndex, undefined],
            });
          }

          return versionItems;
        },
        [],
      );

      const items = [
        {
          label: 'Add new version',
          value: [plugins.length, undefined],
        } as ComponentItem,
        ...versionItems,
      ];
      render(<ExternalRepoComponent items={items} command={this} />);
    }
  }
}
