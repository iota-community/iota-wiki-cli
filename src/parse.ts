import {
  ArrayLiteralExpression,
  Expression,
  Node,
  ObjectLiteralExpression,
  Project,
  SourceFile,
  SyntaxKind,
} from 'ts-morph';

type ErrorCallback = (error: string) => void;

function fileError(file: SourceFile, message: string) {
  return `${file.getFilePath()}: ${message}`;
}

export function nodeError(node: Node, message: string) {
  const filePath = node.getSourceFile().getFilePath();
  const line = node.getStartLineNumber();
  const column = node.getNonWhitespaceStart() - node.getStartLinePos() + 1;
  return `${filePath}:${line}:${column}: ${message}`;
}

export function getConfigFile(filePath: string, fileTemplate: string) {
  const project = new Project();
  return (
    project.addSourceFileAtPathIfExists(filePath) ||
    project.createSourceFile(filePath, fileTemplate)
  );
}

export function getConfig(configFile: SourceFile, error: ErrorCallback) {
  // Find the exported config object.
  const config = configFile
    .getDescendantsOfKind(SyntaxKind.PropertyAccessExpression)
    .find((node) => node.getText() === 'module.exports')
    ?.getParentIfKind(SyntaxKind.BinaryExpression)
    ?.getRight()
    .asKind(SyntaxKind.ObjectLiteralExpression);

  if (!config)
    error(fileError(configFile, 'A config file must export a config object'));

  return config;
}

export function getPlugins(
  config: ObjectLiteralExpression,
  error: ErrorCallback,
) {
  // Find or create the plugins property in the config object.
  const pluginsProperty =
    config.getProperty('plugins') ||
    config.addPropertyAssignment({
      name: 'plugins',
      initializer: '[]',
    });

  // TODO: Allow use of variable.
  const plugins = pluginsProperty
    .asKind(SyntaxKind.PropertyAssignment)
    ?.getInitializerIfKind(SyntaxKind.ArrayLiteralExpression);

  if (!plugins)
    error(nodeError(pluginsProperty, 'Plugins needs to be assigned an array'));

  return plugins;
}

export function getOptionsByPluginName(
  plugins: ArrayLiteralExpression,
  pluginName: string,
  error: ErrorCallback,
) {
  // Get the options from a plugin of the form ['plugin-name', { ...options }].
  const options = plugins.getElements().reduce((options, plugin) => {
    if (plugin.isKind(SyntaxKind.ArrayLiteralExpression)) {
      const elements = plugin.getElements();

      if (
        elements.length === 2 &&
        elements[0].isKind(SyntaxKind.StringLiteral) &&
        elements[1].isKind(SyntaxKind.ObjectLiteralExpression)
      ) {
        if (elements[0].getLiteralText() === pluginName)
          options.push(elements[1]);
      } else {
        error(
          nodeError(
            plugin,
            "Plugin must be of form ['plugin-name', { ...options }]",
          ),
        );
      }
    }

    return options;
  }, [] as ObjectLiteralExpression[]);

  return options;
}

export function getExpressionAsObject(
  expression: Expression,
  error: ErrorCallback,
) {
  if (expression.isKind(SyntaxKind.StringLiteral)) {
    return expression.getLiteralText();
  } else if (expression.isKind(SyntaxKind.CallExpression)) {
    const args = expression.getArguments();
    if (
      args.length === 2 &&
      args[0].isKind(SyntaxKind.Identifier) &&
      args[0].getText() === '__dirname' &&
      args[1].isKind(SyntaxKind.StringLiteral)
    ) {
      return args[1];
    }

    error(
      nodeError(
        expression,
        "Only path.resolve(__dirname, './path/to/target') allowed",
      ),
    );
  } else if (expression.isKind(SyntaxKind.ArrayLiteralExpression)) {
    return expression
      .getElements()
      .map((expression) => getExpressionAsObject(expression, error));
  } else if (expression.isKind(SyntaxKind.ObjectLiteralExpression)) {
    return expression.getProperties().reduce((object, property) => {
      if (property.isKind(SyntaxKind.PropertyAssignment)) {
        object[property.getName()] = getExpressionAsObject(
          property.getInitializer(),
          error,
        );
        return object;
      }

      error(
        nodeError(property, 'Only object assignments like key: value allowed'),
      );
    }, {});
  }
}
