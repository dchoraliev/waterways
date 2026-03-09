import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DayPicker, type DateRange } from 'react-day-picker';
import { CalendarDays } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from './ui/utils';
import 'react-day-picker/dist/style.css';

interface DateRangeFilterProps {
  dateFrom: string;
  dateTo: string;
  onChange: (next: { dateFrom: string; dateTo: string }) => void;
  className?: string;
}

interface DateRangePreset {
  label: string;
  getRange: () => DateRange;
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function fromDateKey(value: string): Date | undefined {
  if (!value) {
    return undefined;
  }

  const [year, month, day] = value.split('-').map((part) => Number.parseInt(part, 10));
  if (!year || !month || !day) {
    return undefined;
  }

  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatRangeLabel(range: DateRange): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  if (!range.from && !range.to) {
    return 'All dates';
  }

  if (range.from && !range.to) {
    return formatter.format(range.from);
  }

  if (range.from && range.to) {
    if (toDateKey(range.from) === toDateKey(range.to)) {
      return formatter.format(range.from);
    }

    return `${formatter.format(range.from)} - ${formatter.format(range.to)}`;
  }

  return 'All dates';
}

function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0=Sun, 1=Mon
  const diff = day === 0 ? -6 : 1 - day; // rewind to Monday
  d.setDate(d.getDate() + diff);
  return d;
}

function getDefaultPresets(): DateRangePreset[] {
  const today = new Date();
  const currentDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const firstDayOfThisMonth = startOfMonth(currentDay);
  const firstDayOfThisWeek = startOfWeek(currentDay);
  const firstDayOfThisYear = new Date(currentDay.getFullYear(), 0, 1);

  return [
    {
      label: 'Last 7 days',
      getRange: () => ({ from: addDays(currentDay, -6), to: currentDay }),
    },
    {
      label: 'Last 30 days',
      getRange: () => ({ from: addDays(currentDay, -29), to: currentDay }),
    },
    {
      label: 'This week',
      getRange: () => ({ from: firstDayOfThisWeek, to: currentDay }),
    },
    {
      label: 'This month',
      getRange: () => ({ from: firstDayOfThisMonth, to: currentDay }),
    },
    {
      label: 'Last 365 days',
      getRange: () => ({ from: addDays(currentDay, -364), to: currentDay }),
    },
    {
      label: 'Year to date',
      getRange: () => ({ from: firstDayOfThisYear, to: currentDay }),
    },
  ];
}

export function DateRangeFilter({ dateFrom, dateTo, onChange, className }: DateRangeFilterProps) {
  const triggerRef = useRef<globalThis.HTMLButtonElement | null>(null);
  const popoverRef = useRef<globalThis.HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<globalThis.React.CSSProperties>({});
  const [draftRange, setDraftRange] = useState<DateRange>({
    from: fromDateKey(dateFrom),
    to: fromDateKey(dateTo),
  });

  const presets = useMemo(() => getDefaultPresets(), []);

  const appliedRange = useMemo<DateRange>(
    () => ({ from: fromDateKey(dateFrom), to: fromDateKey(dateTo) }),
    [dateFrom, dateTo]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: globalThis.MouseEvent) => {
      const target = event.target as globalThis.Node;
      if (!triggerRef.current?.contains(target) && !popoverRef.current?.contains(target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handlePresetClick = (preset: DateRangePreset) => {
    setDraftRange(preset.getRange());
  };

  const handleClear = () => {
    setDraftRange({ from: undefined, to: undefined });
  };

  const handleApply = () => {
    const nextFrom = draftRange.from ? toDateKey(draftRange.from) : '';
    const normalizedTo = draftRange.to ?? draftRange.from;
    const nextTo = normalizedTo ? toDateKey(normalizedTo) : '';

    onChange({ dateFrom: nextFrom, dateTo: nextTo });
    setOpen(false);
  };

  const handleToggle = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPopoverStyle({
        position: 'fixed',
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2,
        transform: 'translateX(-50%)',
        zIndex: 9999,
        width: '760px',
        maxWidth: 'calc(100vw - 2rem)',
      });
    }
    setDraftRange(appliedRange);
    setOpen((prev) => !prev);
  };

  return (
    <>
      <Button
        ref={triggerRef}
        variant="outline"
        size="sm"
        className={cn('w-[240px] justify-between bg-background', className)}
        onClick={handleToggle}
      >
        <span className="truncate">{formatRangeLabel(appliedRange)}</span>
        <CalendarDays className="size-4 ml-2 shrink-0" />
      </Button>

      {open &&
        createPortal(
          <div
            ref={popoverRef}
            style={popoverStyle}
            className="rounded-lg border bg-background p-4 shadow-lg"
          >
            <div className="mb-3">
              <h3 className="text-sm font-semibold">Date range</h3>
              <p className="text-xs text-muted-foreground">
                Select a custom range or choose a preset.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
              {presets.map((preset) => (
                <Button
                  key={preset.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetClick(preset)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            <div className="rounded-md border p-3 overflow-auto mb-3">
              <DayPicker
                mode="range"
                selected={draftRange}
                onSelect={(range) => setDraftRange(range ?? { from: undefined, to: undefined })}
                numberOfMonths={2}
                captionLayout="dropdown"
                startMonth={new Date(2020, 0)}
                endMonth={new Date(new Date().getFullYear(), 11)}
                reverseYears
                navLayout="around"
                className="mx-auto"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={handleClear}>
                Clear
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleApply}>
                Apply
              </Button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
