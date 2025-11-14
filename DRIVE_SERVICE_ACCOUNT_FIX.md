# Solução para Erro de Quota do Service Account

## Problema

Service Accounts do Google não têm quota de armazenamento própria. O erro retornado é:

```
Service Accounts do not have storage quota. Leverage shared drives or use OAuth delegation instead.
```

## Soluções

### Opção 1: Usar Shared Drive (Google Workspace) ✅ RECOMENDADO

Se você tem Google Workspace:

1. **Criar um Shared Drive:**
   - Acesse Google Drive
   - Clique em "Novo" → "Shared Drive"
   - Crie um Shared Drive chamado "Transcrições Automáticas"
   - Anote o ID do Shared Drive (da URL)

2. **Adicionar Service Account ao Shared Drive:**
   - Abra o Shared Drive
   - Clique em "Gerenciar membros"
   - Adicione: `pastadrive@nth-record-478117-d1.iam.gserviceaccount.com`
   - Dê permissão de "Colaborador" ou "Editor"

3. **Atualizar código:**
   - O código já está configurado com `supportsAllDrives: true`
   - Apenas atualize o `DRIVE_FOLDER_ID` para o ID do Shared Drive

### Opção 2: Usar Pasta Compartilhada de Usuário Real

A pasta deve pertencer a um **usuário real** (não Service Account) e estar compartilhada:

1. **Criar pasta no seu Drive pessoal:**
   - Crie uma pasta no seu Google Drive pessoal
   - Compartilhe com: `pastadrive@nth-record-478117-d1.iam.gserviceaccount.com`
   - Dê permissão de "Editor"
   - Anote o ID da pasta (da URL)

2. **Verificar compartilhamento:**
   - A pasta deve estar visível para a Service Account
   - A Service Account deve ter permissão de "Editor"

### Opção 3: Domain-Wide Delegation (OAuth)

Para contas Google Workspace, você pode usar Domain-Wide Delegation:

1. Habilitar Domain-Wide Delegation no Google Cloud Console
2. Configurar OAuth com delegação de domínio
3. Usar credenciais OAuth ao invés de Service Account direto

## Verificação

Após configurar, teste o upload. Os logs devem mostrar:

```
[DRIVE UPLOAD] ✅ DOCX enviado com sucesso
[DRIVE UPLOAD SUCCESS] ✅ File ID: ...
[DRIVE UPLOAD SUCCESS] ✅ Link: ...
```

Se ainda der erro 403, verifique:
- A pasta pertence a um usuário real (não Service Account)?
- A pasta está compartilhada com a Service Account?
- A Service Account tem permissão de "Editor"?

## Código Atualizado

O código já está atualizado com:
- `supportsAllDrives: true` - Para suportar Shared Drives
- `supportsTeamDrives: true` - Compatibilidade com Team Drives
- Logs detalhados para diagnóstico

## Próximos Passos

1. Verificar se a pasta `1-VPWLcqeAx7hVN_zpzqpt0qmzmp7iruw` pertence a um usuário real
2. Se não pertencer, criar uma nova pasta no seu Drive pessoal
3. Compartilhar a pasta com a Service Account
4. Atualizar `DRIVE_FOLDER_ID` no código

