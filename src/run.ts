import * as github from '@actions/github'
import { runCommand } from './command'
import { postComment, UpdateIfExistsType } from './comment'

type Inputs = {
  post: string
  updateIfExists: UpdateIfExistsType
  updateIfExistsKey: string
  run: string
  postOnSuccess: string
  postOnFailure: string
  issueNumber: number | undefined
  token: string
}

export const run = async (inputs: Inputs): Promise<void> => {
  if (!inputs.post && !inputs.run) {
    throw new Error(`either post or run must be set`)
  }

  const octokit = github.getOctokit(inputs.token)
  if (inputs.post) {
    return await postComment(octokit, {
      body: inputs.post,
      updateIfExists: inputs.updateIfExists,
      updateIfExistsKey: inputs.updateIfExistsKey,
      issueNumber: inputs.issueNumber,
    })
  }
  if (inputs.run) {
    return await runCommand(octokit, inputs)
  }
}
