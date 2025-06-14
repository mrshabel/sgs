import type React from "react";
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
import { Key, Sparkles, Database, Clock } from "lucide-react";
import { toast } from "sonner";

interface CreateAPIKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onKeyCreated: (key: any) => void;
}

export function CreateAPIKeyModal({
    isOpen,
    onClose,
    onKeyCreated,
}: CreateAPIKeyModalProps) {
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        projectId: "",
        expiresAt: "1y",
    });

    const projects = [
        { id: "proj-1", name: "my-documents" },
        { id: "proj-2", name: "images-backup" },
        { id: "proj-3", name: "project-assets" },
        { id: "proj-4", name: "video-library" },
        { id: "proj-5", name: "client-files" },
    ];

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

    const getExpirationDate = (option: string) => {
        const now = new Date();
        switch (option) {
            case "30d":
                return new Date(
                    now.getTime() + 30 * 24 * 60 * 60 * 1000
                ).toISOString();
            case "90d":
                return new Date(
                    now.getTime() + 90 * 24 * 60 * 60 * 1000
                ).toISOString();
            case "6m":
                return new Date(
                    now.getTime() + 6 * 30 * 24 * 60 * 60 * 1000
                ).toISOString();
            case "1y":
                return new Date(
                    now.getTime() + 365 * 24 * 60 * 60 * 1000
                ).toISOString();
            case "never":
                return new Date("2099-12-31T23:59:59Z").toISOString();
            default:
                return new Date(
                    now.getTime() + 365 * 24 * 60 * 60 * 1000
                ).toISOString();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);

        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1500));

            const newKey = {
                id: `key-${Date.now()}`,
                name: formData.name,
                token: `sgs_${Math.random()
                    .toString(36)
                    .substring(2, 15)}${Math.random()
                    .toString(36)
                    .substring(2, 15)}`,
                projectId: formData.projectId,
                userId: "user-123",
                expiresAt: getExpirationDate(formData.expiresAt),
                createdAt: new Date().toISOString(),
            };

            onKeyCreated(newKey);

            toast.success("API key created successfully");

            // Reset form
            setFormData({ name: "", projectId: "", expiresAt: "1y" });
            onClose();
        } catch (error) {
            const errMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to create API key";
            toast.error(errMessage);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg border-0 shadow-2xl bg-background/95 backdrop-blur-xl">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 opacity-50 rounded-lg" />

                <DialogHeader className="relative space-y-3">
                    <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-primary/70 shadow-lg">
                            <Key className="h-5 w-5 text-white" />
                        </div>
                        Create API Key
                    </DialogTitle>
                    <DialogDescription className="text-base">
                        Generate a new API key for programmatic access to your
                        projects
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 relative">
                    <div className="space-y-3">
                        <Label htmlFor="name" className="text-sm font-medium">
                            Key Name
                        </Label>
                        <Input
                            id="name"
                            placeholder="e.g., Production API, Mobile App, Analytics Service"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                }))
                            }
                            required
                            className="h-12 bg-background/50 border-muted-foreground/20 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200"
                        />
                        <p className="text-xs text-muted-foreground">
                            Choose a descriptive name to identify this API key
                        </p>
                    </div>

                    <div className="space-y-3">
                        <Label
                            htmlFor="project"
                            className="text-sm font-medium"
                        >
                            Project
                        </Label>
                        <Select
                            value={formData.projectId}
                            onValueChange={(value) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    projectId: value,
                                }))
                            }
                        >
                            <SelectTrigger className="h-12 bg-background/50 border-muted-foreground/20 focus:border-primary/50 focus:ring-primary/20">
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
                                            <span>{project.name}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            This key will have access to the selected project
                        </p>
                    </div>

                    <div className="space-y-3">
                        <Label
                            htmlFor="expires"
                            className="text-sm font-medium"
                        >
                            Expiration
                        </Label>
                        <Select
                            value={formData.expiresAt}
                            onValueChange={(value) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    expiresAt: value,
                                }))
                            }
                        >
                            <SelectTrigger className="h-12 bg-background/50 border-muted-foreground/20 focus:border-primary/50 focus:ring-primary/20">
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
                                            <span className="text-xs text-muted-foreground ml-4">
                                                {option.description}
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Choose when this API key should expire for security
                        </p>
                    </div>

                    <div className="flex space-x-3 pt-4">
                        <Button
                            type="submit"
                            disabled={
                                isCreating ||
                                !formData.name ||
                                !formData.projectId
                            }
                            className="flex-1 h-12 text-base font-medium bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                        >
                            {isCreating ? (
                                <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Creating...</span>
                                </div>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Create Key
                                </>
                            )}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="h-12 px-6 hover:bg-muted/50"
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
