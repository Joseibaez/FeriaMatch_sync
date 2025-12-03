import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import Roles from "@/components/landing/Roles";
import Footer from "@/components/landing/Footer";

// Main landing page for FeriaMatch
const Index = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <section id="features">
          <Features />
        </section>
        <section id="roles">
          <Roles />
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
