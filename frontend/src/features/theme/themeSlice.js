import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isDarkMode: true, // Default to dark mode since that's the current implementation
};

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.isDarkMode = !state.isDarkMode;
      // Save theme preference to localStorage
      localStorage.setItem("isDarkMode", JSON.stringify(state.isDarkMode));
    },
    initializeTheme: (state) => {
      // Get theme from localStorage or use system preference
      const savedTheme = localStorage.getItem("isDarkMode");
      if (savedTheme !== null) {
        state.isDarkMode = JSON.parse(savedTheme);
      } else {
        // Use system preference as fallback
        state.isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
      }
    },
  },
});

export const { toggleTheme, initializeTheme } = themeSlice.actions;
export default themeSlice.reducer; 