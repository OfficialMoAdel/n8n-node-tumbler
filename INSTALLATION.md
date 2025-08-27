# Tumblr n8n Node Installation Guide

This guide provides step-by-step instructions for installing and configuring the Tumblr n8n community node.

## Prerequisites

- n8n instance (version 1.0.0 or higher)
- Node.js (version 16 or higher)
- npm or yarn package manager
- Tumblr API credentials (Client ID and Client Secret)

## Installation Methods

### Method 1: Install via n8n Community Nodes (Recommended)

1. **Access n8n Settings**
   - Open your n8n instance
   - Navigate to Settings → Community Nodes
   - Click "Install a community node"

2. **Install the Package**
   ```
   n8n-nodes-tumblr
   ```
   - Enter the package name in the installation field
   - Click "Install"
   - Wait for the installation to complete

3. **Restart n8n**
   - Restart your n8n instance to load the new node
   - The Tumblr node should now appear in the node palette

### Method 2: Manual Installation

1. **Install via npm**
   ```bash
   npm install n8n-nodes-tumblr
   ```

2. **Set Environment Variable**
   ```bash
   export N8N_CUSTOM_EXTENSIONS=n8n-nodes-tumblr
   ```

3. **Restart n8n**
   ```bash
   n8n start
   ```

### Method 3: Development Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/n8n-nodes-tumblr.git
   cd n8n-nodes-tumblr
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Build the Package**
   ```bash
   npm run build
   ```

4. **Link for Development**
   ```bash
   npm link
   cd /path/to/your/n8n/installation
   npm link n8n-nodes-tumblr
   ```

## Tumblr API Setup

### 1. Create a Tumblr Application

1. **Visit Tumblr Developers**
   - Go to [https://www.tumblr.com/oauth/apps](https://www.tumblr.com/oauth/apps)
   - Log in with your Tumblr account

2. **Create New Application**
   - Click "Create Application"
   - Fill in the application details:
     - **Application Name**: Your application name
     - **Application Website**: Your website URL
     - **Application Description**: Brief description
     - **Administrative Contact Email**: Your email
     - **Default Callback URL**: `https://your-n8n-instance.com/rest/oauth2-credential/callback`

3. **Get Credentials**
   - After creation, note down:
     - **OAuth Consumer Key** (Client ID)
     - **OAuth Consumer Secret** (Client Secret)

### 2. Configure OAuth Callback URL

The callback URL should be set to your n8n instance:
```
https://your-n8n-instance.com/rest/oauth2-credential/callback
```

For local development:
```
http://localhost:5678/rest/oauth2-credential/callback
```

## n8n Credential Configuration

### 1. Create Tumblr OAuth2 Credentials

1. **Access Credentials**
   - In n8n, go to Credentials
   - Click "Create New Credential"
   - Select "Tumblr OAuth2 API"

2. **Configure Credentials**
   - **Client ID**: Enter your OAuth Consumer Key
   - **Client Secret**: Enter your OAuth Consumer Secret
   - **Grant Type**: Authorization Code (pre-filled)
   - **Authorization URL**: https://www.tumblr.com/oauth2/authorize (pre-filled)
   - **Access Token URL**: https://api.tumblr.com/v2/oauth2/token (pre-filled)
   - **Scope**: write (pre-filled)

3. **Authorize Access**
   - Click "Connect my account"
   - You'll be redirected to Tumblr for authorization
   - Grant the requested permissions
   - You'll be redirected back to n8n with the credentials configured

4. **Test Credentials**
   - Click "Test" to verify the connection
   - Save the credentials if the test is successful

### 2. Credential Security

- Credentials are encrypted and stored securely in n8n
- Never share your Client Secret publicly
- Use environment variables for sensitive data in production
- Regularly rotate your API credentials

## Using the Tumblr Node

### 1. Add Tumblr Node to Workflow

1. **Create New Workflow**
   - Click "New Workflow" in n8n
   - Add a trigger node (Manual Trigger, Webhook, etc.)

2. **Add Tumblr Node**
   - Click the "+" button to add a new node
   - Search for "Tumblr" in the node palette
   - Select the Tumblr node

3. **Configure Node**
   - Select your Tumblr OAuth2 credentials
   - Choose the resource (Blog, Post, User, Queue, Draft, Search)
   - Select the operation you want to perform
   - Configure the required parameters

### 2. Basic Usage Examples

#### Create a Text Post
```json
{
  "resource": "post",
  "operation": "create",
  "blogName": "your-blog.tumblr.com",
  "postType": "text",
  "title": "Hello World",
  "body": "This is my first post via n8n!",
  "tags": "n8n,automation,tumblr"
}
```

#### Get Blog Information
```json
{
  "resource": "blog",
  "operation": "getInfo",
  "blogName": "your-blog.tumblr.com"
}
```

#### Search Posts by Tag
```json
{
  "resource": "search",
  "operation": "searchByTag",
  "tag": "photography",
  "searchOptions": {
    "limit": 20,
    "sortBy": "timestamp",
    "sortOrder": "desc"
  }
}
```

## Troubleshooting

### Common Issues

#### 1. Node Not Appearing in Palette
- **Solution**: Restart n8n after installation
- **Check**: Verify the package is installed correctly
- **Environment**: Ensure N8N_CUSTOM_EXTENSIONS is set (for manual installation)

#### 2. Authentication Errors
- **Check Credentials**: Verify Client ID and Client Secret are correct
- **Callback URL**: Ensure the callback URL in Tumblr app matches your n8n instance
- **Permissions**: Verify your Tumblr app has the required permissions
- **Token Expiry**: Re-authorize if tokens have expired

#### 3. API Rate Limiting
- **Error**: "Rate limit exceeded"
- **Solution**: The node automatically handles rate limiting with exponential backoff
- **Limit**: Tumblr allows 1000 requests per hour per user
- **Monitoring**: Check the Performance Monitor for rate limit status

#### 4. Network Errors
- **Timeout**: Increase timeout settings in n8n
- **Connectivity**: Check internet connection and firewall settings
- **Proxy**: Configure proxy settings if required

#### 5. Data Validation Errors
- **Required Fields**: Ensure all required parameters are provided
- **Format**: Check data format matches expected types
- **Size Limits**: Verify file sizes are within Tumblr's limits

### Debug Mode

Enable debug logging to troubleshoot issues:

1. **Environment Variable**
   ```bash
   export N8N_LOG_LEVEL=debug
   ```

2. **Check Logs**
   - Review n8n logs for detailed error information
   - Look for Tumblr-specific error messages

### Getting Help

1. **Documentation**
   - Check the node's built-in help text
   - Review Tumblr API documentation

2. **Community Support**
   - n8n Community Forum
   - GitHub Issues (for bug reports)

3. **API Status**
   - Check Tumblr API status page
   - Verify service availability

## Performance Optimization

### 1. Caching
- The node includes automatic response caching
- Cache TTL is configurable per operation
- Clear cache if data seems stale

### 2. Batch Operations
- Use batch operations for multiple posts
- Implement proper delays between requests
- Monitor rate limit usage

### 3. Memory Management
- The node includes automatic memory cleanup
- Monitor memory usage for large workflows
- Use streaming for large file uploads

## Security Best Practices

### 1. Credential Management
- Use n8n's credential system (never hardcode)
- Regularly rotate API credentials
- Use environment variables for sensitive data

### 2. Data Handling
- Validate all input data
- Sanitize user-generated content
- Use HTTPS for all communications

### 3. Access Control
- Limit API permissions to required scopes
- Use separate credentials for different environments
- Monitor API usage for suspicious activity

## Updates and Maintenance

### 1. Package Updates
```bash
npm update n8n-nodes-tumblr
```

### 2. Breaking Changes
- Check release notes before updating
- Test in development environment first
- Update workflows if API changes

### 3. Monitoring
- Monitor API usage and limits
- Check for deprecation notices
- Keep credentials up to date

## Support

For additional support:
- **Documentation**: Check the inline help in n8n
- **Issues**: Report bugs on GitHub
- **Community**: Ask questions in n8n community forums
- **API**: Refer to Tumblr API documentation

---

**Note**: This node is a community contribution and is not officially supported by n8n or Tumblr. Use at your own discretion and ensure compliance with Tumblr's Terms of Service and API usage policies.