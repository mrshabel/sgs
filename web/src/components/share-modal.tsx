import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Copy, Share, Clock, LinkIcon } from "lucide-react";
import { toast } from "sonner";

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    fileName: string;
    fileId: string;
}

export function ShareModal({
    isOpen,
    onClose,
    fileName,
    fileId,
}: ShareModalProps) {
    const [duration, setDuration] = useState("1h");
    const [shareUrl, setShareUrl] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    const generateShareUrl = async () => {
        setIsGenerating(true);
        try {
            // Simulate API call with realistic delay
            await new Promise((resolve) => setTimeout(resolve, 1500));

            // Generate a realistic-looking share URL
            const expirationTime = Date.now() + getDurationInMs(duration);
            const mockToken = Math.random().toString(36).substring(2, 15);
            const mockUrl = `https://sgs.example.com/share/${fileId}?expires=${expirationTime}&token=${mockToken}`;

            setShareUrl(mockUrl);
            toast.success("Secure share link generated");
        } catch (error) {
            toast.error("Failed to generate link", {
                description: "Please try again",
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const getDurationInMs = (duration: string) => {
        const durations: Record<string, number> = {
            "15m": 15 * 60 * 1000,
            "1h": 60 * 60 * 1000,
            "24h": 24 * 60 * 60 * 1000,
            "7d": 7 * 24 * 60 * 60 * 1000,
            "30d": 30 * 24 * 60 * 60 * 1000,
        };
        return durations[duration] || 60 * 60 * 1000;
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareUrl);
        toast("Copied to clipboard", {
            description: "Share link has been copied to your clipboard.",
        });
    };

    const getDurationLabel = (value: string) => {
        const durations: Record<string, string> = {
            "15m": "15 minutes",
            "1h": "1 hour",
            "24h": "24 hours",
            "7d": "7 days",
            "30d": "30 days",
        };
        return durations[value] || value;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                        <Share className="h-5 w-5" />
                        <span>Share File</span>
                    </DialogTitle>
                    <DialogDescription>
                        Create a secure, time-limited link to share{" "}
                        <strong>{fileName}</strong>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="duration">Link expires in</Label>
                        <Select value={duration} onValueChange={setDuration}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="15m">15 minutes</SelectItem>
                                <SelectItem value="1h">1 hour</SelectItem>
                                <SelectItem value="24h">24 hours</SelectItem>
                                <SelectItem value="7d">7 days</SelectItem>
                                <SelectItem value="30d">30 days</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {!shareUrl ? (
                        <Button
                            onClick={generateShareUrl}
                            disabled={isGenerating}
                            className="w-full"
                        >
                            {isGenerating ? (
                                <>
                                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <LinkIcon className="h-4 w-4 mr-2" />
                                    Generate Share Link
                                </>
                            )}
                        </Button>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>Share Link</Label>
                                <Badge variant="outline" className="text-xs">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Expires in {getDurationLabel(duration)}
                                </Badge>
                            </div>
                            <div className="flex space-x-2">
                                <Input
                                    value={shareUrl}
                                    readOnly
                                    className="font-mono text-xs"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={copyToClipboard}
                                    className="flex-shrink-0"
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                This link will automatically expire after{" "}
                                {getDurationLabel(duration)} and cannot be
                                accessed afterwards.
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
