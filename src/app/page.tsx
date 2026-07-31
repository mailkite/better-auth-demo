import { Background } from "@/components/background";
import { FAQ } from "@/components/blocks/faq";
import { Features } from "@/components/blocks/features";
import { Hero } from "@/components/blocks/hero";

// Deliberately no Logos / Testimonials / Investors / Pricing blocks. The template
// ships those filled with placeholder companies, invented quotes and fake tiers —
// on a demo whose whole argument is "everything here is real", fabricated social
// proof would undercut the point. What's left is the product and how it works.
export default function Home() {
  return (
    <>
      <Background className="via-muted to-muted/80">
        <Hero />
        <Features />
      </Background>
      <Background variant="bottom">
        <FAQ />
      </Background>
    </>
  );
}
