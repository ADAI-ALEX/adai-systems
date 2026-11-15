/// <reference types="astro/client" />
import type { MascotCommand } from './gl/World';

declare global {
  interface WindowEventMap {
    'adai:motion': CustomEvent<{ allowed: boolean }>;
    'adai:mascot': CustomEvent<MascotCommand>;
  }
}
export {};
