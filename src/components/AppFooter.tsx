export function AppFooter() {
  return (
    <footer className="app-footer">
      <span>SocialMediaCreator · Inhalte bleiben auf deinem Gerät</span>
      <nav aria-label="Fußnavigation">
        <a href="/hilfe">Hilfe</a>
        <a href="/ueber">Über das Projekt</a>
        <a href="/verifizieren">Bild verifizieren</a>
        <a href="/datenschutz">Datenschutz</a>
        <a href="/impressum">Impressum</a>
        <a
          href="https://github.com/ChristianHaake/SocialMediaCreator"
          rel="noreferrer"
          target="_blank"
        >
          GitHub
        </a>
      </nav>
    </footer>
  );
}
