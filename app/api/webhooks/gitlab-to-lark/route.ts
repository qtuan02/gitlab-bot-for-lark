import { NextRequest, NextResponse } from 'next/server'
import { generateLarkMessage, GitLabEvent } from '@/lib/template-generator'
import { sendToLark } from '@/lib/lark-sender'

const protectedBranch : string[] = [
  "production",
  "staging",
  "pre-production"
] 

const verifyProtectedBranch = (branch: string) => {
  return protectedBranch.includes(branch)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()

    const gitlabEvent = JSON.parse(body) 
    const eventType = request.headers.get('X-Gitlab-Event')
    
    console.log(`Received GitLab webhook: ${eventType}`)

    if(verifyProtectedBranch((gitlabEvent as GitLabEvent)?.object_attributes?.source_branch || "")) {
      return NextResponse.json({ error: 'Protected branch' }, { status: 400 })
    }
    
    // Generate Lark message template
    const larkMessage = generateLarkMessage(gitlabEvent, eventType)

    if (!larkMessage) {
      return NextResponse.json({ error: 'Unsupported event type' }, { status: 400 })
    }
    
    // Send to Lark webhook
    const larkResponse = await sendToLark(request, larkMessage)
    
    if (!larkResponse.success) {
      console.log('Failed to send to Lark:', larkResponse.error)
      return NextResponse.json({ error: larkResponse.error }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: larkResponse.message,
      eventType,
      larkMessageId: larkResponse.message
    })
    
  } catch (error) {
    console.log('Error processing GitLab webhook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
