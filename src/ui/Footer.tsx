export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="flex items-center justify-center gap-2 pb-5 pt-2 text-[11px] text-text-muted">
      <span>© {year} haneulcha</span>
      <span aria-hidden="true">·</span>
      <a
        href="https://github.com/haneulcha"
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-sm underline-offset-2 transition-colors hover:text-text-secondary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        GitHub
      </a>
    </footer>
  );
}
