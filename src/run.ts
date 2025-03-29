import { Context } from './github.js'
import { Octokit } from '@octokit/action'
import { runCommand } from './command.js'
import { postComment, UpdateIfExistsType } from './comment.js'

type Inputs = {
  post: string
  updateIfExists: UpdateIfExistsType
  updateIfExistsKey: string
  run: string
  postOnSuccess: string
  postOnFailure: string
  repository: string
  issueNumber: number | undefined
}

export const run = async (inputs: Inputs, octokit: Octokit, context: Context): Promise<void> => {
  if (!inputs.post && !inputs.run) {
    throw new Error(`either post or run must be set`)
  }

  if (inputs.post) {
    return await postComment(
      {
        body: inputs.post,
        updateIfExists: inputs.updateIfExists,
        updateIfExistsKey: inputs.updateIfExistsKey,
        repository: inputs.repository,
        issueNumber: inputs.issueNumber,
      },
      octokit,
      context,
    )
  }

  if (inputs.run) {
    return await runCommand(inputs, octokit, context)
  }
}
