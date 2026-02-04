# Guia de Configuração do Cloudinary CDN

## Por que usar Cloudinary?

O Cloudinary oferece:
- ✅ Otimização automática de imagens (WebP, AVIF)
- ✅ Redimensionamento responsivo automático
- ✅ CDN global com cache
- ✅ Transformações on-the-fly
- ✅ Plano gratuito generoso (25GB/mês)

---

## Passo 1: Criar Conta no Cloudinary

1. Acesse: https://cloudinary.com/users/register_free
2. Crie uma conta gratuita
3. Anote suas credenciais:
   - **Cloud Name**: `dxxxxxxxx`
   - **API Key**: `123456789012345`
   - **API Secret**: `xxxxxxxxxxxxxxxxx`

---

## Passo 2: Adicionar Variáveis de Ambiente

Adicione no arquivo `.env`:

```env
# Cloudinary CDN
VITE_CLOUDINARY_CLOUD_NAME=seu_cloud_name_aqui
VITE_CLOUDINARY_API_KEY=sua_api_key_aqui
VITE_CLOUDINARY_API_SECRET=seu_api_secret_aqui
```

**⚠️ IMPORTANTE:** Adicione também no Vercel/Netlify Dashboard:
- Settings → Environment Variables
- Adicione as 3 variáveis acima

---

## Passo 3: Fazer Upload das Imagens para o Cloudinary

### Opção A: Upload Manual (Recomendado para começar)

1. Acesse: https://console.cloudinary.com/console/media_library
2. Clique em "Upload"
3. Faça upload das imagens:
   - `landing-hero.webp` → Renomeie para `diderot/landing-hero`
   - `landing-mid-section.jpg` → `diderot/landing-mid-section`
   - `landing-mid-section2.jpg` → `diderot/landing-mid-section2`
   - Categorias e coleções também

### Opção B: Upload via CLI (Avançado)

```bash
npm install -g cloudinary-cli
cloudinary config
cloudinary upload src/assets/landing-hero.webp -f diderot/landing-hero
```

---

## Passo 4: Atualizar o Código para Usar Cloudinary

Edite `src/lib/imageOptimization.ts`:

```typescript
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

export function optimizeImage(
  url: string,
  options: ImageOptions = {}
): string {
  // Se for uma imagem local/estática, use Cloudinary
  if (url.startsWith('/') || url.includes('assets')) {
    const imageName = url.split('/').pop()?.replace(/\.(jpg|png|webp)$/, '');
    
    if (!CLOUDINARY_CLOUD_NAME) return url;
    
    const { width, height, quality = 'auto', format = 'auto' } = options;
    
    let transformations = `f_${format},q_${quality}`;
    if (width) transformations += `,w_${width}`;
    if (height) transformations += `,h_${height}`;
    
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transformations}/diderot/${imageName}`;
  }
  
  return url;
}
```

---

## Passo 5: Testar

Após configurar, as imagens serão automaticamente:
- Convertidas para WebP/AVIF
- Redimensionadas conforme necessário
- Servidas via CDN global
- Comprimidas com qualidade otimizada

---

## Alternativa: Usar Supabase Storage com Transformações

Se preferir não usar Cloudinary, o Supabase também oferece transformações:

```typescript
// Para imagens do Supabase Storage
const supabaseUrl = 'https://xxx.supabase.co/storage/v1/object/public/bucket/image.jpg';

// Adicione transformações
const optimized = `${supabaseUrl}?width=800&quality=80&format=webp`;
```

Documentação: https://supabase.com/docs/guides/storage/serving/image-transformations

---

## Resultado Esperado

### Antes (JPG)
- landing-hero.jpg: **1017 KB**
- Total imagens: **~2.5 MB**

### Depois (WebP + Cloudinary)
- landing-hero.webp: **~200 KB** (-80%)
- Total imagens: **~500 KB** (-80%)

### PageSpeed Score
- LCP: 10.5s → **~2.5s** ✅
- Performance: 61 → **~85-90** ✅
