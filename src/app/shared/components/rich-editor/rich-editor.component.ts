import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  forwardRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Composant partagé : éditeur rich-text (barre d'outils + contenteditable).
 * Implémente ControlValueAccessor pour être utilisable avec [(ngModel)].
 *
 * Usage : <app-rich-editor [(ngModel)]="htmlContent" />
 */
@Component({
  selector: 'app-rich-editor',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RichEditorComponent),
      multi: true,
    },
  ],
  templateUrl: './rich-editor.component.html',
  styleUrl: './rich-editor.component.scss',
})
export class RichEditorComponent implements ControlValueAccessor, AfterViewInit {
  @ViewChild('editor', { static: false })
  editorRef!: ElementRef<HTMLDivElement>;

  onChangeFn: (v: string) => void = () => {};
  onTouchedFn: () => void = () => {};

  private pendingValue: string | null = null;

  ngAfterViewInit(): void {
    if (this.pendingValue !== null) {
      this.editorRef.nativeElement.innerHTML = this.pendingValue;
      this.pendingValue = null;
    }
  }

  exec(event: MouseEvent, cmd: string): void {
    event.preventDefault();
    document.execCommand(cmd, false);
  }

  execWithValue(cmd: string, event: Event): void {
    const value = (event.target as HTMLInputElement | HTMLSelectElement).value;
    this.editorRef?.nativeElement.focus();
    document.execCommand(cmd, false, value);
  }

  onContentInput(): void {
    this.onChangeFn(this.editorRef.nativeElement.innerHTML);
  }

  // ControlValueAccessor

  writeValue(value: string | null): void {
    const html = value ?? '';
    if (this.editorRef?.nativeElement) {
      this.editorRef.nativeElement.innerHTML = html;
    } else {
      this.pendingValue = html;
    }
  }

  registerOnChange(fn: (v: string) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }
}
