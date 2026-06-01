interface User {
  id: number
  name: string
  username: string
  avatar_url: string
}

interface GitlabTagEvent  {
  object_kind: string
  event_name: string
  before: string
  after: string
  ref: string
  ref_protected: boolean
  checkout_sha: string
  user_id: number
  user_name: string
  user_avatar: string
  project_id: number
}

export interface GitLabEvent extends Partial<GitlabTagEvent> {
  object_kind: string
  project: {
    id: number
    name: string
    web_url: string
    namespace: string
  }
  user: User
  repository: {
    name: string
    url: string
    description: string
  }
  commits?: Array<{
    id: string
    message: string
    url: string
    author: {
      name: string
      email: string
    }
  }>
  object_attributes?: {
    title: string
    description: string
    url: string
    state: string
    action: string
    iid: number
    source_branch?: string
    target_branch?: string
  }
  changes?: {
    title?: {
      previous: string
      current: string
    }
    state?: {
      previous: string
      current: string
    }
  }
  reviewers?: User[]
}

export function generateLarkMessage(event: GitLabEvent, eventType: string | null): any | null {
  const titlePrefix = 'GitLab Notification'
  const defaultColor = 'blue'
  
  switch (eventType) {
    // case 'Push Hook':
    //   return generatePushMessage(event, titlePrefix, defaultColor)
    
    case 'Merge Request Hook':
      return generateMergeRequestMessage(event, titlePrefix, defaultColor)

    // case 'Tag Push Hook' : 
    //   return generateTagPushMessage(event, titlePrefix, defaultColor)
    
    // case 'Issue Hook':
    //   return generateIssueMessage(event, titlePrefix, defaultColor)
    
    // case 'Note Hook':
    //   return generateNoteMessage(event, titlePrefix, defaultColor)
    
    // case 'Pipeline Hook':
    //   return generatePipelineMessage(event, titlePrefix, defaultColor)
    
    default:
      return null
  }
}

const mappingUserGitlab : Record<string,string> = {
  "kimn02": "KimN",
  "leducthinh.2408" : "ThinhLD",
  "huynhquoctuan200702": "TuanHQ"
}

const gitUrl = "https://gitlab.com"

function generateTagUserName (usernames : string[]) {
  const mappedUsernames = usernames.map(username => mappingUserGitlab[username] || username)
  // return usernames.map(username => `<at id=\"${mappedUsernames}\">${mappedUsernames}</at> `).join(', ')
  return usernames.map(username => `[@${mappedUsernames}](${gitUrl}/${username})`).join(', ')
}

function generateMergeRequestMessage(event: GitLabEvent, titlePrefix: string, color: string) {
  const mr = event.object_attributes
  if (!mr) return null
  
  const action = mr.action || 'opened'
  const actionEmoji = getActionEmoji(action)

  const elements : any[] = [
    {
      tag: 'div',
      text: {
        content: `**Title:** ${mr.title}`,
        tag: 'lark_md'
      }
    },
    {
      tag: 'div',
      text: {
        content: `**Repository:** [${event.project.name}](${event.project.web_url})`,
        tag: 'lark_md'
      }
    },
    {
      tag: 'div',
      text: {
        content: `**Author:** ${generateTagUserName([event.user.username])}`,
        tag: 'lark_md'
      }
    }
  ]

  // reviewers
  if (event.reviewers) {
    elements.push({
      tag: 'div',
      text: {
        content: `**Reviewers:** ${generateTagUserName(event.reviewers.map(reviewer => reviewer.username))}`,
        tag: 'lark_md'
      }
    })
  }
   
  // source 
  elements.push({
    tag: 'div',
    text: {
      content: `**Source:** [${mr.source_branch}](${event.project.web_url}/tree/${mr.source_branch})`,
      tag: 'lark_md'
    }
  })

  // target
  elements.push({
    tag: 'div',
    text: {
      content: `**Target:** [${mr.target_branch}](${event.project.web_url}/tree/${mr.target_branch})`,
      tag: 'lark_md'
    }
  })

  elements.push({
    tag: 'div',
    text: {
      content: `**MR ID:** [${mr.iid}](${mr.url})`,
      tag: 'lark_md'
    }
  })
  

  // action
  elements.push({
    tag: 'action',
    actions: [
      {
        tag: 'button',
        text: {
          content: 'View Merge Request',
          tag: 'plain_text'
        },
        url: mr.url,
        type: 'primary'
      }
    ]
  })


  return {
    msg_type: 'interactive',
    card: {
      config: {
        wide_screen_mode: true
      },
      header: {
        template: color,
        title: {
          content: `${actionEmoji} [${event.project.name}][${mr.state.toUpperCase()}] Merge Request`,
          tag: 'plain_text'
        }
      },
      elements
    }
  }
}

function getActionEmoji(action: string): string {
  const emojiMap: { [key: string]: string } = {
    'opened': '🆕',
    'closed': '🔒',
    'reopened': '🔄',
    'updated': '✏️',
    'approved': '✅',
    'unapproved': '❌',
    'merged': '🔀',
    'commented': '💬'
  }
  return emojiMap[action] || '📝'
}
