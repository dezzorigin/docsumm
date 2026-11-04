// OpenRouter API client

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string | { type: string; text?: string; image_url?: { url: string } }[]
}

interface OpenRouterRequest {
  model: string
  messages: ChatMessage[]
  temperature?: number
  max_tokens?: number
}

interface OpenRouterResponse {
  choices: {
    message: {
      content: string
    }
  }[]
}

export async function callOpenRouter(
  model: string,
  messages: ChatMessage[],
  temperature: number = 0.2,
  maxTokens: number = 2000
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  
  if (!apiKey) {
    console.warn('⚠️ OPENROUTER_API_KEY not configured - using mock response')
    throw new Error('OPENROUTER_API_KEY_MISSING')
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      } as OpenRouterRequest)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('OpenRouter API error:', errorData)
      throw new Error(`OpenRouter API error: ${response.status}`)
    }

    const data: OpenRouterResponse = await response.json()
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from OpenRouter')
    }

    return data.choices[0].message.content
  } catch (error) {
    console.error('OpenRouter client error:', error)
    throw error
  }
}
