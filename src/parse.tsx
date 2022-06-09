import fs from 'fs';
import { parse, ParseResult } from '@babel/parser';
import {
  arrayExpression,
  assignmentExpression,
  Expression,
  expressionStatement,
  File,
  identifier,
  memberExpression,
  ObjectExpression,
  objectExpression,
  ObjectProperty,
  objectProperty,
  PatternLike,
  SpreadElement,
  Statement,
} from '@babel/types';
import generator from '@babel/generator';
import prettier from 'prettier';

function tryModuleExports(statement: Statement): Expression {
  if (
    statement.type === 'ExpressionStatement' &&
    statement.expression.type === 'AssignmentExpression' &&
    statement.expression.left.type === 'MemberExpression' &&
    statement.expression.left.object.type === 'Identifier' &&
    statement.expression.left.object.name === 'module' &&
    statement.expression.left.property.type === 'Identifier' &&
    statement.expression.left.property.name === 'exports'
  ) {
    return statement.expression.right;
  }
}

function getConfig(statements: Statement[]): Expression {
  let expression = statements.reduce(
    (previous, current) => previous || tryModuleExports(current),
    null as Expression,
  );

  if (expression === null) {
    expression = assignmentExpression(
      '=',
      memberExpression(identifier('module'), identifier('exports')),
      objectExpression([]),
    );

    statements.push(expressionStatement(expression));
  }

  return expression;
}

function tryPlugins(
  property: ObjectExpression['properties'][number],
): Expression | PatternLike {
  if (
    property.type === 'ObjectProperty' &&
    property.key.type === 'Identifier' &&
    property.key.name === 'plugins'
  ) {
    return property.value;
  }
}

export type Plugin = Expression | SpreadElement;

export function getPlugins(ast: ParseResult<File>): Plugin[] {
  const config = getConfig(ast.program.body);

  // TODO: Allow config exported via variable assigned to `module.exports`.
  if (config.type !== 'ObjectExpression')
    throw 'Module needs to export a config object.';

  let plugins = config.properties.reduce(
    (previous, current) => previous || tryPlugins(current),
    null as Expression | PatternLike,
  );

  if (plugins === null) {
    plugins = arrayExpression([]);

    config.properties.push(objectProperty(identifier('plugins'), plugins));
  }

  // TODO: Allow variable and convert it to variable spread in array literal.
  if (plugins.type !== 'ArrayExpression')
    throw 'Plugins property needs to be an array.';

  return plugins.elements;
}

export type DocsPlugin = ObjectExpression['properties'];

export function getDocsPlugins(plugins: Plugin[]): DocsPlugin[] {
  return plugins.reduce((docsPlugins, plugin) => {
    if (plugin.type === 'ArrayExpression') {
      const [name, options] = plugin.elements;

      if (
        name.type === 'StringLiteral' &&
        name.value === '@docusaurus/plugin-content-docs' &&
        options.type === 'ObjectExpression'
      ) {
        docsPlugins.push(options.properties);
      }
    }
    return docsPlugins;
  }, []);
}

export function getDocsPluginId(plugin: DocsPlugin): string {
  const id = plugin.find(
    (property): property is ObjectProperty =>
      property.type === 'ObjectProperty' &&
      property.key.type === 'Identifier' &&
      property.key.name === 'id',
  );

  if (id?.value.type === 'StringLiteral') {
    return id.value.value;
  }
}

export type DocsPluginVersion = ObjectProperty;

export function getDocsPluginVersions(plugin: DocsPlugin): DocsPluginVersion[] {
  const versions = plugin.find(
    (property): property is ObjectProperty =>
      property.type === 'ObjectProperty' &&
      property.key.type === 'Identifier' &&
      property.key.name === 'versions',
  );

  if (versions?.value.type === 'ObjectExpression') {
    return versions.value.properties.filter(
      (property): property is ObjectProperty =>
        property.type === 'ObjectProperty',
    );
  }
}

export function parseConfig(filePath: string) {
  return parse(fs.readFileSync(filePath, 'utf-8'));
}

export function writeConfig(filePath: string, ast: ParseResult<File>) {
  const { code } = generator(ast);
  const formattedCode = prettier.format(code, {
    filepath: filePath,
    singleQuote: true,
    jsxSingleQuote: true,
    trailingComma: 'all',
  });
  fs.writeFileSync(filePath, formattedCode);
}
