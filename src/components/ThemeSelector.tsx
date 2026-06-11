import type { Theme } from "../types";

type ThemeSelectorProps = {
  value: Theme;
  onChange: (theme: Theme) => void;
};

export function ThemeSelector({ value, onChange }: ThemeSelectorProps) {
  return (
    <fieldset className="segmented-field">
      <legend className="field-label">Farbschema</legend>
      <div className="segmented-control segmented-control--three">
        {[
          ["light", "Light"],
          ["dim", "Dim"],
          ["dark", "Dark"],
        ].map(([theme, label]) => (
          <label key={theme}>
            <input
              checked={value === theme}
              name="preview-theme"
              onChange={() => onChange(theme as Theme)}
              type="radio"
            />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
