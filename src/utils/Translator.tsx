// Example of a language selector component
import React from "react";
import { useTranslation } from "react-i18next";

 export default function LanguageSelector() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng:any) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div>
      <button onClick={() => changeLanguage("en")}>English</button>
      <button onClick={() => changeLanguage("ki")}>Ki</button>
      <button onClick={() => changeLanguage("fr")}>French</button>
   
    </div>
  );
}
