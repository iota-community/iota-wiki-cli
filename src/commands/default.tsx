import React, { FC } from 'react';
import { Command } from 'clipanion';
import { render, Box, Text } from 'ink';
import Select from 'ink-select-input';

interface DefaultComponentProps {
  command: Default;
}

const DefaultComponent: FC<DefaultComponentProps> = (props) => {
  const items = [
    {
      label: 'Preview the current directory.',
      value: ['start'],
    },
    {
      label: 'Build the current directory.',
      value: ['build'],
    },
    {
      label: 'Configure tutorials.',
      value: ['tutorial'],
    },
  ];

  const onSelect = (item) => {
    props.command.cli.run(item.value);
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

export class Default extends Command {
  static paths = [Command.Default];

  static usage = Command.Usage({
    description: `Choose what you want to do.`,
  });

  async execute() {
    render(<DefaultComponent command={this} />);
  }
}
