import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as github from '@actions/github'
import { postComment } from './comment'
import { evaluateTemplate } from './template'

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
    const result = await runCommand(inputs.run)
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
}

const runCommand = async (cmdline: string) => {
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
