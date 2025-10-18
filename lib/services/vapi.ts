/**
 * Vapi Voice Service
 * Singleton service for managing Vapi conversational AI integration
 */

import Vapi from '@vapi-ai/web'
import type {
  VapiConfig,
  VapiSpeakOptions,
  VapiMessage,
  VapiState,
  VapiEmotion,
} from '@/types/vapi'

type MessageHandler = (message: VapiMessage) => void

/**
 * VapiService manages the Vapi SDK instance and provides methods for
 * voice interactions with child-friendly emotional tones
 */
class VapiService {
  private vapi: Vapi | null = null
  private state: VapiState = {
    connectionState: 'disconnected',
    isSpeaking: false,
    error: null,
  }
  private messageHandlers: Set<MessageHandler> = new Set()
  private config: VapiConfig | null = null

  /**
   * Initialize the Vapi service with configuration
   */
  initialize(config: VapiConfig): void {
    if (this.vapi) {
      console.warn('[Vapi] Already initialized')
      return
    }

    this.config = config
    this.vapi = new Vapi(config.apiKey)

    // Set up event listeners
    this.setupEventListeners()

    console.log('[Vapi] Service initialized')
  }

  /**
   * Set up Vapi event listeners
   */
  private setupEventListeners(): void {
    if (!this.vapi) return

    // Call started
    this.vapi.on('call-start', () => {
      console.log('[Vapi] Call started')
      this.state.connectionState = 'connected'
      this.state.error = null
    })

    // Call ended
    this.vapi.on('call-end', () => {
      console.log('[Vapi] Call ended')
      this.state.connectionState = 'disconnected'
      this.state.isSpeaking = false
    })

    // Speech started
    this.vapi.on('speech-start', () => {
      console.log('[Vapi] Speech started')
      this.state.isSpeaking = true
    })

    // Speech ended
    this.vapi.on('speech-end', () => {
      console.log('[Vapi] Speech ended')
      this.state.isSpeaking = false
    })

    // Messages
    this.vapi.on('message', (message: any) => {
      console.log('[Vapi] Message received:', message)

      // Convert to our message format
      const vapiMessage: VapiMessage = {
        role: message.role || 'assistant',
        content: message.content || message.transcript || '',
        timestamp: new Date(),
      }

      // Notify all message handlers
      this.messageHandlers.forEach((handler) => handler(vapiMessage))
    })

    // Errors
    this.vapi.on('error', (error: any) => {
      console.error('[Vapi] Error:', error)
      this.state.error = error.message || 'Unknown error'
    })
  }

  /**
   * Start a new voice session
   */
  async startSession(): Promise<void> {
    if (!this.vapi || !this.config) {
      throw new Error('Vapi service not initialized')
    }

    if (this.state.connectionState === 'connected') {
      console.warn('[Vapi] Already connected')
      return
    }

    try {
      this.state.connectionState = 'connecting'
      this.state.error = null

      await this.vapi.start(this.config.assistantId)

      console.log('[Vapi] Session started')
    } catch (error) {
      this.state.connectionState = 'disconnected'
      this.state.error = error instanceof Error ? error.message : 'Failed to start session'
      console.error('[Vapi] Failed to start session:', error)
      throw error
    }
  }

  /**
   * Stop the current voice session
   */
  async stopSession(): Promise<void> {
    if (!this.vapi) {
      console.warn('[Vapi] Service not initialized')
      return
    }

    try {
      await this.vapi.stop()
      this.state.connectionState = 'disconnected'
      this.state.isSpeaking = false
      console.log('[Vapi] Session stopped')
    } catch (error) {
      console.error('[Vapi] Failed to stop session:', error)
      throw error
    }
  }

  /**
   * Make the assistant speak specific text with an emotional tone
   */
  async speak(options: Partial<VapiSpeakOptions>): Promise<void> {
    if (!this.vapi) {
      throw new Error('Vapi service not initialized')
    }

    if (this.state.connectionState !== 'connected') {
      throw new Error('Not connected to Vapi. Call startSession() first.')
    }

    const { text, emotion = 'calm' } = options

    if (!text || text.trim().length === 0) {
      console.warn('[Vapi] No text provided to speak')
      return
    }

    try {
      // Format the message with emotional context
      const emotionalPrompt = this.formatEmotionalPrompt(text, emotion)

      // Send message to Vapi assistant
      this.vapi.send({
        type: 'add-message',
        message: {
          role: 'system',
          content: emotionalPrompt,
        },
      })

      console.log('[Vapi] Speak request sent:', { text: text.substring(0, 50), emotion })
    } catch (error) {
      console.error('[Vapi] Failed to speak:', error)
      throw error
    }
  }

  /**
   * Format text with emotional tone instructions
   */
  private formatEmotionalPrompt(text: string, emotion: VapiEmotion): string {
    const emotionMap: Record<VapiEmotion, string> = {
      happy: 'cheerful and excited',
      sad: 'gentle and comforting',
      angry: 'firm but understanding',
      scared: 'reassuring and calm',
      calm: 'warm and peaceful',
    }

    const tone = emotionMap[emotion] || emotionMap.calm

    return `Say the following to the child with a ${tone} tone: "${text}"`
  }

  /**
   * Send a system message to guide the conversation
   */
  sendSystemMessage(content: string): void {
    if (!this.vapi) {
      throw new Error('Vapi service not initialized')
    }

    if (this.state.connectionState !== 'connected') {
      console.warn('[Vapi] Not connected, cannot send system message')
      return
    }

    try {
      this.vapi.send({
        type: 'add-message',
        message: {
          role: 'system',
          content,
        },
      })

      console.log('[Vapi] System message sent')
    } catch (error) {
      console.error('[Vapi] Failed to send system message:', error)
    }
  }

  /**
   * Subscribe to messages from the assistant
   */
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler)

    // Return unsubscribe function
    return () => {
      this.messageHandlers.delete(handler)
    }
  }

  /**
   * Get current state
   */
  getState(): VapiState {
    return { ...this.state }
  }

  /**
   * Check if service is available and connected
   */
  isAvailable(): boolean {
    return this.state.connectionState === 'connected'
  }

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    return this.state.isSpeaking
  }
}

// Export singleton instance
export const vapiService = new VapiService()
