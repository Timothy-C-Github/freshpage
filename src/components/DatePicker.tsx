
import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { SelectRangeEventHandler, DateRange } from "react-day-picker";
import { isDateRange } from "@/utils/dateUtils";

export type DateSelection = Date | { from: Date; to: Date } | undefined;

interface DatePickerProps {
  date: DateSelection;
  setDate: React.Dispatch<React.SetStateAction<DateSelection>>;
}

function getDateRangeForCalendar(date: DateSelection): DateRange | undefined {
  if (!date) return undefined;
  if (isDateRange(date)) return { from: date.from, to: date.to };
  return { from: date, to: date };
}

function getDateLabel(date: DateSelection) {
  if (!date) return <span>Select date</span>;

  if (isDateRange(date)) {
    if (date.from && date.to) {
      const fromFormatted = format(date.from, "PPP");
      const toFormatted = format(date.to, "PPP");
      if (date.from.getTime() === date.to.getTime()) {
        return fromFormatted;
      }
      return `${fromFormatted} - ${toFormatted}`;
    }
    return <span>Select date range</span>;
  }
  return format(date, "PPP");
}

export function DatePicker({ date, setDate }: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelect: SelectRangeEventHandler = (range) => {
    if (!range || !range.from || !range.to) {
      setDate(undefined);
    } else {
      setDate({ from: range.from, to: range.to });
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="date">Date Requested</Label>
      <Popover open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal bg-secondary/50",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {getDateLabel(date)}
          </Button>
        </PopoverTrigger>
        <PopoverContent forceMount className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={getDateRangeForCalendar(date)}
            onSelect={handleSelect}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

