import fs from 'fs';
import { parse } from '@babel/parser';
import { assignmentExpression, Expression, expressionStatement, identifier, memberExpression, objectExpression, Statement } from '@babel/types';
import { getPlugins } from '../../../parse';
import { VersionsOptions } from '@docusaurus/plugin-content-docs';

type Versions = Omit<VersionsOptions, 'lastVersion' | 'onlyIncludeVersions' | 'disableVersioning' | 'includeCurrentVersion'>

export class ExternalRepo {
    static getVersions() {
        const filePath = 'docusaurus.config.js';

        const ast = parse(fs.readFileSync(filePath, 'utf-8'));
        const plugins = getPlugins(ast);

        console.log(plugins);

        const versionConfigs = plugins.elements.reduce(
            (plugins, element) => {
                if (element.type === 'ArrayExpression') {
                    const pluginElement = element.elements[0];

                    if (
                        pluginElement.type !== 'StringLiteral' ||
                        pluginElement.value !== '@docusaurus/plugin-content-docs'
                    ) {
                        return plugins;
                    }

                    const optionsElement = element.elements[1];

                    if (optionsElement.type !== 'ObjectExpression') return plugins;

                    // Reduce plugin config
                    const options = optionsElement.properties.reduce((properties, property) => {
                        //console.log('*******************************************')
                        //console.log(property);
                        //console.log(property.type);
                        if (
                            property.type === 'ObjectProperty' &&
                            property.key.type === 'Identifier' && 
                            property.key.name === 'versions'
                        ) {
                            console.log(property);
                            console.log('---------------------------------------');
                            console.log(property.value.type);
                            if (property.value.type === 'ObjectExpression') {
                                //properties = property.value.properties
                            }
                        }
                        return properties;
                    }, {versions: {}});

                    return options;
                }
                return plugins;
            },
            new Map<string, Versions>(),
        );
        
        // TODO Implement
        return (
            [
                {
                    label: 'Update v0.5.0 - latest',
                    value: 'v0.5.0',
                },
                {
                    label: 'Update Develope',
                    value: 'develope',
                }
            ]
        )
    }
}