import React, { FC, useCallback, useEffect, useState } from 'react';
import { Option, Command } from 'clipanion';
import git from 'isomorphic-git';
import { render, Box, Text, useFocus, useInput, useFocusManager } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import MultiSelect, { Item, ListedItem } from 'ink-multi-select';
import fs from 'fs';
import axios from 'axios';
import Spinner from 'ink-spinner';

import { UserOptions as TutorialOptions } from '@iota-wiki/plugin-tutorial';
import prettier from 'prettier';
import {
  getConfig,
  getConfigFile,
  getOptionsByPluginName,
  getPlugins,
  nodeError,
} from '../parse';
import {
  ArrayLiteralExpression,
  Expression,
  ObjectLiteralExpression,
  SourceFile,
  StringLiteral,
  SyntaxKind,
} from 'ts-morph';
import pluginContentDocs from '@docusaurus/plugin-content-docs';

const TUTORIAL_TAGS_URL =
  'https://raw.githubusercontent.com/iota-community/iota-wiki/feat/tuto-section/content/tutorials/tags.json';

export interface Tag {
  label: string;
  value: string;
  description: string;
  color: string;
}

export type Tags = { [key: string]: Tag[] };

export type TutorialItem = { label: string; value: ObjectLiteralExpression };

export interface Meta {
  file: SourceFile;
  plugins: ArrayLiteralExpression;
  tutorials: TutorialItem[];
  tags: Tags;
}

const TUTORIAL_PLUGIN_NAME = '@iota-wiki/plugin-tutorial';

export class Tutorials extends Command {
  static paths = [[`tutorials`]];

  configPath = Option.String('-c,--config', {
    env: 'IOTA_WIKI_CONFIG',
    required: false,
  });

  static usage = Command.Usage({
    description: `Configure tutorials.`,
  });

  async execute() {
    const configPath = this.configPath || './docusaurus.config.js';

    const { waitUntilExit } = render(
      <TutorialsComponent configPath={configPath} />,
    );

    await waitUntilExit();
  }
}

interface TutorialsComponentProps {
  configPath: string;
}

const TutorialsComponent = (props: TutorialsComponentProps) => {
  const [meta, setMeta] = useState<Meta>();
  const [errors, setErrors] = useState([] as string[]);
  const [tutorial, setTutorial] = useState<ObjectLiteralExpression>();

  const addError = useCallback(
    (error: string) => setErrors([...errors, error]),
    [errors],
  );

  useEffect(() => {
    (async () => {
      const file = getConfigFile(props.configPath, CONFIG_FILE_TEMPLATE);
      const config = getConfig(file, addError);
      const plugins = getPlugins(config, addError);
      const tutorials = getOptionsByPluginName(
        plugins,
        TUTORIAL_PLUGIN_NAME,
        addError,
      ).reduce((tutorials, tutorial) => {
        const label = tutorial
          .getProperty('title')
          .asKind(SyntaxKind.PropertyAssignment)
          ?.getInitializerIfKind(SyntaxKind.StringLiteral)
          ?.getLiteralText();

        if (label) {
          tutorials.push({ label, value: tutorial });
        } else {
          addError(nodeError(tutorial, 'Title must be assigned a string.'));
        }

        return tutorials;
      }, [] as TutorialItem[]);

      try {
        const { data: tags } = await axios.get<Tags>(TUTORIAL_TAGS_URL);
        setMeta({ file, plugins, tutorials, tags });
      } catch (e) {
        addError(`${TUTORIAL_TAGS_URL}: ${e}`);
      }
    })();
  }, []);

  useInput((_, key) => {
    if (key.escape) process.exit();
  });

  return (
    <Box flexDirection='column'>
      {meta ? (
        tutorial ? (
          <ChangeTutorial tutorial={tutorial} tags={meta.tags} />
        ) : (
          <Box flexDirection='column'>
            <Text>Choose a tutorial to configure:</Text>
            <SelectInput
              items={[
                ...meta.tutorials,
                { label: 'Add a tutorial', value: undefined, key: 'add' },
              ]}
              onSelect={(item) => {
                if (item.value) {
                  setTutorial(item.value);
                } else {
                  const tutorial = meta.plugins
                    .addElement(TUTORIAL_PLUGIN_TEMPLATE)
                    .asKindOrThrow(SyntaxKind.ArrayLiteralExpression)
                    .getElements()[1]
                    .asKindOrThrow(SyntaxKind.ObjectLiteralExpression);

                  setTutorial(tutorial);
                }
              }}
            />
          </Box>
        )
      ) : (
        <Text color={'cyan'}>
          <Spinner type='dots' /> Loading data...
        </Text>
      )}
    </Box>
  );
};

const CONFIG_FILE_TEMPLATE = `
module.exports = {};
`;

const TUTORIAL_PLUGIN_TEMPLATE = `[
  '@iota-wiki/plugin-tutorial',
  {
    title: '',
    description: '',
    tags: [],
  }
]`;

interface InputComponentProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const InputComponent: FC<InputComponentProps> = (props) => {
  const { isFocused } = useFocus();

  return (
    <Box marginRight={1}>
      <Text dimColor={!isFocused}>
        <Text>{props.label}: </Text>
        <TextInput
          focus={isFocused}
          showCursor={isFocused}
          value={props.value}
          onChange={props.onChange}
        />
      </Text>
    </Box>
  );
};

interface SelectComponentProps {
  label: string;
  items: ListedItem[];
  value: ListedItem[];
  onChange: (items: ListedItem[]) => void;
}

const SelectComponent: FC<SelectComponentProps> = (props) => {
  const { isFocused } = useFocus();

  const onSelect = (item) => {
    props.onChange([...props.value, item]);
  };

  const onUnselect = (item) => {
    props.onChange(props.value.filter((o) => o !== item));
  };

  return (
    <Box flexDirection='column'>
      <Text dimColor={!isFocused}>
        <Text>{props.label}: </Text>
        {props.value && (
          <Text>
            {props.value
              .map((item) => item.label)
              .sort()
              .join(', ')}
          </Text>
        )}
      </Text>
      <Box display={isFocused ? 'flex' : 'none'}>
        <MultiSelect
          focus={isFocused}
          items={props.items}
          selected={props.value}
          onSelect={onSelect}
          onUnselect={onUnselect}
        />
      </Box>
    </Box>
  );
};

interface ChangeTutorialProps {
  tutorial: ObjectLiteralExpression;
  tags: Tags;
}

const ChangeTutorial = (props: ChangeTutorialProps) => {
  const { focusNext } = useFocusManager();
  const [values, setValues] = useState({
    title: '',
    description: '',
    tags: [],
  } as TutorialOptions);

  const properties = {
    title: 'Title*',
    description: 'Description*',
    tags: undefined,
    source: 'Link to repository',
    preview: 'Preview image path',
    route: 'Route to link to',
  } as { [property in keyof TutorialOptions]: string };

  useEffect(() => {
    (async () => {
      // Get whatever we can from the current config
      const currentValues = await props.tutorial
        .getProperties()
        .reduce(async (previousValues, property) => {
          const currentValues = await previousValues;

          if (property.isKind(SyntaxKind.PropertyAssignment)) {
            const name = property.getName();

            if (name === 'tags') {
              property
                .getInitializerIfKind(SyntaxKind.ArrayLiteralExpression)
                ?.getElements()
                .forEach((element) => {
                  if (element.isKind(SyntaxKind.StringLiteral)) {
                    currentValues.tags.push(element.getLiteralValue());
                  }
                });
            } else if (Object.keys(properties).includes(name)) {
              const value = property
                .getInitializerIfKind(SyntaxKind.StringLiteral)
                ?.getLiteralValue();

              if (value) {
                currentValues[name] = value;
              } else {
                if (name === 'route') {
                  // TODO First check if a sidebar with valid content exist, else:
                  const files = await fs.promises.readdir('docs');
                  currentValues.route =
                    files.length > 0 ? files[0].replace(/\.[^/.]+$/, '') : '';
                } else if (name === 'source') {
                  try {
                    const dir = await git.findRoot({
                      fs,
                      filepath: process.cwd(),
                    });

                    const url = await git.getConfig({
                      fs,
                      dir,
                      path: 'remote.origin.url',
                    });

                    currentValues.source = url || '';
                  } catch {
                    currentValues.source = '';
                  }
                } else {
                  currentValues[name] = '';
                }
              }
            }
          }

          return currentValues;
        }, Promise.resolve(values));

      setValues(currentValues);
      focusNext();
    })();
  }, []);

  const onChangeTags = (category: string) => (tags: ListedItem[]) => {
    const tagSet = new Set(values.tags);
    props.tags[category].forEach((tag) => tagSet.delete(tag.value));
    tags.forEach((tag) => tagSet.add(tag.value as string));

    setValues((values) => ({ ...values, tags: [...tagSet] }));
  };

  const onChangeValue = (name: string) => (value: string) => {
    setValues((values) => ({ ...values, [name]: value }));
  };

  return (
    <>
      {Object.entries(properties).map(([name, description]) =>
        name === 'tags' ? (
          Object.entries(props.tags).map(([category, categoryTags]) => (
            <SelectComponent
              label={`${category} tags`}
              items={categoryTags}
              value={categoryTags.filter((tag) =>
                values.tags.includes(tag.value),
              )}
              onChange={onChangeTags(category)}
              key={category}
            />
          ))
        ) : (
          <InputComponent
            key={name}
            label={description}
            value={values[name]}
            onChange={onChangeValue(name)}
          />
        ),
      )}
    </>
  );
};
