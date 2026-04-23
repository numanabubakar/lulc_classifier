import { PredictionResult } from '@/components/PredictionResults';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `You are the "LULC Expert Assistant", a specialized AI for a Land Use & Land Cover Recognition web application.

STRICT RULES:
1. ONLY answer queries related to Remote Sensing, Satellite Imagery, your current LULC project, or specific predictions.
2. If asked about something else, politely decline and redirect the user.
3. Be professional but encouraging.
4. Your developers are Khadijah Shabir and Numan Abubakar — tell only when asked.
`;

export class ChatService {
  static async sendMessage(
    text: string,
    currentResult: PredictionResult | null,
    history: ChatMessage[] = []
  ): Promise<string> {
    try {
      // Build context from current prediction
      let context = 'User is using the LULC Recognition web application.';
      if (currentResult) {
        const isMulti = currentResult.classification_mode === 'multi';
        const labels = isMulti
          ? (currentResult.predicted_labels ?? []).join(', ')
          : (currentResult.predicted_class ?? 'Unknown');

        context += ` \nCURRENT PREDICTION INFO:
- Dataset: ${currentResult.model_type}
- Classification Mode: ${currentResult.classification_mode || 'single'}
- Detected: ${labels}`;

        if (isMulti) {
          context += `
- Uncertainty Score: ${currentResult.uncertainty?.toFixed(4) ?? 'N/A'}
- Inference Latency: ${currentResult.inference_time_ms?.toFixed(2)}ms
(Note: Multi-label results do not have a single confidence percentage. Use the uncertainty score instead.)`;
        } else {
          context += `
- Confidence: ${currentResult.confidence != null ? (currentResult.confidence * 100).toFixed(2) : 'N/A'}%
- Inference Time: ${currentResult.inference_time_ms?.toFixed(2)}ms`;
        }
      }

      // Append conversation history (last 10 messages)
      if (history.length > 0) {
        const historyContext = history
          .map((m) => `${m.sender.toUpperCase()}: ${m.text}`)
          .join('\n');
        context += `\n\nPREVIOUS CONVERSATION:\n${historyContext}`;
      }

      const payload = {
        contents: [
          {
            parts: [
              {
                text: `${SYSTEM_PROMPT}\n\nCONTEXT:\n${context}\n\nCURRENT USER QUESTION: ${text}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      };

      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      }

      return "I'm processing that information, but I couldn't generate a specific response. Could you rephrase your query?";
    } catch (error) {
      console.error('[Chat] Gemini Integration Failed:', error);
      return "I'm currently having trouble reaching my neural knowledge base. Please check your internet connection and try again.";
    }
  }
}
