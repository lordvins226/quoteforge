import { Nav } from "../components/Nav";
import { Footer } from "../components/Footer";
import { Hero } from "../components/Hero";
import { BentoFeatures } from "../components/BentoFeatures";
import { CardGallery } from "../components/CardGallery";
import { Install } from "../components/Install";

export function Landing() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <BentoFeatures />
        <CardGallery />
        <Install />
      </main>
      <Footer />
    </>
  );
}
