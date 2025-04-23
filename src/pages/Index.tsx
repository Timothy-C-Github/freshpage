
import { useState } from "react";
import { ReportForm, GeneratedReport } from "@/components/ReportForm";
import { ReportList } from "@/components/ReportList";
import { Separator } from "@/components/ui/separator";

const Index = () => {
  const [reports, setReports] = useState<GeneratedReport[]>([]);

  const handleReportGenerated = (newReport: GeneratedReport) => {
    setReports((prevReports) => [newReport, ...prevReports]);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header with logo */}
      <header className="border-b border-border/40 p-4">
        <div className="container mx-auto flex items-center">
          <img 
            src="https://guk.co.uk/wp-content/uploads/2024/03/GUK-grouplogo.png" 
            alt="GUK Group Logo" 
            className="h-12"
          />
          <div className="ml-auto text-sm font-medium">Security Report System</div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="container mx-auto py-8 px-4">
        <div className="grid gap-8 md:grid-cols-[350px_1fr] lg:grid-cols-[400px_1fr]">
          {/* Form column */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Generate Security Report</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Fill in the details to create a security assessment report
              </p>
            </div>
            
            <div className="bg-card rounded-lg border border-border/40 p-6">
              <ReportForm onReportGenerated={handleReportGenerated} />
            </div>
          </div>
          
          {/* Reports column */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">Report Dashboard</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                View all generated security reports
              </p>
            </div>
            
            <div className="bg-card rounded-lg border border-border/40 p-6 min-h-[400px]">
              <ReportList reports={reports} />
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-border/40 mt-auto py-4">
        <div className="container mx-auto text-center text-xs text-muted-foreground">
          Guarding UK - Sentinel Report System &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
};

export default Index;

