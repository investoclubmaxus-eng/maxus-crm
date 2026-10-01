import { useEffect, useState } from "react";

const STORAGE_KEY = "maxus-super-admin-theme"; 

export default function useTheme() {
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem(STORAGE_KEY);

        if (savedTheme === "dark" || savedTheme === "light") {
            return savedTheme;
        }

        return "light";
    });

    useEffect(() => {
        const root = document.documentElement;

        root.setAttribute("data-theme", theme);

        localStorage.setItem(STORAGE_KEY, theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((currentTheme) =>
            currentTheme === "light" ? "dark" : "light"
        );
    };

    return {
        theme,
        setTheme,
        toggleTheme,
        isDark: theme === "dark",
    };
}