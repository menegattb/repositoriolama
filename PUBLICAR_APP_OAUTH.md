# Como Publicar o App OAuth em Produção

Publicar o app permite que qualquer pessoa use sem precisar ser adicionada como testador.

## ⚠️ Importante

Publicar o app requer:
- Preencher informações de branding (logo, política de privacidade, etc.)
- Pode levar alguns dias para ser aprovado pelo Google
- Para desenvolvimento/teste, é mais rápido usar "Usuários de teste"

## 📋 Passo a Passo

### 1. Acessar Tela de Consentimento

1. Acesse: https://console.cloud.google.com/apis/credentials/consent?project=nth-record-478117-d1
2. Ou: Google Cloud Console → APIs e Serviços → Tela de consentimento OAuth

### 2. Preencher Informações de Branding

Na seção **"Branding"** (onde você está agora):

1. **Logo do App** (opcional mas recomendado):
   - Faça upload de uma imagem quadrada 120x120px
   - Formatos: JPG, PNG ou BMP
   - Máximo: 1 MB

2. **Domínio do App**:
   - **Página inicial**: `https://repositorio.acaoparamita.com.br` ou `https://acaoparamita.com.br`
   - **Política de Privacidade**: Crie uma página ou use `https://repositorio.acaoparamita.com.br/privacy`
   - **Termos de Serviço**: Crie uma página ou use `https://repositorio.acaoparamita.com.br/terms`

### 3. Configurar Público-Alvo

1. Clique em **"Público-alvo"** no menu lateral
2. Selecione **"Externo"** (External)
3. Clique em **"SALVAR E CONTINUAR"**

### 4. Adicionar Escopos

1. Clique em **"Acesso a dados"** no menu lateral
2. Verifique se os escopos estão corretos:
   - `https://www.googleapis.com/auth/drive.file`
   - `https://www.googleapis.com/auth/drive`
3. Clique em **"SALVAR E CONTINUAR"**

### 5. Adicionar Informações do App

1. Preencha:
   - **Nome do app**: `Transcrições Automáticas` ou `Repositório Lama`
   - **Email de suporte**: Seu email
   - **Domínios autorizados**: `acaoparamita.com.br`

### 6. Publicar o App

1. Role até o final da página
2. Clique em **"PUBLICAR APP"** ou **"ENVIAR PARA VERIFICAÇÃO"**
3. Aguarde a aprovação (pode levar alguns dias)

## ⚡ Alternativa Rápida: Modo de Teste com Usuários

Se você quer testar AGORA sem esperar aprovação:

1. Vá em **"Público-alvo"** → Selecione **"Externo"**
2. Vá em **"Usuários de teste"** → **"+ ADICIONAR USUÁRIOS"**
3. Adicione seu email: `repositorio.transcricoes@gmail.com`
4. Salve

Isso permite testar imediatamente enquanto o app está em modo de teste.

## 🔍 Onde Está "Usuários de Teste"?

Se você não encontrou "Usuários de teste", pode estar em:

1. **"Público-alvo"** → Role até o final → Seção "Usuários de teste"
2. Ou: Menu lateral → **"Configurações"** → Seção "Usuários de teste"

## ✅ Depois de Publicar

1. Qualquer pessoa poderá autorizar o app
2. Não precisará adicionar testadores
3. O refresh token funcionará normalmente

## 🆘 Problemas?

- Se o botão "PUBLICAR APP" não aparecer, verifique se todas as informações obrigatórias foram preenchidas
- Se aparecer erro, pode ser necessário preencher mais informações ou aguardar verificação

