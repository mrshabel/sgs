import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Database,
    Key,
    Shield,
    Upload,
    Users,
    Zap,
    ArrowRight,
    Github,
    Star,
} from "lucide-react";
import { Link } from "react-router-dom";

const features = [
    {
        icon: Database,
        title: "Project Organization",
        description:
            "Organize your files into logical projects. Each project acts as a separate bucket with its own access controls and settings.",
        gradient: "from-blue-500 to-cyan-500",
    },
    {
        icon: Key,
        title: "API Key Management",
        description:
            "Generate and manage API keys for programmatic access. Set expiration dates and revoke keys when needed.",
        gradient: "from-purple-500 to-pink-500",
    },
    {
        icon: Shield,
        title: "Secure Sharing",
        description:
            "Create time-limited pre-signed URLs for secure file sharing. Control access duration and permissions.",
        gradient: "from-green-500 to-emerald-500",
    },
    {
        icon: Upload,
        title: "File Management",
        description:
            "Upload, download, and manage files with ease. Support for all file types with metadata tracking and organization.",
        gradient: "from-orange-500 to-red-500",
    },
    {
        icon: Users,
        title: "Built-in Authentication",
        description:
            "Secure user authentication and authorization built-in. No need for external auth providers.",
        gradient: "from-indigo-500 to-purple-500",
    },
    {
        icon: Zap,
        title: "Docker Ready",
        description:
            "Deploy anywhere with Docker. Self-hosted solution that gives you complete control over your data and infrastructure.",
        gradient: "from-yellow-500 to-orange-500",
    },
];

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-2">
                            <div className="rounded-lg bg-primary/10 p-2">
                                <Database className="h-6 w-6 text-primary" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                                SGS
                            </span>
                        </div>
                    </div>

                    <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
                        <Link
                            to="#"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Features
                        </Link>
                        <Link
                            to="#"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Documentation
                        </Link>
                    </nav>

                    <div className="flex items-center space-x-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="hidden sm:inline-flex"
                        >
                            <Link to="/login">Sign In</Link>
                        </Button>
                        <Button
                            size="sm"
                            asChild
                            className="shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                            <Link to="/register">
                                Get Started
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative overflow-hidden">
                <div className="container mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-8 py-20">
                        {/* Badge */}
                        <div className="inline-flex items-center rounded-full border px-4 py-2 text-sm bg-muted/50 backdrop-blur-sm">
                            <Star className="mr-2 h-4 w-4 text-yellow-500" />
                            <span className="font-medium">
                                Open Source & Self-Hosted
                            </span>
                        </div>

                        {/* Main Heading */}
                        <div className="space-y-4 max-w-4xl">
                            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                                <span className="bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
                                    Self-Hosted Object Storage
                                </span>
                                <br />
                                <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
                                    Made Simple
                                </span>
                            </h1>
                            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                                A powerful, open-source object storage solution
                                with built-in authentication, project
                                organization, and API key management. Deploy
                                anywhere, own your data.
                            </p>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Button
                                size="lg"
                                asChild
                                className="text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                            >
                                <Link to="/register">
                                    Start Free Today
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                asChild
                                className="text-lg px-8 py-6 hover:bg-muted/50 transition-all duration-300"
                            >
                                {/* <Link to="/docs"> */}
                                <a
                                    href="https://github.com/mrshabel/sgs"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Github className="mr-2 h-5 w-5" />
                                    View on GitHub
                                </a>
                                {/* </Link> */}
                            </Button>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-8 pt-12 text-center">
                            <div className="space-y-2">
                                <div className="text-3xl font-bold text-primary">
                                    100%
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Open Source
                                </div>
                            </div>
                            {/* <div className="space-y-2">
                                <div className="text-3xl font-bold text-primary">
                                    0$
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Forever Free
                                </div>
                            </div> */}
                            <div className="space-y-2">
                                <div className="text-3xl font-bold text-primary">
                                    ∞
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Unlimited Storage
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Background Elements */}
                <div className="absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <div className="h-[800px] w-[800px] rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 blur-3xl opacity-20"></div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 bg-muted/30">
                <div className="container mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center space-y-4 mb-16">
                        <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
                            Everything you need to manage files
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Built with modern technologies and best practices
                            for reliability, security, and performance.
                        </p>
                    </div>

                    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {features.map((feature, index) => (
                            <Card
                                key={index}
                                className="group relative overflow-hidden border-0 bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-all duration-300 hover:scale-105 hover:shadow-xl"
                            >
                                <CardHeader className="space-y-4">
                                    <div
                                        className={`inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r ${feature.gradient} text-white shadow-lg`}
                                    >
                                        <feature.icon className="h-6 w-6" />
                                    </div>
                                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                                        {feature.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription className="text-base leading-relaxed">
                                        {feature.description}
                                    </CardDescription>
                                </CardContent>

                                {/* Hover effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-gradient-to-r from-primary/10 via-background to-secondary/10">
                <div className="container mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center space-y-8">
                        <div className="space-y-4">
                            <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
                                Ready to take control of your data?
                            </h2>
                            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                                Join thousands of developers who trust SGS for
                                their object storage needs. Start your journey
                                to data independence today.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                            <Button
                                size="lg"
                                asChild
                                className="text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                            >
                                <Link to="/register">
                                    Create Your Account
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                asChild
                                className="text-lg px-8 py-6 hover:bg-muted/50 transition-all duration-300"
                            >
                                <a
                                    href="https://github.com/mrshabel/sgs"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Read Documentation
                                </a>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
