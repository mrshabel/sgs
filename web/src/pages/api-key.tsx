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
        toast.info("Copied to clipboard", {
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

            toast.success("API key revoked");
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
                color: "text-red-500",
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

    return (
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
                                        <Key className="h-5 w-5 text-white" />
                                    </div>
                                </div>
                                <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                                    API Keys
                                </h1>
                            </div>
                        </div>
                        <Button
                            onClick={() => setShowCreateModal(true)}
                            className="shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-r from-primary to-primary/90"
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
                            gradient: "from-blue-500 to-cyan-500",
                            change: "+1 this month",
                        },
                        {
                            title: "Active Keys",
                            value: activeKeys.length,
                            description: "Currently active",
                            icon: Activity,
                            gradient: "from-green-500 to-emerald-500",
                            change: "All healthy",
                        },
                        {
                            title: "Expired/Revoked",
                            value: expiredRevokedKeys.length,
                            description: "Inactive keys",
                            icon: AlertTriangle,
                            gradient: "from-orange-500 to-red-500",
                            change: "2 need attention",
                        },
                    ].map((stat, index) => (
                        <Card
                            key={index}
                            className="relative overflow-hidden border-0 bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-all duration-300 hover:scale-105 hover:shadow-xl group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {stat.title}
                                </CardTitle>
                                <div
                                    className={`p-2 rounded-lg bg-gradient-to-r ${stat.gradient} shadow-lg`}
                                >
                                    <stat.icon className="h-4 w-4 text-white" />
                                </div>
                            </CardHeader>

                            <CardContent className="relative">
                                <div className="text-2xl font-bold mb-1">
                                    {stat.value}
                                </div>
                                <p className="text-xs text-muted-foreground mb-2">
                                    {stat.description}
                                </p>
                                <div className="flex items-center text-xs">
                                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                                    <span className="text-green-500 font-medium">
                                        {stat.change}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* API Keys Table */}
                <Card className="border-0 shadow-2xl bg-background/80 backdrop-blur-xl relative overflow-hidden">
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
                        {isLoading ? (
                            <div className="space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center space-x-4 animate-pulse p-4 rounded-lg bg-muted/20"
                                    >
                                        <div className="h-4 bg-muted rounded w-32"></div>
                                        <div className="h-4 bg-muted rounded w-48"></div>
                                        <div className="h-4 bg-muted rounded w-24"></div>
                                        <div className="h-4 bg-muted rounded w-32"></div>
                                    </div>
                                ))}
                            </div>
                        ) : apiKeys.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 mb-6">
                                    <Key className="h-10 w-10 text-primary" />
                                    <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                                </div>
                                <h3 className="text-2xl font-semibold mb-2">
                                    No API keys yet
                                </h3>
                                <p className="text-muted-foreground text-lg mb-6 max-w-md mx-auto">
                                    Generate your first API key to access the
                                    SGS API programmatically
                                </p>
                                <Button
                                    onClick={() => setShowCreateModal(true)}
                                    size="lg"
                                    className="shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                                >
                                    <Sparkles className="h-5 w-5 mr-2" />
                                    Generate API Key
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
                                                    className="hover:bg-muted/30 transition-all duration-200 group"
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
                                                    <TableCell>
                                                        <div className="flex items-center space-x-2">
                                                            <code className="text-sm bg-muted/50 px-3 py-1 rounded-md font-mono border">
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
                                                            <Clock className="h-3 w-3 text-muted-foreground" />
                                                            {new Date(
                                                                key.expiresAt
                                                            ).toLocaleDateString()}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {new Date(
                                                            key.createdAt
                                                        ).toLocaleDateString()}
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
