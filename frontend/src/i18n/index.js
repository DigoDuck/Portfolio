import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { useAppStore } from '../store/useAppStore';
import pt from './locales/pt.json';
import en from './locales/en.json';

// O idioma vive no store (persistido pelo zustand). O i18next é derivado dele:
// nasce com o idioma reidratado e acompanha cada troca pelo subscribe, então
// nenhum componente precisa lembrar de sincronizar os dois na mão.
const initialLang = useAppStore.getState().lang;

i18n.use(initReactI18next)
    .init({
        resources: { pt: { translation: pt }, en: { translation: en } },
        lng: initialLang,
        fallbackLng: 'pt',
        interpolation: { escapeValue: false },
    });

document.documentElement.lang = initialLang;

useAppStore.subscribe((state, prev) => {
    if (state.lang === prev.lang) return;
    i18n.changeLanguage(state.lang);
    document.documentElement.lang = state.lang;
});

export default i18n;
