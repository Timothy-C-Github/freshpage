
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

export interface FormData {
  location: string;
  date: "Today" | "Next 7 Days" | "Next 14 Days" | "Next 30 Days" | "";
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
  const [date, setDate] = useState<"Today" | "Next 7 Days" | "Next 14 Days" | "Next 30 Days" | "">("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { toast } = useToast();

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

      // Instead of dateFrom and dateTo, send the date option in query param
      // e.g. &dateOption=Today, Next 7 Days, etc.
      const dateQuery = `&dateOption=${encodeURIComponent(date)}`;

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

      const newReport: GeneratedReport = {
        id: Date.now().toString(),
        location: responseData.location,
        date: date,
        email: responseData.email,
        reportUrl: responseData.urlOfSecurityReport,
        generatedAt: new Date(),
      };

      onReportGenerated(newReport);

      setLocation("");
      setDate("");
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

      <div className="space-y-2">
        <Label htmlFor="date">Date Requested</Label>
        <select
          id="date"
          value={date}
          onChange={(e) =>
            setDate(e.target.value as
              | "Today"
              | "Next 7 Days"
              | "Next 14 Days"
              | "Next 30 Days"
              | "")
          }
          className={cn(
            "w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          )}
          required
        >
          <option value="" disabled>
            Select a date range
          </option>
          <option value="Today">Today</option>
          <option value="Next 7 Days">Next 7 Days</option>
          <option value="Next 14 Days">Next 14 Days</option>
          <option value="Next 30 Days">Next 30 Days</option>
        </select>
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
