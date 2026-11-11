// ============================================================
// src/app/services/admin.service.ts
// Admin Authentication Service for Palengke Watch.
// Provides reactive admin status and manages login prompt
// UI via Ionic modal / state.
// ============================================================

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const ADMIN_SESSION_KEY = 'palengke_admin_session';

// SHA-256 hash of PIN "1384"
const ADMIN_PIN_HASH = 'a73531f89e6bcbc2a72a8b08ac33122114e19ffbf89d9dc7d3ef0e85f5dc2287';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private _isAdmin$ = new BehaviorSubject<boolean>(this.checkSession());
  isAdmin$ = this._isAdmin$.asObservable();

  // Controls the visibility of the custom popup dialog
  showLoginModal = false;
  pinInput = '';
  errorMessage = '';

  private loginResolver: ((value: boolean) => void) | null = null;

  get isAdmin(): boolean {
    return this._isAdmin$.value;
  }

  /**
   * Opens the in-app modal popup container to ask for PIN.
   * Returns a promise that resolves when the user submits or cancels.
   */
  promptLogin(): Promise<boolean> {
    return new Promise((resolve) => {
      this.pinInput = '';
      this.errorMessage = '';
      this.showLoginModal = true;
      this.loginResolver = resolve;
    });
  }

  cancelLogin(): void {
    this.showLoginModal = false;
    this.pinInput = '';
    this.errorMessage = '';
    if (this.loginResolver) {
      this.loginResolver(false);
      this.loginResolver = null;
    }
  }

  async submitPin(): Promise<void> {
    const pin = this.pinInput.trim();
    if (!pin) {
      this.errorMessage = 'Pakilagay ang PIN.';
      return;
    }

    const hash = await this.sha256(pin);
    if (hash === ADMIN_PIN_HASH) {
      this.setSession();
      this.showLoginModal = false;
      this.pinInput = '';
      this.errorMessage = '';
      if (this.loginResolver) {
        this.loginResolver(true);
        this.loginResolver = null;
      }
    } else {
      this.errorMessage = 'Mali ang PIN. Pakisubukang muli.';
      this.pinInput = '';
    }
  }

  logout(): void {
    try {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    } catch {}
    this._isAdmin$.next(false);
  }

  private checkSession(): boolean {
    try {
      return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
    } catch {
      return false;
    }
  }

  private setSession(): void {
    try {
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
    } catch {}
    this._isAdmin$.next(true);
  }

  private async sha256(text: string): Promise<string> {
    const buf = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(text)
    );
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
