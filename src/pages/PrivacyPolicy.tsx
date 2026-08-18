import { ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

const SECTIONS = [
  {
    title: '1. Dados Recolhidos',
    content:
      'Recolhemos apenas os dados estritamente necessários para o funcionamento da plataforma: nome, endereço de e-mail, senha (encriptada), nome da instituição e NIF. Não recolhemos dados biométricos, de localização ou de navegação.',
  },
  {
    title: '2. Finalidade dos Dados',
    content:
      'Os dados são utilizados exclusivamente para: autenticação de utilizadores, emissão e validação de documentos digitais, registo de auditoria e comunicação sobre o estado dos documentos.',
  },
  {
    title: '3. Base Legal',
    content:
      'O tratamento de dados é fundamentado no consentimento do utilizador (aceite dos termos no registo) e na execução do contrato de prestação de serviços da plataforma VeriDoc.',
  },
  {
    title: '4. Armazenamento e Segurança',
    content:
      'Os dados são armazenados em servidores seguros com encriptação em trânsito (TLS/HTTPS). As senhas são protegidas com PBKDF2 (260.000 iterações). As chaves de assinatura digital são armazenadas sem passphrase no servidor, protegidas pelo sistema operativo.',
  },
  {
    title: '5. Partilha de Dados',
    content:
      'Não partilhamos dados pessoais com terceiros. Os dados de documentos são partilhados apenas com a instituição emissora e com quem possua o código de verificação para validação pública.',
  },
  {
    title: '6. Retenção de Dados',
    content:
      'Os dados de utilizadores são mantidos enquanto a conta estiver ativa. Documents são mantidos indefinidamente para fins de validação histórica. Registos de auditoria são mantidos por um período mínimo de 5 anos.',
  },
  {
    title: '7. Direitos dos Utilizadores',
    content:
      'De acordo com a Lei n.º 22/11 de Proteção de Dados Pessoais de Angola, tem direito a: acesso aos seus dados, retificação, eliminação, portabilidade e oposição ao tratamento. Para exercer estes direitos, contacte-nos em privacy@veridoc.ao.',
  },
  {
    title: '8. Cookies',
    content:
      'A plataforma VeriDoc não utiliza cookies de rastreamento. Apenas utilizamos armazenamento local (localStorage) para manter a sessão do utilizador autenticado.',
  },
  {
    title: '9. Alterações',
    content:
      'Esta política pode ser alterada a qualquer momento. Utilizadores serão notificados sobre alterações significativas através do e-mail registado.',
  },
  {
    title: '10. Contacto',
    content:
      'Para questões sobre proteção de dados, contacte: privacy@veridoc.ao ou av. Principal, Luanda, Angola.',
  },
]

export default function PrivacyPolicy() {
  return (
    <div className="bg-white">
      <div className="container-page py-16">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
              <ShieldCheck className="size-6" />
            </div>
            <h1 className="font-display text-3xl font-bold text-navy-900">Política de Privacidade</h1>
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
