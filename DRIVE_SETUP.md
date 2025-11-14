# Configuração do Google Drive para Transcrições Automáticas

Este documento explica como configurar o upload automático de transcrições para o Google Drive, funcionando tanto localmente quanto no Vercel.

## 📋 Pré-requisitos

1. **Service Account do Google Cloud** já criada
2. **Pasta no Google Drive** para armazenar as transcrições
3. **Credenciais JSON** da Service Account

## 🔧 Configuração no Vercel (Produção)

### Passo 1: Preparar o JSON para Variável de Ambiente

O arquivo `nth-record-478117-d1-f0cb80ff1823.json` contém as credenciais. Para usar no Vercel:

1. **Abra o arquivo JSON** e copie TODO o conteúdo
2. **Remova todas as quebras de linha** (opcional, mas recomendado)
3. O JSON deve ficar como uma única linha, por exemplo:
   ```json
   {"type":"service_account","project_id":"nth-record-478117-d1",...}
   ```

### Passo 2: Configurar no Vercel

1. Acesse o **Dashboard do Vercel**
2. Vá em **Settings** → **Environment Variables**
3. Adicione a variável:
   - **Name**: `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS`
   - **Value**: Cole o JSON completo (como string, sem aspas externas)
   - **Environments**: Selecione `Production`, `Preview` e `Development`
4. Clique em **Save**

**⚠️ IMPORTANTE**: 
- Não adicione aspas ao redor do JSON
- O Vercel aceita JSON multi-linha, mas é melhor usar uma linha só
- A variável será parseada automaticamente pelo código

### Passo 3: Compartilhar Pasta do Drive com Service Account

**CRÍTICO**: A Service Account precisa ter acesso à pasta do Drive!

1. Abra a pasta no Google Drive: `https://drive.google.com/drive/folders/1-VPWLcqeAx7hVN_zpzqpt0qmzmp7iruw`
2. Clique com botão direito → **Compartilhar**
3. Adicione o email da Service Account: `pastadrive@nth-record-478117-d1.iam.gserviceaccount.com`
4. Dê permissão de **Editor** (ou pelo menos **Colaborador**)
5. Clique em **Enviar**

**Por que isso é necessário?**
- O escopo `drive` permite acesso completo ao Drive
- Mas a Service Account ainda precisa ter permissão explícita na pasta
- Sem isso, você receberá erro 403 (Forbidden)

## 🖥️ Configuração Local (Desenvolvimento)

### Opção 1: Usar Arquivo JSON (Recomendado)

1. Coloque o arquivo `nth-record-478117-d1-f0cb80ff1823.json` na raiz do projeto
2. O código encontrará automaticamente

### Opção 2: Usar Variável de Ambiente

1. Adicione ao `.env.local`:
   ```bash
   GOOGLE_SERVICE_ACCOUNT_CREDENTIALS='{"type":"service_account",...}'
   ```
2. Use aspas simples para envolver o JSON

## 🔍 Verificação

### Testar Upload

1. Gere uma transcrição no site
2. Verifique os logs no Vercel (ou terminal local)
3. Procure por:
   - `[DRIVE UPLOAD] ✅ Credenciais carregadas`
   - `[DRIVE UPLOAD SUCCESS] ✅ DOCX enviado com sucesso`
4. Verifique se o arquivo aparece na pasta do Drive

### Erros Comuns

#### Erro 403 (Forbidden)
**Causa**: Service Account não tem acesso à pasta
**Solução**: Compartilhe a pasta com `pastadrive@nth-record-478117-d1.iam.gserviceaccount.com`

#### Erro: "Credenciais não encontradas"
**Causa**: Variável de ambiente não configurada ou JSON inválido
**Solução**: 
- Verifique se `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS` está configurada no Vercel
- Verifique se o JSON está válido (use um validador JSON online)

#### Erro: "Erro ao parsear credenciais"
**Causa**: JSON mal formatado na variável de ambiente
**Solução**: 
- Remova quebras de linha
- Não adicione aspas externas
- Use um validador JSON antes de colar

## 📝 Formato dos Arquivos

### DOCX (Atual)
- **Vantagens**: 
  - Formato padrão do Word
  - Fácil de editar em qualquer editor
  - Mantém formatação
- **Desvantagens**:
  - Não é editável diretamente na web
  - Requer download para editar

### Alternativas para Edição Futura

#### Google Docs (Recomendado para edição)
- **Vantagens**:
  - Editável diretamente no Drive
  - Colaboração em tempo real
  - API do Google Docs permite edição programática
- **Como implementar**:
  - Converter DOCX para Google Docs após upload
  - Usar `drive.files.copy()` com `convert: true`
  - Deletar DOCX original (opcional)

#### Markdown
- **Vantagens**:
  - Editável em qualquer editor de texto
  - Versão controlável (Git)
  - Renderizável na web
- **Desvantagens**:
  - Perde formatação rica
  - Não ideal para documentos longos

#### HTML
- **Vantagens**:
  - Editável na web
  - Mantém formatação
- **Desvantagens**:
  - Mais complexo de gerar
  - Requer editor HTML

## 🚀 Próximos Passos

1. ✅ Configurar variável no Vercel
2. ✅ Compartilhar pasta com Service Account
3. ✅ Testar upload remoto
4. ⏳ Implementar conversão para Google Docs (se necessário)
5. ⏳ Adicionar editor na plataforma (futuro)

## 📚 Referências

- [Google Drive API v3](https://developers.google.com/drive/api/v3/about-sdk)
- [Service Account Authentication](https://cloud.google.com/iam/docs/service-accounts)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

