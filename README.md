# comment-action [![ts](https://github.com/int128/comment-action/actions/workflows/ts.yaml/badge.svg)](https://github.com/int128/comment-action/actions/workflows/ts.yaml)

This is an action to post a comment to the current pull request.
It is inspired from [suzuki-shunsuke/github-comment](https://github.com/suzuki-shunsuke/github-comment).


## Getting Started

This action infers pull request(s) from the context as follows:

- On `pull_request` event, use the current pull request
- On `issue` event, use the current issue
- On `push` event, use pull request(s) associated with the current commit
- Otherwise, get pull request(s) associated with `github.sha`

You can also specify the issue or pull request number via `issue-number` input.

### Post a comment

To post a comment:

```yaml
jobs:
  build:
    steps:
      - uses: int128/comment-action@v1
        with:
          post: |
            :wave: Hello World
```

### Update the comment if exists

You can create an issue or update the issue if exists.
It is useful to avoid too many comments in an issue.

<img width="920" alt="image" src="https://user-images.githubusercontent.com/321266/193756823-d9b668be-afa2-46eb-b9d7-d5d38da46a03.png">

To replace the issue body if it exists,

```yaml
jobs:
  build:
    steps:
      - uses: int128/comment-action@v1
        with:
          update-if-exists: replace
          post: |
            :while_check_mark: The resource has been created
```

To append the issue body if it exists,

```yaml
jobs:
  build:
    steps:
      - uses: int128/comment-action@v1
        with:
          update-if-exists: append
          post: |
            :warning: Creating resource
```

This action finds the latest comment created by same workflow and job, by default.
It embeds the key into an issue comment as a markdown comment `<!-- -->`.

If you need to identify a comment to update, set the key as follows:

```yaml
jobs:
  build:
    steps:
      - uses: int128/comment-action@v1
        with:
          update-if-exists: append
          update-if-exists-key: ${{ github.workflow }}/${{ github.job }}/terraform-plan
          post: |
            :warning: Creating resource
```

### Run a command

To run a command and post the output on failure:

```yaml
jobs:
  build:
    steps:
      - uses: int128/comment-action@v1
        with:
          run: yarn test
          post-on-failure: |
            ## :x: Test failure
            ```
            ${run.output}
            ```
```

You can use the string interpolation in `post-on-success` and `post-on-failure`.
The following variables are available:

- `${run.output}`
  - combined output of the command
- `${run.code}`
  - exit code of the command

This action does not support any script to keep it simple and secure.
You can still write a script by `actions/github-script`,
but it would be nice to write your awesome action by a programming language for maintainability.

## Inputs

| Name | Default | Description
|------|----------|------------
| `post` | - | If set, post a comment to the pull request
| `update-if-exists` | (optional) | If set, create or update a comment. This must be either `replace` or `append`
| `update-if-exists-key` | `${{ github.workflow }}/${{ github.job }}` | Key for `update-if-exists`
| `run` | - | If set, run a command
| `post-on-success` | (optional) | If set, post a comment on success of the command
| `post-on-failure` | (optional) | If set, post a comment on failure of the command
| `issue-number` | (optional) | Number of an issue or pull request on which to create a comment
| `token` | `github.token` | GitHub token

Either `post` or `run` must be set.
