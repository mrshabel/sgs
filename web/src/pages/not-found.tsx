"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Database, Home, Search, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

export default function NotFoundPage() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl animate-pulse delay-500" />
            </div>

            <Card
                className={`relative max-w-4xl w-full border-0 bg-white/80 backdrop-blur-xl shadow-2xl dark:bg-slate-900/80 transition-all duration-1000 ${
                    mounted
                        ? "opacity-100 translate-y-0 scale-100"
                        : "opacity-0 translate-y-8 scale-95"
                }`}
            >
                {/* Gradient Border Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-violet-500/20 to-primary/20 rounded-xl blur-sm opacity-75" />

                <CardContent className="relative p-12 text-center">
                    {/* Logo Section */}
                    <div className="flex justify-center mb-8">
                        <div className="relative">
                            <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-primary to-primary/70 opacity-75 blur-lg animate-pulse" />
                            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-primary to-primary/70 shadow-xl">
                                <Database className="h-8 w-8 text-white" />
                            </div>
                        </div>
                    </div>

                    {/* 404 Text */}
                    <div className="mb-8">
                        <h1 className="text-8xl md:text-9xl font-black bg-gradient-to-r from-primary via-violet-600 to-primary bg-clip-text text-transparent mb-4 tracking-tight">
                            404
                        </h1>
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                            <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent dark:from-white dark:to-slate-300">
                                Page Not Found
                            </h2>
                            <Sparkles className="h-5 w-5 text-primary animate-pulse delay-500" />
                        </div>
                        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                            Oops! The page you're looking for seems to have
                            wandered off into the digital void. Don't worry,
                            even the best storage systems have their mysteries.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                        <Button
                            asChild
                            size="lg"
                            className="h-12 px-8 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
                        >
                            <Link to="/dashboard">
                                <Database className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                                Go to Dashboard
                            </Link>
                        </Button>

                        <Button
                            asChild
                            variant="outline"
                            size="lg"
                            className="h-12 px-8 border-slate-200/50 hover:bg-primary/5 hover:border-primary/30 transition-all duration-300 hover:scale-105 group dark:border-slate-700/50"
                        >
                            <Link to="/">
                                <Home className="h-5 w-5 mr-2 group-hover:-translate-y-0.5 transition-transform duration-300" />
                                Back to Home
                            </Link>
                        </Button>
                    </div>

                    {/* Quick Links */}
                    <div className="border-t border-slate-200/50 dark:border-slate-700/50 pt-8">
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                            Or try one of these popular destinations:
                        </p>
                        <div className="flex flex-wrap justify-center gap-3">
                            <Button
                                asChild
                                variant="ghost"
                                size="sm"
                                className="hover:bg-primary/10 hover:text-primary transition-all duration-300 group"
                            >
                                <Link to="/dashboard/projects/new">
                                    <span className="group-hover:scale-110 transition-transform duration-300">
                                        📁
                                    </span>
                                    <span className="ml-2">New Project</span>
                                </Link>
                            </Button>

                            <Button
                                asChild
                                variant="ghost"
                                size="sm"
                                className="hover:bg-primary/10 hover:text-primary transition-all duration-300 group"
                            >
                                <Link to="/dashboard/api-keys">
                                    <span className="group-hover:scale-110 transition-transform duration-300">
                                        🔑
                                    </span>
                                    <span className="ml-2">API Keys</span>
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Fun Footer */}
                    <div className="mt-8 pt-6 border-t border-slate-200/30 dark:border-slate-700/30">
                        <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-2">
                            <Search className="h-3 w-3" />
                            Lost in the cloud? We've all been there.
                            <span className="animate-bounce">☁️</span>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
