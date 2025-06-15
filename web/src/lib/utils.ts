import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function getCurrentGreeting() {
    const hour = new Date().getHours();
    let period = "morning";
    if (0 < hour && hour < 12) {
        period = "morning";
    } else if (12 < hour && hour < 16) {
        period = "afternoon";
    } else if (16 < hour && hour < 24) {
        period = "evening";
    }

    return `Good ${period}`;
}

export function getExpirationDate(option: string) {
    const now = new Date();
    switch (option) {
        case "30d":
            return new Date(
                now.getTime() + 30 * 24 * 60 * 60 * 1000
            ).toISOString();
        case "90d":
            return new Date(
                now.getTime() + 90 * 24 * 60 * 60 * 1000
            ).toISOString();
        case "6m":
            return new Date(
                now.getTime() + 6 * 30 * 24 * 60 * 60 * 1000
            ).toISOString();
        case "1y":
            return new Date(
                now.getTime() + 365 * 24 * 60 * 60 * 1000
            ).toISOString();
        case "never":
            return new Date("2099-12-31T23:59:59Z").toISOString();
        default:
            // 1 year
            return new Date(
                now.getTime() + 365 * 24 * 60 * 60 * 1000
            ).toISOString();
    }
}
