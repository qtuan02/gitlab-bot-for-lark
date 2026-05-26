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

function generateTagPushMessage(event: GitLabEvent, titlePrefix: string, color: string) {
  return {
    msg_type: 'interactive',
    card: {
      config: {
        wide_screen_mode: true
      },
      header: {
        template: color,
        title: {
          content: `${titlePrefix}: Tag Push`,
          tag: 'plain_text'
        }
      },
      elements: [
        {
          tag: 'div',
          text: {
            content: `**Repository:** ${event.project.name}\n**Tag:** ${event.ref}\n**Author:** ${generateTagUserName([event.user_name || ""])}`,
            tag: 'lark_md'
          }
        },
        {
          tag: 'action',
          actions: [
            {
              tag: 'button',
              text: {
                content: 'View Repository',
                tag: 'plain_text'
              },
              url: event.project.web_url,
              type: 'primary'
            }
          ]
        }
      ]
    }
  }
}

const mappingUserGitlab : Record<string,string> = {
  "leducthinh.2408" : "ThinhLD",
  "huynhquoctuan200702": "TuanHQ"
}

const gitUrl = "https://gitlab.com"

function generateTagUserName (usernames : string[]) {
  const mappedUsernames = usernames.map(username => mappingUserGitlab[username] || username)
  // return usernames.map(username => `<at id=\"${mappedUsernames}\">${mappedUsernames}</at> `).join(', ')
  return usernames.map(username => `[@${mappedUsernames}](${gitUrl}/${username})`).join(', ')
}


function generatePushMessage(event: GitLabEvent, titlePrefix: string, color: string) {
  const commits = event.commits || []
  const commitCount = commits.length

  const elements  = [
    {
      tag: 'div',
      text: {
        content: `**Repository:** ${event.project.name}\n**Branch:** ${event.object_attributes?.source_branch || 'main'}\n**Commits:** ${commitCount}`,
        tag: 'lark_md'
      }
    },
    {
      tag: 'div',
      text: {
        content: `**Author:** ${generateTagUserName([event.user.username])}`,
        tag: 'lark_md'
      }
    },
    ...commits.slice(0, 3).map(commit => ({
      tag: 'div',
      text: {
        content: `• ${commit.message.substring(0, 100)}${commit.message.length > 100 ? '...' : ''}`,
        tag: 'lark_md'
      }
    })),
    {
      tag: 'div',
      text: {
        content: `**MR ID:** ${event.project.id}`,
        tag: 'lark_md'
      }
    },
    {
      tag: 'action',
      actions: [
        {
          tag: 'button',
          text: {
            content: 'View Repository',
            tag: 'plain_text'
          },
          url: event.project.web_url,
          type: 'primary'
        }
      ]
    }
  ]

  if (event.reviewers?.length) {
    elements.push({
      tag: 'div',
      text: {
        content: `**Reviewers:** ${event.reviewers ? generateTagUserName(event.reviewers.map(reviewer => reviewer.username)) : ""}`,
        tag: 'lark_md'
      }
    })
  }
  
  return {
    msg_type: 'interactive',
    card: {
      config: {
        wide_screen_mode: true
      },
      header: {
        template: color,
        title: {
          content: `${titlePrefix}: Push Event`,
          tag: 'plain_text'
        }
      },
      elements
    }
  }
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

function generateIssueMessage(event: GitLabEvent, titlePrefix: string, color: string) {
  const issue = event.object_attributes
  if (!issue) return null
  
  const action = issue.action || 'opened'
  const actionEmoji = getActionEmoji(action)
  
  return {
    msg_type: 'interactive',
    card: {
      config: {
        wide_screen_mode: true
      },
      header: {
        template: color,
        title: {
          content: `${titlePrefix}: ${actionEmoji} Issue ${action}`,
          tag: 'plain_text'
        }
      },
      elements: [
        {
          tag: 'div',
          text: {
            content: `**Title:** ${issue.title}\n**Repository:** ${event.project.name}\n**Author:** ${event.user.name}`,
            tag: 'lark_md'
          }
        },
        {
          tag: 'div',
          text: {
            content: `**Issue #${issue.iid}** | **State:** ${issue.state}`,
            tag: 'lark_md'
          }
        },
        ...(issue.description ? [{
          tag: 'div',
          text: {
            content: `**Description:**\n${issue.description.substring(0, 200)}${issue.description.length > 200 ? '...' : ''}`,
            tag: 'lark_md'
          }
        }] : []),
        {
          tag: 'action',
          actions: [
            {
              tag: 'button',
              text: {
                content: 'View Issue',
                tag: 'plain_text'
              },
              url: issue.url,
              type: 'primary'
            }
          ]
        }
      ]
    }
  }
}

function generateNoteMessage(event: GitLabEvent, titlePrefix: string, color: string) {
  return {
    msg_type: 'interactive',
    card: {
      config: {
        wide_screen_mode: true
      },
      header: {
        template: color,
        title: {
          content: `${titlePrefix}: New Comment`,
          tag: 'plain_text'
        }
      },
      elements: [
        {
          tag: 'div',
          text: {
            content: `**Repository:** ${event.project.name}\n**Author:** ${event.user.name}`,
            tag: 'lark_md'
          }
        },
        {
          tag: 'action',
          actions: [
            {
              tag: 'button',
              text: {
                content: 'View Comment',
                tag: 'plain_text'
              },
              url: event.object_attributes?.url || event.project.web_url,
              type: 'primary'
            }
          ]
        }
      ]
    }
  }
}

function generatePipelineMessage(event: GitLabEvent, titlePrefix: string, color: string) {
  const pipeline = event.object_attributes
  if (!pipeline) return null
  
  const status = pipeline.state || 'unknown'
  const statusEmoji = getPipelineStatusEmoji(status)
  
  return {
    msg_type: 'interactive',
    card: {
      config: {
        wide_screen_mode: true
      },
      header: {
        template: getPipelineColor(status),
        title: {
          content: `${titlePrefix}: ${statusEmoji} Pipeline ${status}`,
          tag: 'plain_text'
        }
      },
      elements: [
        {
          tag: 'div',
          text: {
            content: `**Repository:** ${event.project.name}\n**Pipeline:** #${pipeline.iid}\n**Status:** ${status}`,
            tag: 'lark_md'
          }
        },
        {
          tag: 'action',
          actions: [
            {
              tag: 'button',
              text: {
                content: 'View Pipeline',
                tag: 'plain_text'
              },
              url: pipeline.url,
              type: 'primary'
            }
          ]
        }
      ]
    }
  }
}

function generateGenericMessage(event: GitLabEvent, eventType: string | null, titlePrefix: string, color: string) {
  return {
    msg_type: 'interactive',
    card: {
      config: {
        wide_screen_mode: true
      },
      header: {
        template: color,
        title: {
          content: `${titlePrefix}: ${eventType || 'Unknown Event'}`,
          tag: 'plain_text'
        }
      },
      elements: [
        {
          tag: 'div',
          text: {
            content: `**Repository:** ${event.project.name}\n**Event Type:** ${eventType || 'Unknown'}`,
            tag: 'lark_md'
          }
        },
        {
          tag: 'action',
          actions: [
            {
              tag: 'button',
              text: {
                content: 'View Repository',
                tag: 'plain_text'
              },
              url: event.project.web_url,
              type: 'primary'
            }
          ]
        }
      ]
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

function getPipelineStatusEmoji(status: string): string {
  const emojiMap: { [key: string]: string } = {
    'success': '✅',
    'failed': '❌',
    'running': '🔄',
    'pending': '⏳',
    'canceled': '⏹️',
    'skipped': '⏭️'
  }
  return emojiMap[status] || '❓'
}

function getPipelineColor(status: string): string {
  const colorMap: { [key: string]: string } = {
    'success': 'green',
    'failed': 'red',
    'running': 'blue',
    'pending': 'orange',
    'canceled': 'grey',
    'skipped': 'grey'
  }
  return colorMap[status] || 'blue'
}

function uppercaseFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}