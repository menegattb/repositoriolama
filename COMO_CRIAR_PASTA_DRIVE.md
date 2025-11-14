# Como Criar a Pasta Correta no Google Drive

## ⚠️ PROBLEMA

Service Accounts **NÃO têm quota de armazenamento própria**. Se a pasta pertence à Service Account, os uploads falharão com erro 403.

## ✅ SOLUÇÃO: Criar Pasta no Seu Drive Pessoal

### Passo 1: Criar Nova Pasta

1. Acesse [Google Drive](https://drive.google.com)
2. Clique em **"Novo"** → **"Pasta"**
3. Nomeie a pasta (ex: "Transcrições Automáticas")
4. Clique em **"Criar"**

### Passo 2: Obter o ID da Pasta

1. Abra a pasta que você acabou de criar
2. Olhe a URL no navegador. Ela será algo como:
   ```
   https://drive.google.com/drive/folders/1-VPWLcqeAx7hVN_zpzqpt0qmzmp7iruw
   ```
3. **Copie o ID** que vem depois de `/folders/`
   - No exemplo acima: `1-VPWLcqeAx7hVN_zpzqpt0qmzmp7iruw`

### Passo 3: Compartilhar com a Service Account

1. Com a pasta aberta, clique no botão **"Compartilhar"** (ícone de pessoa com +)
2. No campo de compartilhamento, cole este email:
   ```
   pastadrive@nth-record-478117-d1.iam.gserviceaccount.com
   ```
3. Clique no dropdown ao lado do email e selecione **"Editor"**
4. Clique em **"Enviar"** ou **"Concluído"**

### Passo 4: Atualizar o Código

1. Abra o arquivo: `src/app/api/transcribe/route.ts`
2. Procure pela constante `DRIVE_FOLDER_ID`
3. Substitua o valor pelo ID da nova pasta:
   ```typescript
   const DRIVE_FOLDER_ID = 'SEU_NOVO_ID_AQUI';
   ```

### Passo 5: Testar

1. Reinicie o servidor de desenvolvimento
2. Tente gerar uma transcrição
3. Verifique os logs no terminal - devem mostrar:
   ```
   [DRIVE UPLOAD] ✅ Pasta encontrada: Transcrições Automáticas
   [DRIVE UPLOAD] Proprietários: seu-email@gmail.com
   [DRIVE UPLOAD] ✅ Pasta parece estar configurada corretamente
   [DRIVE UPLOAD SUCCESS] ✅ DOCX enviado com sucesso
   ```

## 🔍 Como Verificar se Está Correto

O código agora verifica automaticamente antes de fazer upload. Se a pasta pertencer à Service Account, você verá:

```
[DRIVE UPLOAD ERROR] ⚠️ PROBLEMA CRÍTICO:
[DRIVE UPLOAD ERROR] A pasta pertence à Service Account!
[DRIVE UPLOAD ERROR] Service Accounts não têm quota de armazenamento.
```

Se estiver correto, você verá:

```
[DRIVE UPLOAD] ✅ Pasta encontrada: Nome da Pasta
[DRIVE UPLOAD] Proprietários: seu-email@gmail.com
[DRIVE UPLOAD] ✅ Pasta parece estar configurada corretamente
```

## 📝 Checklist

- [ ] Pasta criada no seu Google Drive pessoal (não na Service Account)
- [ ] Pasta compartilhada com: `pastadrive@nth-record-478117-d1.iam.gserviceaccount.com`
- [ ] Permissão definida como "Editor"
- [ ] ID da pasta copiado da URL
- [ ] `DRIVE_FOLDER_ID` atualizado no código
- [ ] Servidor reiniciado
- [ ] Teste realizado com sucesso

## 🆘 Problemas Comuns

### "A pasta não aparece para a Service Account"
- Verifique se você compartilhou corretamente
- Verifique se o email da Service Account está correto
- Tente remover e adicionar novamente o compartilhamento

### "Ainda dá erro 403"
- Certifique-se de que a pasta pertence ao seu email pessoal
- Verifique se você não está usando uma pasta criada pela Service Account
- Tente criar uma pasta completamente nova

### "Não consigo encontrar o ID da pasta"
- O ID está na URL quando você abre a pasta
- Formato: `https://drive.google.com/drive/folders/ID_AQUI`
- Se não aparecer, clique com botão direito na pasta → "Obter link" → o ID estará no link

