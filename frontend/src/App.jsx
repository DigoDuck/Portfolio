import Navbar from '@/components/layout/Navbar'
import HeroSection from '@/components/sections/HeroSection'
import ProjectsSection from '@/components/sections/ProjectsSection'
import AboutSection from '@/components/sections/AboutSection'
import SkillsSection from '@/components/sections/SkillsSection'
import ContactSection from '@/components/sections/ContactSection'
import { useProfile } from '@/hooks/useProfile'

export default function App() {
  // Uma busca só: hero, sobre, contato e navbar leem o mesmo perfil.
  const { data: profile, loading, error } = useProfile()

  return (
    <>
      <Navbar name={profile?.full_name} />
      <main id="main">
        <HeroSection profile={profile} loading={loading} error={error} />
        <ProjectsSection />
        <AboutSection profile={profile} />
        <SkillsSection />
      </main>
      <ContactSection profile={profile} />
    </>
  )
}
