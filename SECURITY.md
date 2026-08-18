# Política de Segurança

## Reportar Vulnerabilidades

Se descobrir uma vulnerabilidade de segurança, por favor não a publique publicamente.
Em vez disso, contacte-nos diretamente:

- **E-mail:** security@veridoc.ao
- **Subject:** [SECURITY] Descrição breve da vulnerabilidade

## O que esperar

- Resposta inicial em até 48 horas
- Avaliação da vulnerabilidade em até 5 dias úteis
- Correção depende da gravidade:
  - **Crítica:** 24-48 horas
  - **Alta:** 3-5 dias
  - **Média:** 1-2 semanas
  - **Baixa:** Próximo release

## Medidas de Segurança Ativas

- Rate limiting em endpoints de autenticação
- Bloqueio de conta após 5 tentativas falhadas (15 min)
- Password hashing com PBKDF2 (260.000 iterações)
- Assinatura digital RSA-2048
- Headers de segurança (CSP, HSTS, X-Frame-Options)
- Validação de JWT com expiração
- Validação de JWT secret em produção
- RBAC com verificação server-side
- Isolamento entre instituições

## Escopo

A cobertura inclui:
- API backend (FastAPI)
- Frontend (React/TypeScript)
- Infraestrutura Docker
- Configuração de base de dados

## Emenda

Agradecemos a ajuda na melhoria da segurança da plataforma VeriDoc.
