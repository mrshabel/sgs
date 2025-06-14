import { Routes, Route, BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "@/contexts/auth-context";
import { Toaster } from "sonner";

// Pages
import HomePage from "@/pages/home";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import DashboardPage from "@/pages/dashboard";
import NewProjectPage from "@/pages/new-project";
import APIKeysPage from "@/pages/api-key";
import ProjectDetailPage from "@/pages/project-detail";
import NotFoundPage from "@/pages/not-found";

export default function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route
                        path="/dashboard/api-keys"
                        element={<APIKeysPage />}
                    />
                    <Route
                        path="/dashboard/projects/new"
                        element={<NewProjectPage />}
                    />
                    <Route
                        path="/dashboard/projects/:id"
                        element={<ProjectDetailPage />}
                    />
                    <Route path="*" element={<NotFoundPage />} />
                </Routes>
                <Toaster richColors />
            </AuthProvider>
        </Router>
    );
}
