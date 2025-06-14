import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
    Upload,
    X,
    FileText,
    ImageIcon,
    Video,
    Music,
    Archive,
    File,
    Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";

interface FileUploadProps {
    projectId: string;
    onUploadComplete?: () => void;
    className?: string;
}

interface UploadingFile {
    file: File;
    progress: number;
    status: "uploading" | "completed" | "error";
    id: string;
}

const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return ImageIcon;
    if (type.startsWith("video/")) return Video;
    if (type.startsWith("audio/")) return Music;
    if (type.includes("zip") || type.includes("rar") || type.includes("tar"))
        return Archive;
    if (type.includes("text") || type.includes("document")) return FileText;
    return File;
};

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
        Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
};

export function FileUpload({
    projectId,
    onUploadComplete,
    className,
}: FileUploadProps) {
    const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

    const onDrop = useCallback(
        async (acceptedFiles: File[]) => {
            const newUploadingFiles: UploadingFile[] = acceptedFiles.map(
                (file) => ({
                    file,
                    progress: 0,
                    status: "uploading" as const,
                    id: Math.random().toString(36).substr(2, 9),
                })
            );

            setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);

            // Upload files one by one with real API calls
            for (const uploadingFile of newUploadingFiles) {
                try {
                    await apiClient.uploadFile(
                        projectId,
                        uploadingFile.file,
                        (progress) => {
                            setUploadingFiles((prev) =>
                                prev.map((f) =>
                                    f.id === uploadingFile.id
                                        ? { ...f, progress }
                                        : f
                                )
                            );
                        }
                    );

                    setUploadingFiles((prev) =>
                        prev.map((f) =>
                            f.id === uploadingFile.id
                                ? { ...f, status: "completed", progress: 100 }
                                : f
                        )
                    );

                    toast.success("File uploaded successfully", {
                        description: `${uploadingFile.file.name} has been uploaded to your project.`,
                    });
                } catch (error) {
                    setUploadingFiles((prev) =>
                        prev.map((f) =>
                            f.id === uploadingFile.id
                                ? { ...f, status: "error" }
                                : f
                        )
                    );

                    const errorMessage =
                        error instanceof Error
                            ? error.message
                            : "Upload failed";
                    toast.error("Upload failed", {
                        description: `Failed to upload ${uploadingFile.file.name}. ${errorMessage}`,
                    });
                }
            }

            // Clean up completed uploads after a delay
            setTimeout(() => {
                setUploadingFiles((prev) =>
                    prev.filter((f) => f.status !== "completed")
                );
                onUploadComplete?.();
            }, 2000);
        },
        [projectId, onUploadComplete]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: (acceptedFiles) => onDrop(acceptedFiles),
        multiple: true,
        onDragEnter: () => {}, // Optional: Add custom logic if needed
        onDragLeave: () => {}, // Optional: Add custom logic if needed
        onDragOver: () => {}, // Optional: Add custom logic if needed
    });

    const removeFile = (id: string) => {
        setUploadingFiles((prev) => prev.filter((f) => f.id !== id));
    };

    return (
        <div className={cn("space-y-6", className)}>
            <Card
                {...getRootProps()}
                className={cn(
                    "relative overflow-hidden border-2 border-dashed transition-all duration-300 cursor-pointer group",
                    "hover:border-primary/50 hover:bg-primary/5 hover:shadow-lg hover:scale-[1.02]",
                    isDragActive
                        ? "border-primary bg-primary/10 shadow-xl scale-[1.02]"
                        : "border-muted-foreground/25"
                )}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <CardContent className="flex flex-col items-center justify-center py-16 text-center relative">
                    <input {...getInputProps()} type="file" />
                    <div
                        className={cn(
                            "rounded-full p-6 mb-6 transition-all duration-300 relative",
                            isDragActive
                                ? "bg-primary/20 scale-110"
                                : "bg-gradient-to-r from-primary/10 to-secondary/10 group-hover:scale-110"
                        )}
                    >
                        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-0 group-hover:opacity-75" />
                        <Upload
                            className={cn(
                                "h-10 w-10 transition-all duration-300 relative z-10",
                                isDragActive
                                    ? "text-primary animate-bounce"
                                    : "text-primary group-hover:text-primary"
                            )}
                        />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                        {isDragActive ? "Drop files here" : "Upload files"}
                    </h3>
                    <p className="text-muted-foreground text-lg mb-6 max-w-md">
                        {isDragActive
                            ? "Release to upload your files to this project"
                            : "Drag and drop files here, or click to browse and select files"}
                    </p>
                    <Button
                        variant="outline"
                        size="lg"
                        className="shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-background/50 backdrop-blur-sm"
                    >
                        <Sparkles className="h-5 w-5 mr-2" />
                        Browse Files
                    </Button>
                </CardContent>
            </Card>

            {uploadingFiles.length > 0 && (
                <div className="space-y-4">
                    <h4 className="text-lg font-semibold flex items-center gap-2">
                        <Upload className="h-5 w-5 text-primary" />
                        Uploading files
                    </h4>
                    {uploadingFiles.map((uploadingFile, index) => {
                        const Icon = getFileIcon(uploadingFile.file.type);
                        return (
                            <Card
                                key={uploadingFile.id}
                                className="border-0 bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-all duration-300"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-center space-x-4">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg blur-sm" />
                                            <div className="relative bg-gradient-to-r from-primary/10 to-secondary/10 p-2 rounded-lg">
                                                <Icon className="h-6 w-6 text-primary" />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-sm font-medium truncate">
                                                    {uploadingFile.file.name}
                                                </p>
                                                <div className="flex items-center space-x-2">
                                                    <Badge
                                                        variant={
                                                            uploadingFile.status ===
                                                            "completed"
                                                                ? "default"
                                                                : uploadingFile.status ===
                                                                  "error"
                                                                ? "destructive"
                                                                : "secondary"
                                                        }
                                                        className="shadow-sm"
                                                    >
                                                        {uploadingFile.status ===
                                                        "completed"
                                                            ? "Completed"
                                                            : uploadingFile.status ===
                                                              "error"
                                                            ? "Failed"
                                                            : "Uploading"}
                                                    </Badge>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            removeFile(
                                                                uploadingFile.id
                                                            )
                                                        }
                                                        className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive transition-all hover:scale-110"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                                                <span>
                                                    {formatFileSize(
                                                        uploadingFile.file.size
                                                    )}
                                                </span>
                                                <span className="font-medium">
                                                    {Math.round(
                                                        uploadingFile.progress
                                                    )}
                                                    %
                                                </span>
                                            </div>
                                            <Progress
                                                value={uploadingFile.progress}
                                                className="h-2 bg-muted/50"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
