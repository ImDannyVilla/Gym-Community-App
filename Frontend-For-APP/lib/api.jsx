import { Platform } from "react-native";

// Expo will automatically swap this value based on your environment
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_BASE_URL) {
    console.warn("API_BASE_URL is missing! Check your .env file.");
}
