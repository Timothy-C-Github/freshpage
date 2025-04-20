
import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import type { DateSelection } from "@/utils/dateUtils";
import { isDateRange } from "@/utils/dateUtils";
import { DatePicker } from "./DatePicker";

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

      let dateQuery = "";
      // Since we no longer expect dateFrom and dateTo, we always send date(s) flattened
      if (isDateRange(date)) {
        if (!date.from || !date.to) {
          throw new Error("Please select a valid date range.");
        }
        dateQuery = `&dateFrom=${encodeURIComponent(formatDateForWebhook(date.from))}&dateTo=${encodeURIComponent(formatDateForWebhook(date.to))}`;
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

      if (
        !responseData.location ||
        !responseData.email ||
        !responseData.urlOfSecurityReport
      ) {
        throw new Error("Incomplete data received from webhook");
      }

      // Use the date sent from the form as reportDate directly
      const reportDate: Date | { from: Date; to: Date } = date;

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

      <DatePicker date={date} setDate={setDate} />

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
