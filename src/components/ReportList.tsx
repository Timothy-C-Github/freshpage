
import { format } from "date-fns";
import { Clock, Link, MapPin, Mail, Calendar, Download } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GeneratedReport } from "./ReportForm";

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

// Helper to convert Google Docs document "edit" url into PDF export url
function getGoogleDocsPdfExportUrl(url: string): string | null {
  try {
    const docsRegex = /https:\/\/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)\/edit/;
    const match = url.match(docsRegex);
    if (match && match[1]) {
      const fileId = match[1];
      return `https://docs.google.com/document/d/${fileId}/export?format=pdf`;
    }
    return null;
  } catch {
    return null;
  }
}

// Function to programmatically download file from URL with fetch and a blob link
async function downloadFile(url: string, filename: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error("Download failed:", error);
    alert("Download failed. Please try again.");
  }
}

// Helper to parse string or Date to valid Date object or null
function parseReportDate(date: Date | string | unknown): Date | null {
  if (date instanceof Date && !isNaN(date.getTime())) {
    return date;
  }
  if (typeof date === "string") {
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
    // Remove ordinal suffixes if any and parse again
    const cleaned = date.replace(/(\d+)(st|nd|rd|th)/, "$1");
    const reparsed = new Date(cleaned);
    if (!isNaN(reparsed.getTime())) {
      return reparsed;
    }
  }
  return null;
}

interface ReportListProps {
  reports: GeneratedReport[];
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
          // We expect report.date to be a Date or possibly a string, never a range now
          let displayDate: React.ReactNode = <span className="text-red-500">Invalid date</span>;

          const validDate = parseReportDate(report.date);
          if (validDate) {
            displayDate = format(validDate, "MMM d, yyyy");
          }

          const directDownloadUrl = getGoogleDriveDownloadUrl(report.reportUrl);
          const docsPdfUrl = getGoogleDocsPdfExportUrl(report.reportUrl);

          const safeLocation = report.location.replace(/[^a-zA-Z0-9-_]/g, "_");
          const formattedDate = validDate ? format(validDate, "yyyy-MM-dd") : "unknown-date";
          const fileName = `security-report-${formattedDate}-${safeLocation}.pdf`;

          const downloadUrl = docsPdfUrl || directDownloadUrl || report.reportUrl;

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
                      className="flex items-center gap-1"
                      onClick={(e) => {
                        e.preventDefault();
                        downloadFile(downloadUrl, fileName);
                      }}
                      aria-label={`Download report for ${safeLocation} on ${formattedDate}`}
                    >
                      <Download className="h-4 w-4" />
                      Download
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
                        <div className="text-sm">{displayDate}</div>
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
