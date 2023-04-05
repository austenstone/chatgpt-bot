# chatgpt-bot

A GitHub App built with [Probot](https://github.com/probot/probot) that allows you to talk to ChatGPT using Issue and PR comments.

## Setup

```sh
# Install dependencies
npm install

# Run the bot
npm start
```

## Docker

```sh
# 1. Build container
docker build -t chatgpt-bot .

# 2. Start container
docker run -e APP_ID=<app-id> -e PRIVATE_KEY=<pem-value> chatgpt-bot
```

## Action
See [usage.yml](https://github.com/austenstone/chatgpt-bot/blob/main/.github/workflows/usage.yml).

```yml
name: ChatGPT Bot

on:
  issue_comment:
    types:
      - created

jobs:
  run-bot:
    runs-on: ubuntu-latest
    steps:
      - uses: austenstone/chatgpt-bot@main
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

## Contributing

If you have suggestions for how chatgpt-bot could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[ISC](LICENSE) © 2023 Austen Stone
