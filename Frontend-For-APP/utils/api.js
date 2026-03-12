import { Platform } from "react-native";

// Temporarily bypassing local development to use the live Railway backend
export const getBaseUrl = () => {
  return "https://gym-community-api.up.railway.app";
};

export const API_URL = getBaseUrl();
