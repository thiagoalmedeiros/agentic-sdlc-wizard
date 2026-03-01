class McpServer {
  constructor(name, options = {}) {
    this.name = name;
    this.envParams = options.envParams || [];
    this.tools = [];
  }

  addTool(name, description, handler) {
    this.tools.push({ name, description, handler });
  }

  start() {
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', async (data) => {
      try {
        const request = JSON.parse(data.trim());
        const response = await this.handleRequest(request);
        process.stdout.write(JSON.stringify(response) + '\n');
      } catch (err) {
        const errorResponse = {
          jsonrpc: '2.0',
          error: { code: -32700, message: 'Parse error' },
          id: null
        };
        process.stdout.write(JSON.stringify(errorResponse) + '\n');
      }
    });

    process.stderr.write(`${this.name} MCP server started\n`);
  }

  async handleRequest(request) {
    const { method, params, id } = request;

    switch (method) {
      case 'initialize':
        return {
          jsonrpc: '2.0',
          result: {
            name: this.name,
            version: '1.0.0',
            capabilities: { tools: {} }
          },
          id
        };

      case 'tools/list':
        return {
          jsonrpc: '2.0',
          result: {
            tools: this.tools.map((t) => ({
              name: t.name,
              description: t.description
            }))
          },
          id
        };

      case 'tools/call': {
        const tool = this.tools.find((t) => t.name === params?.name);
        if (!tool) {
          return {
            jsonrpc: '2.0',
            error: { code: -32601, message: `Unknown tool: ${params?.name}` },
            id
          };
        }
        const result = await tool.handler(params?.arguments || {});
        return { jsonrpc: '2.0', result, id };
      }

      default:
        return {
          jsonrpc: '2.0',
          error: { code: -32601, message: `Unknown method: ${method}` },
          id
        };
    }
  }
}

module.exports = { McpServer };
