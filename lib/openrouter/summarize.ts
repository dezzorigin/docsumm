import { callOpenRouter } from './client'
import { SummaryCardOutput } from '@/lib/types'

// Mock summary for development when API key is not configured
const MOCK_SUMMARY: SummaryCardOutput = {
  mode: 'card',
  overview: 'This is a mock summary for development. The actual AI summarization will work once OpenRouter API key is configured in .env.local. This document appears to contain important information that would normally be analyzed and structured by our AI.',
  critical_points: [
    'Configure OPENROUTER_API_KEY in .env.local to enable real AI summarization',
    'Test with real document upload once API key is configured',
    'Mock data is being used for development purposes'
  ],
  action_items: [
    'Add OPENROUTER_API_KEY to environment variables',
    'Test upload flow end-to-end with real API',
    'Verify summary quality and adjust prompts if needed'
  ],
  key_dates: [
    { label: 'Development', value: 'Today' },
    { label: 'Testing Phase', value: 'After API key setup' }
  ],
  metadata: {
    document_type: 'Development Mock Document',
    parties: ['DocSumm Team', 'Development Environment'],
    location: 'Local Development',
    tags: ['mock', 'development', 'test', 'setup-required']
  }
}

// Summarize text into structured JSON
export async function summarizeText(text: string): Promise<SummaryCardOutput> {
  const prompt = `You are a professional document analyst.

Analyze the following document and return a structured JSON summary.
Return ONLY a valid JSON object with this exact structure, no markdown, no explanation:

{
  "mode": "card",
  "overview": "2-3 sentence summary of the document",
  "critical_points": ["critical point 1", "critical point 2", "critical point 3"],
  "action_items": ["action item 1", "action item 2"],
  "key_dates": [{"label": "date label", "value": "date value"}],
  "metadata": {
    "document_type": "type of document (e.g., contract, report, invoice)",
    "parties": ["party 1", "party 2"],
    "location": "location if mentioned or empty string",
    "tags": ["tag1", "tag2", "tag3"]
  }
}

Important:
- Be concise and factual
- Extract actual dates, parties, and locations from the document
- If information is not present, use empty string or empty array
- Return ONLY valid JSON, no markdown code blocks

Document text:
${text}

JSON output:`

  try {
    const response = await callOpenRouter(
      'google/gemini-flash-1.5',
      [
        {
          role: 'user',
          content: prompt
        }
      ],
      0.2,
      2000
    )

    // Parse JSON response
    let parsedSummary: SummaryCardOutput
    try {
      // Remove markdown code blocks if present
      let cleanedResponse = response.trim()
      if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '')
      }
      
      parsedSummary = JSON.parse(cleanedResponse)
      
      // Validate structure
      if (!parsedSummary.mode || !parsedSummary.overview) {
        throw new Error('Invalid summary structure')
      }
      
      return parsedSummary
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      console.error('Raw response:', response)
      
      // Retry once with more explicit instructions
      const retryResponse = await callOpenRouter(
        'google/gemini-flash-1.5',
        [
          {
            role: 'user',
            content: `${prompt}\n\nIMPORTANT: Return ONLY the JSON object, no other text, no markdown formatting.`
          }
        ],
        0.1,
        2000
      )
      
      let cleanedRetry = retryResponse.trim()
      if (cleanedRetry.startsWith('```')) {
        cleanedRetry = cleanedRetry.replace(/```json\n?/g, '').replace(/```\n?/g, '')
      }
      
      return JSON.parse(cleanedRetry)
    }
  } catch (error) {
    console.error('Summarization error:', error)
    
    // Return mock data if API key is missing
    if (error instanceof Error && error.message === 'OPENROUTER_API_KEY_MISSING') {
      console.log('🔧 Using mock summary data for development')
      return MOCK_SUMMARY
    }
    
    throw new Error('Failed to generate summary')
  }
}
