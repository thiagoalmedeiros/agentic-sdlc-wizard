#!/usr/bin/env node

const { McpServer } = require('./server');

const server = new McpServer('bitbucket-mcp', {
  envParams: [
    { name: 'BITBUCKET_URL', description: 'Bitbucket server URL', required: true },
    { name: 'BITBUCKET_TOKEN', description: 'Bitbucket personal access token', required: true },
    { name: 'BITBUCKET_USERNAME', description: 'Bitbucket username', required: false }
  ]
});

server.addTool('list_repos', 'List repositories for a project', async (params) => {
  return { description: 'Lists all repositories in the specified Bitbucket project' };
});

server.addTool('get_pull_requests', 'Get pull requests for a repository', async (params) => {
  return { description: 'Retrieves pull requests for the specified repository' };
});

server.addTool('create_pull_request', 'Create a new pull request', async (params) => {
  return { description: 'Creates a new pull request in the specified repository' };
});

server.start();
