import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { GitHub } from '@actions/github/lib/utils'
import { postComment, UpdateIfExistsType } from './comment'
import { replaceTemplate } from './template'

type Octokit = InstanceType<typeof GitHub>

type Inputs = {
  run: string
  postOnSuccess: string
  postOnFailure: string
  updateIfExists: UpdateIfExistsType
  updateIfExistsKey: string
  issueNumber: number | undefined
}

export const runCommand = async (octokit: Octokit, inputs: Inputs) => {
  const result = await execute(inputs.run)
  const context = {
    '${run.code}': String(result.code),
    '${run.output}': result.lines.join('\n'),
  }
  if (result.code === 0) {
    if (inputs.postOnSuccess) {
      const body = replaceTemplate(inputs.postOnSuccess, context)
      return await postComment(octokit, {
        body,
        updateIfExists: inputs.updateIfExists,
        updateIfExistsKey: inputs.updateIfExistsKey,
        issueNumber: inputs.issueNumber,
      })
    }
    return
  }

  if (inputs.postOnFailure) {
    const body = replaceTemplate(inputs.postOnFailure, context)
    await postComment(octokit, {
      body,
      updateIfExists: inputs.updateIfExists,
      updateIfExistsKey: inputs.updateIfExistsKey,
      issueNumber: inputs.issueNumber,
    })
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
