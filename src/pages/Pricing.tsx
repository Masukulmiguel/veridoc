import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { FadeIn } from '@/components/ui/FadeIn'
import type { Plan } from '@/types/plan'

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Ideal para projectos pequenos e integracao B.I.',
    priceMonthlyKz: 200,
    priceAnnualKz: 2400,
    limits: {
      maxDocumentsMonthly: 100,
      maxUsers: 1,
      hasPdf: false,
      hasQrCode: true,
      hasApiAccess: true,
      hasPrioritySupport: false,
    },
  },
  {
    id: 'professional',
    name: 'Profissional',
    description: 'Para instituicoes que emitem documentos regularmente.',
    priceMonthlyKz: 500,
    priceAnnualKz: 6000,
    limits: {
      maxDocumentsMonthly: 500,
      maxUsers: 5,
      hasPdf: true,
      hasQrCode: true,
      hasApiAccess: true,
      hasPrioritySupport: false,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Para grandes organizacoes com necessidades avancadas.',
    priceMonthlyKz: 1500,
    priceAnnualKz: 18000,
    limits: {
      maxDocumentsMonthly: null,
      maxUsers: null,
      hasPdf: true,
      hasQrCode: true,
      hasApiAccess: true,
      hasPrioritySupport: true,
    },
  },
]

function formatPrice(kz: number): string {
  return kz.toLocale('pt-AO') + ' kz'
}

function Feature({ included, children }: { included: boolean; children: React.ReactNode }) {
  return (
    <li className={`flex items-center gap-3 text-sm ${included ? 'text-navy-700' : 'text-navy-400'}`}>
      <Check className={`size-4 shrink-0 ${included ? 'text-success-600' : 'text-navy-300'}`} />
      {children}
    </li>
  )
}

export default function Pricing() {
  const [annual, setAnnual] = useState(true)

  return (
    <div>
      <section className="bg-navy-950 py-20 lg:py-24">
        <div className="container-page text-center">
          <FadeIn>
            <Badge tone="primary" className="mb-4">Precos</Badge>
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              Planos simples e transparentes
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-navy-300">
              Escolha o plano ideal para a sua instituicao. Pagamento anual com economia.
            </p>

            <div className="mt-8 inline-flex items-center gap-3 rounded-full bg-white/10 p-1">
              <button
                onClick={() => setAnnual(false)}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                  !annual ? 'bg-white text-navy-900' : 'text-navy-300 hover:text-white'
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                  annual ? 'bg-white text-navy-900' : 'text-navy-300 hover:text-white'
                }`}
              >
                Anual
                <span className="ml-1.5 text-xs text-success-400">-17%</span>
              </button>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="bg-white py-20 lg:py-24">
        <div className="container-page">
          <div className="grid gap-8 lg:grid-cols-3">
            {PLANS.map((plan, index) => (
              <FadeIn key={plan.id} delay={index * 150}>
                <div
                  className={`relative flex flex-col rounded-2xl border-2 p-8 transition-all duration-300 ${
                    plan.id === 'professional'
                      ? 'border-primary-500 shadow-xl'
                      : 'border-navy-200 hover:border-navy-300 hover:shadow-lg'
                  }`}
                >
                  {plan.id === 'professional' && (
                    <Badge tone="primary" className="absolute -top-3 left-1/2 -translate-x-1/2">
                      Mais popular
                    </Badge>
                  )}

                  <h3 className="font-display text-xl font-bold text-navy-900">{plan.name}</h3>
                  <p className="mt-2 text-sm text-navy-500">{plan.description}</p>

                  <div className="mt-6">
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-4xl font-extrabold text-navy-900">
                        {formatPrice(annual ? Math.round(plan.priceAnnualKz / 12) : plan.priceMonthlyKz)}
                      </span>
                      <span className="text-sm text-navy-500">/mes</span>
                    </div>
                    {annual && (
                      <p className="mt-1 text-xs text-navy-400">
                        {formatPrice(plan.priceAnnualKz)}/ano
                      </p>
                    )}
                  </div>

                  <ul className="mt-8 space-y-3 flex-1">
                    <Feature included={true}>
                      {plan.limits.maxDocumentsMonthly
                        ? `${plan.limits.maxDocumentsMonthly} documentos/mes`
                        : 'Documentos ilimitados'}
                    </Feature>
                    <Feature included={true}>
                      {plan.limits.maxUsers
                        ? `${plan.limits.maxUsers} utilizador(es)`
                        : 'Utilizadores ilimitados'}
                    </Feature>
                    <Feature included={plan.limits.hasQrCode}>QR Code de validacao</Feature>
                    <Feature included={plan.limits.hasPdf}>PDF personalizado</Feature>
                    <Feature included={plan.limits.hasApiAccess}>Acesso a API</Feature>
                    <Feature included={plan.limits.hasPrioritySupport}>
                      Suporte prioritario
                    </Feature>
                  </ul>

                  <Link to="/register" className="mt-8">
                    <Button
                      fullWidth
                      variant={plan.id === 'professional' ? 'primary' : 'outline'}
                      rightIcon={<ArrowRight className="size-4" />}
                    >
                      Comecar agora
                    </Button>
                  </Link>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-navy-50 py-20">
        <div className="container-page text-center">
          <FadeIn>
            <h2 className="font-display text-2xl font-bold text-navy-900">
              Precisa de algo personalizado?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-navy-500">
              Para grandes volumes ou integracoes especificas, fale com a nossa equipa
              para um orcamento sob medida.
            </p>
            <Link to="/register" className="mt-6 inline-block">
              <Button variant="secondary" rightIcon={<ArrowRight className="size-4" />}>
                Contactar vendas
              </Button>
            </Link>
          </FadeIn>
        </div>
      </section>
    </div>
  )
}
