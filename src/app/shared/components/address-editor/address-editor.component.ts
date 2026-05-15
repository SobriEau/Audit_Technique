import {
  Component,
  forwardRef,
  OnDestroy,
  HostListener,
  ElementRef,
  ChangeDetectorRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

export interface AddressResult {
  label: string;
  lat?: number;
  lon?: number;
}

interface BanFeature {
  properties: { label: string };
  geometry: { coordinates: [number, number] }; // [lon, lat]
}

/**
 * Composant partagé : saisie d'adresse avec autocomplétion BAN (api-adresse.data.gouv.fr).
 * Implémente ControlValueAccessor — usage : <app-address-editor [(ngModel)]="adresse" />
 *
 * La valeur émise est un objet { label, lat?, lon? }.
 * En mode hors-ligne, la saisie libre est autorisée (sans coordonnées GPS).
 */
@Component({
  selector: 'app-address-editor',
  standalone: true,
  imports: [],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AddressEditorComponent),
      multi: true,
    },
  ],
  templateUrl: './address-editor.component.html',
  styleUrl: './address-editor.component.scss',
})
export class AddressEditorComponent implements ControlValueAccessor, OnDestroy {
  inputValue = '';
  suggestions: AddressResult[] = [];
  isOffline = false;
  showDropdown = false;
  isLoading = false;

  private selectedValue: AddressResult | null = null;
  private searchSubject = new Subject<string>();
  private sub: Subscription;
  private controller: AbortController | null = null;

  onChangeFn: (v: AddressResult | null) => void = () => {};
  onTouchedFn: () => void = () => {};

  constructor(private elRef: ElementRef, private cdr: ChangeDetectorRef) {
    this.sub = this.searchSubject
      .pipe(debounceTime(350), distinctUntilChanged())
      .subscribe((query) => this.fetchSuggestions(query));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    this.controller?.abort();
  }

  onInput(value: string): void {
    this.inputValue = value;
    // Invalidate selection if the user modifies the text
    if (this.selectedValue && this.selectedValue.label !== value) {
      this.selectedValue = null;
      this.onChangeFn(null);
    }
    if (value.length >= 3) {
      this.searchSubject.next(value);
    } else {
      this.suggestions = [];
      this.showDropdown = false;
    }
  }

  private async fetchSuggestions(query: string): Promise<void> {
    this.controller?.abort();
    this.controller = new AbortController();
    this.isLoading = true;
    this.cdr.detectChanges();

    try {
      const url =
        `https://api-adresse.data.gouv.fr/search/?q=` +
        `${encodeURIComponent(query)}&limit=6`;
      const res = await fetch(url, { signal: this.controller.signal });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = (await res.json()) as { features: BanFeature[] };

      this.suggestions = json.features.map((f) => ({
        label: f.properties.label,
        lat: f.geometry.coordinates[1],
        lon: f.geometry.coordinates[0],
      }));
      this.isOffline = false;
      this.showDropdown = this.suggestions.length > 0;
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      this.isOffline = true;
      this.suggestions = [];
      this.showDropdown = false;
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  select(result: AddressResult): void {
    this.selectedValue = result;
    this.inputValue = result.label;
    this.suggestions = [];
    this.showDropdown = false;
    this.onChangeFn(result);
    this.onTouchedFn();
  }

  onBlur(): void {
    this.onTouchedFn();
    // Allow free input when offline
    if (this.isOffline && this.inputValue.trim() && !this.selectedValue) {
      const free: AddressResult = { label: this.inputValue.trim() };
      this.selectedValue = free;
      this.onChangeFn(free);
    }
    // Delay closing so mousedown on a suggestion fires first
    setTimeout(() => {
      this.showDropdown = false;
      this.cdr.detectChanges();
    }, 150);
  }

  @HostListener('document:click', ['$event.target'])
  onDocumentClick(target: HTMLElement): void {
    if (!this.elRef.nativeElement.contains(target)) {
      this.showDropdown = false;
    }
  }

  /** Formatted GPS label for display, null if no coordinates. */
  get coordsLabel(): string | null {
    const v = this.selectedValue;
    if (v?.lat === undefined || v?.lon === undefined) return null;
    return `${v.lat.toFixed(5)}, ${v.lon.toFixed(5)}`;
  }

  /** Formatted coords for a suggestion item. */
  suggestionCoords(s: AddressResult): string {
    if (s.lat === undefined || s.lon === undefined) return '';
    return `${s.lat.toFixed(4)}, ${s.lon.toFixed(4)}`;
  }

  // ─── ControlValueAccessor ────────────────────────────────────────────────

  writeValue(val: AddressResult | null): void {
    this.selectedValue = val ?? null;
    this.inputValue = val?.label ?? '';
  }

  registerOnChange(fn: (v: AddressResult | null) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }
}
