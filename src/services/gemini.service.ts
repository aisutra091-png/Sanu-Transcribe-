import { Injectable } from '@angular/core';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';

// IMPORTANT: This is a placeholder for the API key.
// In a real application, this should be handled securely and not hardcoded.
// The Applet environment provides `process.env.API_KEY`.
declare const process: any;

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    if (typeof process === 'undefined' || !process.env?.API_KEY) {
      console.error('API_KEY environment variable not found.');
      // In a real app, you might want to prevent initialization or show an error.
      // For this example, we proceed but API calls will fail.
      // A mock or placeholder could be used for UI development without a key.
      this.ai = new GoogleGenAI({apiKey: 'YOUR_API_KEY_PLACEHOLDER'});
      return;
    }
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async transcribeAudio(base64Audio: string, mimeType: string): Promise<string> {
    if (!base64Audio || !mimeType) {
      throw new Error('Audio data or MIME type is missing.');
    }
    
    try {
      const audioPart = {
        inlineData: {
          mimeType: mimeType,
          data: base64Audio,
        },
      };

      const textPart = {
        text: 'Transcribe this audio file. Provide only the transcribed text in its original language, with appropriate punctuation and capitalization.'
      };

      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [audioPart, textPart] },
      });
      
      const transcription = response.text;
      if (transcription) {
        return transcription;
      } else {
        throw new Error('The API returned an empty transcription.');
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      // Re-throw a more user-friendly error
      if (error instanceof Error) {
        throw new Error(`Gemini API error: ${error.message}`);
      }
      throw new Error('An unknown error occurred while communicating with the Gemini API.');
    }
  }

  async translateText(text: string, sourceLanguage: 'english' | 'hinglish'): Promise<string> {
    if (!text) {
      throw new Error('Text to translate is missing.');
    }

    let prompt: string;

    if (sourceLanguage === 'english') {
      prompt = `Translate the following English text into Hindi using the Devanagari script. If the provided text is already in Hindi, return it unchanged. Provide only the final translated text. Text to translate: "${text}"`;
    } else { // 'hinglish'
      prompt = `Translate the following Hinglish (Romanized Hindi) text into Hindi using the Devanagari script. If the provided text is already in correct Devanagari Hindi, return it unchanged. Provide only the final translated text. Text to translate: "${text}"`;
    }

    try {
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const translation = response.text;
      if (translation) {
        return translation;
      } else {
        throw new Error('The API returned an empty translation.');
      }
    } catch (error) {
      console.error('Error calling Gemini API for translation:', error);
      if (error instanceof Error) {
        throw new Error(`Gemini API error: ${error.message}`);
      }
      throw new Error('An unknown error occurred while translating.');
    }
  }
}