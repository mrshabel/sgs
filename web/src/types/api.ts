export interface User {
    id: string;
    username: string;
    fullName?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Project {
    id: string;
    ownerId: string;
    bucket: string;
    createdAt: string;
    updatedAt: string;
    fileCount?: number;
    totalFileSize?: number;
}

export interface AppFile {
    id: string;
    filename: string;
    objectName: string;
    projectId: string;
    size: number;
    contentType: string;
    uploadedBy: string;
    createdAt: string;
    bucket?: string;
}

export interface APIKey {
    id: string;
    token: string;
    name: string;
    projectId: string;
    userId: string;
    expiresAt: string;
    revokedAt?: string;
    createdAt: string;
    projectBucket?: string;
}

export interface DashboardStats {
    totalProjects: number;
    totalFiles: number;
    totalSize: number;
    activeAPIKeys: number;
    storageUsed: string;
}

export interface APIResponse<T = any> {
    message: string;
    data?: T;
    errors?: any;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    password: string;
    fullName?: string;
}

export interface CreateProjectRequest {
    bucket: string;
    ownerId: string;
}

export interface CreateAPIKeyRequest {
    name: string;
    expiresAt: string;
}
