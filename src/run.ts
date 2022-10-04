import * as github from '@actions/github'
import { runCommand } from './command'
import { postComment } from './comment'

type Inputs = {
  post: string
  run: string
  postOnSuccess: string
  postOnFailure: string
  token: string
}

export const run = async (inputs: Inputs): Promise<void> => {
  if (!inputs.post && !inputs.run) {
    throw new Error(`either post or run must be set`)
  }

  const octokit = github.getOctokit(inputs.token)
  if (inputs.post) {
    return await postComment(octokit, inputs.post)
  }
  if (inputs.run) {
    return await runCommand(octokit, inputs)
  }
}
