import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import {
    Database,
    FileText,
    FolderPlus,
    Key,
    Plus,
    LogOut,
    Settings,
    ChevronRight,
    HardDrive,
    Activity,
    UserPlus,
    Sparkles,
    Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/protected";
import { useAuth } from "@/contexts/auth-context";
import { apiClient } from "@/lib/api";
import type { Project, DashboardStats } from "@/types/api";
import { toast } from "sonner";
import { getCurrentGreeting } from "@/lib/utils";
import CreateUserDialog from "@/components/create-user";

export default function DashboardPage() {
    const { user, logout } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateUser, setShowCreateUser] = useState(false);
    const [stats, setStats] = useState<DashboardStats>({
        totalProjects: 0,
        totalFiles: 0,
        totalSize: 0,
        activeAPIKeys: 0,
        storageUsed: "0 MB",
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setIsLoading(true);

                const [projectsResponse, statsResponse] = await Promise.all([
                    apiClient.getProjects(),
                    apiClient.getDashboardStats(),
                ]);

                if (projectsResponse.data) {
                    setProjects(projectsResponse.data);
                }

                if (statsResponse.data) {
                    setStats(statsResponse.data);
                }
            } catch (error) {
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : "Failed to load dashboard data";
                toast.error(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const statsCards = [
        {
            title: "Projects",
            value: stats.totalProjects.toString(),
            icon: Database,
            description: "Active storage buckets",
            gradient: "from-violet-500 via-purple-500 to-indigo-600",
            bgGradient: "from-violet-500/10 via-purple-500/5 to-indigo-500/10",
            iconBg: "from-violet-500 to-purple-600",
        },
        {
            title: "Files",
            value: stats.totalFiles.toLocaleString(),
            icon: FileText,
            description: "Total objects stored",
            gradient: "from-emerald-500 via-teal-500 to-cyan-600",
            bgGradient: "from-emerald-500/10 via-teal-500/5 to-cyan-500/10",
            iconBg: "from-emerald-500 to-teal-600",
        },
        {
            title: "Storage",
            value: stats.storageUsed,
            icon: HardDrive,
            description: "Space consumed",
            gradient: "from-orange-500 via-amber-500 to-yellow-600",
            bgGradient: "from-orange-500/10 via-amber-500/5 to-yellow-500/10",
            iconBg: "from-orange-500 to-amber-600",
        },
        {
            title: "API Keys",
            value: stats.activeAPIKeys.toString(),
            icon: Key,
            description: "Active access tokens",
            gradient: "from-rose-500 via-pink-500 to-fuchsia-600",
            bgGradient: "from-rose-500/10 via-pink-500/5 to-fuchsia-500/10",
            iconBg: "from-rose-500 to-pink-600",
        },
    ];

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
                                Loading Dashboard
                            </h2>
                            <p className="text-muted-foreground">
                                Please wait while we fetch your data...
                            </p>
                        </div>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
                {/* Header */}
                <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 items-center justify-between">
                            {/* Logo */}
                            <div className="flex items-center space-x-3">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/70 rounded-lg blur-sm opacity-75" />
                                    <div className="relative bg-gradient-to-r from-primary to-primary/70 p-2 rounded-lg">
                                        <Database className="h-5 w-5 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                                        SGS
                                    </h1>
                                    <p className="text-xs text-muted-foreground">
                                        Storage Gateway
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center space-x-3">
                                {/* <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-10 w-10 p-0 hover:bg-primary/5"
                                >
                                    <Bell className="h-4 w-4" />
                                </Button> */}

                                <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                    className="bg-primary/5 border-primary/20 text-primary hover:bg-primary/15 hover:border-primary/50 transition-all"
                                >
                                    <Link to="/dashboard/api-keys">
                                        <Key className="h-4 w-4 mr-2" />
                                        API Keys
                                    </Link>
                                </Button>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className="h-10 w-10 p-0"
                                        >
                                            <Avatar className="h-8 w-8 ring-2 ring-background shadow-lg">
                                                <AvatarImage src="/placeholder-avatar.jpg" />
                                                <AvatarFallback className="bg-gradient-to-r from-primary to-primary/70 text-white text-sm font-semibold">
                                                    {user?.fullName?.charAt(
                                                        0
                                                    ) ||
                                                        user?.username?.charAt(
                                                            0
                                                        ) ||
                                                        "U"}
                                                </AvatarFallback>
                                            </Avatar>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="end"
                                        className="w-56 bg-background/95 backdrop-blur-xl border-border/50"
                                    >
                                        <div className="px-2 py-1.5">
                                            <p className="text-sm font-medium text-foreground">
                                                {user?.fullName ||
                                                    user?.username}
                                            </p>
                                        </div>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem>
                                            <Settings className="h-4 w-4 mr-2" />
                                            Settings
                                        </DropdownMenuItem>
                                        <Dialog
                                            open={showCreateUser}
                                            onOpenChange={setShowCreateUser}
                                        >
                                            <DialogTrigger asChild>
                                                <DropdownMenuItem
                                                    onSelect={(e) =>
                                                        e.preventDefault()
                                                    }
                                                >
                                                    <UserPlus className="h-4 w-4 mr-2" />
                                                    Create User
                                                </DropdownMenuItem>
                                            </DialogTrigger>
                                        </Dialog>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={logout}
                                            className="text-destructive"
                                        >
                                            <LogOut className="h-4 w-4 mr-2" />
                                            Sign out
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                    {/* Welcome Section */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                                    {getCurrentGreeting()},{" "}
                                    {user?.fullName?.split(" ")[0] ||
                                        user?.username}
                                </h1>
                                <p className="mt-2 text-lg text-muted-foreground">
                                    Here's what's happening with your storage
                                    today.
                                </p>
                            </div>
                            <Button
                                asChild
                                size="lg"
                                className="h-12 px-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-r from-primary to-primary/90"
                            >
                                <Link to="/dashboard/projects/new">
                                    <Plus className="h-5 w-5 mr-2" />
                                    New Project
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Premium Stats Grid */}
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-12">
                        {statsCards.map((stat, index) => (
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
                                        <h3 className="text-3xl font-bold text-foreground">
                                            {stat.value}
                                        </h3>
                                        <div className="space-y-1">
                                            <p className="text-lg font-semibold text-foreground/80">
                                                {stat.title}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {stat.description}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Projects Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                                    Your Projects
                                </h2>
                                <p className="text-lg text-muted-foreground">
                                    Manage and organize your storage buckets
                                </p>
                            </div>
                            {/* <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 hover:bg-primary/5 hover:border-primary/20 transition-all"
                            >
                                View all
                                <ChevronRight className="h-4 w-4" />
                            </Button> */}
                        </div>

                        {/* Projects Grid */}
                        {projects.length === 0 ? (
                            <Card className="border-0 bg-background/50 backdrop-blur-sm">
                                <CardContent className="flex flex-col items-center justify-center py-16">
                                    <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 mb-6">
                                        <FolderPlus className="h-12 w-12 text-primary" />
                                        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                                    </div>
                                    <h3 className="text-2xl font-semibold mb-3">
                                        Create your first project
                                    </h3>
                                    <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto text-center">
                                        Start organizing your files by creating
                                        a storage project. It only takes a few
                                        seconds.
                                    </p>
                                    <Button
                                        asChild
                                        size="lg"
                                        className="h-12 px-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                                    >
                                        <Link to="/dashboard/projects/new">
                                            <Zap className="h-5 w-5 mr-2" />
                                            Create Project
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {projects.map((project, index) => (
                                    <Card
                                        key={project.id}
                                        className="group relative overflow-hidden border-0 shadow-2xs  backdrop-blur-xl hover:bg-background/80 transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer"
                                        style={{
                                            animationDelay: `${index * 100}ms`,
                                        }}
                                    >
                                        {/* Hover Gradient */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                        <Link
                                            to={`/dashboard/projects/${project.id}`}
                                            className="block relative"
                                        >
                                            <CardContent className="p-6">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="p-3 rounded-2xl bg-gradient-to-r from-muted to-muted/80 group-hover:from-primary/10 group-hover:to-primary/5 transition-all duration-300">
                                                        <Database className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                                                    </div>
                                                    <Badge
                                                        variant="secondary"
                                                        className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                                                    >
                                                        <Activity className="h-3 w-3 mr-1" />
                                                        Active
                                                    </Badge>
                                                </div>

                                                <div className="space-y-4">
                                                    <div>
                                                        <h4 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
                                                            {project.bucket}
                                                        </h4>
                                                        <p className="text-sm text-muted-foreground">
                                                            Created{" "}
                                                            {new Date(
                                                                project.createdAt
                                                            ).toUTCString()}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center justify-between pt-4 border-t border-border">
                                                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                                            <FileText className="h-4 w-4" />
                                                            <span className="font-medium">
                                                                {project.fileCount ??
                                                                    0}
                                                            </span>
                                                            <span>files</span>
                                                        </div>
                                                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                                            <HardDrive className="h-4 w-4" />
                                                            <span className="font-medium">
                                                                {project.totalFileSize ??
                                                                    "0 B"}
                                                            </span>
                                                        </div>
                                                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Link>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </main>

                {/* Create User Modal */}
                <CreateUserDialog
                    open={showCreateUser}
                    setOpen={setShowCreateUser}
                />
            </div>
        </ProtectedRoute>
    );
}
