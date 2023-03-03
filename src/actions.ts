const { run } = require("@probot/adapter-github-actions");
const app = require("./index");

run(app);