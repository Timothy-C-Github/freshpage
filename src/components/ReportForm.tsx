
import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import type { SelectRangeEventHandler, DateRange } from "react-day-picker";

export interface FormData {
  location: string;
  date: Date | { from: Date; to: Date };
  email: string;
}

export interface GeneratedReport extends FormData {
  id: string;
  reportUrl: string;
  generatedAt: Date;
}

interface ReportFormProps {
  onReportGenerated: (report: GeneratedReport) => void;
}

type DateSelection = Date | { from: Date; to: Date } | undefined;

function isDateRange(selection: DateSelection): selection is { from: Date; to: Date } {
  return (
    typeof selection === "object" &&
    selection !== null &&
    "from" in selection &&
    "to" in selection &&
    selection.from instanceof Date && 
    selection.to instanceof Date
  );
}

export function ReportForm({ onReportGenerated }: ReportFormProps) {
  const [location, setLocation] = useState("");
  const [date, setDate] = useState<DateSelection>(undefined);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { toast } = useToast();

  const formatDateForWebhook = (date: Date) => format(date, "yyyy-MM-dd");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!location || !date || !email) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      const webhookUrl =
        "https://n8ern8ern8ern8er.app.n8n.cloud/webhook/64ae32ba-582c-4921-8452-5e0d81256d00";

      // Prepare date parameters: if range, send both from and to, else send single date
      let dateQuery = "";
      if (isDateRange(date)) {
        if (!date.from || !date.to) {
          throw new Error("Please select a valid date range.");
        }
        dateQuery = `&dateFrom=${encodeURIComponent(
          formatDateForWebhook(date.from)
        )}&dateTo=${encodeURIComponent(formatDateForWebhook(date.to))}`;
      } else {
        dateQuery = `&date=${encodeURIComponent(formatDateForWebhook(date))}`;
      }

      const response = await fetch(
        `${webhookUrl}?location=${encodeURIComponent(location)}${dateQuery}&email=${encodeURIComponent(email)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const responseData = await response.json();

      // Check required fields including new dateFrom/dateTo support
      const hasDateRange =
        typeof responseData.dateFrom === "string" && typeof responseData.dateTo === "string";

      if (
        !responseData.location ||
        !responseData.email ||
        !responseData.urlOfSecurityReport ||
        (!responseData.date && !hasDateRange)
      ) {
        throw new Error("Incomplete data received from webhook");
      }

      // Construct date property based on presence of date range or single date
      let reportDate: Date | { from: Date; to: Date };

      if (hasDateRange) {
        reportDate = {
          from: new Date(responseData.dateFrom),
          to: new Date(responseData.dateTo),
        };
      } else {
        reportDate = new Date(responseData.date);
      }

      const newReport: GeneratedReport = {
        id: Date.now().toString(),
        location: responseData.location,
        date: reportDate,
        email: responseData.email,
        reportUrl: responseData.urlOfSecurityReport,
        generatedAt: new Date(),
      };

      onReportGenerated(newReport);

      setLocation("");
      setDate(undefined);
      setEmail("");

      toast({
        title: "Success",
        description: "Your security report has been generated.",
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description:
          "Failed to generate report. Please try again or contact support if the issue persists.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Render date or range labels nicely
  const getDateLabel = () => {
    if (!date) return <span>Select date</span>;

    if (isDateRange(date)) {
      if (date.from && date.to) {
        const fromFormatted = format(date.from, "PPP");
        const toFormatted = format(date.to, "PPP");
        if (date.from.getTime() === date.to.getTime()) {
          return fromFormatted; // same day range treated as single day
        }
        return `${fromFormatted} - ${toFormatted}`;
      }
      return <span>Select date range</span>;
    }
    return format(date, "PPP");
  };

  // Fix types for react-day-picker's onSelect for range mode
  const handleDateSelect: SelectRangeEventHandler = (range) => {
    if (!range || !range.from || !range.to) {
      setDate(undefined);
    } else {
      setDate({ from: range.from, to: range.to });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          placeholder="Enter location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="bg-secondary/50"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Date Requested</Label>
        <Popover>
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
              {getDateLabel()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={date}
              onSelect={handleDateSelect}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="client@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-secondary/50"
        />
      </div>

      <Button type="submit" className="w-full font-semibold" disabled={isLoading}>
        {isLoading ? "Generating Report..." : "Generate Report"}
      </Button>
    </form>
  );
}
