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
    Copy,
    Key,
    MoreHorizontal,
    Plus,
    Trash2,
    Shield,
    Clock,
    Activity,
    TrendingUp,
    Sparkles,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Database,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { CreateAPIKeyModal } from "@/components/create-api-key";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import type { APIKey } from "@/types/api";

export default function APIKeysPage() {
    const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        fetchAPIKeys();
    }, []);

    const fetchAPIKeys = async () => {
        try {
            setIsLoading(true);
            const response = await apiClient.getAPIKeys();

            if (response.data) {
                setApiKeys(response.data);
            }
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to load API Keys";
            toast.error(errorMessage, {
                description: "Please refresh the page to try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard", {
            description: "API key has been copied to your clipboard.",
        });
    };

    const revokeKey = async (keyId: string) => {
        try {
            await apiClient.revokeAPIKey(keyId);

            // Update local state
            setApiKeys((prev) =>
                prev.map((key) =>
                    key.id === keyId
                        ? { ...key, revokedAt: new Date().toISOString() }
                        : key
                )
            );

            toast.success("API key revoked", {
                description: "The API key has been successfully revoked.",
            });
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to revoke API key";
            toast.error(errorMessage);
        }
    };

    const isExpired = (expiresAt: string) => {
        return new Date(expiresAt) < new Date();
    };

    const isRevoked = (revokedAt?: string) => {
        return !!revokedAt;
    };

    const getKeyStatus = (key: APIKey) => {
        if (isRevoked(key.revokedAt))
            return {
                label: "Revoked",
                variant: "destructive" as const,
                icon: XCircle,
                color: "text-gray-200",
            };
        if (isExpired(key.expiresAt))
            return {
                label: "Expired",
                variant: "secondary" as const,
                icon: Clock,
                color: "text-orange-500",
            };
        return {
            label: "Active",
            variant: "default" as const,
            icon: CheckCircle,
            color: "text-green-500",
        };
    };

    const handleKeyCreated = (newKey: APIKey) => {
        setApiKeys((prev) => [newKey, ...prev]);
    };

    const activeKeys = apiKeys.filter(
        (key) => !isRevoked(key.revokedAt) && !isExpired(key.expiresAt)
    );
    const expiredRevokedKeys = apiKeys.filter(
        (key) => isRevoked(key.revokedAt) || isExpired(key.expiresAt)
    );

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative inline-flex items-center justify-center w-16 h-16 mb-4">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/70 rounded-full blur-sm opacity-75 animate-pulse" />
                        <div className="relative bg-gradient-to-r from-primary to-primary/70 p-3 rounded-full shadow-lg">
                            <Database className="h-6 w-6 text-white animate-spin" />
                        </div>
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                        Loading API Keys
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400">
                        Please wait while we fetch your API keys...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-white/20 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:border-slate-800/50 dark:bg-slate-950/80">
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
                                    <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-primary to-primary/70 opacity-75 blur-sm" />
                                    <div className="relative bg-gradient-to-r from-primary to-primary/70 p-2 rounded-xl shadow-lg">
                                        <Key className="h-5 w-5 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent dark:from-white dark:to-slate-300">
                                        API Keys
                                    </h1>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Manage programmatic access
                                    </p>
                                </div>
                            </div>
                        </div>
                        <Button
                            onClick={() => setShowCreateModal(true)}
                            className="shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Generate New Key
                        </Button>
                    </div>
                </div>
            </header>

            <div className="container mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats */}
                <div className="grid gap-6 md:grid-cols-3 mb-8">
                    {[
                        {
                            title: "Total Keys",
                            value: apiKeys.length,
                            description: "All API keys",
                            icon: Key,
                            gradient:
                                "from-violet-500 via-purple-500 to-indigo-600",
                            bgGradient:
                                "from-violet-500/10 via-purple-500/5 to-indigo-500/10",
                            iconBg: "from-violet-500 to-purple-600",
                            change: `${apiKeys.length > 0 ? "+" : ""}${
                                apiKeys.length
                            } total`,
                        },
                        {
                            title: "Active Keys",
                            value: activeKeys.length,
                            description: "Currently active",
                            icon: Activity,
                            gradient:
                                "from-emerald-500 via-teal-500 to-cyan-600",
                            bgGradient:
                                "from-emerald-500/10 via-teal-500/5 to-cyan-500/10",
                            iconBg: "from-emerald-500 to-teal-600",
                            change:
                                activeKeys.length > 0
                                    ? "All healthy"
                                    : "No active keys",
                        },
                        {
                            title: "Expired/Revoked",
                            value: expiredRevokedKeys.length,
                            description: "Inactive keys",
                            icon: AlertTriangle,
                            gradient:
                                "from-orange-500 via-amber-500 to-yellow-600",
                            bgGradient:
                                "from-orange-500/10 via-amber-500/5 to-yellow-500/10",
                            iconBg: "from-orange-500 to-amber-600",
                            change:
                                expiredRevokedKeys.length > 0
                                    ? "Need attention"
                                    : "All good",
                        },
                    ].map((stat, index) => (
                        <Card
                            key={index}
                            className="group relative overflow-hidden border-0 bg-white/70 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] dark:bg-slate-900/70"
                        >
                            {/* Background Gradient */}
                            <div
                                className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-60`}
                            />

                            {/* Animated Border */}
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <CardContent className="relative p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div
                                        className={`p-3 rounded-2xl bg-gradient-to-r ${stat.iconBg} shadow-lg`}
                                    >
                                        <stat.icon className="h-6 w-6 text-white" />
                                    </div>
                                    <div
                                        className={`px-2 py-1 rounded-full bg-gradient-to-r ${stat.gradient} opacity-20`}
                                    >
                                        <Sparkles className="h-3 w-3 text-transparent" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
                                        {stat.value}
                                    </h3>
                                    <div className="space-y-1">
                                        <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                                            {stat.title}
                                        </p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {stat.description}
                                        </p>
                                    </div>
                                    <div className="flex items-center text-xs pt-2">
                                        <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                                        <span className="text-green-500 font-medium">
                                            {stat.change}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* API Keys Table */}
                <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl relative overflow-hidden dark:bg-slate-900/80">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 opacity-30" />

                    <CardHeader className="relative">
                        <CardTitle className="text-2xl font-semibold flex items-center gap-2">
                            <Shield className="h-6 w-6 text-primary" />
                            API Keys
                        </CardTitle>
                        <CardDescription className="text-base">
                            Manage your API keys for programmatic access to your
                            projects
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="relative">
                        {apiKeys.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 mb-6">
                                    <Key className="h-10 w-10 text-primary" />
                                    <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                                </div>
                                <h3 className="text-2xl font-semibold mb-2 text-slate-900 dark:text-white">
                                    No API keys yet
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 text-lg mb-6 max-w-md mx-auto">
                                    Generate your first API key to access the
                                    SGS API programmatically
                                </p>
                                <Button
                                    onClick={() => setShowCreateModal(true)}
                                    size="lg"
                                    className="shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-r from-primary to-primary/90"
                                >
                                    <Sparkles className="h-5 w-5 mr-2" />
                                    Generate API Key
                                </Button>
                            </div>
                        ) : (
                            <div className="rounded-lg border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/50 hover:bg-slate-100/50 dark:bg-slate-800/50 dark:hover:bg-slate-700/50">
                                            <TableHead className="font-semibold">
                                                Name
                                            </TableHead>
                                            <TableHead className="font-semibold">
                                                Project
                                            </TableHead>
                                            <TableHead className="font-semibold">
                                                Token
                                            </TableHead>
                                            <TableHead className="font-semibold">
                                                Status
                                            </TableHead>
                                            <TableHead className="font-semibold">
                                                Expires
                                            </TableHead>
                                            <TableHead className="font-semibold">
                                                Created
                                            </TableHead>
                                            <TableHead className="w-[70px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {apiKeys.map((key, index) => {
                                            const status = getKeyStatus(key);
                                            return (
                                                <TableRow
                                                    key={key.id}
                                                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all duration-200 group"
                                                    style={{
                                                        animationDelay: `${
                                                            index * 50
                                                        }ms`,
                                                    }}
                                                >
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <Key className="h-4 w-4 text-primary" />
                                                            <span className="group-hover:text-primary transition-colors">
                                                                {key.name}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        <span className="group-hover:text-primary transition-colors">
                                                            {key.projectBucket ??
                                                                "N/A"}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center space-x-2">
                                                            <code className="text-sm bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md font-mono border border-slate-200 dark:border-slate-700">
                                                                {key.token.substring(
                                                                    0,
                                                                    16
                                                                )}
                                                                ...
                                                            </code>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() =>
                                                                    copyToClipboard(
                                                                        key.token
                                                                    )
                                                                }
                                                                className="hover:bg-primary/10 transition-all hover:scale-110"
                                                            >
                                                                <Copy className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={
                                                                status.variant
                                                            }
                                                            className="flex items-center gap-1 w-fit"
                                                        >
                                                            <status.icon
                                                                className={`h-3 w-3 ${status.color}`}
                                                            />
                                                            {status.label}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="font-mono text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="h-3 w-3 text-slate-500 dark:text-slate-400" />
                                                            {new Date(
                                                                key.expiresAt
                                                            ).toUTCString()}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-slate-600 dark:text-slate-400">
                                                        {new Date(
                                                            key.createdAt
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
                                                                        copyToClipboard(
                                                                            key.token
                                                                        )
                                                                    }
                                                                    className="cursor-pointer"
                                                                >
                                                                    <Copy className="h-4 w-4 mr-2" />
                                                                    Copy Token
                                                                </DropdownMenuItem>
                                                                {!isRevoked(
                                                                    key.revokedAt
                                                                ) && (
                                                                    <DropdownMenuItem
                                                                        onClick={() =>
                                                                            revokeKey(
                                                                                key.id
                                                                            )
                                                                        }
                                                                        className="text-destructive focus:text-destructive cursor-pointer"
                                                                    >
                                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                                        Revoke
                                                                    </DropdownMenuItem>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <CreateAPIKeyModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onKeyCreated={handleKeyCreated}
            />
        </div>
    );
}
