import axios, { type AxiosInstance, type AxiosResponse } from "axios";
import type {
    APIResponse,
    User,
    Project,
    AppFile,
    APIKey,
    LoginRequest,
    RegisterRequest,
    CreateProjectRequest,
    CreateAPIKeyRequest,
    DashboardStats,
} from "@/types/api";

// Local storage keys
const AUTH_TOKEN_KEY = "sgs_auth_token";

class APIClient {
    private client: AxiosInstance;
    private token: string | null = null;

    constructor(baseURL: string = import.meta.env.VITE_API_URL) {
        this.client = axios.create({
            baseURL,
            // 30 seconds timeout
            timeout: 30000,
            headers: {
                "Content-Type": "application/json",
            },
        });

        // Load token from localStorage on initialization
        this.token = localStorage.getItem(AUTH_TOKEN_KEY);
        if (this.token) {
            this.setAuthHeader(this.token);
        }

        // Request interceptor to add auth header and handle requests
        this.client.interceptors.request.use(
            (config) => {
                if (this.token && config.headers) {
                    config.headers.Authorization = `Bearer ${this.token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Response interceptor for error handling and token management
        this.client.interceptors.response.use(
            (response: AxiosResponse) => response,
            (error) => {
                // Handle 401 Unauthorized - clear token and redirect to login
                if (error.response?.status === 401) {
                    this.clearToken();
                }

                // Handle network errors
                if (!error.response) {
                    console.error("Network error:", error.message);
                }

                return Promise.reject(error);
            }
        );
    }

    private setAuthHeader(token: string) {
        this.client.defaults.headers.common[
            "Authorization"
        ] = `Bearer ${token}`;
    }

    private removeAuthHeader() {
        delete this.client.defaults.headers.common["Authorization"];
    }

    // Token management
    setToken(token: string) {
        this.token = token;
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        this.setAuthHeader(token);
    }

    clearToken() {
        this.token = null;
        localStorage.removeItem(AUTH_TOKEN_KEY);
        this.removeAuthHeader();
    }

    getToken(): string | null {
        return this.token;
    }

    isAuthenticated(): boolean {
        return !!this.token;
    }

    // Auth endpoints
    async register(
        data: RegisterRequest
    ): Promise<APIResponse<{ user: User; token: string }>> {
        try {
            const response = await this.client.post("/auth/register", data);
            return response.data;
        } catch (error) {
            throw this.handleError(error, "Registration failed");
        }
    }

    async login(
        data: LoginRequest
    ): Promise<APIResponse<{ user: User; token: string }>> {
        try {
            const response = await this.client.post("/auth/login", data);
            return response.data;
        } catch (error) {
            throw this.handleError(error, "Login failed");
        }
    }

    async logout() {
        this.clearToken();
    }

    async getCurrentUser(): Promise<APIResponse<User>> {
        try {
            const response = await this.client.get("/auth/me");
            return response.data;
        } catch (error) {
            throw this.handleError(error, "Failed to get current user");
        }
    }

    // Project endpoints
    async getProjects(): Promise<APIResponse<Project[]>> {
        try {
            const response = await this.client.get("/projects");
            return response.data;
        } catch (error) {
            throw this.handleError(error, "Failed to fetch projects");
        }
    }

    async getProject(projectId: string): Promise<APIResponse<Project>> {
        try {
            const response = await this.client.get(`/projects/${projectId}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error, "Failed to fetch project");
        }
    }

    async createProject(
        data: CreateProjectRequest
    ): Promise<APIResponse<Project>> {
        try {
            const response = await this.client.post("/projects", data);
            return response.data;
        } catch (error) {
            throw this.handleError(error, "Failed to create project");
        }
    }

    async updateProject(
        projectId: string,
        data: Partial<CreateProjectRequest>
    ): Promise<APIResponse<Project>> {
        try {
            const response = await this.client.patch(
                `/projects/${projectId}`,
                data
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error, "Failed to update project");
        }
    }

    async deleteProject(projectId: string): Promise<APIResponse<void>> {
        try {
            const response = await this.client.delete(`/projects/${projectId}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error, "Failed to delete project");
        }
    }

    // File endpoints
    async getProjectFiles(projectId: string): Promise<APIResponse<AppFile[]>> {
        try {
            const response = await this.client.get(
                `/projects/${projectId}/files/meta`
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error, "Failed to fetch project files");
        }
    }

    async uploadFile(
        projectId: string,
        file: File,
        onProgress?: (progress: number) => void
    ): Promise<APIResponse<AppFile>> {
        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await this.client.post(
                `/projects/${projectId}/files`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                    onUploadProgress: (progressEvent) => {
                        if (progressEvent.total && onProgress) {
                            const progress = Math.round(
                                (progressEvent.loaded / progressEvent.total) *
                                    100
                            );
                            onProgress(progress);
                        }
                    },
                    // 5 minutes for life uploads
                    timeout: 300000,
                }
            );

            return response.data;
        } catch (error) {
            throw this.handleError(error, "File upload failed");
        }
    }

    async uploadMultipleFiles(
        projectId: string,
        files: File[],
        onProgress?: (fileIndex: number, progress: number) => void
    ): Promise<APIResponse<AppFile[]>> {
        try {
            const uploadPromises = files.map((file, index) =>
                this.uploadFile(projectId, file, (progress) => {
                    onProgress?.(index, progress);
                })
            );

            const results = await Promise.all(uploadPromises);
            return {
                message: "Files uploaded successfully",
                data: results
                    .map((result) => result.data)
                    .filter(Boolean) as AppFile[],
            };
        } catch (error) {
            throw this.handleError(error, "Multiple file upload failed");
        }
    }

    async downloadFile(fileId: string): Promise<Blob> {
        try {
            const response = await this.client.get(
                `/files/${fileId}/download`,
                {
                    responseType: "blob",
                    // 5 minutes timeout for downloads
                    timeout: 300000,
                }
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error, "File download failed");
        }
    }

    async getFileDownloadUrl(
        fileId: string
    ): Promise<APIResponse<{ url: string; expiresAt: string }>> {
        try {
            const response = await this.client.get(
                `/files/${fileId}/download-url`
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error, "Failed to get download URL");
        }
    }

    async deleteFile(fileId: string): Promise<APIResponse<void>> {
        try {
            const response = await this.client.delete(`/files/${fileId}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error, "Failed to delete file");
        }
    }

    async getFileMetadata(fileId: string): Promise<APIResponse<File>> {
        try {
            const response = await this.client.get(`/files/${fileId}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error, "Failed to get file metadata");
        }
    }

    async updateFileMetadata(
        fileId: string,
        data: { filename?: string }
    ): Promise<APIResponse<File>> {
        try {
            const response = await this.client.patch(`/files/${fileId}`, data);
            return response.data;
        } catch (error) {
            throw this.handleError(error, "Failed to update file metadata");
        }
    }

    // File sharing endpoints
    async createShareLink(
        fileId: string,
        options: { expiresIn?: string; password?: string } = {}
    ): Promise<
        APIResponse<{ url: string; expiresAt: string; shareId: string }>
    > {
        try {
            const response = await this.client.post(
                `/files/${fileId}/share`,
                options
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error, "Failed to create share link");
        }
    }

    async revokeShareLink(
        fileId: string,
        shareId: string
    ): Promise<APIResponse<void>> {
        try {
            const response = await this.client.delete(
                `/files/${fileId}/share/${shareId}`
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error, "Failed to revoke share link");
        }
    }

    // API Key endpoints
    async getAPIKeys(): Promise<APIResponse<APIKey[]>> {
        try {
            const response = await this.client.get("/api-keys/me");
            return response.data;
        } catch (error) {
            throw this.handleError(error, "Failed to fetch API keys");
        }
    }

    async getAPIKey(keyId: string): Promise<APIResponse<APIKey>> {
        try {
            const response = await this.client.get(`/api-keys/${keyId}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error, "Failed to fetch API key");
        }
    }

    async createAPIKey(
        projectId: string,
        data: CreateAPIKeyRequest
    ): Promise<APIResponse<APIKey & { token: string }>> {
        try {
            const response = await this.client.post(
                `projects/${projectId}/api-keys`,
                data
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error, "Failed to create API key");
        }
    }

    async updateAPIKey(
        keyId: string,
        data: { name?: string }
    ): Promise<APIResponse<APIKey>> {
        try {
            const response = await this.client.patch(
                `/api-keys/${keyId}`,
                data
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error, "Failed to update API key");
        }
    }

    async revokeAPIKey(keyId: string): Promise<APIResponse<void>> {
        try {
            const response = await this.client.patch(
                `/api-keys/${keyId}/revoke`
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error, "Failed to revoke API key");
        }
    }

    async deleteAPIKey(keyId: string): Promise<APIResponse<void>> {
        try {
            const response = await this.client.delete(`/api-keys/${keyId}`);
            return response.data;
        } catch (error) {
            throw this.handleError(error, "Failed to delete API key");
        }
    }

    // Statistics endpoints
    async getProjectStats(projectId: string): Promise<
        APIResponse<{
            totalFiles: number;
            totalSize: number;
            fileTypes: Record<string, number>;
            recentActivity: Array<{
                action: string;
                timestamp: string;
                filename?: string;
            }>;
        }>
    > {
        try {
            const response = await this.client.get(
                `/projects/${projectId}/stats`
            );
            return response.data;
        } catch (error) {
            throw this.handleError(error, "Failed to fetch project statistics");
        }
    }

    async getDashboardStats(): Promise<APIResponse<DashboardStats>> {
        try {
            const response = await this.client.get("/dashboard/stats");
            return response.data;
        } catch (error) {
            throw this.handleError(
                error,
                "Failed to fetch dashboard statistics"
            );
        }
    }

    // Health check
    async healthCheck(): Promise<
        APIResponse<{ status: string; timestamp: string }>
    > {
        try {
            const response = await this.client.get("/health");
            return response.data;
        } catch (error) {
            throw this.handleError(error, "Health check failed");
        }
    }

    // Error handling helper
    private handleError(error: any, defaultMessage: string): Error {
        if (axios.isAxiosError(error)) {
            const message =
                error.response?.data?.message ||
                error.message ||
                defaultMessage;
            const status = error.response?.status;

            // Create a more detailed error
            const enhancedError = new Error(message);
            (enhancedError as any).status = status;
            (enhancedError as any).response = error.response?.data;

            return enhancedError;
        }

        return new Error(defaultMessage);
    }

    // Utility methods
    async testConnection(): Promise<boolean> {
        try {
            await this.healthCheck();
            return true;
        } catch {
            return false;
        }
    }

    getBaseURL(): string {
        return this.client.defaults.baseURL || "";
    }

    // File helper methods
    formatFileSize(bytes: number): string {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${
            sizes[i]
        }`;
    }

    getFileIcon(contentType: string): string {
        if (contentType.startsWith("image/")) return "image";
        if (contentType.startsWith("video/")) return "video";
        if (contentType.startsWith("audio/")) return "audio";
        if (contentType.includes("pdf")) return "pdf";
        if (contentType.includes("zip") || contentType.includes("rar"))
            return "archive";
        if (contentType.includes("text") || contentType.includes("document"))
            return "document";
        return "file";
    }
}

// Create and export singleton instance
export const apiClient = new APIClient();

// Export types for convenience
export * from "@/types/api";

// Export the class for testing or multiple instances
export { APIClient };
