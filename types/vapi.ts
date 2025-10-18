/**
 * Vapi Voice Integration Types
 * Type definitions for Vapi conversational AI integration
 */

export interface VapiConfig {
  /**
   * Vapi public API key
   */
  apiKey: string

  /**
   * Assistant ID to connect to
   */
  assistantId: string
}

export type VapiEmotion = 'happy' | 'sad' | 'angry' | 'scared' | 'calm'

export interface VapiSpeakOptions {
  /**
   * Text for the assistant to speak
   */
  text: string

  /**
   * Emotional tone to use when speaking
   * @default 'calm'
   */
  emotion?: VapiEmotion

  /**
   * Whether to listen for a response after speaking
   * @default false
   */
  listenForResponse?: boolean
}

export interface VapiMessage {
  /**
   * Role of the message sender
   */
  role: 'assistant' | 'user' | 'system'

  /**
   * Content of the message
   */
  content: string

  /**
   * Timestamp when message was received
   */
  timestamp: Date
}

export type VapiConnectionState = 'disconnected' | 'connecting' | 'connected'

export interface VapiState {
  /**
   * Current connection state
   */
  connectionState: VapiConnectionState

  /**
   * Whether the assistant is currently speaking
   */
  isSpeaking: boolean

  /**
   * Error message if any
   */
  error: string | null
}
