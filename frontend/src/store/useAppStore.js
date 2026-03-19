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

                setLang: (lang) => set({ lang }),
                toggleLang: () =>
                    set((state) => ({ lang: state.lang === 'pt' ? 'en' : 'pt' })),
            }),
            {
                name: 'portfolio-preferences',
                onRehydrateStorage: () => (state) => {
                    if (state) {
                        document.documentElement.classList.toggle('dark', state.theme === 'dark')
                    }
                }
            }
        )
    )