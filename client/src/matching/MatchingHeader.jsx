import React from "react";
import AppNavbar from "../components/AppNavbar";
import { useMatchingLanguage } from "./MatchingLanguageContext";

/**
 * Matching/mentor page header — shared AppNavbar + language toggle.
 */
function MatchingHeader() {
  const { language, setLanguage, t } = useMatchingLanguage();

  return (
    <AppNavbar
      language={language}
      onLanguageChange={setLanguage}
      languageAria={t.languageAria}
    />
  );
}

export default MatchingHeader;
