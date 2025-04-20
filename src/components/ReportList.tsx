
import { format } from "date-fns";
import { Clock, Link, MapPin, Mail, Calendar, Download } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GeneratedReport } from "./ReportForm";

interface ReportListProps {
  reports: GeneratedReport[];
}

// Helper to convert Google Drive shared url to direct download url
function getGoogleDriveDownloadUrl(url: string): string | null {
  try {
    const gdriveRegex = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)\/?/;
    const match = url.match(gdriveRegex);
    if (match && match[1]) {
      const fileId = match[1];
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
    return null;
  } catch {
    return null;
  }
}

export function ReportList({ reports }: ReportListProps) {
  if (reports.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No reports generated yet. Use the form to create a security report.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Generated Reports</h2>
      
      <div className="grid gap-4">
        {reports.map((report) => {
          const directDownloadUrl = getGoogleDriveDownloadUrl(report.reportUrl);

          return (
            <Card key={report.id} className="bg-card shadow-sm border border-border/40 overflow-hidden">
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <Badge className="bg-security-600 text-white">Report Generated</Badge>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" /> 
                    {format(report.generatedAt, "h:mm a 'on' MMMM d, yyyy")}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-2 pb-4 px-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Link className="h-4 w-4 text-primary flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Report Link</div>
                      <a 
                        href={report.reportUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-sm text-primary hover:underline break-all"
                      >
                        {report.reportUrl.split('/').pop()}
                      </a>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="flex items-center gap-1"
                    >
                      <a
                        href={directDownloadUrl || report.reportUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        aria-label={`Download report ${report.reportUrl.split('/').pop()}`}
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </a>
                    </Button>
                  </div>
                  
                  <Separator className="my-1" />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-muted-foreground">Location</div>
                        <div className="text-sm">{report.location}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-muted-foreground">Date Requested</div>
                        <div className="text-sm">{format(report.date, "MMM d, yyyy")}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                      <div>
                        <div className="text-xs text-muted-foreground">Email</div>
                        <div className="text-sm break-all">{report.email}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

