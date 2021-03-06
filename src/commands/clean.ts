import {Command, flags} from '@oclif/command'
import {join} from 'path'
import {rmSync} from 'fs'
import {getLocalConfig} from '../local-config'

export default class Clean extends Command {
  static description = 'completely removes local wiki'

  static flags = {
    help: flags.help({char: 'h'}),
    // flag with a value (-n, --name=VALUE)
  }

  async run() {
    const PWD = process.env.PWD ?? ''
    const userConfig = await getLocalConfig()
    const LOCAL_WIKI_FOLDER = join(PWD, userConfig.localWikiFolder)
    rmSync(LOCAL_WIKI_FOLDER, {recursive: true, force: true})
  }
}
