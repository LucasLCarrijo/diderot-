# Diderot — Test Checklist

## 1. Onboarding — Creator Flow

- [ ] Acessar `/onboarding` sem estar logado
- [ ] Selecionar "Sou Creator" e avançar para step 2
- [ ] Preencher handle (validar disponibilidade em tempo real)
- [ ] Preencher nome, email, celular, senha e aceitar termos
- [ ] Avançar para step 3 (seleção de plano)
- [ ] Selecionar plano Mensal → clicar "Comece seu teste de 14 dias" → redirecionar para Stripe
- [ ] Selecionar plano Anual → clicar "Comece seu teste de 14 dias" → redirecionar para Stripe
- [ ] Completar pagamento no Stripe e retornar para `/onboarding?success=true`
- [ ] Step 4 deve aparecer com "Sua loja está pronta!"
- [ ] Clicar "Quero começar!" → redirecionar para `/creator/shop`

## 2. Onboarding — Follower Flow

- [ ] Acessar `/onboarding`, selecionar "Sou Seguidor"
- [ ] Preencher email, senha e aceitar termos
- [ ] Clicar "Criar conta" → criar conta Supabase com role='follower'
- [ ] Redirecionar automaticamente para `/me/feed`

## 3. Banco de dados — profiles.role

- [ ] Novo usuário follower tem `role = 'follower'` na tabela `profiles`
- [ ] Após confirmação de pagamento via webhook, creator tem `role = 'creator'`
- [ ] Index `idx_profiles_role` existe em `profiles`

## 4. Banco de dados — subscriptions

- [ ] Após checkout.session.completed, novo registro em `subscriptions` com:
  - `status = 'trialing'` ou `'active'`
  - `plan = 'monthly'` ou `'annual'`
  - `trial_end` preenchido (quando trialing)
  - `current_period_end` preenchido
- [ ] Após pagamento falhar → status = 'past_due'
- [ ] Após assinatura cancelada → status = 'canceled'
- [ ] Após renovação bem-sucedida → status = 'active', period end atualizado

## 5. Webhook Stripe

- [ ] Evento `checkout.session.completed` → cria subscription + atualiza profile.role
- [ ] Evento `customer.subscription.updated` → atualiza status, plan, period_end
- [ ] Evento `customer.subscription.deleted` → status = 'canceled'
- [ ] Evento `invoice.payment_failed` → status = 'past_due'
- [ ] Evento `invoice.payment_succeeded` (renovação) → status = 'active'
- [ ] Assinatura com STRIPE_WEBHOOK_SECRET inválido → retorna 400

## 6. Controle de Acesso — Creator com assinatura ativa

- [ ] Creator com status `active` ou `trialing` acessa `/creator/shop` normalmente
- [ ] Creator com status `past_due` ou `canceled` é redirecionado para `/reactivate`
- [ ] Creator sem nenhuma assinatura é redirecionado para `/onboarding`

## 7. Controle de Acesso — Follower tentando acessar dashboard

- [ ] Follower que tenta acessar `/creator/shop` é redirecionado para `/me/feed`
- [ ] Toast "Essa área é exclusiva para Creators." aparece
- [ ] Follower NÃO consegue acessar NENHUMA rota `/creator/*`

## 8. Página /reactivate

- [ ] Creator com `past_due` vê: "Problema com seu pagamento" + botão "Atualizar Cartão"
- [ ] Clicar "Atualizar Cartão" → abre portal Stripe em nova aba
- [ ] Creator com `canceled` vê dois cards de plano (Mensal / Anual)
- [ ] Clicar "Reativar Mensal" → inicia checkout Stripe mensal
- [ ] Clicar "Reativar Anual" → inicia checkout Stripe anual
- [ ] "Voltar ao início" redireciona para `/`

## 9. Loja pública — `/username`

- [ ] Creator com assinatura ativa → loja aparece normalmente com produtos
- [ ] Creator com assinatura inativa/cancelada → "Esta loja está temporariamente indisponível."
- [ ] Foto, nome e follower count aparecem mesmo quando loja está indisponível
- [ ] Produtos de creators inativos NÃO aparecem via RLS (SELECT policy no Supabase)

## 10. Setup Checklist (Dashboard)

- [ ] Novo creator (sem avatar, bio, produtos) vê todos os 4 itens pendentes
- [ ] Ao adicionar foto → item "Adicionar foto de perfil" fica com check
- [ ] Ao escrever bio → item "Escrever sua bio" fica com check
- [ ] Ao criar produto → item "Adicionar primeiro produto" fica com check
- [ ] Ao ter username + produto → item "Compartilhar sua loja" fica com check
- [ ] Quando todos os 4 itens estão done → checklist desaparece automaticamente
- [ ] Checklist pode ser colapsada clicando no header
- [ ] "Copiar link" copia URL da loja e mostra toast "Link copiado!"
- [ ] Botão de link externo abre a loja em nova aba

## 11. Billing (/creator/billing)

- [ ] Creator ativo vê status, próxima renovação e plano corretos
- [ ] Trial period exibe "Período de teste (14 dias)" no badge
- [ ] Botão "Abrir Portal de Faturamento" abre portal Stripe em nova aba
- [ ] NÃO existe menção a "Plano Free", "upgrade" ou "recursos limitados"

## 12. Sem referências a "Free" / "Grátis" / "Upgrade"

- [ ] `src/lib/stripe-config.ts` não tem `PLANS.FREE`
- [ ] `src/pages/creator/Billing.tsx` não tem card "Free Plan Info"
- [ ] `src/pages/creator/Pricing.tsx` diz "14 dias" (não "7 dias")
- [ ] `src/pages/onboarding/CreatorOnboarding.tsx` não menciona "(Free)" ou "Upgrade Pro"
- [ ] `src/hooks/useCreatorLimits.ts` não tem `FREE_LIMITS`
- [ ] `src/hooks/useEntitlements.ts` não referencia `PLANS.FREE`

## 13. Tipos TypeScript

- [ ] `profiles.Row` tem campo `role: string`
- [ ] `subscriptions.Row` tem campos `plan: string | null` e `trial_end: string | null`
- [ ] Não há erros de TypeScript (`tsc --noEmit`) nos arquivos modificados
