import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Upload, FileText } from "lucide-react";

export const CsvUploader = () => {
  const [file, setFile] = useState<File | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to upload",
        variant: "destructive",
      });
      return;
    }

    if (!webhookUrl) {
      toast({
        title: "No webhook URL",
        description: "Please enter a webhook URL to send the CSV data",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const csvText = await file.text();
      
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename: file.name,
          csvData: csvText,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook responded with status: ${response.status}`);
      }

      toast({
        title: "CSV uploaded successfully",
        description: "Your CSV data has been sent to the webhook",
      });

      setFile(null);
      setWebhookUrl("");
      
      // Reset file input
      const fileInput = document.getElementById('csv-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error("Error uploading CSV:", error);
      toast({
        title: "Upload failed",
        description: "Failed to send CSV data to webhook. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          CSV Upload
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhook-url">Webhook URL</Label>
            <Input
              id="webhook-url"
              type="url"
              placeholder="https://your-webhook-url.com"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="bg-secondary/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="csv-file">CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="bg-secondary/50"
            />
          </div>

          {file && (
            <div className="flex items-center gap-2 p-2 bg-secondary/30 rounded-md">
              <FileText className="h-4 w-4" />
              <span className="text-sm">{file.name}</span>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isUploading || !file || !webhookUrl}
          >
            {isUploading ? "Uploading..." : "Upload CSV"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};