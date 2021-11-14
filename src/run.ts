import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as github from '@actions/github'
import { GitHub } from '@actions/github/lib/utils'
import { evaluateTemplate } from './template'

type Octokit = InstanceType<typeof GitHub>

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
    if (result.code === 0 && inputs.postOnSuccess) {
      const body = evaluateTemplate(inputs.postOnSuccess, context)
      return await postComment(octokit, body)
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

const postComment = async (octokit: Octokit, body: string) => {
  const pullNumbers = await inferPullRequestsFromContext(octokit)
  for (const issue_number of pullNumbers) {
    const { context } = github
    core.info(`Post a comment to #${issue_number}`)
    await octokit.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number,
      body,
    })
  }
}

const inferPullRequestsFromContext = async (octokit: Octokit) => {
  const { context } = github
  if (Number.isSafeInteger(context.issue.number)) {
    core.info(`Use ${context.issue.number} from the current context`)
    return [context.issue.number]
  }

  core.info(`List pull requests associated with sha ${context.sha}`)
  const pulls = await octokit.rest.repos.listPullRequestsAssociatedWithCommit({
    owner: context.repo.owner,
    repo: context.repo.repo,
    commit_sha: context.sha,
  })
  for (const pull of pulls.data) {
    core.info(`  #${pull.number}: ${pull.title}`)
  }
  return pulls.data.map((p) => p.number)
}
