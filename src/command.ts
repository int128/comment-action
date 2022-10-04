import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { GitHub } from '@actions/github/lib/utils'
import { postComment } from './comment'
import { evaluateTemplate } from './template'

type Octokit = InstanceType<typeof GitHub>

type Inputs = {
  run: string
  postOnSuccess: string
  postOnFailure: string
}

export const runCommand = async (octokit: Octokit, inputs: Inputs) => {
  const result = await execute(inputs.run)
  const context = {
    run: {
      code: result.code,
      lines: result.lines,
      get output(): string {
        return this.lines.join('\n')
      },
    },
  }
  if (result.code === 0) {
    if (inputs.postOnSuccess) {
      const body = evaluateTemplate(inputs.postOnSuccess, context)
      return await postComment(octokit, body)
    }
    return
  }

  if (inputs.postOnFailure) {
    const body = evaluateTemplate(inputs.postOnFailure, context)
    await postComment(octokit, body)
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
