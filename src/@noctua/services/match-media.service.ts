import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Service to observe media query changes using native window.matchMedia
 * Replaces @angular/flex-layout MediaObserver
 */
@Injectable({
  providedIn: 'root'
})
export class NoctuaMatchMediaService implements OnDestroy {
  activeMediaQuery: string;
  onMediaChange: BehaviorSubject<string> = new BehaviorSubject<string>('');

  private mediaQueries: { alias: string; query: string; mql: MediaQueryList }[] = [];

  // Tailwind/Material aligned breakpoints
  private breakpoints = [
    { alias: 'xs', query: '(max-width: 599.98px)' },
    { alias: 'sm', query: '(min-width: 600px) and (max-width: 959.98px)' },
    { alias: 'md', query: '(min-width: 960px) and (max-width: 1279.98px)' },
    { alias: 'lg', query: '(min-width: 1280px) and (max-width: 1439.98px)' },
    { alias: 'xl', query: '(min-width: 1440px)' },
  ];

  constructor() {
    this.activeMediaQuery = '';
    this._init();
  }

  private _init(): void {
    if (typeof window === 'undefined') return;

    // Set up media query listeners for each breakpoint
    this.breakpoints.forEach(bp => {
      const mql = window.matchMedia(bp.query);
      const entry = { alias: bp.alias, query: bp.query, mql };
      this.mediaQueries.push(entry);

      // Check initial state
      if (mql.matches) {
        this.activeMediaQuery = bp.alias;
        this.onMediaChange.next(bp.alias);
      }

      // Listen for changes
      const handler = (e: MediaQueryListEvent) => {
        if (e.matches && this.activeMediaQuery !== bp.alias) {
          this.activeMediaQuery = bp.alias;
          this.onMediaChange.next(bp.alias);
        }
      };

      mql.addEventListener('change', handler);
    });
  }

  ngOnDestroy(): void {
    // Clean up listeners
    this.mediaQueries.forEach(entry => {
      entry.mql.removeEventListener('change', () => {});
    });
  }
}
