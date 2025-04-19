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

export interface FormData {
  location: string;
  date: Date;
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
  const [date, setDate] = useState<Date | undefined>(undefined);
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
      
      // The webhook URL
      const webhookUrl = "https://n8ern8ern8ern8er.app.n8n.cloud/webhook/64ae32ba-582c-4921-8452-5e0d81256d00";
      
      // Format date for the request
      const formattedDate = format(date, "yyyy-MM-dd");
      
      // Make GET request to the webhook and wait for response
      const response = await fetch(`${webhookUrl}?location=${encodeURIComponent(location)}&date=${formattedDate}&email=${encodeURIComponent(email)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      // Parse the response data
      const responseData = await response.json();
      
      // Verify that we have all required fields from the webhook response
      if (!responseData.location || !responseData.date || !responseData.email || !responseData.urlOfSecurityReport) {
        throw new Error('Incomplete data received from webhook');
      }

      // Create report object using the webhook response data
      const newReport: GeneratedReport = {
        id: Date.now().toString(),
        location: responseData.location,
        date: new Date(responseData.date),
        email: responseData.email,
        reportUrl: responseData.urlOfSecurityReport,
        generatedAt: new Date(),
      };
      
      // Pass the new report up to the parent component
      onReportGenerated(newReport);
      
      // Reset form
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
        description: "Failed to generate report. Please try again or contact support if the issue persists.",
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
              {date ? format(date, "PPP") : <span>Select date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
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
      
      <Button 
        type="submit" 
        className="w-full font-semibold"
        disabled={isLoading}
      >
        {isLoading ? "Generating Report..." : "Generate Report"}
      </Button>
    </form>
  );
}
