import axios from 'axios'
import { createHmac } from 'crypto'
import { NextRequest } from 'next/server'

interface LarkResponse {
  success: boolean
  messageId?: string
  error?: string
  message?: string
}

export async function sendToLark(req: NextRequest,message: any): Promise<LarkResponse> {
  const webhookUrl = req.headers.get('X-Lark-Url') || process.env.LARK_WEBHOOK_URL
  const webhookSecret = req.headers.get('X-Lark-Secret') || process.env.LARK_WEBHOOK_SECRET

  try {
    if (!webhookUrl) {
      throw new Error('LARK_WEBHOOK_URL is not set (env or X-Lark-Url header)')
    }

    
    // Add timestamp for webhook verification if secret is provided
    if (webhookSecret) {
      const timestamp = Math.floor(Date.now() / 1000).toString()
      const sign = generateLarkSignature(timestamp, webhookSecret)

      const response = await axios.post(webhookUrl, {
        ...message,
        sign,
        timestamp,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      return parseLarkResponse(response)
    } else {
      // Send without signature verification
      const response = await axios.post(webhookUrl, message, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      return parseLarkResponse(response)
    }
    
  } catch (error) {
    console.error('Error sending to Lark:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

function parseLarkResponse(response: { status: number; data?: { code?: number; msg?: string; data?: { message_id?: string }; message?: string } }): LarkResponse {
  const ok = response.status === 200 && response.data?.code === 0

  if (!ok) {
    console.error('Lark webhook error:', response.data)
  } else {
    console.log('Success sending to Lark', response.data)
  }

  return {
    success: ok,
    messageId: ok ? response.data?.data?.message_id : undefined,
    error: ok ? undefined : response.data?.msg,
    message: response.data?.message
  }
}

function generateLarkSignature(timestamp: string, secret: string): string {
  const stringToSign = `${timestamp}\n${secret}`
  return createHmac('sha256', stringToSign).update('').digest('base64')
}
