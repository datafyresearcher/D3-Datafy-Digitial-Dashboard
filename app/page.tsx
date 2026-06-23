import Header from "@/components/Header";
import Hero from "@/components/Hero";
import WhoWeAre from "@/components/WhoWeAre";
import SolarServices from "@/components/SolarServices";
import DigitalTwin from "@/components/DigitalTwin";
import TopoMapping from "@/components/TopoMapping";
import WhyChooseUs from "@/components/WhyChooseUs";
import Testimonials from "@/components/Testimonials";
import Partners from "@/components/Partners";
import FAQ from "@/components/FAQ";
import Certifications from "@/components/Certifications";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <Hero />
        <WhoWeAre />
        <SolarServices />
        <DigitalTwin />
        <TopoMapping />
        <WhyChooseUs />
        <Testimonials />
        <Partners />
        <FAQ />
        <Certifications />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
