import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-sans font-medium text-[#111111] mb-6 leading-tight">
            Sobre a Diderot
          </h1>
          <p className="text-lg text-[#525252] leading-relaxed mb-8">
            A Diderot é o marketplace dos creators. Um lugar onde creators organizam suas recomendações 
            e pessoas descobrem produtos de forma simples e visual.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#F5F5F5]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-sans font-medium text-[#111111] mb-6">
            Nossa Missão
          </h2>
          <p className="text-base text-[#525252] leading-relaxed mb-4">
            Conectar creators e suas audiências de forma mais direta e transparente. Acreditamos que 
            as melhores recomendações vêm de pessoas reais, e queremos facilitar essa conexão.
          </p>
          <p className="text-base text-[#525252] leading-relaxed">
            Criamos uma plataforma onde creators podem organizar suas recomendações com pins clicáveis, 
            cupons exclusivos e looks completos, enquanto seus seguidores descobrem produtos de forma 
            rápida e intuitiva.
          </p>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-sans font-medium text-[#111111] mb-8">
            Nossos Valores
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-[#111111] mb-3">
                Transparência
              </h3>
              <p className="text-sm text-[#525252] leading-relaxed">
                Acreditamos em recomendações transparentes e honestas. Todos os links e cupons são 
                claramente identificados.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#111111] mb-3">
                Simplicidade
              </h3>
              <p className="text-sm text-[#525252] leading-relaxed">
                Facilitamos a descoberta de produtos. Encontre o que você viu em um story em segundos, 
                sem precisar pedir link por DM.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#111111] mb-3">
                Comunidade
              </h3>
              <p className="text-sm text-[#525252] leading-relaxed">
                Construímos uma comunidade onde creators e suas audiências se conectam de forma 
                autêntica e significativa.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#111111] mb-3">
                Inovação
              </h3>
              <p className="text-sm text-[#525252] leading-relaxed">
                Estamos sempre buscando novas formas de melhorar a experiência de descoberta e 
                recomendação de produtos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-sans font-medium text-[#111111] mb-4">
            Faça parte da Diderot
          </h2>
          <p className="text-base text-[#525252] mb-8">
            Se você é creator ou está procurando recomendações autênticas, venha fazer parte da nossa comunidade.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth/signup">
              <Button 
                size="lg" 
                className="bg-[#111111] text-white hover:bg-[#111111]/90 rounded-full px-8 h-12 text-sm font-medium"
              >
                Comece gratuitamente
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/discover/creators">
              <Button 
                size="lg" 
                variant="outline" 
                className="border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-white rounded-full px-8 h-12 text-sm font-medium"
              >
                Explorar creators
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}



