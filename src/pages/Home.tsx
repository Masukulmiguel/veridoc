import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Fingerprint,
  FileCheck2,
  Globe2,
  Lock,
  QrCode,
  ScanLine,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

const STEPS = [
  {
    icon: FileCheck2,
    title: 'Emita',
    description:
      'A instituição emite o documento na plataforma. O conteúdo é protegido por hash SHA-256.',
  },
  {
    icon: Fingerprint,
    title: 'Assine e proteja',
    description:
      'O documento é assinado digitalmente no backend e recebe um QR Code único de validação.',
  },
  {
    icon: ScanLine,
    title: 'Valide',
    description:
      'Qualquer pessoa verifica a autenticidade pelo QR Code ou pelo código de validação.',
  },
]

const BENEFITS = [
  {
    icon: ShieldCheck,
    title: 'Integridade verificável',
    description:
      'Qualquer alteração no conteúdo do documento é detectada imediatamente durante a validação.',
  },
  {
    icon: Lock,
    title: 'Segurança real',
    description:
      'Assinatura digital gerida no backend, sem chaves privadas expostas no frontend.',
  },
  {
    icon: QrCode,
    title: 'Verificação instantânea',
    description:
      'Validação simples pelo telemóvel, sem instalar qualquer aplicação.',
  },
  {
    icon: Building2,
    title: 'Emissão institucional',
    description:
      'Documentos emitidos apenas por instituições registadas e autorizadas na VeriDoc.',
  },
  {
    icon: Globe2,
    title: 'Acesso público',
    description:
      'Página pública de validação acessível a qualquer pessoa, em qualquer dispositivo.',
  },
  {
    icon: FileCheck2,
    title: 'Controlo total',
    description:
      'Revogação, histórico e auditoria completos de cada documento emitido.',
  },
]

const VALIDATE_STEPS = [
  'Aponte a câmara do telemóvel para o QR Code do documento.',
  'A VeriDoc abre a página de validação com o código preenchido.',
  'O sistema verifica o hash, a assinatura digital e o estado do documento.',
  'Vê imediatamente o resultado: documento válido, revogado ou expirado.',
]

export default function Home() {
  return (
    <div>
      <section className="relative overflow-hidden bg-navy-950">
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/banner.jpg)' }}
        />
        <div className="pointer-events-none absolute inset-0 bg-navy-950/60" />
        <div className="container-page relative flex items-center py-24 lg:py-32">
          <div className="animate-fade-up max-w-2xl">
            <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Documentos digitais{' '}
              <span className="text-brand-cyan">verificáveis</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-navy-300">
              Emita, assine e valide documentos com segurança e integridade garantidas.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link to="/verificar">
                <Button size="lg" leftIcon={<ScanLine className="size-5" />}>
                  Validar documento
                </Button>
              </Link>
              <Link to="/register">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 bg-white/5 text-white hover:border-white/40 hover:bg-white/10"
                  rightIcon={<ArrowRight className="size-5" />}
                >
                  Criar conta
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="bg-white py-20 lg:py-24">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <Badge tone="primary" className="mb-4">Como funciona</Badge>
            <h2 className="font-display text-3xl font-bold tracking-tight text-navy-900">
              Três passos para confiança total
            </h2>
            <p className="mt-3 text-navy-500">
              Da emissão à validação, cada documento passa por um processo seguro e transparente.
            </p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <div
                key={step.title}
                className="relative rounded-2xl border border-navy-200 bg-white p-7 shadow-card transition-shadow hover:shadow-card-hover"
              >
                <span className="absolute right-6 top-6 font-display text-4xl font-extrabold text-navy-100">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  <step.icon className="size-6" />
                </div>
                <h3 className="font-display text-lg font-semibold text-navy-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-500">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="beneficios" className="bg-navy-50 py-20 lg:py-24">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <Badge tone="navy" className="mb-4">Benefícios</Badge>
            <h2 className="font-display text-3xl font-bold tracking-tight text-navy-900">
              Porquê a VeriDoc
            </h2>
            <p className="mt-3 text-navy-500">
              Segurança e simplicidade para instituições e para quem recebe documentos.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((benefit) => (
              <div
                key={benefit.title}
                className="rounded-2xl border border-navy-200 bg-white p-7 shadow-card transition-shadow hover:shadow-card-hover"
              >
                <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-navy-900 text-white">
                  <benefit.icon className="size-5.5" />
                </div>
                <h3 className="font-display text-base font-semibold text-navy-900">
                  {benefit.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-500">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="validar-documento" className="bg-white py-20 lg:py-24">
        <div className="container-page grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Badge tone="success" className="mb-4">
              <ScanLine className="size-3.5" />
              Validação pública
            </Badge>
            <h2 className="font-display text-3xl font-bold tracking-tight text-navy-900">
              Como validar um documento
            </h2>
            <p className="mt-3 text-navy-500">
              Não precisa de conta nem de aplicação. Se recebeu um documento VeriDoc, pode
              verificar a sua autenticidade em poucos segundos.
            </p>
            <ol className="mt-8 space-y-5">
              {VALIDATE_STEPS.map((step, index) => (
                <li key={step} className="flex items-start gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success-100 font-display text-sm font-bold text-success-700">
                    {index + 1}
                  </span>
                  <p className="pt-1 text-sm leading-relaxed text-navy-600">{step}</p>
                </li>
              ))}
            </ol>
            <Link to="/verificar" className="mt-8 inline-block">
              <Button size="lg" variant="success" leftIcon={<ScanLine className="size-5" />}>
                Validar um documento agora
              </Button>
            </Link>
          </div>

          <div className="rounded-3xl border border-navy-200 bg-navy-50 p-8 lg:p-10">
            <div className="rounded-2xl bg-white p-6 shadow-card">
              <div className="flex items-center gap-3 rounded-xl border border-navy-100 bg-navy-50 p-4">
                <ShieldCheck className="size-6 shrink-0 text-success-600" />
                <div>
                  <p className="font-display text-sm font-semibold text-navy-900">
                    Um documento válido contém
                  </p>
                  <p className="text-xs text-navy-500">
                    identidade da instituição, hash e assinatura digital
                  </p>
                </div>
              </div>
              <ul className="mt-4 space-y-3">
                {[
                  'Identificador único e código de validação',
                  'QR Code com ligação à página de validação',
                  'Hash SHA-256 do conteúdo protegido',
                  'Assinatura digital verificada no backend',
                  'Estado atual: válido, revogado ou expirado',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-navy-700">
                    <CheckCircle2 className="size-4.5 shrink-0 text-success-600" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-5 rounded-xl bg-warning-50 px-4 py-3 text-xs leading-relaxed text-warning-700">
                Um QR Code por si só não prova a autenticidade. A confiança nasce da emissão
                controlada pela VeriDoc e da verificação do hash e da assinatura digital.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="instituicoes" className="bg-navy-950 py-20 lg:py-24">
        <div className="container-page grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Badge tone="navy" className="mb-4 bg-primary-600/20 text-primary-300">
              <Building2 className="size-3.5" />
              Para instituições
            </Badge>
            <h2 className="font-display text-3xl font-bold tracking-tight text-white">
              Emita documentos digitais com valor legal e verificável
            </h2>
            <p className="mt-4 max-w-xl text-navy-300">
              Universidades, escolas, empresas e entidades públicas podem emitir certificados,
              diplomas e declarações que qualquer pessoa consegue validar instantaneamente.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                'Emissão em minutos, com QR Code e PDF gerados automaticamente',
                'Assinatura digital segura gerida no backend da VeriDoc',
                'Painel de gestão com auditoria completa',
                'Revogação e controlo de validade a qualquer momento',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-navy-200">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success-500" />
                  <span className="text-sm leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center lg:p-10">
            <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-elevated">
              <Building2 className="size-8" />
            </div>
            <h3 className="font-display text-xl font-bold text-white">
              Pronto para começar a emitir?
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-navy-300">
              Crie a conta da sua instituição e comece a emitir os primeiros documentos hoje.
            </p>
            <Link to="/register" className="mt-6 inline-block">
              <Button
                size="lg"
                rightIcon={<ArrowRight className="size-5" />}
              >
                Criar conta da instituição
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
