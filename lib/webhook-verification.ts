export function verifyGitLabWebhook(body: string, signature: string | null): boolean {
  if (!signature) {
    return false
  }
  
  const secret = process.env.GITLAB_WEBHOOK_SECRET

  if (!secret) {
    console.warn('GITLAB_WEBHOOK_SECRET not configured')
    return true // Allow if no secret is configured (for development)
  }
  
  // GitLab uses the secret as a simple token in X-Gitlab-Token header
  return signature === secret
}
