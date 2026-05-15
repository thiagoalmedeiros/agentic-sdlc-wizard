FROM mcr.microsoft.com/devcontainers/javascript-node:1-22

# Install global development tools
RUN npm install -g npm@10 \
    && npm cache clean --force

# Install go-task
RUN sh -c "$(curl --location https://taskfile.dev/install.sh)" -- -d -b /usr/local/bin

# Install waza (AI agent skill evaluation CLI)
USER root
RUN curl -fsSL https://raw.githubusercontent.com/microsoft/waza/main/install.sh | bash
USER node
