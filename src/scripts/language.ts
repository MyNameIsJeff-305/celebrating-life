/** Only the unlocalized home route detects language. Explicit URLs and QR links win. */
export function preferredLanguage(saved: string | null, languages: readonly string[]): 'en' | 'es' {
  if (saved === 'en' || saved === 'es') return saved;
  for (const language of languages) {
    const base = language.toLowerCase().split(/[-_]/)[0];
    if (base === 'en' || base === 'es') return base;
  }
  return 'en';
}

export function rememberLanguageSwitches() {
  document.querySelectorAll<HTMLAnchorElement>('[data-language-switch]').forEach(link => {
    link.addEventListener('click', () => {
      const language = link.dataset.languageSwitch;
      if (language !== 'es' && language !== 'en') return;
      try { localStorage.setItem('cl-language', language); } catch { /* The explicit destination still works. */ }
    });
  });
}
