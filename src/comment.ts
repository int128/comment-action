import assert from 'node:assert'
import * as core from '@actions/core'
import type { Octokit } from '@octokit/action'
import type { Context } from './github.js'

type Inputs = {
  body: string
  updateIfExists: UpdateIfExistsType
  updateIfExistsKey: string
  repository: string
  issueNumber: number | undefined
}

export type UpdateIfExistsType = 'replace' | 'append' | 'recreate' | undefined

type Issue = {
  owner: string
  repo: string
  number: number
}

export const postComment = async (inputs: Inputs, octokit: Octokit, context: Context) => {
  if (inputs.issueNumber) {
    const repoParts = inputs.repository.split('/')
    assert(repoParts.length === 2, 'repository must be in the format of owner/repo')
    const issue = {
      owner: repoParts[0],
      repo: repoParts[1],
      number: inputs.issueNumber,
    }
    await createOrUpdateComment(issue, octokit, inputs)
    return
  }

  const issues = await inferIssuesFromContext(octokit, context)
  for (const issue of issues) {
    await createOrUpdateComment(issue, octokit, inputs)
  }
}

const createOrUpdateComment = async (issue: Issue, octokit: Octokit, inputs: Inputs) => {
  if (inputs.updateIfExists === undefined) {
    core.info(`Creating a comment to ${issue.owner}/${issue.repo}#${issue.number}`)
    const { data: created } = await octokit.rest.issues.createComment({
      owner: issue.owner,
      repo: issue.repo,
      issue_number: issue.number,
      body: inputs.body,
    })
    core.info(`Created a comment ${created.html_url}`)
    return
  }

  const commentKey = `<!-- comment-action/${inputs.updateIfExistsKey} -->`
  core.info(`Finding key ${commentKey} from comments in ${issue.owner}/${issue.repo}#${issue.number}`)
  const comment = await findComment(octokit, issue, commentKey)
  if (!comment) {
    core.info(`Key not found in #${issue.number}`)
    const { data: created } = await octokit.rest.issues.createComment({
      owner: issue.owner,
      repo: issue.repo,
      issue_number: issue.number,
      body: `${inputs.body}\n${commentKey}`,
    })
    core.info(`Created a comment ${created.html_url}`)
    return
  }

  if (inputs.updateIfExists === 'recreate') {
    await octokit.rest.issues.deleteComment({
      owner: issue.owner,
      repo: issue.repo,
      comment_id: comment.id,
    })
    core.info(`Deleted the comment ${comment.html_url}`)

    const { data: created } = await octokit.rest.issues.createComment({
      owner: issue.owner,
      repo: issue.repo,
      issue_number: issue.number,
      body: `${inputs.body}\n${commentKey}`,
    })
    core.info(`Created a comment ${created.html_url}`)
    return
  }

  core.info(`Key found at the comment ${comment.html_url}`)
  let body = `${inputs.body}\n${commentKey}`
  if (inputs.updateIfExists === 'append') {
    body = `${comment.body}\n${body}`
  }
  const { data: updated } = await octokit.rest.issues.updateComment({
    owner: issue.owner,
    repo: issue.repo,
    comment_id: comment.id,
    body,
  })
  core.info(`Updated the comment ${updated.html_url}`)
}

type Comment = {
  id: number
  body: string
  html_url: string
}

const findComment = async (octokit: Octokit, issue: Issue, key: string): Promise<Comment | undefined> => {
  const comments = await octokit.paginate(octokit.rest.issues.listComments, {
    owner: issue.owner,
    repo: issue.repo,
    issue_number: issue.number,
    sort: 'created',
    direction: 'desc',
    per_page: 100,
  })
  core.info(`Found ${comments.length} comment(s) of ${issue.owner}/${issue.repo}#${issue.number}`)
  for (const comment of comments) {
    if (comment.body?.includes(key)) {
      return { ...comment, body: comment.body }
    }
  }
}

const inferIssuesFromContext = async (octokit: Octokit, context: Context): Promise<Issue[]> => {
  if ('issue' in context.payload) {
    const issueNumber = context.payload.issue.number
    core.info(`Use the issue #${issueNumber} from the current context`)
    return [
      {
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        number: issueNumber,
      },
    ]
  }

  if ('pull_request' in context.payload) {
    const pullNumber = context.payload.pull_request.number
    core.info(`Use the pull request #${pullNumber} from the current context`)
    return [
      {
        owner: context.payload.repository.owner.login,
        repo: context.payload.repository.name,
        number: pullNumber,
      },
    ]
  }

  assert('repository' in context.payload, 'context.payload must have repository property')
  assert(context.payload.repository, 'context.payload.repository must be defined')
  const owner = context.payload.repository.owner.login
  const repo = context.payload.repository.name

  core.info(`List pull requests associated with the current commit ${context.sha}`)
  const { data: pulls } = await octokit.rest.repos.listPullRequestsAssociatedWithCommit({
    owner,
    repo,
    commit_sha: context.sha,
  })
  for (const pull of pulls) {
    core.info(`- #${pull.html_url}: ${pull.title}`)
  }
  return pulls.map((pull) => ({
    owner,
    repo,
    number: pull.number,
  }))
}
