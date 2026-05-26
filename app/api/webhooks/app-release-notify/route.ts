import { NextRequest, NextResponse } from 'next/server'
import { sendToLark } from '@/lib/lark-sender'

type ThirdPartyPayload = {
  data?: {
    url?: string
    app_name?: string
    enviroment?: string
    platform?: string
    commit?:string
    version?:string
  }
}

const REQUIRED_FIELDS: Array<keyof NonNullable<ThirdPartyPayload['data']>> = [
  'url',
  'app_name',
  'enviroment',
  'platform'
]

export async function POST(request: NextRequest) {
  try {
    const payload: ThirdPartyPayload = await request.json().catch(() => ({}))
    const data = payload.data

    if (!data) {
      return NextResponse.json({ error: 'Missing data payload' }, { status: 400 })
    }

    const missingFields = REQUIRED_FIELDS.filter(
      (field) => !data[field] || typeof data[field] !== 'string' || data[field]?.trim() === ''
    )

    if (missingFields.length) {
      return NextResponse.json(
        { error: `Missing fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    const larkMessage = buildThirdPartyCardMessage({
      url: data.url!.trim(),
      app_name: data.app_name!.trim(),
      enviroment: data.enviroment!.trim(),
      platform: data.platform!.trim(),
      version: data.version!.trim(),
      commit: data.commit!.trim()
    })

    const larkResponse = await sendToLark(request, larkMessage)

    if (!larkResponse.success) {
      return NextResponse.json({ error: larkResponse.error }, { status: 502 })
    }

    return NextResponse.json({
      success: true,
      message: larkResponse.message ?? 'Forwarded to Lark'
    })
  } catch (error) {
    console.error('Error processing third-party webhook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function buildThirdPartyCardMessage(data: Required<NonNullable<ThirdPartyPayload['data']>>) {
  const elements = [
    {
      tag: 'div',
      text: {
        tag: 'lark_md',
        content:
          `**Application:** ${data.app_name}\n` +
          `**Environment:** ${data.enviroment}\n` +
          `**Platform:** ${data.platform}\n` +
          `**Version:** ${data.version}\n` +
          `**Commit:** [${data.commit}](https://gitlab.com/dhsc/emr/web-emr/-/commit/${data.commit})\n` +
          `**URL:** ${data.url}` 
      }
    }
  ] as any[]

  if (isUrlValid(data.url)) {
    elements.push({
      tag: 'action',
      actions: [
        {
          tag: 'button',
          text: {
            tag: 'plain_text',
            content: 'Go to Release'
          },
          type: 'primary',
          url: data.url
        }
      ]
    })
  }

  return {
    msg_type: 'interactive',
    card: {
      config: {
        wide_screen_mode: true
      },
      header: {
        template: 'green',
        title: {
          tag: 'plain_text',
          content: `[${data.platform?.toUpperCase()}][${data.enviroment?.toUpperCase()}] ${data.app_name}`
        }
      },
      elements
    }
  }
}

const isUrlValid = (url: string) => {
  try {
    new URL(url)
    return true
  } catch (error) {
    return false
  }
}