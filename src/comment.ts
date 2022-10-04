import * as core from '@actions/core'
import * as github from '@actions/github'
import { GitHub } from '@actions/github/lib/utils'

type Octokit = InstanceType<typeof GitHub>

export const postComment = async (octokit: Octokit, body: string) => {
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
