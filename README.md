# Lark GitLab Webhook Integration

A Next.js application that receives GitLab webhooks and forwards formatted notifications to Lark (Feishu) webhooks.

## Features

- **GitLab Webhook Receiver**: Handles various GitLab events (push, merge requests, issues, comments, pipelines)
- **Template Generation**: Automatically generates rich Lark message cards based on GitLab events
- **Lark Integration**: Sends formatted notifications to Lark webhook endpoints
- **Webhook Verification**: Supports GitLab webhook signature verification
- **TypeScript Support**: Fully typed for better development experience

## Supported GitLab Events

- **Push Hook**: Code pushes with commit details
- **Merge Request Hook**: MR creation, updates, merges, and closures
- **Issue Hook**: Issue creation, updates, and closures
- **Note Hook**: Comments on issues, MRs, and commits
- **Pipeline Hook**: CI/CD pipeline status updates

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure your webhooks:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# GitLab Webhook Configuration
GITLAB_WEBHOOK_SECRET=your_gitlab_webhook_secret_here

# Lark Webhook Configuration
LARK_WEBHOOK_URL=your_lark_webhook_url_here
LARK_WEBHOOK_SECRET=your_lark_webhook_secret_here

# Optional: Custom template configuration
TEMPLATE_TITLE_PREFIX=GitLab Notification
DEFAULT_LARK_COLOR=blue
```

### 3. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## API Endpoints

### Webhook Endpoints

- **POST** `/api/webhooks/gitlab` - GitLab webhook receiver
- **GET** `/api/health` - Health check endpoint

### GitLab Webhook Configuration

1. Go to your GitLab project settings
2. Navigate to **Integrations** → **Webhooks**
3. Set the URL to: `https://your-domain.com/api/webhooks/gitlab`
4. Select the events you want to receive:
   - Push events
   - Issues events
   - Merge request events
   - Note events
   - Pipeline events
5. Set the **Secret Token** to match your `GITLAB_WEBHOOK_SECRET`
6. Enable **SSL verification**

### Lark Webhook Configuration

1. In your Lark workspace, create a custom bot
2. Get the webhook URL from the bot settings
3. Set the webhook URL in your `.env.local` file
4. Optionally configure a webhook secret for additional security

## Message Templates

The application generates rich interactive cards for different GitLab events:

### Push Events
- Repository and branch information
- Commit count and details
- Author information
- Direct link to repository

### Merge Request Events
- MR title and description
- Source and target branches
- Author and current state
- Direct link to the MR

### Issue Events
- Issue title and description
- Issue number and state
- Author information
- Direct link to the issue

### Pipeline Events
- Pipeline status with appropriate emoji
- Repository and pipeline number
- Color-coded status (green for success, red for failure, etc.)
- Direct link to pipeline

## Development

### Project Structure

```
├── app/
│   ├── api/
│   │   ├── health/
│   │   └── webhooks/
│   │       └── gitlab/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── lark-sender.ts
│   ├── template-generator.ts
│   └── webhook-verification.ts
├── package.json
├── tsconfig.json
└── next.config.js
```

### Adding New Event Types

1. Add the event type to the `generateLarkMessage` function in `lib/template-generator.ts`
2. Create a new generator function for the event type
3. Update the switch statement to handle the new event

### Customizing Templates

Modify the template generator functions in `lib/template-generator.ts` to customize:
- Message formatting
- Colors and emojis
- Field layouts
- Action buttons

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- Heroku
- AWS
- Google Cloud

## Security

- Webhook signatures are verified using the configured secret
- Environment variables are used for sensitive configuration
- HTTPS is required for production deployments

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**: Check GitLab webhook configuration and URL
2. **Lark messages not sending**: Verify Lark webhook URL and permissions
3. **Signature verification failing**: Ensure `GITLAB_WEBHOOK_SECRET` matches GitLab configuration

### Logs

Check the application logs for detailed error messages and webhook processing information.

## License

MIT License
