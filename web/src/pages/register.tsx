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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Database,
    Eye,
    EyeOff,
    AlertCircle,
    ArrowLeft,
    Sparkles,
    UserPlus,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";

export default function RegisterPage() {
    const { register, isAuthenticated, isLoading } = useAuth();
    const navigate = useNavigate();

    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        fullName: "",
    });

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated && !isLoading) {
            navigate("/dashboard", { replace: true });
        }
    }, [isAuthenticated, isLoading, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        // Basic validation
        if (!formData.username.trim() || !formData.password.trim()) {
            setError("Username and password are required");
            setIsSubmitting(false);
            return;
        }

        if (formData.username.length < 3) {
            setError("Username must be at least 3 characters long");
            setIsSubmitting(false);
            return;
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters long");
            setIsSubmitting(false);
            return;
        }

        try {
            await register(
                formData.username.trim(),
                formData.password,
                formData.fullName.trim() || undefined
            );
            // Navigation is handled in the auth context
        } catch (error: any) {
            setError(error.message || "Registration failed. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange =
        (field: keyof typeof formData) =>
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setFormData((prev) => ({ ...prev, [field]: e.target.value }));
            // Clear error when user starts typing
            if (error) setError(null);
        };

    // Show loading if checking authentication
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
                <Card className="w-full max-w-md border-0 shadow-2xl bg-background/80 backdrop-blur-xl">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <div className="relative">
                            <Database className="h-12 w-12 text-primary animate-pulse" />
                            <div className="absolute inset-0 h-12 w-12 bg-primary/20 rounded-full animate-ping" />
                        </div>
                        <p className="text-muted-foreground mt-4 font-medium">
                            Loading...
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-md space-y-8">
                    {/* Header */}
                    <div className="text-center space-y-6">
                        <div className="inline-flex items-center justify-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/70 rounded-2xl blur-lg opacity-75" />
                                <div className="relative bg-gradient-to-r from-primary to-primary/70 p-4 rounded-2xl">
                                    <Database className="h-8 w-8 text-white" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                                Create Account
                            </h1>
                            <p className="text-muted-foreground">
                                Get started with SGS object storage
                            </p>
                        </div>
                    </div>

                    {/* Register Card */}
                    <Card className="border-0 shadow-2xl bg-background/80 backdrop-blur-xl relative overflow-hidden">
                        {/* Card glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 opacity-50" />

                        <CardHeader className="relative space-y-1 pb-4">
                            <CardTitle className="text-2xl font-semibold flex items-center gap-2">
                                <UserPlus className="h-5 w-5 text-primary" />
                                Sign Up
                            </CardTitle>
                            <CardDescription className="text-base">
                                Create your account to start managing files
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="relative space-y-6">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {error && (
                                    <Alert
                                        variant="destructive"
                                        className="border-destructive/20 bg-destructive/5"
                                    >
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription className="font-medium">
                                            {error}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className="space-y-3">
                                    <Label
                                        htmlFor="fullName"
                                        className="text-sm font-medium"
                                    >
                                        Full Name
                                    </Label>
                                    <Input
                                        id="fullName"
                                        type="text"
                                        placeholder="Enter your full name (optional)"
                                        value={formData.fullName}
                                        onChange={handleInputChange("fullName")}
                                        disabled={isSubmitting}
                                        className="h-12 bg-background/50 border-muted-foreground/20 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200"
                                        autoComplete="name"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label
                                        htmlFor="username"
                                        className="text-sm font-medium"
                                    >
                                        Username
                                    </Label>
                                    <Input
                                        id="username"
                                        type="text"
                                        placeholder="Choose a username"
                                        value={formData.username}
                                        onChange={handleInputChange("username")}
                                        required
                                        disabled={isSubmitting}
                                        className="h-12 bg-background/50 border-muted-foreground/20 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200"
                                        autoComplete="username"
                                        minLength={3}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        At least 3 characters
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <Label
                                        htmlFor="password"
                                        className="text-sm font-medium"
                                    >
                                        Password
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            placeholder="Create a password"
                                            value={formData.password}
                                            onChange={handleInputChange(
                                                "password"
                                            )}
                                            required
                                            disabled={isSubmitting}
                                            className="h-12 bg-background/50 border-muted-foreground/20 focus:border-primary/50 focus:ring-primary/20 transition-all duration-200 pr-12"
                                            autoComplete="new-password"
                                            minLength={6}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent"
                                            onClick={() =>
                                                setShowPassword(!showPassword)
                                            }
                                            disabled={isSubmitting}
                                            tabIndex={-1}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                                            ) : (
                                                <Eye className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        At least 6 characters
                                    </p>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 text-base font-medium bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center space-x-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Creating account...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <Sparkles className="mr-2 h-4 w-4" />
                                            Create Account
                                        </>
                                    )}
                                </Button>
                            </form>

                            <div className="text-center">
                                <p className="text-sm text-muted-foreground">
                                    Already have an account?{" "}
                                    <Link
                                        to="/login"
                                        className="font-medium text-primary hover:text-primary/80 transition-colors"
                                    >
                                        Sign in
                                    </Link>
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Back to home */}
                    <div className="text-center">
                        <Button
                            variant="ghost"
                            asChild
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <Link to="/">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to home
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
