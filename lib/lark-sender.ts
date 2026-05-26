import axios from 'axios'
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
      
      console.log("Webhook Secret: ", {webhookSecret,sign,timestamp});
      
      // Add signature to headers
      const headers = {
        'Content-Type': 'application/json',
      }
      
      const response = await axios.post(webhookUrl, {
        ...message,
        sign,
        timestamp,
      }, { headers })
      
      console.log("Susses sending to Lark ", response.status, response.data);
      
      return {
        success: response.status === 200,
        messageId: response.data?.code === 0 ? response.data?.data?.message_id : undefined,
        error: response.data?.code !== 0 ? response.data?.msg : undefined,
        message: response.data?.message
      }
    } else {
      // Send without signature verification
      const response = await axios.post(webhookUrl, message, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log("Susses sending to Lark ", response.status, response.data);
      
      
      return {
        success: response.status === 200,
        messageId: response.data?.code === 0 ? response.data?.data?.message_id : undefined,
        error: response.data?.code !== 0 ? response.data?.msg : undefined,
        message: response.data?.message
      }
    }
    
  } catch (error) {
    console.error('Error sending to Lark:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

function generateLarkSignature(timestamp: string, secret: string): string {
  const crypto = require('crypto')
  const stringToSign = timestamp + secret
  return crypto.createHmac('sha256', secret).update(stringToSign).digest('base64')
}
