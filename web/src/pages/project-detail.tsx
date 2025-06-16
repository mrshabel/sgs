import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    ArrowLeft,
    Download,
    FileText,
    MoreHorizontal,
    Share,
    Trash2,
    Upload,
    Database,
    Activity,
    Calendar,
    Eye,
    Sparkles,
    FolderOpen,
    CloudUpload,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ProtectedRoute } from "@/components/protected";
import { FileUpload } from "@/components/file-upload";
import { ShareModal } from "@/components/share-file-modal";
import { apiClient } from "@/lib/api";
import type { Project, AppFile } from "@/types/api";
import { toast } from "sonner";

export default function ProjectDetailPage() {
    const params = useParams();
    const projectId = params.id as string;

    const [project, setProject] = useState<Project | null>(null);
    const [files, setFiles] = useState<AppFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showUpload, setShowUpload] = useState(false);
    const [shareModal, setShareModal] = useState<{
        isOpen: boolean;
        file?: AppFile;
    }>({ isOpen: false });

    useEffect(() => {
        fetchProjectData();
    }, [projectId]);

    const fetchProjectData = async () => {
        try {
            setIsLoading(true);

            const [projectResponse, filesResponse] = await Promise.all([
                apiClient.getProject(projectId),
                apiClient.getProjectFiles(projectId),
            ]);

            if (projectResponse.data) {
                setProject(projectResponse.data);
            }

            if (filesResponse.data) {
                setFiles(filesResponse.data);
            }
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to load project";
            toast.error(errorMessage, {
                description: "Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return (
            Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) +
            " " +
            sizes[i]
        );
    };

    const getFileIcon = (contentType: string) => {
        if (contentType.startsWith("image/")) return "🖼️";
        if (contentType.startsWith("video/")) return "🎥";
        if (contentType.startsWith("audio/")) return "🎵";
        if (contentType.includes("pdf")) return "📄";
        if (contentType.includes("zip") || contentType.includes("rar"))
            return "📦";
        if (contentType.includes("text") || contentType.includes("document"))
            return "📝";
        return "📁";
    };

    const handleDownload = async (file: AppFile) => {
        try {
            const blob = await apiClient.downloadFile(file.id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = file.filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success("Download started", {
                description: `${file.filename} is being downloaded.`,
            });
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "Download failed";
            toast.error(errorMessage, {
                description: "Please try again.",
            });
        }
    };

    const handleDelete = async (file: AppFile) => {
        try {
            await apiClient.deleteFile(file.id);

            setFiles((prev) => prev.filter((f) => f.id !== file.id));
            toast.success("File deleted", {
                description: `${file.filename} has been deleted.`,
            });
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "Delete failed";
            toast.error(errorMessage, {
                description: "Please try again.",
            });
        }
    };

    const handleShare = (file: AppFile) => {
        setShareModal({ isOpen: true, file });
    };

    const refreshFiles = async () => {
        try {
            const response = await apiClient.getProjectFiles(projectId);
            if (response.data) {
                setFiles(response.data);
            }
        } catch (error) {
            console.error("Failed to refresh files:", error);
        }
    };

    if (isLoading) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10 flex items-center justify-center">
                    <div className="flex flex-col items-center space-y-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/70 rounded-xl blur-sm opacity-75 animate-pulse" />
                            <div className="relative bg-gradient-to-r from-primary to-primary/70 p-4 rounded-xl animate-spin">
                                <Database className="h-8 w-8 text-white" />
                            </div>
                        </div>
                        <div className="text-center">
                            <h2 className="text-xl font-semibold text-foreground">
                                Loading Project
                            </h2>
                            <p className="text-muted-foreground">
                                Please wait while we fetch your project data...
                            </p>
                        </div>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    if (!project) {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10 flex items-center justify-center">
                    <Card className="border-0 shadow-2xl bg-background/80 backdrop-blur-xl">
                        <CardContent className="pt-6 text-center">
                            <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-lg font-medium">
                                Project not found
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
                {/* Header */}
                <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="container mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    asChild
                                    className="hover:bg-primary/5"
                                >
                                    <Link to="/dashboard">
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Back to Dashboard
                                    </Link>
                                </Button>
                                <div className="flex items-center space-x-3">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/70 rounded-lg blur-sm opacity-75" />
                                        <div className="relative bg-gradient-to-r from-primary to-primary/70 p-2 rounded-lg">
                                            <Database className="h-5 w-5 text-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                                            {project.bucket}
                                        </h1>
                                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            Created{" "}
                                            {new Date(
                                                project.createdAt
                                            ).toUTCString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button
                                    size="sm"
                                    onClick={() => setShowUpload(!showUpload)}
                                    className={`shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${
                                        showUpload
                                            ? "bg-gradient-to-r from-secondary to-secondary/90"
                                            : "bg-gradient-to-r from-primary to-primary/90"
                                    }`}
                                >
                                    {showUpload ? (
                                        <>
                                            <Eye className="h-4 w-4 mr-2" />
                                            Hide Upload
                                        </>
                                    ) : (
                                        <>
                                            <CloudUpload className="h-4 w-4 mr-2" />
                                            Upload Files
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="container mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-8">
                    {/* Upload Section */}
                    {showUpload && (
                        <div className="mb-8 animate-in slide-in-from-top-4 duration-500">
                            <Card className="border-0 shadow-xl bg-background/80 backdrop-blur-xl relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 opacity-50" />
                                <CardHeader className="relative">
                                    <CardTitle className="flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 text-primary" />
                                        Upload Files
                                    </CardTitle>
                                    <CardDescription>
                                        Drag and drop files or click to browse
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="relative">
                                    <FileUpload
                                        projectId={projectId}
                                        onUploadComplete={refreshFiles}
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Project Stats */}
                    <div className="grid gap-6 md:grid-cols-3 mb-8">
                        {[
                            {
                                title: "Total Files",
                                value: files.length,
                                description: "Files in this project",
                                icon: FileText,
                                gradient: "from-emerald-500 to-teal-600",
                                bgGradient:
                                    "from-emerald-500/10 to-teal-500/10",
                                iconBg: "from-emerald-500 to-teal-600",
                            },
                            {
                                title: "Total Size",
                                value: formatFileSize(
                                    files.reduce(
                                        (acc, file) => acc + file.size,
                                        0
                                    )
                                ),
                                description: "Storage consumed",
                                icon: Upload,
                                gradient: "from-orange-500 to-amber-600",
                                bgGradient:
                                    "from-orange-500/10 to-amber-500/10",
                                iconBg: "from-orange-500 to-amber-600",
                            },
                            {
                                title: "Status",
                                value: "Active",
                                description: "Project status",
                                icon: Activity,
                                gradient: "from-violet-500 to-purple-600",
                                bgGradient:
                                    "from-violet-500/10 to-purple-500/10",
                                iconBg: "from-violet-500 to-purple-600",
                            },
                        ].map((stat, index) => (
                            <Card
                                key={index}
                                className="group relative overflow-hidden border-0 bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-all duration-300 hover:scale-105 hover:shadow-xl"
                            >
                                {/* Background Gradient */}
                                <div
                                    className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-60`}
                                />

                                {/* Animated Border */}
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        {stat.title}
                                    </CardTitle>
                                    <div
                                        className={`p-2 rounded-lg bg-gradient-to-r ${stat.iconBg} shadow-lg`}
                                    >
                                        <stat.icon className="h-4 w-4 text-white" />
                                    </div>
                                </CardHeader>

                                <CardContent className="relative">
                                    <div className="text-2xl font-bold mb-1 text-foreground">
                                        {stat.value}
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-2">
                                        {stat.description}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Files Table */}
                    <Card className="border-0 shadow-2xl bg-background/80 backdrop-blur-xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 opacity-30" />

                        <CardHeader className="relative">
                            <CardTitle className="text-2xl font-semibold flex items-center gap-2">
                                <FileText className="h-6 w-6 text-primary" />
                                Files
                            </CardTitle>
                            <CardDescription className="text-base">
                                Manage and organize files in this project
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="relative">
                            {files.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 mb-6">
                                        <FileText className="h-10 w-10 text-primary" />
                                        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                                    </div>
                                    <h3 className="text-2xl font-semibold mb-2">
                                        No files yet
                                    </h3>
                                    <p className="text-muted-foreground text-lg mb-6 max-w-md mx-auto">
                                        Upload your first file to get started
                                        with this project
                                    </p>
                                    <Button
                                        onClick={() => setShowUpload(true)}
                                        size="lg"
                                        className="shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                                    >
                                        <CloudUpload className="h-5 w-5 mr-2" />
                                        Upload Files
                                    </Button>
                                </div>
                            ) : (
                                <div className="rounded-lg border border-muted-foreground/10 overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/30 hover:bg-muted/50">
                                                <TableHead className="font-semibold">
                                                    Name
                                                </TableHead>
                                                <TableHead className="font-semibold">
                                                    Type
                                                </TableHead>
                                                <TableHead className="font-semibold">
                                                    Size
                                                </TableHead>
                                                <TableHead className="font-semibold">
                                                    Uploaded
                                                </TableHead>
                                                <TableHead className="w-[70px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {files.map((file, index) => (
                                                <TableRow
                                                    key={file.id}
                                                    className="hover:bg-muted/30 transition-all duration-200 group"
                                                    style={{
                                                        animationDelay: `${
                                                            index * 50
                                                        }ms`,
                                                    }}
                                                >
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-lg">
                                                                {getFileIcon(
                                                                    file.contentType
                                                                )}
                                                            </span>
                                                            <span className="group-hover:text-primary transition-colors">
                                                                {file.filename}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant="outline"
                                                            className="font-mono text-xs"
                                                        >
                                                            {file.contentType
                                                                .split("/")[1]
                                                                ?.toUpperCase() ||
                                                                "FILE"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="font-mono text-sm">
                                                        {formatFileSize(
                                                            file.size
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {new Date(
                                                            file.createdAt
                                                        ).toUTCString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    variant="ghost"
                                                                    className="h-8 w-8 p-0 hover:bg-primary/10 transition-all hover:scale-110"
                                                                >
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent
                                                                align="end"
                                                                className="w-48"
                                                            >
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        handleDownload(
                                                                            file
                                                                        )
                                                                    }
                                                                    className="cursor-pointer"
                                                                >
                                                                    <Download className="h-4 w-4 mr-2" />
                                                                    Download
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        handleShare(
                                                                            file
                                                                        )
                                                                    }
                                                                    className="cursor-pointer"
                                                                >
                                                                    <Share className="h-4 w-4 mr-2" />
                                                                    Share
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        handleDelete(
                                                                            file
                                                                        )
                                                                    }
                                                                    className="text-destructive focus:text-destructive cursor-pointer"
                                                                >
                                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Share Modal */}
                <ShareModal
                    isOpen={shareModal.isOpen}
                    onClose={() => setShareModal({ isOpen: false })}
                    fileName={shareModal.file?.filename || ""}
                    fileId={shareModal.file?.id || ""}
                />
            </div>
        </ProtectedRoute>
    );
}
