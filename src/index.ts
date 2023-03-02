import { Probot } from "probot";
import { OpenAIApi, Configuration } from "openai";

const getCommentRequest = async (
  context: any,
  issue: any,
  previousComments: any
) => {
  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "You are a helpful bot that helps people on GitHub",
      },
      {
        role: "assistant",
        content: `This is the issue: ${issue.data.title.substring(
          0,
          4096
        )} ${issue.data.body.substring(0, 4096)}`,
      },
      {
        role: "assistant",
        content: `These are the previous messages in the conversation in JSON format: ${JSON.stringify(
          previousComments.data.map(
            (comment: any) => `@${comment.user.login} says ${comment.body}`
          )
        ).substring(0, 4096)}`,
      },
      {
        role: "assistant",
        content: `This is the user's context of the event in JSON format: ${JSON.stringify(
          context
        ).substring(0, 4096)}`,
      },
      {
        role: "user",
        content: context.payload.comment.body,
      },
    ],
  });
  return response.data.choices[0].message?.content || "Error";
};

const buildCommentRequest = (context: any, response: string) => {
  return {
    body: `@${context.payload.sender.login} ${response}`,
  };
};

const isForUs = (context: any) =>
  context.payload.sender.type !== "Bot" ||
  context.payload.comment.body.startsWith("/gpt") ||
  context.payload.comment.body.startsWith("/chatgpt") ||
  context.payload.comment.body.startsWith("@gpt") ||
  context.payload.comment.body.startsWith("@chatgpt");

const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);

export = (app: Probot) => {
  app.on("issue_comment.created", async (context) => {
    if (!isForUs(context)) return;
    const previousComments = await context.octokit.issues.listComments(
      context.issue()
    );
    const issue = await context.octokit.issues.get(context.issue());
    const response = await getCommentRequest(context, issue, previousComments);
    const issueComment = context.issue(buildCommentRequest(context, response));
    await context.octokit.issues.createComment(issueComment);
  });

  app.on("pull_request_review_comment", async (context) => {
    console.log("pr", context.payload.comment);
    if (!isForUs(context)) return;
    const previousComments = await context.octokit.pulls.listReviewComments(
      context.pullRequest()
    );
    const pullRequest = await context.octokit.pulls.get(context.pullRequest());
    const response = await getCommentRequest(
      context,
      pullRequest,
      previousComments
    );
    const pullrequestReviewComment = context.pullRequest(
      buildCommentRequest(context, response)
    );
    await context.octokit.pulls.createReviewComment(pullrequestReviewComment);
  });

  app.on("discussion_comment", async (context) => {
    if (!isForUs(context)) return;
    const previousComments =
      await context.octokit.teams.listDiscussionCommentsInOrg(context.repo());
    const discussion = await context.octokit.teams.getDiscussionInOrg(context.repo());
    const response = await getCommentRequest(
      context,
      discussion,
      previousComments
    );
    console.log(response);
    // const discussionComment = context.repo(buildCommentRequest(context, response));
    // await context.octokit.teams.createDiscussionCommentInOrg({
    //   ...context,
    //   ...discussionComment
    // });
  });
};
