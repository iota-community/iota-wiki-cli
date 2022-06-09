import { DocsPluginVersion } from '../../../parse';
import { VersionOptions } from '../list';

export class ExternalRepo {
  static getVersionName(version: DocsPluginVersion): string {
    if (
      version.type === 'ObjectProperty' &&
      version.value.type === 'ObjectExpression'
    ) {
      // Version keys can be both identifiers or strings
      if (version.key.type === 'Identifier') {
        return version.key.name;
      }

      if (version.key.type === 'StringLiteral') {
        return version.key.value;
      }
    }

    throw 'Invalid version';
  }

  static getVersionOptions(version: DocsPluginVersion): VersionOptions {
    if (
      version.type === 'ObjectProperty' &&
      version.value.type === 'ObjectExpression'
    ) {
      // Reduce version options
      return version.value.properties.reduce((options, option) => {
        if (
          option.type === 'ObjectProperty' &&
          option.key.type === 'Identifier'
        ) {
          if (option.value.type === 'StringLiteral') {
            options[option.key.name] = option.value.value;
          }

          if (option.value.type === 'BooleanLiteral') {
            options[option.key.name] = option.value.value;
          }
        }
        return options;
      }, {});
    }

    throw 'Invalid version';
  }
}
