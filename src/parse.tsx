import fs from 'fs';
import { ParseResult } from '@babel/parser';
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
  objectProperty,
  PatternLike,
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

export function getPlugins(ast: ParseResult<File>) {
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
