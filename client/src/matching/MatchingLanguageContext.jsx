import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import translations from "./translations";

const STORAGE_KEY = "queenb-matching-language";

const MatchingLanguageContext = createContext(null);

function readStoredLanguage() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "he" || stored === "en") return stored;
  } catch {
    // Ignore storage access errors (private mode, etc.)
  }
  return "en";
}

export function MatchingLanguageProvider({ children }) {
  const [language, setLanguageState] = useState(readStoredLanguage);

  const setLanguage = useCallback((next) => {
    setLanguageState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore storage write errors
    }
  }, []);

  const value = useMemo(() => {
    const dir = language === "he" ? "rtl" : "ltr";
    const t = translations[language] || translations.en;
    return { language, setLanguage, dir, t };
  }, [language, setLanguage]);

  return (
    <MatchingLanguageContext.Provider value={value}>
      {children}
    </MatchingLanguageContext.Provider>
  );
}

export function useMatchingLanguage() {
  const context = useContext(MatchingLanguageContext);
  if (!context) {
    throw new Error(
      "useMatchingLanguage must be used within MatchingLanguageProvider"
    );
  }
  return context;
}
