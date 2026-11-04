import { callOpenRouter } from './client'

// Extract text from image using OCR
export async function extractTextFromImage(base64Image: string): Promise<string> {
  try {
    const response = await callOpenRouter(
      'google/gemini-2.0-flash-exp',
      [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all text from this document image. Return only the raw text content, no formatting, no explanations.'
            },
            {
              type: 'image_url',
              image_url: {
                url: base64Image.startsWith('data:') ? base64Image : `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      0.1, // Low temperature for accurate OCR
      4000 // Higher token limit for long documents
    )

    return response.trim()
  } catch (error) {
    console.error('OCR error:', error)
    throw new Error('Failed to extract text from image')
  }
}
