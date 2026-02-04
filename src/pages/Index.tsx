import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { SiteHeader } from "@/components/site/SiteHeader";
import logoLight from "@/assets/logo-diderot-white.svg";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// Image imports
import heroImage from "@/assets/landing-hero.jpg";
import card1Image from "@/assets/Sect1diderot.jpg";
import card2Image from "@/assets/Sect2diderot.jpg";
import card3Image from "@/assets/Sect3diderot.jpg";
import midSectionImage from "@/assets/landing-mid-section.jpg";
import finalSectionImage from "@/assets/landing-mid-section2.jpg";
import categoryJeans from "@/assets/category-jeans.jpg";
import categorySandals from "@/assets/category-sandals.jpg";
import categoryBlazers from "@/assets/category-blazers.jpg";
import categorySneakers from "@/assets/category-sneakers.jpg";
import categoryJewelry from "@/assets/category-jewelry.jpg";
import collection1 from "@/assets/collection-1.jpg";
import collection2 from "@/assets/collection-2.jpg";
import collection3 from "@/assets/collection-3.jpg";

const CATEGORIES = [
  { name: "Jeans", slug: "jeans", image: categoryJeans },
  { name: "Sandals", slug: "sandals", image: categorySandals },
  { name: "Blazers", slug: "blazers", image: categoryBlazers },
  { name: "Sneakers", slug: "sneakers", image: categorySneakers },
  { name: "Jewelry", slug: "jewelry", image: categoryJewelry },
];

const COLLECTIONS = [
  { name: "Holiday Hosts", image: collection1 },
  { name: "Summer Vibes", image: collection2 },
  { name: "Pool Days", image: collection3 },
];

export default function Index() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Fetch featured creators with caching
  const { data: featuredCreators } = useQuery({
    queryKey: ["featured-creators"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, name, avatar_url, bio, is_verified")
        .limit(8);
      return data || [];
    },
    staleTime: 1000 * 60 * 60, // 1 hour - data changes infrequently
    gcTime: 1000 * 60 * 60 * 24, // 24 hours cache
  });

  const scrollToCreators = () => {
    document.getElementById("creators-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      {/* Hero Section - Full Bleed */}
      <section className="relative h-[85vh] min-h-[600px] overflow-hidden">
        <img
          src={heroImage}
          alt=""
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/45" />

        <div className={`relative z-10 h-full flex items-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="max-w-xl lg:max-w-[600px]">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-sans font-medium text-white leading-[1.1] tracking-[-0.02em] w-full max-w-full">
                Descubra tudo o que seus creators favoritos recomendam.
              </h1>
              <p className="mt-4 sm:mt-6 text-base sm:text-lg text-white/85 leading-relaxed">
                Pins clicáveis. Cupons. Looks completos.
                <br className="hidden sm:block" />
                <span className="sm:hidden"> </span>
                Encontre o produto que você viu em um story, em segundos.
              </p>
              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link to="/auth/signup" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-white text-[#111111] hover:bg-white/90 rounded-full px-6 sm:px-8 h-11 sm:h-12 text-sm font-medium"
                  >
                    Comece agora gratuitamente
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={scrollToCreators}
                  className="w-full sm:w-auto border-white text-white hover:bg-white/10 hover:text-white rounded-full px-6 sm:px-8 h-11 sm:h-12 text-sm font-medium bg-transparent"
                >
                  Conhecer creators
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why People Use Diderot Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-sans font-medium text-[#111111] mb-8 sm:mb-12">
            Por isso as pessoas amam a Diderot
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                image: card1Image,
                title: "Descubra sem esforço",
                text: "Encontre todos os produtos que seus creators indicam em um só lugar sem precisar pedir link por DM.",
              },
              {
                image: card2Image,
                title: "Veja o look completo",
                text: "Posts com pins clicáveis mostram exatamente o que está sendo usado em cada foto.",
              },
              {
                image: card3Image,
                title: "Compre com confiança",
                text: "Cupons, links e recomendações transparentes, direto da fonte dos seus creators preferidos.",
              },
            ].map((card, i) => (
              <div key={i} className="group">
                <div className="aspect-[4/5] rounded-2xl overflow-hidden mb-5 bg-[#F5F5F5]">
                  <img
                    src={card.image}
                    alt={card.title}
                    loading="lazy"
                    width={400}
                    height={500}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-[#111111] mb-2">
                  {card.title}
                </h3>
                <p className="text-sm sm:text-base text-[#525252] leading-relaxed">
                  {card.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Meet New Creators Section */}
      <section id="creators-section" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-3 gap-4 sm:gap-0">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-sans font-medium text-[#111111]">
              Conheça novos Creators
            </h2>
            <Link
              to="/discover/creators"
              className="hidden md:flex items-center text-sm text-[#111111] hover:text-[#525252] transition-colors"
            >
              Conhecer agora
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <p className="text-sm text-[#525252] mb-8">
            Moda, beleza e lifestyle — recomendações reais do dia a dia.
          </p>

          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {(featuredCreators || []).map((creator, i) => (
                <CarouselItem key={creator.id || i} className="pl-4 basis-1/2 md:basis-1/4 lg:basis-1/6">
                  <Link
                    to={`/${creator.username}`}
                    className="block group"
                    aria-label={`Ver perfil de ${creator.name || 'Creator'}`}
                  >
                    <div className="aspect-square rounded-xl overflow-hidden bg-[#F5F5F5] mb-3">
                      {creator.avatar_url ? (
                        <img
                          src={creator.avatar_url}
                          alt={`Foto de ${creator.name || 'Creator'}`}
                          loading="lazy"
                          width={200}
                          height={200}
                          className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#E5E5E5] rounded-xl">
                          <span className="text-4xl font-sans text-[#525252]">
                            {creator.name?.charAt(0) || "?"}
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-medium text-[#111111] truncate">
                      {creator.name || "Creator"}
                    </p>
                    <p className="text-xs text-[#525252]">@{creator.username}</p>
                  </Link>
                </CarouselItem>
              ))}
              {/* Placeholder creators if no data */}
              {(!featuredCreators || featuredCreators.length === 0) &&
                Array.from({ length: 6 }).map((_, i) => (
                  <CarouselItem key={i} className="pl-4 basis-1/2 md:basis-1/4 lg:basis-1/6">
                    <div className="block">
                      <div className="aspect-[3/4] rounded-xl overflow-hidden bg-[#F5F5F5] mb-3" />
                      <div className="h-4 bg-[#F5F5F5] rounded w-24 mb-1" />
                      <div className="h-3 bg-[#F5F5F5] rounded w-16" />
                    </div>
                  </CarouselItem>
                ))
              }
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-4" />
            <CarouselNext className="hidden md:flex -right-4" />
          </Carousel>

          <Link
            to="/discover/creators"
            className="md:hidden flex items-center justify-center text-sm text-[#111111] hover:text-[#525252] transition-colors mt-6"
          >
            Conhecer agora
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Mid-Page CTA Section */}
      <section className="relative py-16 sm:py-24 lg:py-32 overflow-hidden">
        <img
          src={midSectionImage}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-sans font-medium text-white leading-tight">
            Crie. Compartilhe. Descubra.
          </h2>
          <p className="mt-4 sm:mt-6 text-base sm:text-lg text-white/85 px-2 sm:px-0">
            A Diderot é o lugar onde creators organizam suas recomendações e pessoas descobrem produtos de forma simples e visual.
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>
            Se você recomenda coisas boas, aqui é onde isso ganha forma.
          </p>
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link to="/auth/signup" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-white text-[#111111] hover:bg-white/90 rounded-full px-6 sm:px-8 h-11 sm:h-12 text-sm font-medium"
              >
                Comece gratuitamente
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/discover/creators" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-white text-white hover:bg-white/10 hover:text-white rounded-full px-6 sm:px-8 h-11 sm:h-12 text-sm font-medium bg-transparent"
              >
                Explorar creators
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 sm:mb-10 gap-4 sm:gap-0">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-sans font-medium text-[#111111]">
              Procure por categoria
            </h2>
            <Link
              to="/discover"
              className="flex items-center text-sm text-[#111111] hover:text-[#525252] transition-colors"
            >
              Explorar todas
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </div>

          <Carousel
            opts={{
              align: "start",
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {CATEGORIES.map((category) => (
                <CarouselItem key={category.slug} className="pl-4 basis-1/2 md:basis-1/4 lg:basis-1/5">
                  <Link
                    to={`/discover/${category.slug}`}
                    className="block group"
                    aria-label={`Ver categoria ${category.name}`}
                  >
                    <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-[#F5F5F5] mb-4">
                      <img
                        src={category.image}
                        alt={`Categoria ${category.name}`}
                        loading="lazy"
                        width={300}
                        height={400}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <p className="text-xs text-[#525252] mb-1">Shop</p>
                    <p className="text-base font-medium text-[#111111]">
                      {category.name}
                    </p>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-4" />
            <CarouselNext className="hidden md:flex -right-4" />
          </Carousel>
        </div>
      </section>

      {/* Collections Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 sm:mb-3">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-sans font-medium text-[#111111]">
              Procure por Coleções
            </h2>
            <p className="text-xs sm:text-sm text-[#525252] mt-2">
              Infraestrutura completa para creators monetizarem.
            </p>
          </div>

          <Carousel
            opts={{
              align: "start",
            }}
            className="w-full mt-8"
          >
            <CarouselContent className="-ml-4">
              {COLLECTIONS.map((collection, i) => (
                <CarouselItem key={i} className="pl-4 basis-1/2 md:basis-1/4 lg:basis-1/5">
                  <Link
                    to="#"
                    className="block group relative"
                    aria-label={`Ver coleção ${collection.name}`}
                  >
                    <div className="aspect-[3/4] rounded-2xl overflow-hidden relative">
                      <img
                        src={collection.image}
                        alt={`Coleção ${collection.name}`}
                        loading="lazy"
                        width={300}
                        height={400}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-2xl pointer-events-none" />
                      <div className="absolute bottom-4 left-4 right-4 z-10">
                        <p className="text-white font-semibold text-lg leading-tight">
                          {collection.name}
                        </p>
                      </div>
                    </div>
                  </Link>
                </CarouselItem>
              ))}
              {/* Duplicate for more items */}
              {COLLECTIONS.map((collection, i) => (
                <CarouselItem key={`dup-${i}`} className="pl-4 basis-1/2 md:basis-1/4 lg:basis-1/5">
                  <Link
                    to="#"
                    className="block group relative"
                    aria-label={`Ver coleção ${collection.name}`}
                  >
                    <div className="aspect-[3/4] rounded-2xl overflow-hidden relative">
                      <img
                        src={collection.image}
                        alt={`Coleção ${collection.name}`}
                        loading="lazy"
                        width={300}
                        height={400}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-2xl pointer-events-none" />
                      <div className="absolute bottom-4 left-4 right-4 z-10">
                        <p className="text-white font-semibold text-lg leading-tight">
                          {collection.name}
                        </p>
                      </div>
                    </div>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-4" />
            <CarouselNext className="hidden md:flex -right-4" />
          </Carousel>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-16 sm:py-24 lg:py-32 overflow-hidden">
        <img
          src={finalSectionImage}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-sans font-medium text-white leading-tight">
            As melhores coisas da vida merecem ser compartilhadas.
          </h2>
          <p className="mt-4 sm:mt-6 text-base sm:text-lg text-white/85 px-2 sm:px-0">
            Encontre o produto que você viu em um story em segundos.
          </p>
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link to="/auth/signup" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-white text-[#111111] hover:bg-white/90 rounded-full px-6 sm:px-8 h-11 sm:h-12 text-sm font-medium"
              >
                Comece gratuitamente
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/onboarding/creator" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-white text-white hover:bg-white/10 hover:text-white rounded-full px-6 sm:px-8 h-11 sm:h-12 text-sm font-medium bg-transparent"
              >
                Criar minha loja
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#111111] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 md:gap-8">
            {/* Brand Column */}
            <div className="md:col-span-1">
              <Link to="/" className="inline-block">
                <img src={logoLight} alt="Diderot" className="h-6 w-auto" />
              </Link>
              <p className="text-sm text-white/60 mt-3">
                © 2024 Diderot ®
              </p>
              <p className="text-sm text-white/60">
                contato@diderot.com.br
              </p>
              <div className="flex gap-4 mt-4">
                <a href="https://www.instagram.com/shopdiderot/" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a href="#" className="text-white/60 hover:text-white transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Diderot Column */}
            <div>
              <h4 className="font-medium text-sm mb-4">Diderot</h4>
              <ul className="space-y-3 text-sm text-white/60">
                <li><Link to="/about" className="hover:text-white transition-colors">Sobre</Link></li>
                <li><Link to="/discover/creators" className="hover:text-white transition-colors">Creators</Link></li>
                <li><Link to="/me/feed" className="hover:text-white transition-colors">Feed</Link></li>
              </ul>
            </div>

            {/* Soluções Column */}
            <div>
              <h4 className="font-medium text-sm mb-4">Soluções</h4>
              <ul className="space-y-3 text-sm text-white/60">
                <li><Link to="#" className="hover:text-white transition-colors">Para creators</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Para marcas</Link></li>
              </ul>
            </div>

            {/* CTA Column */}
            <div>
              <Link to="/auth/signup">
                <Button
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white hover:text-black rounded-full px-6 text-sm bg-transparent"
                >
                  Fale com a gente
                </Button>
              </Link>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="flex flex-col md:flex-row justify-between items-center mt-16 pt-8 border-t border-white/10">
            <p className="text-xs text-white/40">
              © 2024 Diderot. Todos os direitos reservados. Termos e condições de uso.
            </p>
            <div className="flex gap-6 mt-4 md:mt-0 text-xs text-white/40">
              <span>Acessibilidade</span>
              <span>Desenvolvido por Diderot</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
