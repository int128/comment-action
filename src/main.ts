import * as core from '@actions/core'
import { UpdateIfExistsType } from './comment'
import { run } from './run'

const main = async (): Promise<void> => {
  await run({
    post: core.getInput('post'),
    updateIfExists: updateIfExists(core.getInput('update-if-exists')),
    updateIfExistsKey: core.getInput('update-if-exists-key'),
    run: core.getInput('run'),
    postOnSuccess: core.getInput('post-on-success'),
    postOnFailure: core.getInput('post-on-failure'),
    token: core.getInput('token'),
  })
}

const updateIfExists = (s: string): UpdateIfExistsType => {
  if (!s) {
    return undefined
  }
  if (s !== 'replace' && s !== 'append') {
    throw new Error(`update-if-exists must be replace or append`)
  }
  return s
}

main().catch((e) => core.setFailed(e instanceof Error ? e : String(e)))
