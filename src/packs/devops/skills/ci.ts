import type { Skill } from '../../types';

const skill: Skill = {
  id: 'ci',
  title: 'Integração Contínua',
  subtitle: 'Cada commit, testado automaticamente',
  icon: 'ci',
  tier: 2,
  x: 0.42,
  deps: ['collab', 'scripting'],
  xp: 200,
  summary:
    'Constrói pipelines que testam e validam cada alteração em minutos, com GitLab CI e GitHub Actions, para que o `main` esteja sempre pronto a ir para produção.',
  topics: [
    'Princípios de integração contínua',
    'Pipelines, stages e jobs',
    'GitLab CI e GitHub Actions na prática',
    'Cache e artifacts',
    'Testes e quality gates',
    'Feedback rápido',
  ],
  lessons: [
    {
      id: 'principios-ci',
      title: 'Princípios e anatomia de um pipeline',
      minutes: 6,
      blocks: [
        { type: 'h', text: 'O que é integração contínua' },
        {
          type: 'p',
          text: 'Integração contínua (CI) é a prática de **integrar código no branch principal com frequência** e validar cada integração automaticamente com build e testes. O objetivo: descobrir problemas minutos depois de os criares, não semanas depois.',
        },
        {
          type: 'list',
          items: [
            'Integra pelo menos uma vez por dia (branches curtos).',
            'Cada push dispara um build automático e reproduzível.',
            'Os testes automáticos são a rede de segurança.',
            '**Pipeline vermelho no `main` é prioridade máxima:** quem partiu, corrige ou reverte.',
            'O pipeline deve ser rápido: idealmente menos de 10 minutos.',
          ],
        },
        { type: 'h', text: 'Pipelines, stages e jobs' },
        {
          type: 'p',
          text: 'Um **pipeline** é o processo completo disparado por um evento (push, merge request, tag). Divide-se em **stages** que correm em sequência; cada stage tem um ou mais **jobs** que correm em paralelo, cada um num runner isolado.',
        },
        {
          type: 'flow',
          steps: ['lint', 'test', 'build', 'scan', 'publish'],
          caption: 'Stages típicas. Se uma falha, as seguintes não correm.',
        },
        {
          type: 'compare',
          left: 'Conceito',
          right: 'O que é',
          rows: [
            ['Pipeline', 'Execução completa disparada por um evento'],
            ['Stage', 'Fase; corre depois da anterior terminar com sucesso'],
            ['Job', 'Unidade de trabalho: um conjunto de comandos num runner'],
            ['Runner', 'Máquina ou container que executa os jobs'],
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          title: 'CI vs CD',
          text: '**CI** garante que o código integrado está sempre testado. **Continuous Delivery** leva-o até estar pronto a fazer deploy com um clique; **Continuous Deployment** faz o deploy automaticamente.',
        },
        {
          type: 'quickcheck',
          question: 'Num pipeline com stages `lint → test → build`, o que acontece se um job da stage `test` falhar?',
          options: ['A stage `build` corre na mesma', 'O pipeline repete o job até passar', 'A stage `build` não corre e o pipeline falha', 'Só o próximo commit é afetado'],
          answer: 2,
          explanation: 'Por omissão, uma stage só começa se todos os jobs da anterior tiverem sucesso. Assim não se gastam recursos a construir código que já falhou nos testes.',
        },
      ],
    },
    {
      id: 'gitlab-github',
      title: 'GitLab CI e GitHub Actions',
      minutes: 8,
      blocks: [
        { type: 'h', text: 'GitLab CI: `.gitlab-ci.yml`' },
        {
          type: 'p',
          text: 'No GitLab, o pipeline vive num ficheiro `.gitlab-ci.yml` na raiz do repositório. Cada chave de topo (exceto palavras reservadas) é um job.',
        },
        {
          type: 'code',
          lang: 'yaml',
          caption: '.gitlab-ci.yml do contadores-api',
          code: `stages: [lint, test, build]

default:
  image: node:22-alpine
  cache:
    key:
      files: [package-lock.json]
    paths: [.npm/]

variables:
  npm_config_cache: "$CI_PROJECT_DIR/.npm"

lint:
  stage: lint
  script:
    - npm ci
    - npm run lint

test:
  stage: test
  services: [postgres:16]
  variables:
    POSTGRES_PASSWORD: test
    DATABASE_URL: postgres://postgres:test@postgres:5432/postgres
  script:
    - npm ci
    - npm test -- --coverage
  coverage: '/All files\\s*\\|\\s*([\\d.]+)/'
  artifacts:
    when: always
    reports:
      junit: reports/junit.xml

build:
  stage: build
  script:
    - npm ci
    - npm run build
  artifacts:
    paths: [dist/]
    expire_in: 1 week
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH`,
        },
        { type: 'h', text: 'GitHub Actions: `.github/workflows/*.yml`' },
        {
          type: 'p',
          text: 'No GitHub, cada ficheiro em `.github/workflows/` é um **workflow**. Os jobs correm em paralelo por omissão; usa `needs` para criar dependências. Cada job tem **steps**, que podem ser comandos (`run`) ou actions reutilizáveis (`uses`).',
        },
        {
          type: 'code',
          lang: 'yaml',
          caption: '.github/workflows/ci.yml',
          code: `name: CI
on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node: [20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ matrix.node }}
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci && npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/`,
        },
        {
          type: 'compare',
          left: 'GitLab CI',
          right: 'GitHub Actions',
          rows: [
            ['`.gitlab-ci.yml` (um ficheiro)', '`.github/workflows/*.yml` (vários)'],
            ['`stages` definem a ordem', '`needs` define dependências entre jobs'],
            ['`script:` lista de comandos', '`steps:` com `run` ou `uses`'],
            ['`rules:` / `only:` para condições', '`on:` e `if:` para condições'],
            ['Variáveis CI/CD nas definições', 'Secrets e variables nas definições'],
          ],
        },
        {
          type: 'callout',
          variant: 'warn',
          title: 'Segredos fora do YAML',
          text: 'Nunca escrevas passwords ou tokens no ficheiro do pipeline. Usa variáveis protegidas e *masked* no GitLab ou `secrets` no GitHub, e prefere OIDC para autenticar na cloud sem chaves de longa duração.',
        },
        {
          type: 'terminal',
          lines: [
            { cmd: 'git push origin feat/leituras-por-hora', out: 'remote: View merge request for feat/leituras-por-hora:\nremote:   https://gitlab.eda.pt/plataforma/contadores-api/-/merge_requests/87' },
            { cmd: 'glab ci status', out: 'Pipeline #4821 (running) for feat/leituras-por-hora\n  lint   ✓ passed   (0m 41s)\n  test   ● running\n  build  ○ created' },
          ],
        },
        {
          type: 'quickcheck',
          question: 'No GitHub Actions, como garantes que o job `build` só corre depois de `test` ter sucesso?',
          options: ['Pô-lo mais abaixo no ficheiro', 'Adicionar `needs: test` ao job `build`', 'Usar `stages: [test, build]`', 'Criar um segundo workflow'],
          answer: 1,
          explanation: 'Em GitHub Actions os jobs correm em paralelo por omissão. `needs` cria a dependência; `stages` é sintaxe do GitLab CI.',
        },
      ],
    },
    {
      id: 'cache-artifacts-gates',
      title: 'Cache, artifacts e quality gates',
      minutes: 7,
      blocks: [
        { type: 'h', text: 'Cache vs artifacts' },
        {
          type: 'p',
          text: 'Os dois guardam ficheiros entre jobs, mas com objetivos diferentes. Confundi-los é uma das causas mais comuns de pipelines lentos ou com resultados estranhos.',
        },
        {
          type: 'compare',
          left: 'Cache',
          right: 'Artifacts',
          rows: [
            ['Acelera: dependências (`.npm/`, `.m2/`, `~/.cache/pip`)', 'Passa resultados: `dist/`, relatórios, binários'],
            ['"Best effort": pode não existir', 'Garantido para jobs seguintes'],
            ['Partilhada entre pipelines', 'Pertence a um pipeline específico'],
            ['Chave baseada no lockfile', 'Tem prazo de expiração (`expire_in`)'],
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Chave de cache inteligente',
          text: 'Usa o hash do lockfile (`package-lock.json`, `poetry.lock`) como chave. A cache só é invalidada quando as dependências mudam de facto.',
        },
        { type: 'h', text: 'Quality gates' },
        {
          type: 'p',
          text: 'Um **quality gate** é uma condição que o código tem de cumprir para avançar. Se falhar, o merge request fica bloqueado. São a forma de transformar boas intenções em regras automáticas.',
        },
        {
          type: 'list',
          items: [
            '**Lint e formatação** (ESLint, Prettier, Ruff) sem erros.',
            '**Testes unitários e de integração** a passar.',
            '**Cobertura mínima** em código novo (ex.: 80%), em vez de um número global.',
            '**Análise estática e segurança:** SAST, dependências vulneráveis, segredos expostos.',
            '**Build** reproduzível do artefacto final.',
          ],
        },
        {
          type: 'terminal',
          lines: [
            { cmd: 'npm test -- --coverage', out: ' PASS  src/leituras.test.ts\n PASS  src/contadores.test.ts\n FAIL  src/faturacao.test.ts\n  ● calcula tarifa bi-horária › aplica preço de vazio\n    Expected: 0.1123\n    Received: 0.1456\n\nTests:       1 failed, 47 passed, 48 total\nTime:        6.31 s' },
          ],
        },
        { type: 'h', text: 'Feedback rápido' },
        {
          type: 'flow',
          steps: ['Lint (30s)', 'Unit (2min)', 'Integração (5min)', 'E2E (nightly)'],
          caption: 'Primeiro o que é rápido e apanha mais erros; o lento fica para o fim ou para agendado.',
        },
        {
          type: 'list',
          items: [
            'Corre jobs independentes em **paralelo**.',
            'Usa **cache** de dependências e de camadas Docker.',
            'Divide testes lentos em *shards* (`parallel: 4` no GitLab, `matrix` no GitHub).',
            'Corre só o que mudou em monorepos (`rules: changes:` ou `paths:`).',
            'Elimina testes *flaky*: um teste que falha aleatoriamente ensina a equipa a ignorar o vermelho.',
          ],
        },
        {
          type: 'quickcheck',
          question: 'O job `build` gera `dist/` e o job `deploy` precisa desses ficheiros. O que usas?',
          options: ['Cache', 'Uma variável de ambiente', 'Commit do `dist/` no repositório', 'Artifacts'],
          answer: 3,
          explanation: 'Artifacts são a forma garantida de passar resultados entre jobs do mesmo pipeline. A cache é só uma otimização e pode não estar disponível.',
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
        prompt: 'O pipeline do `main` está vermelho há dois dias e a equipa continua a fazer merge de novas alterações. Qual é o principal problema?',
        options: [
          'Nenhum, desde que os merge requests tenham aprovação',
          'Os runners ficam mais lentos',
          'Perde-se a garantia de que o `main` funciona, e novos erros ficam escondidos atrás do primeiro',
          'O GitLab bloqueia o repositório automaticamente',
        ],
        answer: 2,
        explanation: 'Com o `main` vermelho, cada novo merge pode introduzir mais falhas que ninguém deteta. Em CI, corrigir ou reverter o build partido é prioridade máxima.',
      },
      {
        kind: 'single',
        prompt: 'Neste `.gitlab-ci.yml`, quando corre o job `deploy`?',
        code: `deploy:
  stage: deploy
  script: ./deploy.sh
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH`,
        options: [
          'Apenas em pipelines do branch por omissão (ex.: `main`)',
          'Em todos os merge requests',
          'Em todos os branches exceto o `main`',
          'Nunca, falta a palavra `when: always`',
        ],
        answer: 0,
        explanation: 'A regra só inclui o job quando o branch do commit é o branch por omissão do projeto. Em feature branches o job nem aparece no pipeline.',
      },
      {
        kind: 'single',
        prompt: 'O pipeline demora 25 minutos e a maior parte do tempo é `npm ci` a descarregar dependências. Qual é a melhoria mais direta?',
        options: [
          'Remover os testes',
          'Configurar cache de dependências com chave no `package-lock.json`',
          'Usar artifacts para guardar `node_modules/` para sempre',
          'Correr o pipeline só uma vez por semana',
        ],
        answer: 1,
        explanation: 'Cache com chave no lockfile reutiliza as dependências entre pipelines e só as volta a descarregar quando mudam. Artifacts não servem para isto.',
      },
      {
        kind: 'single',
        prompt: 'Um teste de integração falha aleatoriamente cerca de 1 vez em cada 10 execuções. Qual é a melhor atitude?',
        options: [
          'Configurar retry infinito até passar',
          'Ignorar, porque normalmente passa',
          'Apagar todos os testes de integração',
          'Isolar o teste (quarentena), investigar a causa e corrigi-lo',
        ],
        answer: 3,
        explanation: 'Testes flaky destroem a confiança no pipeline. Coloca-o em quarentena para não bloquear a equipa, mas trata a causa (timing, dados partilhados, dependências externas).',
      },
      {
        kind: 'multi',
        prompt: 'Que verificações fazem sentido como quality gates num merge request? (escolhe todas as corretas)',
        options: [
          'Lint sem erros',
          'Testes automáticos a passar',
          'Número mínimo de linhas alteradas',
          'Scan de dependências vulneráveis e segredos',
          'Aprovação do diretor da empresa',
        ],
        answers: [0, 1, 3],
        explanation: 'Lint, testes e scans de segurança são verificações automáticas objetivas. Número de linhas não mede qualidade e aprovações de gestão não são um gate técnico de CI.',
      },
      {
        kind: 'multi',
        prompt: 'Sobre GitHub Actions, quais afirmações estão corretas? (escolhe todas as corretas)',
        options: [
          'Os jobs de um workflow correm em paralelo por omissão',
          '`needs` cria dependências entre jobs',
          'Os workflows ficam em `.gitlab-ci.yml`',
          '`strategy.matrix` permite correr o mesmo job com várias versões',
        ],
        answers: [0, 1, 3],
        explanation: 'Jobs são paralelos salvo indicação com `needs`, e `matrix` multiplica jobs por combinações. Os workflows vivem em `.github/workflows/`.',
      },
      {
        kind: 'order',
        prompt: 'Ordena as stages de um pipeline para dar o feedback mais rápido possível.',
        items: [
          'Lint e formatação',
          'Testes unitários',
          'Testes de integração',
          'Build e publicação do artefacto',
        ],
        explanation: 'Começa pelo mais rápido e que apanha mais erros. Construir e publicar só faz sentido depois de o código estar validado.',
      },
      {
        kind: 'input',
        prompt: 'No GitLab CI, que palavra-chave de um job define os ficheiros a passar para jobs seguintes do mesmo pipeline (ex.: a pasta `dist/`)?',
        accept: ['artifacts', 'artifacts:', 'artifacts: paths', 'artifacts:paths'],
        placeholder: 'palavra-chave',
        explanation: '`artifacts` (com `paths`) guarda ficheiros gerados por um job e disponibiliza-os aos jobs das stages seguintes.',
      },
    ],
  },
};

export default skill;
