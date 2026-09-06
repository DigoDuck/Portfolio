import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAppStore = create(
    persist(
        (set) => ({
            theme: 'dark', // tema principal é o dark

            toggleTheme: () =>
                set((state) => {
                    const newTheme = state.theme === 'dark' ? 'light' : 'dark'
                    document.documentElement.classList.toggle('dark', newTheme === 'dark')
                    return { theme: newTheme }
                }),

            lang: 'pt',

            // O store é a fonte única do idioma. Quem precisa reagir (i18next,
            // <html lang>, o interceptor do axios) lê daqui, e não o contrário.
            setLang: (lang) => set({ lang }),
            toggleLang: () =>
                set((state) => ({ lang: state.lang === 'pt' ? 'en' : 'pt' })),
        }),
        {
            name: 'portfolio-preferences',
            onRehydrateStorage: () => (_state, error) => {
                // Preferências corrompidas não podem derrubar o boot, mas também
                // não somem em silêncio: o app segue com os padrões e avisa.
                if (error) {
                    console.warn(
                        'portfolio-preferences: preferências salvas inválidas, usando os padrões.',
                        error,
                    )
                }
            },
        },
    ),
)

// O persist do zustand reidrata de forma síncrona, então na avaliação do módulo
// getState() já traz o tema efetivo (o do storage ou o padrão, quando o storage
// estava inválido). Aplicar aqui garante a classe antes da primeira renderização
// sem ninguém precisar reler o localStorage na mão.
document.documentElement.classList.toggle(
    'dark',
    useAppStore.getState().theme === 'dark',
)
