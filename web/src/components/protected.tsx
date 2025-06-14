import type React from "react";
import { useAuth } from "@/contexts/auth-context";
import { Navigate, useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Database } from "lucide-react";

interface ProtectedRouteProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
    const { user, isLoading, isAuthenticated } = useAuth();
    const location = useLocation();

    // Show loading state
    if (isLoading) {
        return (
            fallback || (
                <div className="min-h-screen flex items-center justify-center bg-muted/50">
                    <Card className="w-full max-w-md">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Database className="h-8 w-8 animate-pulse mb-4 text-primary" />
                            <p className="text-muted-foreground">Loading...</p>
                        </CardContent>
                    </Card>
                </div>
            )
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated || !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}

// Higher-order component version
export function WithAuth<P extends object>(Component: React.ComponentType<P>) {
    return function AuthenticatedComponent(props: P) {
        return (
            <ProtectedRoute>
                <Component {...props} />
            </ProtectedRoute>
        );
    };
}
