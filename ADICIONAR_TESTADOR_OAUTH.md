# Como Adicionar Testadores ao OAuth 2.0

O erro "access_denied" acontece porque o app OAuth está em modo de teste. Você precisa adicionar seu email como testador.

## 🔧 Passo a Passo

### 1. Acessar Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Selecione o projeto: **nth-record-478117-d1**

### 2. Configurar Tela de Consentimento OAuth

1. No menu lateral, vá em **APIs e Serviços** → **Tela de consentimento OAuth**
2. Ou acesse diretamente: https://console.cloud.google.com/apis/credentials/consent?project=nth-record-478117-d1

### 3. Encontrar "Usuários de Teste"

A seção "Usuários de teste" pode estar em diferentes lugares:

**Opção A - No menu lateral:**
1. Clique em **"Público-alvo"** no menu lateral (ao lado de "Branding")
2. Role até o final da página
3. Você verá a seção **"Usuários de teste"**

**Opção B - Direto no menu:**
1. Procure por **"Configurações"** no menu lateral
2. Role até encontrar **"Usuários de teste"**

### 4. Adicionar Usuários de Teste

1. Na seção **"Usuários de teste"**, clique em **"+ ADICIONAR USUÁRIOS"**
2. Adicione o email que você usa para acessar o Google Drive:
   - Exemplo: `repositorio.transcricoes@gmail.com`
   - Ou seu email pessoal
3. Clique em **"ADICIONAR"**
4. Clique em **"SALVAR"** ou **"SALVAR E CONTINUAR"**

### 5. Salvar e Testar

1. Clique em **"SALVAR E CONTINUAR"** (se aparecer)
2. Volte e acesse: `http://localhost:3000/api/auth/google`
3. Agora deve funcionar!

## 📝 Informações Importantes

- **Modo de Teste**: O app pode ter até 100 usuários de teste
- **Escopo**: Usuários de teste podem autorizar todos os escopos solicitados
- **Produção**: Para produção, você precisará publicar o app (requer verificação do Google)

## 🔄 Se Ainda Não Funcionar

1. Verifique se você está logado com o email correto no navegador
2. Tente usar uma janela anônima/privada
3. Certifique-se de que o email adicionado é exatamente o mesmo que você usa

## 🚀 Alternativa: Publicar o App (Não Recomendado para Dev)

Se você quiser que qualquer pessoa possa usar (não recomendado para desenvolvimento):

1. Na tela de consentimento, clique em **"PUBLICAR APP"**
2. Isso requer verificação do Google e pode levar dias
3. **Recomendação**: Use apenas usuários de teste para desenvolvimento

