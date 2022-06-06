import React, { FC } from 'react';
import { Command } from "clipanion";
import { render, Box, Text } from 'ink';
import Select from 'ink-select-input';
import { BaseVersioning } from '.';
import { ExternalRepo } from './external';
import { Wiki } from './wiki';

interface ComponentProps {
    command: VersioningList;
}

const Component: FC<ComponentProps> = (props) => {
    const isWiki = props.command.isWiki;
    const items = [
        {
            label: 'Add new version',
            value: 'add',
        },
        ...(isWiki ? Wiki.getVersions() : ExternalRepo.getVersions())
    ];

    const onSelect = (item) => {
        if (item.value === 'add') {
            if (items.length > 1 && !isWiki) {
                props.command.context.stderr.write(
                    'At the moment the Wiki only supports one version per branch.'
                );
                process.exit();
            }

            if (isWiki)
                props.command.cli.run(['versioning', 'add', '--wiki']);
            else 
                props.command.cli.run(['versioning', 'add']);
        }
        if (isWiki)
            props.command.cli.run(['versioning', 'configure', item.value, '--wiki']);
        else
            props.command.cli.run(['versioning', 'configure', item.value]);
    };

    return (
        <Box flexDirection='column'>
            <Text>What do you want to do?</Text>
            <Box marginTop={1}>
                <Select items={items} onSelect={onSelect} />
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
        render(<Component command={this} />);
    }
}