import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Filter } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";

interface Document {
  id: number;
  content: string;
  metadata?: any;
}

export const DocumentsViewer = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    location: "",
    type: "",
    source: "",
    content: "",
    dateFrom: "",
    dateTo: ""
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select('id, content, metadata')
        .order('id', { ascending: false })
        .limit(20);

      if (error) throw error;
      const sortedData = (data || []).sort((a, b) => {
        const dateA = extractDateFromContent(a.content);
        const dateB = extractDateFromContent(b.content);
        if (!dateA && !dateB) return b.id - a.id; // fallback to ID desc
        if (!dateA) return 1;
        if (!dateB) return -1;
        return new Date(dateB).getTime() - new Date(dateA).getTime(); // latest first
      });
      setDocuments(sortedData);
      setFilteredDocuments(sortedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const extractDateFromContent = (content: string): string | null => {
    if (!content) return null;
    
    // Match the exact format: dateOfReport:"YYYY-MM-DD"
    const dateMatch = content.match(/dateOfReport:"(\d{4}-\d{2}-\d{2})"/);
    console.log('Searching for dateOfReport:"YYYY-MM-DD" in:', content.substring(0, 200));
    console.log('Date match result:', dateMatch);
    
    return dateMatch ? dateMatch[1] : null;
  };

  useEffect(() => {
    let filtered = documents;

    if (filters.location) {
      filtered = filtered.filter(doc => 
        doc.metadata?.location?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }
    if (filters.type) {
      filtered = filtered.filter(doc => 
        doc.metadata?.type?.toLowerCase().includes(filters.type.toLowerCase())
      );
    }
    if (filters.source) {
      filtered = filtered.filter(doc => 
        doc.metadata?.source?.toLowerCase().includes(filters.source.toLowerCase())
      );
    }
    if (filters.content) {
      filtered = filtered.filter(doc => 
        doc.content?.toLowerCase().includes(filters.content.toLowerCase())
      );
    }
    if (filters.dateFrom) {
      filtered = filtered.filter(doc => {
        const docDate = extractDateFromContent(doc.content);
        return docDate && docDate >= filters.dateFrom;
      });
    }
    if (filters.dateTo) {
      filtered = filtered.filter(doc => {
        const docDate = extractDateFromContent(doc.content);
        return docDate && docDate <= filters.dateTo;
      });
    }

    setFilteredDocuments(filtered);
  }, [documents, filters]);

  const exportToCSV = () => {
    const csvContent = [
      ["ID", "Content", "Location", "Date", "Time", "Type", "Source"],
      ...filteredDocuments.map(doc => {
        const metadata = doc.metadata || {};
        const extractedDate = extractDateFromContent(doc.content);
        return [
          doc.id,
          `"${(doc.content || '').replace(/"/g, '""')}"`,
          metadata.location || '',
          extractedDate || '',
          '', // time column (empty for extracted dates)
          metadata.type || '',
          metadata.source || ''
        ];
      })
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `documents-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const parseDateTime = (dateString: string) => {
    if (!dateString) return { date: '', time: '' };
    
    try {
      const date = parseISO(dateString);
      if (isValid(date)) {
        return {
          date: format(date, 'yyyy-MM-dd'),
          time: format(date, 'HH:mm:ss')
        };
      }
    } catch (e) {
      // If parsing fails, try to extract date/time manually
    }
    
    // Fallback: just return the original string split if it looks like a date
    if (dateString.includes('T') || dateString.includes(' ')) {
      const parts = dateString.split(/[T ]/);
      return {
        date: parts[0] || '',
        time: parts[1]?.split('.')[0] || ''
      };
    }
    
    return { date: dateString, time: '' };
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const clearFilters = () => {
    setFilters({
      location: "",
      type: "",
      source: "",
      content: "",
      dateFrom: "",
      dateTo: ""
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>Loading documents...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>Error loading documents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-destructive">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Recent Documents</CardTitle>
            <CardDescription>
              {filteredDocuments.length} of {documents.length} entries shown
            </CardDescription>
          </div>
          <Button onClick={exportToCSV} size="sm" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Filter className="h-4 w-4" />
              Filters:
            </div>
            <Input
              placeholder="Filter by content..."
              value={filters.content}
              onChange={(e) => setFilters(prev => ({ ...prev, content: e.target.value }))}
              className="w-48"
            />
            <Input
              placeholder="Filter by location..."
              value={filters.location}
              onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
              className="w-48"
            />
            <Input
              placeholder="Filter by type..."
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="w-48"
            />
            <Input
              placeholder="Filter by source..."
              value={filters.source}
              onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))}
              className="w-48"
            />
            <div className="flex items-center gap-2">
              <span className="text-sm">Date range:</span>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                className="w-40"
              />
              <span className="text-sm">to</span>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="w-40"
              />
            </div>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear All
            </Button>
          </div>

          {filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {documents.length === 0 ? "No documents found" : "No documents match your filters"}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead className="max-w-md">Content</TableHead>
                    <TableHead className="w-32">Location</TableHead>
                    <TableHead className="w-24">Date</TableHead>
                    <TableHead className="w-24">Time</TableHead>
                    <TableHead className="w-24">Type</TableHead>
                    <TableHead className="w-32">Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc) => {
                    const metadata = doc.metadata || {};
                    const extractedDate = extractDateFromContent(doc.content);
                    console.log(`Document ${doc.id} content preview:`, doc.content?.substring(0, 100));
                    console.log(`Extracted date for document ${doc.id}:`, extractedDate);
                    
                    return (
                      <TableRow key={doc.id}>
                        <TableCell className="font-mono text-sm">
                          {doc.id}
                        </TableCell>
                        <TableCell className="max-w-md">
                          <p className="text-sm">
                            {truncateContent(doc.content || 'No content')}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {metadata.location || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {extractedDate || '-'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          -
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {metadata.type || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {metadata.source || '-'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};