import { Component, ChangeDetectionStrategy, input, output, signal, effect, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Transcription } from '../../app.component';
import { GeminiService } from '../../services/gemini.service';

@Component({
  selector: 'app-transcription-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transcription-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TranscriptionViewComponent {
  private readonly geminiService = inject(GeminiService);

  transcription = input<Transcription | null>(null);
  loading = input<boolean>(false);
  transcribeNew = output();

  // Original transcription state
  copyButtonText = signal('Copy');

  // Loading indicator state
  progress = signal(0);
  statusMessage = signal('Initializing...');
  
  // Translation state
  translatedText = signal<string | null>(null);
  isTranslating = signal(false);
  translationSource = signal<'english' | 'hinglish' | null>(null);
  translationError = signal<string | null>(null);
  copyTranslationButtonText = signal('Copy');

  private readonly statusMessages = [
    'Preparing your audio file...',
    'Connecting to Gemini API...',
    'Analyzing audio patterns...',
    'Generating transcription text...',
    'Finalizing the results...',
    'Almost there...'
  ];

  constructor() {
    effect((onCleanup) => {
      // Handles the progress bar for initial transcription
      if (this.loading()) {
        this.progress.set(0);
        this.statusMessage.set('Initializing...');
        let messageIndex = 0;

        const progressInterval = setInterval(() => {
          this.progress.update(p => {
            if (p < 95) {
              const increment = Math.random() * 2;
              return Math.min(p + increment, 95);
            }
            return p;
          });
        }, 150);

        const messageInterval = setInterval(() => {
          messageIndex = (messageIndex + 1) % this.statusMessages.length;
          this.statusMessage.set(this.statusMessages[messageIndex]);
        }, 2000);

        onCleanup(() => {
          clearInterval(progressInterval);
          clearInterval(messageInterval);
        });
      }
    });

    // Resets translation state when a new transcription is displayed
    effect(() => {
      this.transcription(); // Depend on the input
      this.translatedText.set(null);
      this.isTranslating.set(false);
      this.translationSource.set(null);
      this.translationError.set(null);
      this.copyTranslationButtonText.set('Copy');
    });
  }
  
  async translate(sourceLanguage: 'english' | 'hinglish') {
    const textToTranslate = this.transcription()?.text;
    if (!textToTranslate || this.isTranslating()) return;

    this.isTranslating.set(true);
    this.translationSource.set(sourceLanguage);
    this.translationError.set(null);
    this.translatedText.set(null);

    try {
      const result = await this.geminiService.translateText(textToTranslate, sourceLanguage);
      this.translatedText.set(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred.';
      this.translationError.set(`Translation failed: ${message}`);
    } finally {
      this.isTranslating.set(false);
      this.translationSource.set(null);
    }
  }

  copyToClipboard() {
    const textToCopy = this.transcription()?.text;
    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy).then(() => {
      this.copyButtonText.set('Copied!');
      setTimeout(() => this.copyButtonText.set('Copy'), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      this.copyButtonText.set('Failed to copy');
       setTimeout(() => this.copyButtonText.set('Copy'), 2000);
    });
  }
  
  copyTranslationToClipboard() {
    const textToCopy = this.translatedText();
    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy).then(() => {
      this.copyTranslationButtonText.set('Copied!');
      setTimeout(() => this.copyTranslationButtonText.set('Copy'), 2000);
    }).catch(err => {
      console.error('Failed to copy translation: ', err);
      this.copyTranslationButtonText.set('Failed to copy');
       setTimeout(() => this.copyTranslationButtonText.set('Copy'), 2000);
    });
  }

  onTranscribeNew() {
    this.transcribeNew.emit();
  }
}