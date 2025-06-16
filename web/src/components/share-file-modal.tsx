import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Share2,
    Copy,
    Clock,
    Shield,
    LinkIcon,
    Sparkles,
    CheckCircle,
    Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";

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
    const [isLoading, setIsLoading] = useState(false);
    const [duration, setDuration] = useState("1h");
    const [shareData, setShareData] = useState<{
        downloadUrl: string;
        expiresAt: string;
    } | null>(null);

    const getDurationInMs = (duration: string): number => {
        const durations: Record<string, number> = {
            "15m": 15 * 60 * 1000,
            "1h": 60 * 60 * 1000,
            "24h": 24 * 60 * 60 * 1000,
            "7d": 7 * 24 * 60 * 60 * 1000,
            "30d": 30 * 24 * 60 * 60 * 1000,
        };
        return durations[duration] || 60 * 60 * 1000;
    };

    const getDurationLabel = (value: string): string => {
        const labels: Record<string, string> = {
            "15m": "15 minutes",
            "1h": "1 hour",
            "24h": "24 hours",
            "7d": "7 days",
            "30d": "30 days",
        };
        return labels[value] || value;
    };

    const handleCreateShareLink = async () => {
        setIsLoading(true);
        try {
            // Calculate expiration date
            const expiresAt = new Date(
                Date.now() + getDurationInMs(duration)
            ).toISOString();

            // Call the real API endpoint
            const response = await apiClient.createShareLink(fileId, expiresAt);

            if (response.data) {
                setShareData({
                    downloadUrl: response.data.downloadUrl,
                    expiresAt: expiresAt,
                });
                toast.success("Share link created", {
                    description:
                        "Your secure share link has been generated successfully.",
                });
            }
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to create share link";
            toast.error("Failed to create share link", {
                description: errorMessage,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyLink = async () => {
        if (!shareData?.downloadUrl) return;

        try {
            await navigator.clipboard.writeText(shareData.downloadUrl);
            toast.success("Link copied", {
                description: "Share link has been copied to your clipboard.",
            });
        } catch (error) {
            toast.error("Failed to copy", {
                description: "Unable to copy link to clipboard.",
            });
        }
    };

    const handleClose = () => {
        setShareData(null);
        setDuration("1h");
        onClose();
    };

    const formatExpirationDate = (isoString: string): string => {
        return new Date(isoString).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md border-0 bg-background/95 backdrop-blur-xl shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg" />

                <DialogHeader className="relative">
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/70 rounded-lg blur-sm opacity-75" />
                            <div className="relative bg-gradient-to-r from-primary to-primary/70 p-2 rounded-lg">
                                <Share2 className="h-5 w-5 text-white" />
                            </div>
                        </div>
                        Share File
                    </DialogTitle>
                    <DialogDescription className="text-base">
                        Create a secure share link for{" "}
                        <span className="font-medium text-foreground">
                            {fileName}
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 relative">
                    {!shareData ? (
                        <>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="expiration"
                                        className="text-sm font-medium flex items-center gap-2"
                                    >
                                        <Clock className="h-4 w-4 text-primary" />
                                        Link Expiration
                                    </Label>
                                    <Select
                                        value={duration}
                                        onValueChange={setDuration}
                                    >
                                        <SelectTrigger className="bg-background/50 border-muted-foreground/20 hover:border-primary/50 transition-all h-12">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="15m">
                                                <div className="flex items-center justify-between w-full">
                                                    <span>15 minutes</span>
                                                    <span className="text-xs text-muted-foreground ml-4">
                                                        Quick access
                                                    </span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="1h">
                                                <div className="flex items-center justify-between w-full">
                                                    <span>1 hour</span>
                                                    <span className="text-xs text-muted-foreground ml-4">
                                                        Short term
                                                    </span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="24h">
                                                <div className="flex items-center justify-between w-full">
                                                    <span>24 hours</span>
                                                    <span className="text-xs text-muted-foreground ml-4">
                                                        Daily access
                                                    </span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="7d">
                                                <div className="flex items-center justify-between w-full">
                                                    <span>7 days</span>
                                                    <span className="text-xs text-muted-foreground ml-4">
                                                        Weekly access
                                                    </span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="30d">
                                                <div className="flex items-center justify-between w-full">
                                                    <span>30 days</span>
                                                    <span className="text-xs text-muted-foreground ml-4">
                                                        Monthly access
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">
                                        The link will automatically expire after
                                        the selected duration
                                    </p>
                                </div>

                                <Card className="border-0 bg-primary/5 backdrop-blur-sm">
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-3">
                                            <Shield className="h-5 w-5 text-primary mt-0.5" />
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium">
                                                    Security Notice
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    This link will provide
                                                    temporary access to your
                                                    file. Anyone with the link
                                                    can download the file until
                                                    it expires.
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <DialogFooter>
                                <Button
                                    onClick={handleCreateShareLink}
                                    disabled={isLoading}
                                    className="w-full h-12 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-r from-primary to-primary/90"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                            Creating Link...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="h-4 w-4 mr-2" />
                                            Generate Share Link
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </>
                    ) : (
                        <>
                            <Card className="border-0 bg-background/50 backdrop-blur-sm">
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                            <span className="font-medium text-green-700 dark:text-green-400">
                                                Link Created Successfully
                                            </span>
                                        </div>
                                        <Badge
                                            variant="secondary"
                                            className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                        >
                                            <LinkIcon className="h-3 w-3 mr-1" />
                                            Active
                                        </Badge>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">
                                                Share Link
                                            </Label>
                                            <div className="flex gap-2">
                                                <Input
                                                    value={
                                                        shareData.downloadUrl
                                                    }
                                                    readOnly
                                                    className="font-mono text-sm bg-muted/50 cursor-text"
                                                />
                                                <Button
                                                    onClick={handleCopyLink}
                                                    variant="outline"
                                                    size="sm"
                                                    className="hover:bg-primary/5 transition-all hover:scale-105 px-3"
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Calendar className="h-4 w-4" />
                                                <span>
                                                    Expires:{" "}
                                                    {formatExpirationDate(
                                                        shareData.expiresAt
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Clock className="h-4 w-4" />
                                                <span>
                                                    {getDurationLabel(duration)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-muted-foreground/10">
                                        <p className="text-xs text-muted-foreground">
                                            💡 <strong>Tip:</strong> Save this
                                            link now - it won't be shown again
                                            for security reasons.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <DialogFooter>
                                <Button
                                    onClick={handleClose}
                                    className="w-full h-12"
                                >
                                    Done
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
