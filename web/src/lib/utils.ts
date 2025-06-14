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
