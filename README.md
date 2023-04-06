# chatgpt-bot

A GitHub App built with [Probot](https://github.com/probot/probot) that allows you to talk to ChatGPT using Issue and PR comments.

<details>
  <summary> Issue Example Image </summary>

  ![image](https://marketplace-screenshots.githubusercontent.com/14679/817e76d7-5acb-4746-af56-47994a832743?auto=webp&format=jpeg&width=670&dpr=1.5)
</details>

<details>
  <summary> PR Example Image </summary>

  ![image](https://marketplace-screenshots.githubusercontent.com/14679/50322429-3714-4950-954c-8c2bf1af4bf0?auto=webp&format=jpeg&width=670&dpr=1.5)
</details>

## Setup

See [Configuring a GitHub App](https://probot.github.io/docs/development/#configuring-a-github-app)

```sh
# Install dependencies
npm install

# Build the bot
npm build

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

Or use the published version [here](https://github.com/austenstone/chatgpt-bot/pkgs/container/chatgpt-bot)
```
docker run -e APP_ID=<app-id> -e PRIVATE_KEY=<pem-value> ghcr.io/austenstone/chatgpt-bot:main
```

## Action
We also use [@probot/adapter-github-actions](https://www.npmjs.com/package/@probot/adapter-github-actions) to run this App as a GitHub Action.
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
