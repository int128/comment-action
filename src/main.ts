import * as core from '@actions/core'
import { run } from './run'

const main = async (): Promise<void> => {
  await run({
    post: core.getInput('post'),
    run: core.getInput('run'),
    postOnSuccess: core.getInput('post-on-success'),
    postOnFailure: core.getInput('post-on-failure'),
    token: core.getInput('token'),
  })
}

main().catch((e) => core.setFailed(e instanceof Error ? e : String(e)))
