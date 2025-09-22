"use client"

import { PublicHeader } from "@/components/landing/public-header"
import { HeroSection } from "@/components/landing/hero-section"
import { ServicesSection } from "@/components/landing/services-section"
import { PoliciesSection } from "@/components/landing/policies-section"
import { TestimonialsSection } from "@/components/landing/testimonials-section"
import { PublicFooter } from "@/components/landing/public-footer"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main>
        <HeroSection />
        <ServicesSection />
        <PoliciesSection />
        <TestimonialsSection />
      </main>
      <PublicFooter />
    </div>
  )
}
