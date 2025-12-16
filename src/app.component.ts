import { Component, ChangeDetectionStrategy, signal, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GeminiService } from './services/gemini.service';
import { AudioInputComponent } from './components/audio-input/audio-input.component';
import { TranscriptionViewComponent } from './components/transcription-view/transcription-view.component';
import { HistoryViewComponent } from './components/history-view/history-view.component';

export interface AudioData {
  data: string; // base64
  mimeType: string;
  name: string;
}

export interface Transcription {
  id: string;
  text: string;
  audioName: string;
  date: string;
}

type ViewState = 'input' | 'loading' | 'result' | 'error';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, AudioInputComponent, TranscriptionViewComponent, HistoryViewComponent],
})
export class AppComponent implements OnInit {
  private readonly geminiService = inject(GeminiService);
  
  readonly HISTORY_KEY = 'transcriptionHistory';
  readonly MAX_HISTORY_ITEMS = 5;

  view = signal<ViewState>('input');
  transcription = signal<Transcription | null>(null);
  errorMessage = signal<string>('');
  history = signal<Transcription[]>([]);
  theme = signal<'light' | 'dark'>('light');

  constructor() {
    effect(() => {
      // Persist history to localStorage whenever it changes
      try {
        localStorage.setItem(this.HISTORY_KEY, JSON.stringify(this.history()));
      } catch (e) {
        console.error('Failed to save history to localStorage', e);
      }
    });

    effect(() => {
        // Persist theme to localStorage and update html class
        localStorage.setItem('theme', this.theme());
        if (this.theme() === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    });
  }

  ngOnInit() {
    this.loadHistory();
    this.loadTheme();
  }

  loadTheme() {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark' || storedTheme === 'light') {
        this.theme.set(storedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        this.theme.set('dark');
    } else {
        this.theme.set('light');
    }
  }

  toggleTheme() {
    this.theme.update(current => current === 'light' ? 'dark' : 'light');
  }

  loadHistory() {
    try {
      const storedHistory = localStorage.getItem(this.HISTORY_KEY);
      if (storedHistory) {
        this.history.set(JSON.parse(storedHistory));
      }
    } catch (e) {
      console.error('Failed to load history from localStorage', e);
      this.history.set([]);
    }
  }

  async handleAudio(audioData: AudioData) {
    this.view.set('loading');
    this.errorMessage.set('');
    this.transcription.set(null);

    try {
      const transcriptionText = await this.geminiService.transcribeAudio(audioData.data, audioData.mimeType);
      
      const newTranscription: Transcription = {
        id: crypto.randomUUID(),
        text: transcriptionText,
        audioName: audioData.name,
        date: new Date().toISOString(),
      };

      this.transcription.set(newTranscription);
      this.addToHistory(newTranscription);
      this.view.set('result');
    } catch (error) {
      console.error('Transcription failed:', error);
      const message = error instanceof Error ? error.message : 'An unknown error occurred during transcription.';
      this.errorMessage.set(`Transcription failed. ${message}`);
      this.view.set('error');
    }
  }

  addToHistory(transcription: Transcription) {
    this.history.update(currentHistory => {
      const newHistory = [transcription, ...currentHistory];
      return newHistory.slice(0, this.MAX_HISTORY_ITEMS);
    });
  }
  
  showHistoryItem(transcription: Transcription) {
    this.transcription.set(transcription);
    this.view.set('result');
  }

  clearHistory() {
    this.history.set([]);
    // The effect will handle saving the empty array to localStorage
  }

  transcribeAgain() {
    this.view.set('input');
    this.transcription.set(null);
    this.errorMessage.set('');
  }
}