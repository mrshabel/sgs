import type React from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Database, Sparkles, Info, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";
import type { CreateProjectRequest } from "@/types/api";
import { useAuth } from "@/contexts/auth-context";

export default function NewProjectPage() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        bucket: "",
    });
    // get current user id
    const { user } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // save details
            const data: CreateProjectRequest = {
                bucket: formData.bucket,
                ownerId: user?.id ?? "",
            };

            const response = await apiClient.createProject(data);
            console.log(response);

            toast.success(
                `Project "${formData.bucket}" has been created and is ready to use.`
            );
            navigate("/dashboard");
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "failed to create project";
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
            {/* Header */}
            <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="mr-4 hover:bg-primary/5"
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
                            <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                                Create New Project
                            </h1>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-8">
                <div className="max-w-2xl mx-auto space-y-8">
                    {/* Main Form Card */}
                    <Card className="border-0 shadow-2xl bg-background/80 backdrop-blur-xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 opacity-50" />

                        <CardHeader className="relative space-y-1">
                            <CardTitle className="text-2xl font-semibold flex items-center gap-2">
                                <Sparkles className="h-6 w-6 text-primary" />
                                Project Details
                            </CardTitle>
                            <CardDescription className="text-base">
                                Create a new project to organize your files.
                                Each project acts as a separate storage bucket.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="relative space-y-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-3">
                                    <Label
                                        htmlFor="bucket"
                                        className="text-sm font-medium"
                                    >
                                        Project Name (Bucket)
                                    </Label>
                                    <Input
                                        id="bucket"
                                        type="text"
                                        placeholder="e.g., my-documents, image-backup, client-files"
                                        value={formData.bucket}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                bucket: e.target.value,
                                            }))
                                        }
                                        required
                                        className="h-12 bg-background/50 border-muted-foreground/20 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200"
                                    />
                                    <p className="text-sm text-muted-foreground flex items-start gap-2">
                                        <Info className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                                        Use lowercase letters, numbers, and
                                        hyphens only. This will be your unique
                                        bucket identifier.
                                    </p>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <Button
                                        type="submit"
                                        disabled={
                                            isLoading || !formData.bucket.trim()
                                        }
                                        className="flex-1 h-12 text-base font-medium bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                                    >
                                        {isLoading ? (
                                            <div className="flex items-center space-x-2">
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                <span>Creating...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <Sparkles className="mr-2 h-4 w-4" />
                                                Create Project
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        asChild
                                        className="h-12 px-6"
                                    >
                                        <Link to="/dashboard">Cancel</Link>
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Info Cards */}
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="border-0 bg-background/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Database className="h-5 w-5 text-primary" />
                                    What is a project?
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Projects in SGS are logical containers for
                                    your files, similar to folders or buckets in
                                    other storage systems.
                                </p>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    {[
                                        "Each project has its own unique bucket name",
                                        "Files are organized within projects",
                                        "API keys can be scoped to specific projects",
                                        "Projects can be managed independently",
                                    ].map((item, index) => (
                                        <li
                                            key={index}
                                            className="flex items-start gap-2"
                                        >
                                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="border-0 bg-background/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-primary" />
                                    Best Practices
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Follow these guidelines for optimal project
                                    organization:
                                </p>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    {[
                                        "Use descriptive, meaningful names",
                                        "Keep names short but clear",
                                        "Use hyphens instead of spaces",
                                        "Consider your file organization strategy",
                                    ].map((item, index) => (
                                        <li
                                            key={index}
                                            className="flex items-start gap-2"
                                        >
                                            <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
