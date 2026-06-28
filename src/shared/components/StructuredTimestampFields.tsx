import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "../../i18n";

type StructuredTimestampFieldsProps = {
  date: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  time: string;
};

function isValidDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [, yearValue, monthValue, dayValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function isValidOptionalTime(value: string) {
  return value === "" || /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function StructuredTimestampFields({
  date,
  onDateChange,
  onTimeChange,
  time,
}: StructuredTimestampFieldsProps) {
  const { t } = useTranslation();
  const id = useId();
  const [dateDraft, setDateDraft] = useState(date);
  const [timeDraft, setTimeDraft] = useState(time);
  const syncedDate = useRef(date);
  const syncedTime = useRef(time);
  const dateInvalid = !isValidDate(dateDraft);
  const timeInvalid = !isValidOptionalTime(timeDraft);

  useEffect(() => {
    if (date === syncedDate.current) return;
    syncedDate.current = date;
    setDateDraft(date);
  }, [date]);

  useEffect(() => {
    if (time === syncedTime.current) return;
    syncedTime.current = time;
    setTimeDraft(time);
  }, [time]);

  function updateDateDraft(next: string) {
    setDateDraft(next);
    if (!isValidDate(next)) return;
    syncedDate.current = next;
    onDateChange(next);
  }

  function updateTimeDraft(next: string) {
    setTimeDraft(next);
    if (!isValidOptionalTime(next)) return;
    syncedTime.current = next;
    onTimeChange(next);
  }

  return (
    <div className="field-row">
      <div className="field">
        <label className="field-label" htmlFor={`${id}-date`}>
          {t("common.date")}
        </label>
        <input
          aria-describedby={`${id}-date-hint`}
          aria-invalid={dateInvalid}
          autoComplete="off"
          id={`${id}-date`}
          onChange={(event) => updateDateDraft(event.target.value)}
          pattern="\d{4}-\d{2}-\d{2}"
          placeholder="YYYY-MM-DD"
          required
          type="text"
          value={dateDraft}
        />
        <span
          className={
            dateInvalid ? "field-hint field-hint--warning" : "field-hint"
          }
          id={`${id}-date-hint`}
        >
          {dateInvalid ? t("common.dateInvalid") : t("common.dateFormatHint")}
        </span>
      </div>
      <div className="field">
        <label className="field-label" htmlFor={`${id}-time`}>
          {t("common.timeOptional")}
        </label>
        <input
          aria-describedby={`${id}-time-hint`}
          aria-invalid={timeInvalid}
          autoComplete="off"
          id={`${id}-time`}
          onChange={(event) => updateTimeDraft(event.target.value)}
          pattern="([01]\d|2[0-3]):[0-5]\d"
          placeholder="HH:MM"
          type="text"
          value={timeDraft}
        />
        <span
          className={
            timeInvalid ? "field-hint field-hint--warning" : "field-hint"
          }
          id={`${id}-time-hint`}
        >
          {timeInvalid ? t("common.timeInvalid") : t("common.timeFormatHint")}
        </span>
      </div>
    </div>
  );
}
