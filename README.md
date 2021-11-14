# comment-action [![ts](https://github.com/int128/comment-action/actions/workflows/ts.yaml/badge.svg)](https://github.com/int128/comment-action/actions/workflows/ts.yaml)

This is an action to post a comment to the current pull request.
It is inspired from [suzuki-shunsuke/github-comment](https://github.com/suzuki-shunsuke/github-comment).


## Getting Started

This action infers pull request(s) from the context as follows:

- On `pull_request` event, use the current pull request
- On `issue` event, use the current issue
- On `push` event, use pull request(s) associated with the current commit
- Otherwise, get pull request(s) associated with `github.sha`

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

You can use JavaScript based string interpolation in `post-on-success` and `post-on-failure`.
The following variables are available:

- `run.output` (string)
  - combined output of the command
- `run.lines` (array of strings)
  - combined output of the command
- `run.code` (number)
  - exit code of the command


## Inputs

| Name | Default | Description
|------|----------|------------
| `post` | - | If set, post a comment to the pull request
| `run` | - | If set, run a command
| `post-on-success` | - | If set, post a comment on success of the command
| `post-on-failure` | - | If set, post a comment on failure of the command
| `token` | `github.token` | GitHub token

Either `post` or `run` must be set.


## Outputs

| Name | Description
|------|------------
| `example` | example output
