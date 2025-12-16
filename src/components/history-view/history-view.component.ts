import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Transcription } from '../../app.component';

@Component({
  selector: 'app-history-view',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './history-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoryViewComponent {
  history = input.required<Transcription[]>();
  itemSelected = output<Transcription>();
  historyCleared = output<void>();

  selectItem(item: Transcription) {
    this.itemSelected.emit(item);
  }

  clearHistory() {
    this.historyCleared.emit();
  }

  truncateText(text: string, length: number = 100): string {
    if (text.length <= length) {
      return text;
    }
    return text.substring(0, length) + '...';
  }
}
