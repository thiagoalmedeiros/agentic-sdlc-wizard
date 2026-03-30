"use strict";

const fs = require("fs");
const path = require("path");
const { getMcpConfigPath, readConfig, updateGitignore } = require("../config");

async function installDockerMcpsCommand(cwd) {
  cwd = cwd || process.cwd();
  const config = readConfig(cwd);

  if (!config) {
    console.log('No wizard configuration found. Run "wizard install" first.');
    return;
  }

  const { input, confirm } = require("@inquirer/prompts");

  const imageName = await input({
    message: "Enter the Docker image name (e.g., mcp/server:latest):",
  });

  if (!imageName || imageName.trim() === "") {
    console.log("No image name provided. Aborting.");
    return;
  }

  const defaultName = imageName.split("/").pop().split(":")[0];
  const serviceName = await input({
    message: "Enter a service name:",
    default: defaultName,
  });

  const port = await input({
    message: "Enter the host port to expose:",
    default: "3000",
  });

  const containerPort = await input({
    message: "Enter the container port:",
    default: port,
  });

  const envVars = {};
  let addMore = await confirm({
    message: "Add environment variables (tokens/secrets)?",
    default: false,
  });

  while (addMore) {
    const key = await input({ message: "Variable name:" });
    const value = await input({ message: `Value for ${key}:` });
    envVars[key] = value;
    addMore = await confirm({
      message: "Add another environment variable?",
      default: false,
    });
  }

  const services = [
    {
      name: serviceName.trim(),
      image: imageName.trim(),
      port: port.trim(),
      containerPort: containerPort.trim(),
      env: envVars,
    },
  ];

  const composePath = generateDockerCompose(cwd, services);
  installDockerMcps(cwd, config, services);

  console.log(`\nDocker Compose file written to ${path.relative(cwd, composePath)}`);
  console.log("Run 'docker compose up' to start the MCP environment.");
}

function generateDockerCompose(cwd, services) {
  let yaml = "services:\n";
  for (const svc of services) {
    yaml += `  ${svc.name}:\n`;
    yaml += `    image: ${svc.image}\n`;
    yaml += `    ports:\n`;
    yaml += `      - "${svc.port}:${svc.containerPort}"\n`;
    if (svc.env && Object.keys(svc.env).length > 0) {
      yaml += `    environment:\n`;
      for (const [key, value] of Object.entries(svc.env)) {
        yaml += `      - ${key}=${value}\n`;
      }
    }
    yaml += `    restart: unless-stopped\n`;
  }

  const composePath = path.join(cwd, "docker-compose.yml");
  fs.writeFileSync(composePath, yaml);
  return composePath;
}

function installDockerMcps(cwd, config, services) {
  for (const ide of config.ides) {
    const mcpConfigPath = getMcpConfigPath(cwd, ide);
    if (!mcpConfigPath) continue;

    let mcpConfig = { servers: {} };
    if (fs.existsSync(mcpConfigPath)) {
      mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, "utf-8"));
      if (!mcpConfig.servers) {
        mcpConfig.servers = {};
      }
    }

    for (const svc of services) {
      const url = `http://localhost:${svc.port}/sse`;
      const entry = { type: "sse", url };

      if (svc.env && Object.keys(svc.env).length > 0) {
        entry.env = {};
        for (const key of Object.keys(svc.env)) {
          entry.env[key] = svc.env[key];
        }
      }

      mcpConfig.servers[svc.name] = entry;
    }

    fs.mkdirSync(path.dirname(mcpConfigPath), { recursive: true });
    fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));
    const relMcpConfig = path.relative(cwd, mcpConfigPath);
    updateGitignore(cwd, [relMcpConfig, "docker-compose.yml"]);
    console.log(`MCP configuration written to ${relMcpConfig}`);
  }

  console.log(
    "\nDocker MCP servers configured. Run 'docker compose up' to start."
  );
}

module.exports = {
  installDockerMcpsCommand,
  generateDockerCompose,
  installDockerMcps,
};
