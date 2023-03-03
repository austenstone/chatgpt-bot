import { Probot } from "probot";
import { OpenAIApi, Configuration, ChatCompletionRequestMessage } from "openai";

const getCommentRequest = async (
  openai: OpenAIApi,
  content: string,
  context: any,
  assist?: any[]
) => {
  const messages: ChatCompletionRequestMessage[] = [
    {
      role: "system",
      content: "You are a helpful bot that helps people on GitHub",
    },
    {
      role: "assistant",
      content: `This is the context of the event in JSON format: ${JSON.stringify(context).substring(0, 4000)}`,
    },
    ...(assist || []),
    {
      role: "user",
      content,
    },
  ];
  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages,
  });
  return response.data.choices[0].message?.content || "Error";
};

const buildCommentRequest = (context: any, response: string) => {
  return {
    body: `@${context.payload.sender.login} ${response}`,
  };
};

const getOpenAIKey = async (context: any): Promise<string> => {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    await context.octokit.issues.createComment(
      context.issue({
        body: "You installed [ChatGPT Assistant](https://github.com/apps/chatgpt-assistant) but have not set the `OPENAI_API_KEY` environment variable. Please do so to use this bot.",
      })
    );
    throw new Error("OPENAI_API_KEY not set");
  }
  return openaiApiKey;
};

export = (app: Probot) => {
  app.on("issue_comment.created", async (context) => {
    if (context.isBot) return;
    if (!["/gpt", "/chatgpt", "@gpt", "@chatgpt"].some((starter) =>
      context.payload.comment.body.startsWith(starter)
    )) return;
    if (context.payload.action !== "created") return;

    const openaiApiKey = await getOpenAIKey(context);
    const configuration = new Configuration({ apiKey: openaiApiKey });
    const openai = new OpenAIApi(configuration);

    const assist = []
    let previousComments;
    let issue;
    let type;
    let diff
    if (context.payload.issue.pull_request) {
      type = "pull_request";
      previousComments = await context.octokit.pulls.listReviewComments(context.pullRequest());
      issue = await context.octokit.pulls.get(context.pullRequest());
      diff = ((await context.octokit.pulls.get(
        context.pullRequest({
          mediaType: {
            format: "diff",
          },
        })
      )) as any)?.data;
    } else {
      type = "issue";
      previousComments = await context.octokit.issues.listComments(context.issue());
      issue = await context.octokit.issues.get(context.issue());
    }
    assist.push({
      role: "assistant",
      content: `This is the ${type}: ${issue.data.title.substring(0, 4096)} ${issue.data.body?.substring(0, 4096)}`,
    })
    assist.push({
      role: "assistant",
      content: `These are the previous messages in the conversation in JSON format: ${JSON.stringify(
        previousComments.data.map(
          (comment: any) => `@${comment.user.login} says ${comment.body.replace("/chatgpt", "").trim()}`
        )
      ).substring(0, 4000)}`,
    })
    if (diff) {
      assist.push({
        role: "assistant",
        content: `This is the pull request diff: ${diff.substring(0, 4000)}`,
      })
    }

    const response = await getCommentRequest(
      openai,
      context.payload.comment.body,
      context,
      assist
    );
    const issueComment = context.issue(buildCommentRequest(context, response));
    await context.octokit.issues.createComment(issueComment);
  });

  app.on(["pull_request_review_comment"], async (context) => {
    if (context.isBot) return;
    if (!["/gpt", "/chatgpt", "@gpt", "@chatgpt"].some((starter) =>
      context.payload.comment.body.startsWith(starter)
    )) return;
    if (context.payload.action !== "created") return;
    const openaiApiKey = await getOpenAIKey(context);
    const configuration = new Configuration({ apiKey: openaiApiKey });
    const openai = new OpenAIApi(configuration);

    const previousComments = await context.octokit.pulls.listReviewComments(context.pullRequest());
    const pullRequest = await context.octokit.pulls.get(context.pullRequest());

    console.log(context.payload);
    const diff = ((await context.octokit.pulls.get(context.pullRequest({
      mediaType: {
        format: "diff",
      },
    }))) as any
    )?.data;
    const response = await getCommentRequest(
      openai,
      context.payload.comment.body,
      context,
      [
        {
          role: "system",
          content: "You are good at helping review pull requests and explaining code",
        },
        {
          role: "assistant",
          content: `This is the pull request diff: ${diff.substring(0, 4000)}`,
        },
        {
          role: "assistant",
          content: `This is the pull request: ${pullRequest.data.title.substring(
            0,
            4000
          )} ${pullRequest.data.body?.substring(0, 4000)}`,
        },
        {
          role: "assistant",
          content: `These are the previous messages in the conversation in JSON format: ${JSON.stringify(
            previousComments.data.map(
              (comment: any) =>
                `@${comment.user.login} says ${comment.body
                  .replace("/chatgpt", "")
                  .trim()}`
            )
          ).substring(0, 4000)}`,
        },
        {
          role: "assistant",
          content: `We are talking about lines: ${context.payload.comment.start_line} - ${context.payload.comment.line}`,
        }
      ]
    );
    const pullrequestReviewComment = context.pullRequest({
      ...buildCommentRequest(context, response),
      in_reply_to: context.payload.comment.id,
    });
    await context.octokit.pulls.createReviewComment(pullrequestReviewComment);
  });

  app.on("discussion_comment", async (context) => {
    console.log(context.payload);
    return;
  });
};
