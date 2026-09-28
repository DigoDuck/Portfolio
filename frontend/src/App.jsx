import Navbar from '@/components/layout/Navbar'
import HeroSection from '@/components/sections/HeroSection'
import SkillsSection from '@/components/sections/SkillsSection'
import ProjectsSection from '@/components/sections/ProjectsSection'
import MouseGlow from "./components/ui/MouseGlow";
import { prefersReducedMotion } from "@/utils/motion";

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      {!prefersReducedMotion() && <MouseGlow />}
      <main>
        <HeroSection />
        <SkillsSection />
        <ProjectsSection />
      </main>
    </div>
  )
}