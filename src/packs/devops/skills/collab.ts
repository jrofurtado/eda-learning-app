import type { Skill } from '../../types';

const skill: Skill = {
  id: 'collab',
  title: 'Branches & Merge Requests',
  subtitle: 'Colaborar sem pisar ninguém',
  icon: 'merge',
  tier: 1,
  x: 0.5,
  deps: ['git'],
  xp: 150,
  summary:
    'Aprende a trabalhar em equipa com Git: estratégias de branching, merge vs rebase, resolução de conflitos e merge requests com code review a sério.',
  topics: [
    'Trunk-based development vs GitFlow',
    'Merge, rebase e squash',
    'Resolver conflitos com confiança',
    'Merge requests e code review',
    'Conventional Commits',
    'Branches protegidos e regras de aprovação',
  ],
  lessons: [
    {
      id: 'branching-strategies',
      title: 'Estratégias de branching',
      minutes: 6,
      blocks: [
        { type: 'h', text: 'Porque é que a estratégia importa' },
        {
          type: 'p',
          text: 'Um branch é só um apontador barato para um commit. O difícil não é criá-lo: é decidir **quanto tempo vive** e **como volta** ao `main` sem dores de cabeça.',
        },
        {
          type: 'p',
          text: 'Na equipa do `contadores-api`, três pessoas a trabalhar durante duas semanas em branches separados significa três integrações dolorosas no fim. A estratégia certa reduz esse risco.',
        },
        { type: 'h', text: 'Trunk-based development' },
        {
          type: 'p',
          text: 'Todos integram no `main` (o *trunk*) pelo menos uma vez por dia, através de branches de vida curta (horas, no máximo 1–2 dias). Funcionalidades incompletas ficam escondidas atrás de **feature flags**.',
        },
        {
          type: 'flow',
          steps: ['Branch curto', 'Commits pequenos', 'Merge request', 'CI verde', 'Merge no main'],
          caption: 'Ciclo típico em trunk-based: horas, não semanas.',
        },
        { type: 'h', text: 'GitFlow' },
        {
          type: 'p',
          text: 'O GitFlow usa branches de longa duração (`main`, `develop`) e branches de apoio (`feature/*`, `release/*`, `hotfix/*`). Faz sentido quando tens várias versões suportadas em paralelo, como firmware de contadores instalado no terreno.',
        },
        {
          type: 'compare',
          left: 'Trunk-based',
          right: 'GitFlow',
          rows: [
            ['Branches vivem horas ou 1–2 dias', 'Feature branches podem viver semanas'],
            ['Um branch principal: `main`', '`main` + `develop` + `release/*` + `hotfix/*`'],
            ['Ideal para entrega contínua', 'Ideal para releases versionadas e espaçadas'],
            ['Feature flags escondem trabalho incompleto', 'Trabalho incompleto fica isolado no branch'],
            ['Conflitos pequenos e frequentes', 'Conflitos grandes e raros (mas dolorosos)'],
          ],
        },
        {
          type: 'terminal',
          lines: [
            { cmd: 'git switch main && git pull --ff-only', out: 'Already on \'main\'\nUpdating 3f2a1c9..8b7d4e0\nFast-forward\n src/leituras.ts | 12 +++++++-----\n 1 file changed, 7 insertions(+), 5 deletions(-)' },
            { cmd: 'git switch -c feat/leituras-por-hora', out: 'Switched to a new branch \'feat/leituras-por-hora\'' },
            { cmd: 'git push -u origin feat/leituras-por-hora', out: 'Total 0 (delta 0), reused 0 (delta 0)\nremote: To create a merge request for feat/leituras-por-hora, visit:\nremote:   https://gitlab.eda.pt/plataforma/contadores-api/-/merge_requests/new\nbranch \'feat/leituras-por-hora\' set up to track \'origin/feat/leituras-por-hora\'.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Nomes que se explicam',
          text: 'Usa prefixos como `feat/`, `fix/`, `chore/` e inclui o ID do ticket quando existir: `fix/CNT-142-timeout-leituras`.',
        },
        {
          type: 'quickcheck',
          question: 'A equipa faz deploy várias vezes por dia e quer evitar conflitos grandes. Que estratégia encaixa melhor?',
          options: ['GitFlow com branch `develop`', 'Trunk-based com branches curtos e feature flags', 'Um branch por programador durante o sprint', 'Commits diretos no `main` sem revisão'],
          answer: 1,
          explanation: 'Trunk-based com branches de vida curta integra cedo e muitas vezes, mantendo conflitos pequenos. Feature flags permitem fazer merge de trabalho incompleto em segurança.',
        },
      ],
    },
    {
      id: 'merge-rebase-conflicts',
      title: 'Merge, rebase e conflitos',
      minutes: 7,
      blocks: [
        { type: 'h', text: 'Duas formas de juntar histórias' },
        {
          type: 'p',
          text: '`git merge` cria um **merge commit** que une as duas linhas de história, preservando exatamente o que aconteceu. `git rebase` **reescreve** os teus commits por cima da ponta do outro branch, deixando uma história linear.',
        },
        {
          type: 'compare',
          left: 'git merge',
          right: 'git rebase',
          rows: [
            ['Preserva a história real', 'Cria história linear e limpa'],
            ['Não reescreve commits', 'Gera novos hashes para os teus commits'],
            ['Seguro em branches partilhados', 'Só em branches teus (ainda não partilhados)'],
            ['Pode encher o log de merge commits', 'Exige `push --force-with-lease` depois'],
          ],
        },
        {
          type: 'callout',
          variant: 'warn',
          title: 'A regra de ouro do rebase',
          text: 'Nunca faças rebase de commits que outras pessoas já têm. Se precisares de forçar o push do teu branch, usa sempre `--force-with-lease`, que recusa se alguém tiver feito push entretanto.',
        },
        {
          type: 'terminal',
          lines: [
            { cmd: 'git fetch origin', out: 'From gitlab.eda.pt:plataforma/contadores-api\n   8b7d4e0..c41e9a2  main       -> origin/main' },
            { cmd: 'git rebase origin/main', out: 'Auto-merging src/leituras.ts\nCONFLICT (content): Merge conflict in src/leituras.ts\nerror: could not apply 5e1f0b3... feat: agregar leituras por hora\nhint: Resolve all conflicts manually, mark them as resolved with\nhint: "git add/rm <conflicted_files>", then run "git rebase --continue".' },
            { cmd: 'git status --short', out: 'UU src/leituras.ts' },
          ],
        },
        { type: 'h', text: 'Anatomia de um conflito' },
        {
          type: 'code',
          lang: 'ts',
          caption: 'O Git marca as duas versões; tu decides o resultado final.',
          code: `export function intervaloLeitura(): number {
<<<<<<< HEAD
  return 15 * 60; // main: leituras a cada 15 minutos
=======
  return 60 * 60; // o teu commit: agregação por hora
>>>>>>> 5e1f0b3 (feat: agregar leituras por hora)
}`,
        },
        {
          type: 'list',
          ordered: true,
          items: [
            'Lê as duas versões e percebe a **intenção** de cada uma (fala com o autor se precisares).',
            'Edita o ficheiro até ficar correto e remove os marcadores `<<<<<<<`, `=======`, `>>>>>>>`.',
            'Corre os testes localmente.',
            '`git add src/leituras.ts` e `git rebase --continue` (ou `git commit` num merge).',
            'Em pânico? `git rebase --abort` volta tudo ao estado anterior.',
          ],
        },
        {
          type: 'terminal',
          lines: [
            { cmd: 'git add src/leituras.ts', out: '' },
            { cmd: 'git rebase --continue', out: '[detached HEAD 9a0c7d1] feat: agregar leituras por hora\n 1 file changed, 18 insertions(+), 3 deletions(-)\nSuccessfully rebased and updated refs/heads/feat/leituras-por-hora.' },
            { cmd: 'git push --force-with-lease', out: '+ 5e1f0b3...9a0c7d1 feat/leituras-por-hora -> feat/leituras-por-hora (forced update)' },
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          title: 'Squash merge',
          text: 'Muitas equipas fazem **squash** ao aceitar o merge request: todos os commits do branch viram um só no `main`. A história fica limpa sem obrigar ninguém a fazer rebase interativo.',
        },
        {
          type: 'quickcheck',
          question: 'Fizeste rebase do teu branch pessoal e o `git push` foi rejeitado. Qual é o passo mais seguro?',
          options: ['`git push --force`', '`git pull` e voltar a fazer push', '`git push --force-with-lease`', 'Apagar o branch remoto e recriá-lo'],
          answer: 2,
          explanation: 'Depois de um rebase os hashes mudam, por isso é preciso forçar. `--force-with-lease` só sobrescreve se o remoto ainda estiver como da última vez que fizeste fetch, protegendo trabalho alheio.',
        },
      ],
    },
    {
      id: 'merge-requests-review',
      title: 'Merge requests e code review',
      minutes: 7,
      blocks: [
        { type: 'h', text: 'O merge request é uma conversa' },
        {
          type: 'p',
          text: 'Um **merge request** (GitLab) ou **pull request** (GitHub) propõe integrar um branch noutro. É onde o CI corre, onde a equipa revê e onde fica registado *porquê* a mudança foi feita.',
        },
        {
          type: 'flow',
          steps: ['Abrir MR', 'CI corre', 'Code review', 'Ajustes', 'Aprovação', 'Merge'],
        },
        { type: 'h', text: 'Conventional Commits' },
        {
          type: 'p',
          text: 'Mensagens com formato `tipo(âmbito): descrição` tornam o histórico legível e permitem gerar changelogs e versões semânticas automaticamente.',
        },
        {
          type: 'code',
          lang: 'text',
          caption: 'Exemplos de Conventional Commits',
          code: `feat(leituras): agregar consumos por hora
fix(auth): renovar token antes de expirar
docs: explicar variáveis de ambiente no README
refactor(db): extrair repositório de contadores
feat(api)!: remover endpoint /v1/leituras

BREAKING CHANGE: clientes devem usar /v2/leituras`,
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Versões automáticas',
          text: '`fix` sobe o *patch* (1.4.**1**), `feat` sobe o *minor* (1.**5**.0) e `!` ou `BREAKING CHANGE` sobe o *major* (**2**.0.0).',
        },
        { type: 'h', text: 'Etiqueta de code review' },
        {
          type: 'list',
          items: [
            '**Autor:** MRs pequenos (idealmente < 400 linhas), descrição clara, screenshots ou exemplos de pedidos quando ajudam.',
            '**Revisor:** critica o código, não a pessoa. Faz perguntas: *"E se o contador não enviar leitura?"*',
            'Distingue bloqueios de sugestões: prefixa com `nit:` o que é cosmético.',
            'Responde em menos de um dia útil: um MR parado bloqueia alguém.',
            'Deixa os linters e o CI apanharem estilo; a revisão humana foca-se em lógica, segurança e design.',
          ],
        },
        { type: 'h', text: 'Branches protegidos' },
        {
          type: 'p',
          text: 'Proteger o `main` impede pushes diretos e force-push. Combinado com regras de aprovação, garante que nada chega a produção sem CI verde e pelo menos um par de olhos.',
        },
        {
          type: 'compare',
          left: 'Regra',
          right: 'O que evita',
          rows: [
            ['Sem push direto no `main`', 'Alterações não revistas em produção'],
            ['Pipeline tem de passar', 'Merge de código que parte os testes'],
            ['Mínimo 1–2 aprovações', 'Decisões de uma só pessoa'],
            ['CODEOWNERS obrigatórios', 'Mudanças em áreas críticas sem o dono saber'],
            ['Force-push bloqueado', 'Reescrever história partilhada'],
          ],
        },
        {
          type: 'quickcheck',
          question: 'Qual destes commits faria subir a versão *minor* com semantic-release?',
          options: ['`fix(api): corrigir paginação`', '`chore: atualizar dependências`', '`docs: rever README`', '`feat(api): filtrar leituras por zona`'],
          answer: 3,
          explanation: 'Em Conventional Commits, `feat` indica nova funcionalidade e sobe o minor. `fix` sobe o patch; `chore` e `docs` normalmente não geram release.',
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
        prompt: 'A equipa do `contadores-api` usa trunk-based development. Uma funcionalidade vai demorar três semanas. Qual é a abordagem recomendada?',
        options: [
          'Fazer merges pequenos e frequentes no `main`, escondendo a funcionalidade atrás de uma feature flag',
          'Criar um branch `feature/` e fazer merge só quando estiver completa',
          'Criar um branch `develop` só para esta funcionalidade',
          'Trabalhar localmente sem push até estar pronta',
        ],
        answer: 0,
        explanation: 'Em trunk-based, integra-se continuamente. A feature flag mantém o código inativo em produção até estar pronto, evitando um merge gigante no fim.',
      },
      {
        kind: 'single',
        prompt: 'O teu colega fez rebase do branch partilhado `release/2.3` e fez force-push. O que é mais provável acontecer?',
        options: [
          'Nada, o Git sincroniza automaticamente',
          'Os outros perdem acesso ao repositório',
          'O CI passa a falhar sempre',
          'Quem já tinha os commits antigos fica com histórias divergentes e possíveis commits duplicados',
        ],
        answer: 3,
        explanation: 'O rebase cria novos hashes. Quem tinha a versão antiga do branch fica com história divergente, o que gera confusão e duplicações. Por isso não se faz rebase de branches partilhados.',
      },
      {
        kind: 'single',
        prompt: 'Durante um merge vês este conteúdo. O que representa a parte entre `=======` e `>>>>>>>`?',
        code: `<<<<<<< HEAD
const TIMEOUT = 5000;
=======
const TIMEOUT = 10000;
>>>>>>> feat/timeout-maior`,
        options: [
          'A versão do branch onde estás (HEAD)',
          'A versão que vem do branch `feat/timeout-maior`',
          'O ancestral comum dos dois branches',
          'Uma sugestão automática do Git',
        ],
        answer: 1,
        explanation: 'A secção acima de `=======` é a do HEAD (branch atual); a de baixo é a do branch que estás a integrar, identificado após `>>>>>>>`.',
      },
      {
        kind: 'single',
        prompt: 'Qual destas mensagens segue corretamente Conventional Commits e indica uma breaking change?',
        options: [
          'Fix: Corrigido bug do login',
          '[BREAKING] api changes',
          'feat(api)!: remover suporte a API keys antigas',
          'update: nova versão da API',
        ],
        answer: 2,
        explanation: 'O formato é `tipo(âmbito): descrição`, e o `!` antes dos dois pontos (ou um rodapé `BREAKING CHANGE:`) assinala uma alteração incompatível.',
      },
      {
        kind: 'multi',
        prompt: 'Que regras de proteção do `main` ajudam a garantir que só código revisto e testado chega a produção? (escolhe todas as corretas)',
        options: [
          'Bloquear push direto no `main`',
          'Exigir pipeline com sucesso antes do merge',
          'Permitir force-push a todos os developers',
          'Exigir pelo menos uma aprovação de um revisor',
          'Desativar o CI em merge requests pequenos',
        ],
        answers: [0, 1, 3],
        explanation: 'Bloquear pushes diretos, exigir CI verde e exigir aprovações são a base. Permitir force-push ou desativar CI enfraquece a proteção.',
      },
      {
        kind: 'multi',
        prompt: 'Quais destas práticas são boa etiqueta de code review? (escolhe todas as corretas)',
        options: [
          'Manter merge requests pequenos e focados',
          'Marcar sugestões cosméticas com `nit:`',
          'Comentar o estilo de indentação linha a linha em vez de usar um linter',
          'Fazer perguntas sobre casos limite em vez de impor soluções',
        ],
        answers: [0, 1, 3],
        explanation: 'MRs pequenos, sinalizar o que é opcional e perguntar em vez de impor tornam a revisão rápida e respeitosa. Estilo deve ser automatizado com linters.',
      },
      {
        kind: 'order',
        prompt: 'Ordena os passos para atualizar o teu branch com rebase e resolver um conflito.',
        items: [
          'git fetch origin',
          'git rebase origin/main',
          'Editar o ficheiro e remover os marcadores de conflito',
          'git add <ficheiro> && git rebase --continue',
          'git push --force-with-lease',
        ],
        explanation: 'Primeiro trazes o estado remoto, depois reaplicas os teus commits por cima, resolves, continuas o rebase e finalmente forças o push de forma segura.',
      },
      {
        kind: 'input',
        prompt: 'A meio de um rebase com conflitos complicados, queres desistir e voltar ao estado anterior. Que comando usas?',
        accept: ['git rebase --abort'],
        placeholder: 'git ...',
        explanation: '`git rebase --abort` cancela o rebase em curso e devolve o branch exatamente ao estado em que estava antes de começares.',
      },
    ],
  },
};

export default skill;
