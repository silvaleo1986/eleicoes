# SISURNAS
Aplicação mobile-first/PWA para gestão de rotas da operação de urnas, construída para Supabase + Netlify.

## O que está implementado
- Importação do XLSX no mesmo formato da base fornecida: `Situação por rota`, `Veículos` e `Motoristas`.
- Rotas editáveis; inclusão e exclusão por usuários autorizados.
- Situação automática `Concluído` quando Placa + Motorista + Telefone Motorista estão preenchidos. Ao salvar manualmente pela grade, `situation_manual=true`, preservando a edição do usuário.
- Perfis: Administrador, Gestor de Polo, Gestor de Zona, Motorista/Colaborador e Usuário Externo.
- Segurança no banco por RLS, não apenas por ocultação de tela.
- Motorista/Colaborador vê somente rotas vinculadas ao CPF ou matrícula.
- Missões com Iniciar, Parada (Seção + quantidade de urnas) e Conclusão, com histórico.
- Gestores de Polo/Zona podem operar as missões das rotas que enxergam.
- Usuário Externo recebe somente a tela de indicadores.
- Layout desktop responsivo e mobile-first; manifesto PWA para instalação pelo navegador.

## 1. Supabase
1. Crie um projeto Supabase.
2. Abra SQL Editor e execute `supabase/migrations/001_schema.sql` inteiro.
3. Em Authentication > Users, crie o primeiro usuário.
4. Copie o UUID e execute a linha indicada no fim da migration para torná-lo `admin`.
5. Em Project Settings/API, copie a Project URL e a Publishable Key. Nunca coloque `service_role` no frontend.

## 2. Configuração local
```bash
cp .env.example .env
# preencha as duas variáveis VITE_...
npm install
npm run dev
```
Acesse o endereço exibido pelo Vite.

## 3. Primeira carga
Entre como Administrador, clique em `Importar` e selecione o XLSX. A importação preserva a posição das 17 colunas da aba principal, inclusive os CPFs/telefones distintos de Motorista e Colaborador.

Observação: a aba Motoristas da base fornecida não contém CPF. O vínculo por CPF é obtido da própria rota; matrícula pode ser configurada no perfil e, para bases futuras, nos campos `driver_registration`/`collaborator_registration` da rota.

## 4. Usuários e permissões
Crie contas em Authentication > Users. A trigger cria automaticamente um perfil `external`. No menu `Acessos` do Administrador, altere:
- `admin`: visão global e importação.
- `polo_manager`: informe exatamente o texto do Polo usado nas rotas.
- `zone_manager`: informe a Zona (e opcionalmente o Polo).
- `worker`: informe CPF sem necessidade de pontuação e/ou matrícula.
- `external`: somente indicadores.

As políticas RLS filtram os registros diretamente no PostgreSQL.

## 5. Netlify
Suba esta pasta para um repositório Git e conecte no Netlify. O `netlify.toml` já define `npm run build`, pasta `dist` e fallback SPA.
No Netlify, configure as variáveis de ambiente:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

## 6. APK / celular
A entrega atual é PWA instalável pelo navegador, que já atende operação mobile sem loja. Se APK nativo for obrigatório, use Capacitor sobre este mesmo frontend após homologação; a camada Supabase e as telas podem ser reaproveitadas.

## Regras importantes
- Não exponha chave `service_role` no browser.
- Para produção, teste as RLS com contas de cada perfil antes da operação.
- A importação atual é cumulativa. Para substituir uma carga, exclua a carga anterior antes de importar novamente. Uma próxima evolução recomendada é criar `operations/import_batches` para versionar cargas.

## Login por CPF ou Matrícula e importação por Polo

A interface de login recebe **CPF ou Matrícula + senha**. Internamente, para interoperar com Supabase Auth, o identificador é normalizado e convertido em `<identificador>@sisurnas.local`. Esse e-mail técnico não precisa ser informado ao usuário.

O CPF administrativo reservado é **01636486541**. Para o primeiro acesso, crie no painel Authentication > Users do Supabase um usuário com e-mail `01636486541@sisurnas.local` e a senha desejada. A função `new_user_profile()` promove esse identificador automaticamente para `admin` e grava o CPF no perfil.

A tela **Importar por Polo** está disponível ao Administrador. O fluxo é: selecionar um dos 8 Polos, escolher XLS/XLSX, validar quantidade de rotas/zonas/polos detectados e confirmar. O Polo escolhido na tela prevalece sobre a coluna Polo do arquivo para todas as linhas daquele lote.

Para usuários seguintes, crie o Auth com `<CPF-ou-Matrícula>@sisurnas.local` e depois use **Acessos** para definir papel, Polo, Zona, CPF e/ou Matrícula. Em produção, recomenda-se evoluir a criação de usuários para uma Edge Function administrativa, evitando cadastro manual no Dashboard.
