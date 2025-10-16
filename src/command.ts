import * as core from '@actions/core'
import * as exec from '@actions/exec'
import type { Octokit } from '@octokit/action'
import { postComment, type UpdateIfExistsType } from './comment.js'
import type { Context } from './github.js'
import { replaceTemplate } from './template.js'

type Inputs = {
  run: string
  postOnSuccess: string
  postOnFailure: string
  updateIfExists: UpdateIfExistsType
  updateIfExistsKey: string
  repository: string
  issueNumber: number | undefined
}

export const runCommand = async (inputs: Inputs, octokit: Octokit, context: Context) => {
  const result = await execute(inputs.run)
  const templateContext = {
    '${run.code}': String(result.code),
    '${run.output}': result.lines.join('\n'),
  }
  if (result.code === 0) {
    if (inputs.postOnSuccess) {
      const body = replaceTemplate(inputs.postOnSuccess, templateContext)
      return await postComment(
        {
          body,
          updateIfExists: inputs.updateIfExists,
          updateIfExistsKey: inputs.updateIfExistsKey,
          repository: inputs.repository,
          issueNumber: inputs.issueNumber,
        },
        octokit,
        context,
      )
    }
    return
  }

  if (inputs.postOnFailure) {
    const body = replaceTemplate(inputs.postOnFailure, templateContext)
    await postComment(
      {
        body,
        updateIfExists: inputs.updateIfExists,
        updateIfExistsKey: inputs.updateIfExistsKey,
        repository: inputs.repository,
        issueNumber: inputs.issueNumber,
      },
      octokit,
      context,
    )
  }
  throw new Error(`Command exited with code ${result.code}`)
}

const execute = async (cmdline: string) => {
  const lines: string[] = []
  const code = await exec.exec(cmdline, undefined, {
    ignoreReturnCode: true,
    listeners: {
      stdline: (s) => lines.push(s),
      errline: (s) => lines.push(s),
    },
  })
  core.info(`Exit ${code}`)
  return { code, lines }
}
