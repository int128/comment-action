import * as core from '@actions/core'
import * as github from '@actions/github'
import { GitHub } from '@actions/github/lib/utils'

type Octokit = InstanceType<typeof GitHub>

type Inputs = {
  body: string
  updateIfExists: UpdateIfExistsType
  updateIfExistsKey: string
}

export type UpdateIfExistsType = 'replace' | 'append' | undefined

type PullRequest = {
  owner: string
  repo: string
  issue_number: number
}

export const postComment = async (octokit: Octokit, inputs: Inputs) => {
  const pullRequests = await inferPullRequestsFromContext(octokit)
  for (const pullRequest of pullRequests) {
    await createOrUpdateComment(octokit, pullRequest, inputs)
  }
}

const createOrUpdateComment = async (octokit: Octokit, pullRequest: PullRequest, inputs: Inputs) => {
  if (inputs.updateIfExists === undefined) {
    core.info(`Creating a comment to #${pullRequest.issue_number}`)
    await octokit.rest.issues.createComment({
      ...pullRequest,
      body: inputs.body,
    })
    return
  }

  const commentKey = `<!-- comment-action/${inputs.updateIfExistsKey} -->`
  core.info(`Finding key ${commentKey} from comments in #${pullRequest.issue_number}`)
  const comment = await findComment(octokit, pullRequest, commentKey)
  if (!comment) {
    core.info(`Creating a comment to #${pullRequest.issue_number}`)
    await octokit.rest.issues.createComment({
      ...pullRequest,
      body: `${inputs.body}\n${commentKey}`,
    })
    return
  }

  core.info(`Updating the comment ${comment.html_url}`)
  let body = `${inputs.body}\n${commentKey}`
  if (inputs.updateIfExists === 'append') {
    body = `${comment.body}\n${body}`
  }
  await octokit.rest.issues.updateComment({
    owner: pullRequest.owner,
    repo: pullRequest.repo,
    comment_id: comment.id,
    body,
  })
}

type Comment = {
  id: number
  body: string
  html_url: string
}

const findComment = async (octokit: Octokit, pullRequest: PullRequest, key: string): Promise<Comment | undefined> => {
  const { data: comments } = await octokit.rest.issues.listCommentsForRepo({
    ...pullRequest,
    sort: 'created',
    direction: 'desc',
    per_page: 100,
  })
  for (const comment of comments) {
    if (comment.body?.includes(key)) {
      return { ...comment, body: comment.body }
    }
  }
}

const inferPullRequestsFromContext = async (octokit: Octokit): Promise<PullRequest[]> => {
  const { context } = github
  if (Number.isSafeInteger(context.issue.number)) {
    core.info(`Use ${context.issue.number} from the current context`)
    return [
      {
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: context.issue.number,
      },
    ]
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
  return pulls.data.map((p) => ({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: p.number,
  }))
}
