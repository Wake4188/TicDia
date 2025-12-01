import { useState } from "react";
import { FileDown, FileAudio, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { exportToPDF, exportToAudio, exportToText } from "@/services/exportService";
import { useToast } from "@/components/ui/use-toast";

import { useAuth } from "@/contexts/AuthContext";

interface ExportMenuProps {
    article: {
        id: string;
        title: string;
        content: string;
        image?: string;
        url?: string;
    };
}

export const ExportMenu = ({ article }: ExportMenuProps) => {
    const [isExporting, setIsExporting] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();

    const handleExport = async (type: 'pdf' | 'audio' | 'text') => {
        if (!user) {
            toast({
                title: "Login Required",
                description: "You must be logged in to download articles.",
                variant: "destructive",
            });
            return;
        }

        setIsExporting(true);
        try {
            switch (type) {
                case 'pdf':
                    await exportToPDF(article);
                    toast({
                        title: "PDF Exported",
                        description: "Your article has been saved as PDF",
                    });
                    break;
                case 'audio':
                    await exportToAudio(article);
                    toast({
                        title: "Audio Exported",
                        description: "Your article audio has been downloaded",
                    });
                    break;
                case 'text':
                    exportToText(article);
                    toast({
                        title: "Text Exported",
                        description: "Your article has been saved as text file",
                    });
                    break;
            }
        } catch (error) {
            toast({
                title: "Export Failed",
                description: error instanceof Error ? error.message : "Failed to export article",
                variant: "destructive",
            });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    disabled={isExporting}
                    className="h-8 w-8 p-0 bg-black/30 backdrop-blur-sm hover:bg-black/50 text-white border border-white/20"
                    aria-label="Export article"
                >
                    {isExporting ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                        <Download className="h-4 w-4" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                    onClick={() => handleExport('pdf')}
                    disabled={isExporting}
                    className="cursor-pointer"
                >
                    <FileDown className="mr-2 h-4 w-4" />
                    Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => handleExport('audio')}
                    disabled={isExporting}
                    className="cursor-pointer"
                >
                    <FileAudio className="mr-2 h-4 w-4" />
                    Export as Audio
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={() => handleExport('text')}
                    disabled={isExporting}
                    className="cursor-pointer"
                >
                    <FileText className="mr-2 h-4 w-4" />
                    Export as Text
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
