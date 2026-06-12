import type { Theme } from "../types";
import { useTranslation } from "../i18n";

type ThemeSelectorProps = {
  value: Theme;
  onChange: (theme: Theme) => void;
};

export function ThemeSelector({ value, onChange }: ThemeSelectorProps) {
  const { t } = useTranslation();
  return (
    <fieldset className="segmented-field">
      <legend className="field-label">{t("common.theme")}</legend>
      <div className="segmented-control segmented-control--three">
        {[
          ["light", t("common.light")],
          ["dim", t("common.dim")],
          ["dark", t("common.dark")],
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
