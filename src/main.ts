import * as core from '@actions/core'
import type { UpdateIfExistsType } from './comment.js'
import { getContext, getOctokit } from './github.js'
import { run } from './run.js'

const main = async (): Promise<void> => {
  await run(
    {
      post: core.getInput('post'),
      updateIfExists: updateIfExists(core.getInput('update-if-exists')),
      updateIfExistsKey: core.getInput('update-if-exists-key'),
      run: core.getInput('run'),
      postOnSuccess: core.getInput('post-on-success'),
      postOnFailure: core.getInput('post-on-failure'),
      repository: core.getInput('repository', { required: true }),
      issueNumber: issueNumber(core.getInput('issue-number')),
    },
    getOctokit(),
    await getContext(),
  )
}

const updateIfExists = (s: string): UpdateIfExistsType => {
  if (!s) {
    return undefined
  }
  if (s !== 'replace' && s !== 'append' && s !== 'recreate') {
    throw new Error(`update-if-exists must be replace, append or recreate: ${s}`)
  }
  return s
}

const issueNumber = (s: string): number | undefined => {
  if (!s) {
    return undefined
  }

  const n = parseInt(s, 10)
  if (Number.isNaN(n)) {
    throw new Error('issue-number is an invalid number')
  }
  if (!Number.isSafeInteger(n)) {
    throw new Error('issue-number is not a safe integer')
  }

  return n
}

main().catch((e: Error) => {
  core.setFailed(e)
  console.error(e)
})
