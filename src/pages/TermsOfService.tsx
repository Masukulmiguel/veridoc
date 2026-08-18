import { FileText } from 'lucide-react'
import { Link } from 'react-router-dom'

const SECTIONS = [
  {
    title: '1. Aceitação dos Termos',
    content:
      'Ao aceder e utilizar a plataforma VeriDoc, o utilizador concora com os presentes Termos de Uso. Se não concordar com algum dos termos, não deve utilizar a plataforma.',
  },
  {
    title: '2. Descrição do Serviço',
    content:
      'A VeriDoc é uma plataforma de emissão, assinatura digital e validação de documentos para instituições em Angola. Permite a criação de documentos com assinatura criptográfica (RSA-2048) e verificação pública de autenticidade.',
  },
  {
    title: '3. Registo e Conta',
    content:
      'O utilizador é responsável por manter a confidencialidade das suas credenciais de acesso. Cada conta é pessoal e intransmissível. O utilizador deve notificar imediatamente qualquer uso não autorizado da sua conta.',
  },
  {
    title: '4. Utilização Aceitável',
    content:
      'O utilizador compromete-se a não: (a) criar documentos falsos ou fraudulentos; (b) tentar aceder a contas de outros utilizadores; (c) utilizador a plataforma para atividades ilegais; (d) interferir com o funcionamento da plataforma; (e) realizar engenharia reversa do sistema.',
  },
  {
    title: '5. Propriedade Intelectual',
    content:
      'Todos os documentos emitidos através da VeriDoc são propriedade da instituição emissora. A plataforma VeriDoc e o seu código são propriedade dos seus respetivos titulares, protegidos por direitos de autor.',
  },
  {
    title: '6. Assinatura Digital',
    content:
      'A assinatura digital RSA-2048 garante a integridade e autenticidade dos documentos. A validação verifica o hash SHA-256 e a assinatura criptográfica, mas não garante o conteúdo semântico do documento.',
  },
  {
    title: '7. Disponibilidade',
    content:
      'Empenhamo-nos em manter a plataforma disponível 24/7, mas não garantimos disponibilidade ininterrupta. Podemos realizar manutenção programada com notificação prévia.',
  },
  {
    title: '8. Limitação de Responsabilidade',
    content:
      'A VeriDoc atua como intermediário técnico. Não nos responsabilizamos pelo conteúdo dos documentos emitidos pelas instituições. A responsabilidade legal dos documentos é exclusiva da instituição emissora.',
  },
  {
    title: '9. Cancelamento e Suspensão',
    content:
      'Podemos suspender ou cancelar contas que violem os presentes termos. O utilizador pode solicitar o cancelamento da sua conta a qualquer momento, sem prejuízo dos dados mantidos para fins legais.',
  },
  {
    title: '10. Alterações',
    content:
      'Estes termos podem ser alterados a qualquer momento. Utilizadores registados serão notificados sobre alterações significativas com pelo menos 30 dias de antecedência.',
  },
  {
    title: '11. Lei Aplicável',
    content:
      'Estes termos são regidos pelas leis da República de Angola. Quaisquer litígios serão submetidos aos tribunais competentes de Luanda.',
  },
  {
    title: '12. Contacto',
    content:
      'Para questões sobre estes termos, contacte: suporte@veridoc.ao ou av. Principal, Luanda, Angola.',
  },
]

export default function TermsOfService() {
  return (
    <div className="bg-white">
      <div className="container-page py-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
              <FileText className="size-6" />
            </div>
            <h1 className="font-display text-3xl font-bold text-navy-900">Termos de Uso</h1>
            <p className="mt-2 text-sm text-navy-500">Última atualização: Julho 2026</p>
          </div>

          <div className="space-y-8">
            {SECTIONS.map((section) => (
              <div key={section.title}>
                <h2 className="mb-2 text-lg font-semibold text-navy-800">{section.title}</h2>
                <p className="leading-relaxed text-navy-600">{section.content}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link to="/" className="text-sm text-primary-600 hover:underline">
              Voltar à página inicial
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
