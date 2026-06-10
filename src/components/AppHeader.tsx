import { Check, GraduationCap, Image as ImageIcon } from "lucide-react";

type AppHeaderProps = {
  onOpenTeacherInfo: () => void;
};

export function AppHeader({ onOpenTeacherInfo }: AppHeaderProps) {
  return (
    <header className="app-header">
      <a className="brand" href="/">
        <span className="brand__mark">
          <ImageIcon aria-hidden="true" size={21} />
        </span>
        <span>
          <strong>Mockup Studio</strong>
          <small>Werkstatt für digitale Formate</small>
        </span>
      </a>
      <div className="header-meta">
        <span className="privacy-badge">
          <Check aria-hidden="true" size={15} />
          Inhalte bleiben lokal
        </span>
        <button
          className="text-button"
          onClick={onOpenTeacherInfo}
          type="button"
        >
          <GraduationCap aria-hidden="true" size={18} />
          Für Lehrkräfte
        </button>
      </div>
    </header>
  );
}
