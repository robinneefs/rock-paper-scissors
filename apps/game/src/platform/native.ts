import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

/**
 * The Android app (apps/android) runs this same web build inside Capacitor. Everything here does
 * nothing in a browser, so the web game behaves exactly as before.
 */
export const isNativeApp = (): boolean => Capacitor.isNativePlatform();

/** One buzz from the phone's own haptics (softer or harder), inside the Android app. */
export function nativeImpact(level: 'light' | 'medium' | 'heavy'): void {
  const style = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy }[level];
  void Haptics.impact({ style }).catch(() => undefined);
}

/**
 * The phone's back button: on the home screen it leaves the app, anywhere else it does what Esc
 * does (back out of a menu). Does nothing outside the app.
 */
export function hookBackButton(atHome: () => boolean, back: () => void): void {
  if (!isNativeApp()) return;
  void App.addListener('backButton', () => (atHome() ? void App.exitApp() : back())).catch(() => undefined);
}
