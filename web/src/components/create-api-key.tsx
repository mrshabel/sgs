import type React from "react";
import { useState, useEffect } from "react";
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
    Key,
    Copy,
    Calendar,
    Sparkles,
    AlertTriangle,
    CheckCircle,
    Database,
    Clock,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient, type APIKey, type Project } from "@/lib/api";
import { getExpirationDate } from "@/lib/utils";

interface CreateAPIKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onKeyCreated?: (apiKey: APIKey) => void;
}

export function CreateAPIKeyModal({
    isOpen,
    onClose,
    onKeyCreated,
}: CreateAPIKeyModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [formData, setFormData] = useState({
        name: "",
        projectId: "",
        expiresAt: "1y",
    });
    const [createdKey, setCreatedKey] = useState<
        (APIKey & { token: string }) | null
    >(null);

    const expirationOptions = [
        { value: "30d", label: "30 days", description: "Short-term access" },
        { value: "90d", label: "90 days", description: "Quarterly access" },
        { value: "6m", label: "6 months", description: "Medium-term access" },
        { value: "1y", label: "1 year", description: "Long-term access" },
        {
            value: "never",
            label: "Never expires",
            description: "Permanent access",
        },
    ];

    useEffect(() => {
        if (isOpen) {
            fetchProjects();
        }
    }, [isOpen]);

    const fetchProjects = async () => {
        try {
            const response = await apiClient.getProjects();
            if (response.data) {
                setProjects(response.data);
                if (response.data.length > 0) {
                    setFormData((prev) => ({
                        ...prev,
                        projectId: response.data?.[0]?.id ?? "",
                    }));
                }
            }
        } catch (error) {
            toast.error("Failed to load projects", {
                description: "Unable to fetch your projects. Please try again.",
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error("Name is required", {
                description: "Please enter a name for your API key.",
            });
            return;
        }

        setIsLoading(true);
        try {
            const data = {
                name: formData.name.trim(),
                expiresAt: getExpirationDate(formData.expiresAt),
            };

            const response = await apiClient.createAPIKey(
                formData.projectId,
                data
            );

            if (response.data) {
                setCreatedKey(response.data);
                onKeyCreated?.(response.data);
                toast.success("API key created", {
                    description: `"${formData.name}" has been created successfully.`,
                });
            }
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to create API key";
            toast.error("Failed to create API key", {
                description: errorMessage,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopyToken = async () => {
        if (!createdKey?.token) return;

        try {
            await navigator.clipboard.writeText(createdKey.token);
            toast.success("Token copied", {
                description: "API key token has been copied to your clipboard.",
            });
        } catch (error) {
            toast.error("Failed to copy", {
                description: "Unable to copy token to clipboard.",
            });
        }
    };

    const handleClose = () => {
        setFormData({ name: "", projectId: "", expiresAt: "1y" });
        setCreatedKey(null);
        onClose();
    };

    const selectedProject = projects.find((p) => p.id === formData.projectId);
    const selectedExpiration = expirationOptions.find(
        (opt) => opt.value === formData.expiresAt
    );

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg border-0 bg-white/95 backdrop-blur-xl shadow-2xl dark:bg-slate-950/95">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg" />

                <DialogHeader className="relative">
                    <DialogTitle className="text-2xl flex items-center gap-3">
                        <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/70 rounded-xl blur-sm opacity-75" />
                            <div className="relative bg-gradient-to-r from-primary to-primary/70 p-2.5 rounded-xl shadow-lg">
                                <Key className="h-5 w-5 text-white" />
                            </div>
                        </div>
                        <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent dark:from-white dark:to-slate-300">
                            {createdKey ? "API Key Created" : "Create API Key"}
                        </span>
                    </DialogTitle>
                    <DialogDescription className="text-base text-slate-600 dark:text-slate-400">
                        {createdKey
                            ? "Your API key has been generated. Make sure to copy it now."
                            : "Generate a new API key for programmatic access to your project."}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 relative">
                    {!createdKey ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-3">
                                <Label
                                    htmlFor="name"
                                    className="text-sm font-medium flex items-center gap-2"
                                >
                                    <Key className="h-4 w-4 text-primary" />
                                    API Key Name
                                </Label>
                                <Input
                                    id="name"
                                    placeholder="e.g., Production API, Mobile App Key, Analytics Service"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            name: e.target.value,
                                        })
                                    }
                                    className="h-12 bg-white/50 dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-700/50 hover:border-primary/50 focus:border-primary transition-all"
                                    required
                                />
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Choose a descriptive name to identify this
                                    API key
                                </p>
                            </div>

                            <div className="space-y-3">
                                <Label
                                    htmlFor="project"
                                    className="text-sm font-medium flex items-center gap-2"
                                >
                                    <Database className="h-4 w-4 text-primary" />
                                    Project
                                </Label>
                                <Select
                                    value={formData.projectId}
                                    onValueChange={(value) =>
                                        setFormData({
                                            ...formData,
                                            projectId: value,
                                        })
                                    }
                                >
                                    <SelectTrigger className="h-12 bg-white/50 dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-700/50 hover:border-primary/50 transition-all">
                                        <SelectValue placeholder="Select a project" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {projects.map((project) => (
                                            <SelectItem
                                                key={project.id}
                                                value={project.id}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Database className="h-4 w-4 text-primary" />
                                                    <span>
                                                        {project.bucket}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    This key will have access to the selected
                                    project
                                </p>
                            </div>

                            <div className="space-y-3">
                                <Label
                                    htmlFor="expires"
                                    className="text-sm font-medium flex items-center gap-2"
                                >
                                    <Calendar className="h-4 w-4 text-primary" />
                                    Expiration Period
                                </Label>
                                <Select
                                    value={formData.expiresAt}
                                    onValueChange={(value) =>
                                        setFormData({
                                            ...formData,
                                            expiresAt: value,
                                        })
                                    }
                                >
                                    <SelectTrigger className="h-12 bg-white/50 dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-700/50 hover:border-primary/50 transition-all">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {expirationOptions.map((option) => (
                                            <SelectItem
                                                key={option.value}
                                                value={option.value}
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <div className="flex items-center space-x-2">
                                                        <Clock className="h-4 w-4 text-primary" />
                                                        <span className="font-medium">
                                                            {option.label}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-slate-500 dark:text-slate-400 ml-4">
                                                        {option.description}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Choose when this API key should expire for
                                    security
                                </p>
                            </div>

                            <DialogFooter className="gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleClose}
                                    className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={
                                        isLoading ||
                                        !formData.name.trim() ||
                                        !formData.projectId
                                    }
                                    className="shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="h-4 w-4 mr-2" />
                                            Create API Key
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    ) : (
                        <>
                            <Card className="border-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                            <span className="font-semibold text-lg">
                                                {createdKey.name}
                                            </span>
                                        </div>
                                        <Badge
                                            variant="secondary"
                                            className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                        >
                                            Active
                                        </Badge>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                            API Token
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                value={createdKey.token}
                                                readOnly
                                                className="font-mono text-sm bg-slate-100 dark:bg-slate-800 pr-12 border-slate-200 dark:border-slate-700"
                                            />
                                            <Button
                                                onClick={handleCopyToken}
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-primary/10 transition-all hover:scale-110"
                                            >
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-2 text-sm text-slate-600 dark:text-slate-400">
                                        <div>
                                            <span className="font-medium">
                                                Project:
                                            </span>
                                            <p className="text-slate-900 dark:text-white">
                                                {selectedProject?.bucket}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="font-medium">
                                                Expires:
                                            </span>
                                            <p className="text-slate-900 dark:text-white">
                                                {selectedExpiration?.value ===
                                                "never"
                                                    ? "Never"
                                                    : new Date(
                                                          createdKey.expiresAt
                                                      ).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-0 bg-orange-50 dark:bg-orange-950/20">
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                                                Important Security Notice
                                            </p>
                                            <p className="text-xs text-orange-700 dark:text-orange-300">
                                                This is the only time you'll see
                                                this token. Make sure to copy
                                                and store it securely.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <DialogFooter>
                                <Button
                                    onClick={handleClose}
                                    className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
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
