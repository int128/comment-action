import assert from 'assert'
import * as fs from 'fs/promises'
import { Octokit } from '@octokit/action'
import { WebhookEvent } from '@octokit/webhooks-types'
import { retry } from '@octokit/plugin-retry'

export const getOctokit = () => new (Octokit.plugin(retry))()

export type Context = {
  sha: string
  payload: WebhookEvent
}

export const getContext = async (): Promise<Context> => {
  // https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/store-information-in-variables#default-environment-variables
  return {
    sha: getEnv('GITHUB_SHA'),
    payload: JSON.parse(await fs.readFile(getEnv('GITHUB_EVENT_PATH'), 'utf-8')) as WebhookEvent,
  }
}

const getEnv = (name: string): string => {
  assert(process.env[name], `${name} is required`)
  return process.env[name]
}
