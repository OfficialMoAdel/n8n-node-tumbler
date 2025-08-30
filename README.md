# Tumblr n8n Node

A community node for n8n that provides integration with Tumblr's API.

## Features

- Blog operations (get info, get posts)
- Post management (create, update, delete, get)
- User operations (get info, dashboard, likes)
- Queue management (add, get, remove)
- Draft operations (create, get, update, delete, publish)
- Advanced search functionality
- OAuth2 authentication
- Rate limiting and error handling

## Security Notes

⚠️ **Known Dependencies Issues**: This package currently has some security vulnerabilities in transitive dependencies:

- **Critical: form-data vulnerability (GHSA-fjxv-7rqg-78g4)**: Comes from n8n-workflow peer dependency. This affects boundary generation in multipart forms but will be resolved when the host n8n installation updates to a newer version of n8n-workflow.
- **Development dependencies**: Several vulnerabilities in the gulp/chokidar dependency chain (braces, micromatch, etc.) used only for development builds. These do not affect runtime security.

**Impact Assessment**: These vulnerabilities do not affect the runtime security of the node when used in production n8n installations, as the vulnerable dependencies are either development-only or will be updated by the host n8n system.

## Installation

See [INSTALLATION.md](INSTALLATION.md) for detailed setup instructions.

## Usage

1. Configure Tumblr OAuth2 credentials in n8n
2. Add the Tumblr node to your workflow
3. Select the desired resource and operation
4. Configure the required parameters

## Documentation

- [Installation Guide](INSTALLATION.md)
- [Deployment Checklist](DEPLOYMENT_CHECKLIST.md)
- [GitHub Workflows](GITHUB_WORKFLOWS.md)

## CI/CD Status

[![CI/CD](https://github.com/OfficialMoAdel/n8n-nodes-tumblr/actions/workflows/ci.yml/badge.svg)](https://github.com/OfficialMoAdel/n8n-nodes-tumblr/actions/workflows/ci.yml)
[![Test Publish](https://github.com/OfficialMoAdel/n8n-nodes-tumblr/actions/workflows/test-publish.yml/badge.svg)](https://github.com/OfficialMoAdel/n8n-nodes-tumblr/actions/workflows/test-publish.yml)

## License

MIT

## Support

This is a community node. For issues, please check the documentation or create an issue on GitHub.