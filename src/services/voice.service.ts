import twilio from 'twilio'
import { prisma } from '@/lib/prisma'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

console.log('Twilio Config:', {
  sid: process.env.TWILIO_ACCOUNT_SID?.substring(0, 10) + '...',
  hasToken: !!process.env.TWILIO_AUTH_TOKEN,
  phone: process.env.TWILIO_PHONE_NUMBER
})

export interface IvrCallOptions {
  to: string
  from?: string
  menuId?: string
}

export class VoiceService {
  /**
   * Initiate an outbound call
   */
  static async initiateCall(options: IvrCallOptions) {
    try {
      const call = await client.calls.create({
        to: options.to,
        from: options.from || process.env.TWILIO_PHONE_NUMBER!,
        url: `${process.env.NEXT_PUBLIC_APP_URL}/api/voice/ivr${
          options.menuId ? `?menuId=${options.menuId}` : ''
        }`,
        statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/voice/status`,
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        record: true,
      })

      // Create call record
      const callRecord = await prisma.call.create({
        data: {
          twilioCallSid: call.sid,
          direction: 'OUTBOUND',
          status: 'INITIATED',
          from: call.from,
          to: call.to,
        },
      })

      return {
        success: true,
        data: {
          callSid: call.sid,
          callId: callRecord.id,
          status: call.status,
        },
      }
    } catch (error: any) {
      console.error('Initiate call error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Generate TwiML for IVR menu
   */
  static async generateIvrTwiml(menuId?: string) {
    const VoiceResponse = twilio.twiml.VoiceResponse

    try {
      let menu
      if (menuId) {
        menu = await prisma.ivrMenu.findUnique({
          where: { id: menuId, isActive: true },
        })
      }

      const twiml = new VoiceResponse()

      if (menu) {
        const gather = twiml.gather({
          numDigits: 1,
          action: '/api/voice/handle-key',
          method: 'POST',
        })

        gather.say({ voice: 'alice' }, menu.welcomeText)
      } else {
        // Default menu
        const gather = twiml.gather({
          numDigits: 1,
          action: '/api/voice/handle-key',
          method: 'POST',
        })

        gather.say(
          { voice: 'alice' },
          'Welcome! Press 1 for sales, 2 for support, or 3 to speak with an agent.'
        )
      }

      twiml.say({ voice: 'alice' }, 'We did not receive any input. Goodbye!')

      return twiml.toString()
    } catch (error: any) {
      console.error('Generate TwiML error:', error)
      throw error
    }
  }

  /**
   * Handle IVR keypress
   */
  static async handleKeyPress(digit: string, callSid: string) {
    const VoiceResponse = twilio.twiml.VoiceResponse
    const twiml = new VoiceResponse()

    try {
      // Update call record with IVR path
      await prisma.call.update({
        where: { twilioCallSid: callSid },
        data: {
          ivrPath: {
            push: digit,
          },
        },
      })

      switch (digit) {
        case '1':
          twiml.say({ voice: 'alice' }, 'Connecting you to sales.')
          twiml.dial('+1234567890') // Sales number
          break
        case '2':
          twiml.say({ voice: 'alice' }, 'Connecting you to support.')
          twiml.dial('+1234567891') // Support number
          break
        case '3':
          twiml.say({ voice: 'alice' }, 'Please hold while we connect you.')
          twiml.enqueue('AgentQueue')
          break
        default:
          twiml.say({ voice: 'alice' }, 'Invalid option. Goodbye.')
          twiml.hangup()
      }

      return twiml.toString()
    } catch (error: any) {
      console.error('Handle keypress error:', error)
      twiml.say({ voice: 'alice' }, 'An error occurred. Please try again.')
      return twiml.toString()
    }
  }

  /**
   * Update call status
   */
  static async updateCallStatus(callSid: string, status: string, data?: any) {
    try {
      const updateData: any = {
        status: status.toUpperCase().replace('-', '_'),
      }

      if (status === 'completed') {
        updateData.endedAt = new Date()
        if (data?.CallDuration) {
          updateData.duration = parseInt(data.CallDuration)
        }
        if (data?.RecordingUrl) {
          updateData.recordingUrl = data.RecordingUrl
        }
      } else if (status === 'in-progress') {
        updateData.answeredAt = new Date()
      }

      await prisma.call.update({
        where: { twilioCallSid: callSid },
        data: updateData,
      })

      return { success: true }
    } catch (error: any) {
      console.error('Update call status error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get call recording
   */
  static async getRecording(callSid: string) {
    try {
      const recordings = await client.recordings.list({
        callSid,
        limit: 1,
      })

      if (recordings.length > 0) {
        const recording = recordings[0]
        return {
          success: true,
          data: {
            url: `https://api.twilio.com${recording.uri.replace('.json', '.mp3')}`,
            duration: recording.duration,
            sid: recording.sid,
          },
        }
      }

      return { success: false, error: 'No recording found' }
    } catch (error: any) {
      console.error('Get recording error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Transcribe call recording
   */
  static async transcribeRecording(recordingSid: string) {
    try {
      // Use Twilio's transcription service or integrate with external service
      const recording = await client.recordings(recordingSid).fetch()

      // If transcription is available
      if (recording.transcription) {
        return {
          success: true,
          data: recording.transcription,
        }
      }

      return { success: false, error: 'Transcription not available' }
    } catch (error: any) {
      console.error('Transcribe error:', error)
      return { success: false, error: error.message }
    }
  }
}
