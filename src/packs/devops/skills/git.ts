import type { Skill } from '../../types';

const skill: Skill = {
  id: 'git',
  title: 'Git Essencial',
  subtitle: 'Histórico sem medo',
  icon: 'git',
  tier: 0,
  x: 0.5,
  deps: [],
  xp: 100,
  summary:
    'Aprende a versionar código como uma equipa profissional: commits limpos, histórico legível, trabalho com remotes e, sobretudo, como desfazer erros sem pânico.',
  topics: [
    'Repositórios, working tree e staging',
    'Commits com boas mensagens',
    'Histórico e diferenças',
    '.gitignore',
    'Remotes: clone, push e pull',
    'Desfazer alterações com segurança',
  ],
  lessons: [
    {
      id: 'primeiros-commits',
      title: 'Repositório, staging e commits',
      minutes: 7,
      blocks: [
        { type: 'h', text: 'As três áreas do Git' },
        {
          type: 'p',
          text: 'O Git guarda **fotografias** do teu projeto, chamadas commits. Antes de tirar a fotografia, escolhes o que entra nela colocando alterações na **staging area** (ou index).',
        },
        {
          type: 'flow',
          steps: ['Working tree', 'git add', 'Staging', 'git commit', 'Repositório'],
          caption: 'O caminho de uma alteração até ao histórico',
        },
        {
          type: 'terminal',
          lines: [
            { cmd: 'git init contadores-api && cd contadores-api', out: 'Initialized empty Git repository in /home/joana/contadores-api/.git/' },
            { cmd: 'git config --global user.name "Joana Silva"', out: '' },
            { cmd: 'git config --global user.email "joana.silva@eda.pt"', out: '' },
            {
              cmd: 'git status',
              out: 'On branch main\n\nNo commits yet\n\nUntracked files:\n  (use "git add <file>..." to include in what will be committed)\n\tREADME.md\n\tsrc/',
            },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'git status é o teu GPS',
          text: 'Na dúvida, corre `git status`. Diz-te em que branch estás, o que está em staging, o que mudou e até sugere o comando seguinte.',
        },
        {
          type: 'terminal',
          lines: [
            { cmd: 'git add README.md src/', out: '' },
            {
              cmd: 'git commit -m "feat: endpoint inicial de leituras"',
              out: '[main (root-commit) 3f9c2a1] feat: endpoint inicial de leituras\n 4 files changed, 87 insertions(+)\n create mode 100644 README.md\n create mode 100644 src/server.ts',
            },
          ],
        },
        { type: 'h', text: 'Boas mensagens de commit' },
        {
          type: 'compare',
          left: 'Evita',
          right: 'Prefere',
          rows: [
            ['"fix"', '"fix: corrige timeout na leitura de contadores"'],
            ['"alterações várias"', 'Um commit por alteração lógica'],
            ['"WIP final final v2"', '"feat: adiciona paginação a /leituras"'],
            ['Descrever o *como*', 'Explicar o *porquê* no corpo da mensagem'],
          ],
        },
        {
          type: 'p',
          text: 'Muitas equipas seguem **Conventional Commits** (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`). Facilita ler o histórico e gerar changelogs automaticamente.',
        },
        {
          type: 'list',
          items: [
            '`git add -p` deixa-te escolher pedaços (hunks) de um ficheiro para staging.',
            '`git diff` mostra o que mudou e ainda não está em staging.',
            '`git diff --staged` mostra o que vai entrar no próximo commit.',
          ],
        },
        {
          type: 'quickcheck',
          question: 'Editaste `server.ts` e correste `git add server.ts`. Depois voltaste a editá-lo. O que entra se fizeres `git commit` agora?',
          options: [
            'Todas as alterações, incluindo a segunda edição',
            'Nada, porque o ficheiro mudou depois do add',
            'Apenas a versão que estava no momento do `git add`',
            'O Git dá erro e obriga a fazer add outra vez',
          ],
          answer: 2,
          explanation: 'O staging guarda uma cópia do ficheiro no momento do `git add`. A segunda edição fica apenas na working tree até voltares a fazer `git add`.',
        },
      ],
    },
    {
      id: 'historico-gitignore-remotes',
      title: 'Histórico, .gitignore e remotes',
      minutes: 7,
      blocks: [
        { type: 'h', text: 'Ler o histórico' },
        {
          type: 'terminal',
          lines: [
            {
              cmd: 'git log --oneline --graph -5',
              out: '* a81d0e4 (HEAD -> main, origin/main) fix: valida id do contador\n* 7c2b913 feat: paginação em /leituras\n* 52fe0aa docs: instruções de arranque local\n* 3f9c2a1 feat: endpoint inicial de leituras',
            },
            {
              cmd: 'git show 7c2b913 --stat',
              out: 'commit 7c2b913e4d...\nAuthor: Joana Silva <joana.silva@eda.pt>\nDate:   Fri Oct 10 16:22:05 2026 +0100\n\n    feat: paginação em /leituras\n\n src/routes/leituras.ts | 34 +++++++++++++++++++++++-----\n 1 file changed, 28 insertions(+), 6 deletions(-)',
            },
            { cmd: 'git log -S "DB_TIMEOUT" --oneline', out: '9b31c77 chore: aumenta DB_TIMEOUT para 5s' },
          ],
        },
        {
          type: 'p',
          text: '`git blame ficheiro` mostra quem alterou cada linha e em que commit. Usa-o para perceber contexto, não para apontar dedos.',
        },
        { type: 'h', text: 'O que nunca deve ir para o repositório' },
        {
          type: 'code',
          lang: 'gitignore',
          caption: '.gitignore típico de um projeto Node',
          code: `# dependências e builds
node_modules/
dist/

# segredos e configuração local
.env
.env.*
!.env.example

# lixo do sistema e do editor
.DS_Store
.idea/
*.log`,
        },
        {
          type: 'callout',
          variant: 'warn',
          title: 'O .gitignore não apaga o passado',
          text: 'Se um `.env` já foi commitado, adicioná-lo ao `.gitignore` não chega: corre `git rm --cached .env` e, se tinha segredos, **roda as credenciais**. Elas continuam no histórico.',
        },
        { type: 'h', text: 'Trabalhar com remotes' },
        {
          type: 'p',
          text: 'Um **remote** é outra cópia do repositório, normalmente no GitLab ou GitHub. Por convenção, o remote principal chama-se `origin`.',
        },
        {
          type: 'terminal',
          lines: [
            { cmd: 'git clone git@gitlab.eda.pt:plataforma/contadores-api.git', out: "Cloning into 'contadores-api'...\nReceiving objects: 100% (1243/1243), 412.07 KiB | 3.2 MiB/s, done." },
            { cmd: 'git remote -v', out: 'origin\tgit@gitlab.eda.pt:plataforma/contadores-api.git (fetch)\norigin\tgit@gitlab.eda.pt:plataforma/contadores-api.git (push)' },
            { cmd: 'git pull --rebase', out: 'Successfully rebased and updated refs/heads/main.' },
            { cmd: 'git push origin main', out: 'To gitlab.eda.pt:plataforma/contadores-api.git\n   a81d0e4..c4e7f20  main -> main' },
          ],
        },
        {
          type: 'compare',
          left: 'git fetch',
          right: 'git pull',
          rows: [
            ['Descarrega commits novos do remote', 'Faz fetch e integra logo na tua branch'],
            ['Não mexe na tua working tree', 'Pode gerar merge ou conflitos'],
            ['Seguro para "espreitar"', 'Prático no dia a dia'],
          ],
        },
        {
          type: 'quickcheck',
          question: 'O `git push` foi rejeitado com "Updates were rejected because the remote contains work that you do not have locally". O que fazes?',
          options: [
            '`git push --force` para impor a tua versão',
            'Apagas o repositório local e clonas de novo',
            'Mudas o nome da branch e fazes push',
            '`git pull --rebase` para integrar o trabalho remoto e depois `git push`',
          ],
          answer: 3,
          explanation: 'Alguém publicou commits antes de ti. Integra-os primeiro; `--force` apagaria o trabalho dos colegas no remote.',
        },
      ],
    },
    {
      id: 'desfazer-alteracoes',
      title: 'Desfazer alterações sem pânico',
      minutes: 6,
      blocks: [
        { type: 'h', text: 'Quase tudo no Git tem volta' },
        {
          type: 'p',
          text: 'A ferramenta certa depende de **onde** está o erro: na working tree, no staging, num commit local ou num commit já publicado.',
        },
        {
          type: 'compare',
          left: 'Situação',
          right: 'Comando',
          rows: [
            ['Descartar edições de um ficheiro', 'git restore ficheiro'],
            ['Tirar um ficheiro do staging', 'git restore --staged ficheiro'],
            ['Corrigir a mensagem do último commit (local)', 'git commit --amend'],
            ['Anular o último commit local, mantendo alterações', 'git reset --soft HEAD~1'],
            ['Anular um commit já publicado', 'git revert <sha>'],
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          title: 'revert vs reset',
          text: '`git revert` cria um **novo** commit que desfaz outro, sem reescrever o histórico, por isso é seguro em branches partilhadas. `git reset` move a branch para trás e reescreve o histórico local.',
        },
        {
          type: 'terminal',
          lines: [
            {
              cmd: 'git revert a81d0e4',
              out: '[main e02b6f1] Revert "fix: valida id do contador"\n 1 file changed, 2 insertions(+), 9 deletions(-)',
            },
            { cmd: 'git push', out: '   c4e7f20..e02b6f1  main -> main' },
          ],
        },
        {
          type: 'callout',
          variant: 'warn',
          title: 'Cuidado com reset --hard',
          text: '`git reset --hard` descarta alterações não commitadas de vez. Antes de o usares, faz `git stash` se houver algo que possas querer.',
        },
        { type: 'h', text: 'Guardar trabalho para depois' },
        {
          type: 'terminal',
          lines: [
            { cmd: 'git stash push -m "paginação a meio"', out: 'Saved working directory and index state On main: paginação a meio' },
            { cmd: 'git stash list', out: 'stash@{0}: On main: paginação a meio' },
            { cmd: 'git stash pop', out: 'On branch main\nChanges not staged for commit:\n\tmodified:   src/routes/leituras.ts\nDropped refs/stash@{0}' },
          ],
        },
        { type: 'h', text: 'A rede de segurança: reflog' },
        {
          type: 'p',
          text: 'O `git reflog` regista todos os sítios por onde o `HEAD` passou. Se fizeste um reset errado, encontras lá o commit "perdido" e recuperas com `git reset --hard <sha>`.',
        },
        {
          type: 'terminal',
          lines: [
            {
              cmd: 'git reflog -3',
              out: '52fe0aa HEAD@{0}: reset: moving to HEAD~2\na81d0e4 HEAD@{1}: commit: fix: valida id do contador\n7c2b913 HEAD@{2}: commit: feat: paginação em /leituras',
            },
            { cmd: 'git reset --hard a81d0e4', out: 'HEAD is now at a81d0e4 fix: valida id do contador' },
          ],
        },
        {
          type: 'quickcheck',
          question: 'Um commit com um bug já está na `main` partilhada e outros colegas já fizeram pull. Como o desfazes?',
          options: [
            '`git reset --hard HEAD~1` seguido de `git push --force`',
            '`git revert <sha>` e `git push`',
            '`git commit --amend`',
            '`git stash`',
          ],
          answer: 1,
          explanation: 'Em histórico partilhado, nunca reescrevas: o `revert` cria um commit de correção que todos recebem num pull normal.',
        },
      ],
    },
  ],
  quiz: {
    passScore: 0.8,
    draw: 6,
    questions: [
      {
        kind: 'single',
        prompt: 'Commitaste por engano um ficheiro `.env` com a password da base de dados e já fizeste push. Qual é a ação mais importante?',
        options: [
          'Adicionar `.env` ao `.gitignore`',
          'Fazer `git rm .env` e novo commit',
          'Rodar (alterar) a password imediatamente, e depois limpar o ficheiro do repositório',
          'Fazer `git commit --amend`',
        ],
        answer: 2,
        explanation: 'Depois de publicado, o segredo deve ser considerado comprometido: está no histórico e em clones de terceiros. Rodar a credencial é a prioridade.',
      },
      {
        kind: 'single',
        prompt: 'Qual é a diferença entre `git fetch` e `git pull`?',
        options: [
          '`fetch` descarrega do remote sem integrar; `pull` descarrega e integra na branch atual',
          '`fetch` envia commits; `pull` recebe commits',
          'São iguais, mudam só de nome',
          '`pull` só funciona com GitHub',
        ],
        answer: 0,
        explanation: '`git pull` é `git fetch` seguido de merge (ou rebase, com `--rebase`).',
      },
      {
        kind: 'single',
        prompt: 'O que acontece a seguir a este comando?',
        code: 'git reset --soft HEAD~1',
        options: [
          'O último commit e as suas alterações são apagados de vez',
          'É criado um commit que desfaz o anterior',
          'O remote é atualizado',
          'O último commit é desfeito e as suas alterações ficam em staging',
        ],
        answer: 3,
        explanation: '`--soft` move só a branch; o conteúdo do commit continua no index, pronto a ser commitado de novo.',
      },
      {
        kind: 'single',
        prompt: 'Fizeste `git reset --hard HEAD~3` por engano e perdeste três commits locais. Como os recuperas?',
        options: [
          'Não é possível',
          'Com `git reflog` encontras o SHA anterior e fazes `git reset --hard <sha>`',
          'Com `git revert HEAD~3`',
          'Com `git stash pop`',
        ],
        answer: 1,
        explanation: 'O reflog guarda as posições anteriores do HEAD durante semanas, por isso os commits ainda existem e podem ser recuperados.',
      },
      {
        kind: 'multi',
        prompt: 'Quais destes ficheiros devem normalmente estar no `.gitignore`? (escolhe todas as corretas)',
        options: ['node_modules/', 'package.json', '.env', 'README.md', 'dist/'],
        answers: [0, 2, 4],
        explanation: 'Dependências e builds são gerados e segredos nunca vão para o Git. `package.json` e `README.md` fazem parte do projeto.',
      },
      {
        kind: 'multi',
        prompt: 'Quais destas operações são seguras numa branch partilhada com a equipa?',
        options: ['git revert <sha>', 'git push --force', 'git pull --rebase antes de push', 'git commit --amend num commit já publicado'],
        answers: [0, 2],
        explanation: '`revert` não reescreve histórico e `pull --rebase` só reescreve os teus commits locais ainda não publicados. Force push e amend de commits publicados quebram o trabalho dos colegas.',
      },
      {
        kind: 'order',
        prompt: 'Ordena os passos para publicar uma alteração ao `server.ts`.',
        items: ['git status', 'git add server.ts', 'git commit -m "fix: ..."', 'git pull --rebase', 'git push'],
        explanation: 'Confirmas o estado, preparas o staging, crias o commit, integras o que os colegas publicaram e finalmente publicas.',
      },
      {
        kind: 'input',
        prompt: 'Que comando tira `config.yml` do staging, sem perder as alterações no ficheiro?',
        accept: ['git restore --staged config.yml', 'git reset config.yml', 'git reset head config.yml', 'git reset -- config.yml', 'git restore --staged -- config.yml'],
        placeholder: 'git ...',
        explanation: '`git restore --staged` (ou o clássico `git reset ficheiro`) retira do index, mantendo as edições na working tree.',
      },
    ],
  },
};

export default skill;
