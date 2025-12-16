import { Component, ChangeDetectionStrategy, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioData } from '../../app.component';

type RecordingState = 'idle' | 'recording' | 'stopped';

@Component({
  selector: 'app-audio-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audio-input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AudioInputComponent {
  audioSubmit = output<AudioData>();

  fileError = signal<string | null>(null);
  recordingState = signal<RecordingState>('idle');
  recordingError = signal<string | null>(null);

  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  handleFileChange(event: Event) {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;

    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      this.fileError.set(null);

      const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'video/mp4'];
      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        this.fileError.set('Invalid file type. Please upload an MP3, WAV, OGG, or MP4 file.');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.fileError.set('File is too large. Maximum size is 10MB.');
        return;
      }

      this.readFileAsBase64(file);
    }
  }

  private readFileAsBase64(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      this.audioSubmit.emit({
        data: base64String,
        mimeType: file.type,
        name: file.name,
      });
    };
    reader.onerror = () => {
      this.fileError.set('Error reading file.');
    };
    reader.readAsDataURL(file);
  }
  
  async startRecording() {
    if (this.recordingState() === 'recording') return;

    this.recordingError.set(null);
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.mediaRecorder = new MediaRecorder(stream);
        this.recordedChunks = [];

        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.recordedChunks.push(event.data);
            }
        };

        this.mediaRecorder.onstop = () => {
            const audioBlob = new Blob(this.recordedChunks, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.onload = () => {
                const base64String = (reader.result as string).split(',')[1];
                this.audioSubmit.emit({
                    data: base64String,
                    mimeType: 'audio/webm',
                    name: `recording-${new Date().toISOString()}.webm`
                });
            };
            reader.readAsDataURL(audioBlob);
            stream.getTracks().forEach(track => track.stop());
        };
        
        this.mediaRecorder.start();
        this.recordingState.set('recording');
    } catch (err) {
        console.error('Error accessing microphone:', err);
        this.recordingError.set('Could not access microphone. Please check permissions.');
        this.recordingState.set('idle');
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.recordingState() === 'recording') {
        this.mediaRecorder.stop();
        this.recordingState.set('idle');
    }
  }

  cancelRecording() {
    if (this.mediaRecorder && this.recordingState() === 'recording') {
        this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        this.mediaRecorder = null;
    }
    this.recordedChunks = [];
    this.recordingState.set('idle');
    this.recordingError.set(null);
  }
}
