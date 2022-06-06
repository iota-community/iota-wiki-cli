import React, { FC } from 'react';
import { Command, Option } from "clipanion";
import { render, Box, Text } from 'ink';
import Select from 'ink-select-input';

interface ComponentProps {
    command: VersioningSelector;
}

const Component: FC<ComponentProps> = (props) => {
    const items = [
        {
            label: 'Manage versions in your repo.',
            value: 'external',
        },
        {
            label: 'Manage versions in the wiki.',
            value: 'wiki',
        }
    ];

    const onSelect = (item) => {
        if (item.value === 'external') {
            props.command.cli.run(['versioning', 'list']);
        }
        if (item.value === 'wiki') {
            props.command.cli.run(['versioning', 'list', '--wiki'])
        }
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

export abstract class BaseVersioning extends Command {
    isWiki = Option.Boolean(`--wiki`);

    abstract execute(): Promise<number | void>;
}

export class VersioningSelector extends Command {
    static paths = [['versioning']];

    static usage = Command.Usage({
        description: 'Manage versions in your repo or the wiki',
    });

    async execute() {
        render(<Component command={this}/>);
    }
}