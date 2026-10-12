import type { Skill } from '../../types';

const skill: Skill = {
  id: 'cd',
  title: 'Entrega Contínua',
  subtitle: 'Do commit à produção, sem drama',
  icon: 'deploy',
  tier: 3,
  x: 0.42,
  deps: ['ci', 'docker'],
  xp: 250,
  summary:
    'Leva código para produção de forma frequente, segura e reversível: ambientes e promoção de artefactos, estratégias de deploy, feature flags e rollbacks.',
  topics: [
    'Continuous delivery vs deployment',
    'Ambientes e promoção de artefactos',
    'Rolling, blue-green e canary',
    'Feature flags',
    'Rollbacks e versionamento semver',
    'Release pipelines',
  ],
  lessons: [
    {
      id: 'delivery-vs-deployment',
      title: 'Delivery, deployment e ambientes',
      minutes: 6,
      blocks: [
        {
          type: 'p',
          text: 'A CI garante que cada commit compila e passa nos testes. A **CD** dá o passo seguinte: garante que esse commit pode chegar a produção de forma rápida, repetível e segura.',
        },
        {
          type: 'compare',
          left: 'Continuous Delivery',
          right: 'Continuous Deployment',
          rows: [
            ['Cada commit fica *pronto* para produção', 'Cada commit vai *automaticamente* para produção'],
            ['Deploy final com aprovação humana', 'Sem intervenção humana'],
            ['Comum em setores regulados (energia, banca)', 'Comum em produtos web com testes muito fortes'],
            ['Exige pipeline fiável', 'Exige pipeline fiável + excelente observabilidade'],
          ],
        },
        { type: 'h', text: 'Build once, deploy many' },
        {
          type: 'p',
          text: 'A regra de ouro: constróis o artefacto **uma única vez** e promoves exatamente esse artefacto (a mesma imagem, o mesmo digest) por todos os ambientes. Só a configuração muda entre ambientes.',
        },
        {
          type: 'flow',
          steps: ['Build imagem', 'dev', 'staging', 'Aprovação', 'produção'],
          caption: 'A mesma imagem contadores-api:1.5.0 promovida entre ambientes',
        },
        {
          type: 'callout',
          variant: 'warn',
          title: 'Anti-padrão',
          text: 'Reconstruir a imagem para cada ambiente significa que o que testaste em staging *não* é o que vai para produção. Uma dependência pode ter mudado entretanto.',
        },
        {
          type: 'list',
          items: [
            '**dev**: deploy a cada merge, feedback rápido para a equipa.',
            '**staging**: o mais parecido possível com produção; testes E2E e de carga.',
            '**produção**: só recebe artefactos que passaram em staging.',
            'Configuração por ambiente via variáveis, ConfigMaps ou secret stores — nunca dentro da imagem.',
          ],
        },
        {
          type: 'code',
          lang: 'yaml',
          caption: '.gitlab-ci.yml — promoção com aprovação manual',
          code: `stages: [build, deploy-staging, deploy-prod]

build:
  stage: build
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_TAG .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_TAG

deploy-staging:
  stage: deploy-staging
  environment: staging
  script: ./deploy.sh staging $CI_COMMIT_TAG

deploy-prod:
  stage: deploy-prod
  environment: producao
  when: manual          # continuous delivery: um humano carrega no botão
  script: ./deploy.sh producao $CI_COMMIT_TAG`,
        },
        {
          type: 'quickcheck',
          question: 'A tua pipeline faz deploy automático para staging, mas produção exige que alguém clique em "Deploy". Isto é...',
          options: [
            'Continuous Integration apenas',
            'Continuous Delivery',
            'Continuous Deployment',
            'Deploy manual tradicional',
          ],
          answer: 1,
          explanation: 'O artefacto está sempre pronto para produção, mas o passo final é uma decisão humana: isso é Continuous Delivery.',
        },
      ],
    },
    {
      id: 'estrategias-deploy',
      title: 'Estratégias de deploy',
      minutes: 8,
      blocks: [
        {
          type: 'p',
          text: 'Pôr uma nova versão em produção não tem de significar downtime ou risco total. A estratégia certa depende do custo de infraestrutura, da tolerância ao risco e da arquitetura da aplicação.',
        },
        { type: 'h', text: 'Rolling update' },
        {
          type: 'p',
          text: 'As instâncias são substituídas aos poucos: tira uma antiga, põe uma nova, verifica a saúde, repete. É o padrão do Kubernetes e não exige infraestrutura extra.',
        },
        {
          type: 'flow',
          steps: ['100% v1', '25% v2', '50% v2', '100% v2'],
          caption: 'Rolling update: v1 e v2 coexistem durante a transição',
        },
        { type: 'h', text: 'Blue-green' },
        {
          type: 'p',
          text: 'Tens dois ambientes idênticos: **blue** (atual) e **green** (nova versão). Testas o green e depois mudas o router/load balancer de uma vez. O rollback é instantâneo: voltas a apontar para blue.',
        },
        { type: 'h', text: 'Canary' },
        {
          type: 'p',
          text: 'A nova versão recebe primeiro uma pequena fatia do tráfego (ex.: 5%). Comparas métricas de erros e latência; se estiverem saudáveis, aumentas gradualmente até 100%.',
        },
        {
          type: 'code',
          lang: 'yaml',
          caption: 'Argo Rollouts — canary progressivo para a contadores-api',
          code: `apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: contadores-api
spec:
  replicas: 10
  strategy:
    canary:
      steps:
        - setWeight: 5
        - pause: { duration: 10m }
        - analysis:
            templates:
              - templateName: taxa-erros-abaixo-1pct
        - setWeight: 25
        - pause: { duration: 10m }
        - setWeight: 100`,
        },
        {
          type: 'compare',
          left: 'Blue-green',
          right: 'Canary',
          rows: [
            ['Troca 100% do tráfego de uma vez', 'Aumenta o tráfego gradualmente'],
            ['Precisa do dobro da infraestrutura', 'Precisa de poucas instâncias extra'],
            ['Rollback instantâneo', 'Rollback afeta só a fatia exposta'],
            ['Validação antes da troca', 'Validação com tráfego real e métricas'],
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          title: 'Atenção à base de dados',
          text: 'Em rolling e canary, duas versões correm em simultâneo. As migrações de schema têm de ser **retrocompatíveis** (padrão *expand/contract*): primeiro adiciona colunas, só remove as antigas numa release posterior.',
        },
        {
          type: 'quickcheck',
          question: 'Queres expor a nova versão a apenas 5% dos clientes e avançar só se a taxa de erros se mantiver baixa. Que estratégia usas?',
          options: ['Blue-green', 'Recreate', 'Rolling update', 'Canary'],
          answer: 3,
          explanation: 'O canary encaminha uma pequena percentagem do tráfego para a nova versão e avança com base em métricas.',
        },
      ],
    },
    {
      id: 'flags-rollbacks-versoes',
      title: 'Feature flags, rollbacks e versões',
      minutes: 7,
      blocks: [
        {
          type: 'p',
          text: '**Deploy** e **release** não são a mesma coisa. Com **feature flags** fazes deploy do código desligado e ativas a funcionalidade quando quiseres, para quem quiseres, sem novo deploy.',
        },
        {
          type: 'code',
          lang: 'typescript',
          caption: 'Feature flag com OpenFeature',
          code: `import { OpenFeature } from '@openfeature/server-sdk';

const flags = OpenFeature.getClient();

export async function calcularFatura(cliente: Cliente) {
  const novoTarifario = await flags.getBooleanValue(
    'tarifario-dinamico-2026',
    false,                       // valor por defeito se o serviço falhar
    { targetingKey: cliente.id, regiao: cliente.regiao },
  );

  return novoTarifario ? tarifarioDinamico(cliente) : tarifarioClassico(cliente);
}`,
        },
        {
          type: 'list',
          items: [
            'Ativa primeiro para utilizadores internos, depois para uma região, depois para todos.',
            'Uma flag desligada é um "kill switch" mais rápido do que qualquer rollback.',
            'Remove flags antigas: cada flag é dívida técnica e um ramo extra para testar.',
          ],
        },
        { type: 'h', text: 'Rollbacks' },
        {
          type: 'p',
          text: 'Um rollback deve ser **aborrecido**: um comando, testado, sem improviso. Como promoves artefactos imutáveis, voltar atrás é simplesmente fazer deploy da versão anterior.',
        },
        {
          type: 'terminal',
          lines: [
            {
              cmd: 'kubectl rollout history deployment/contadores-api',
              out: 'deployment.apps/contadores-api\nREVISION  CHANGE-CAUSE\n7         release 1.4.2\n8         release 1.5.0',
            },
            {
              cmd: 'kubectl rollout undo deployment/contadores-api',
              out: 'deployment.apps/contadores-api rolled back',
            },
            {
              cmd: 'kubectl rollout status deployment/contadores-api',
              out: 'Waiting for deployment "contadores-api" rollout to finish: 3 of 4 updated replicas are available...\ndeployment "contadores-api" successfully rolled out',
            },
          ],
        },
        { type: 'h', text: 'Semantic Versioning' },
        {
          type: 'p',
          text: 'O **semver** usa `MAJOR.MINOR.PATCH`. Incrementa MAJOR para alterações que quebram compatibilidade, MINOR para novas funcionalidades compatíveis e PATCH para correções.',
        },
        {
          type: 'compare',
          left: 'Alteração',
          right: 'De 1.4.2 passa a...',
          rows: [
            ['Corrigido bug no cálculo de IVA', '1.4.3'],
            ['Novo endpoint `/leituras/estimadas`', '1.5.0'],
            ['Removido o endpoint `/v1/contadores`', '2.0.0'],
            ['Pré-lançamento para testes', '2.0.0-rc.1'],
          ],
        },
        {
          type: 'flow',
          steps: ['Merge na main', 'Tag v1.5.0', 'Build + SBOM', 'Changelog', 'Promoção'],
          caption: 'Release pipeline típica',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Automatiza as versões',
          text: 'Com **Conventional Commits** (`feat:`, `fix:`, `feat!:`) ferramentas como semantic-release ou release-please calculam a próxima versão e geram o changelog sozinhas.',
        },
        {
          type: 'quickcheck',
          question: 'A `contadores-api` está na versão 3.2.7. Adicionas um campo opcional à resposta JSON, sem quebrar clientes. Qual é a próxima versão?',
          options: ['3.2.8', '4.0.0', '3.3.0', '3.2.7-1'],
          answer: 2,
          explanation: 'Nova funcionalidade retrocompatível incrementa o MINOR e faz reset ao PATCH: 3.3.0.',
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
        prompt: 'Um bug passou em staging mas falha em produção. Descobres que a pipeline faz `docker build` separadamente para cada ambiente. Qual é o problema de fundo?',
        options: [
          'Os ambientes têm nomes diferentes',
          'O artefacto testado em staging não é o mesmo que foi para produção',
          'O staging tem menos réplicas',
          'Falta um passo de lint',
        ],
        answer: 1,
        explanation: 'O princípio "build once, deploy many" garante que o artefacto validado é exatamente o que chega a produção. Rebuilds podem trazer dependências diferentes.',
      },
      {
        kind: 'single',
        prompt: 'Tens orçamento para duplicar temporariamente a infraestrutura e precisas de rollback instantâneo com troca de tráfego total. Que estratégia escolhes?',
        options: ['Blue-green', 'Canary', 'Recreate', 'Rolling update'],
        answer: 0,
        explanation: 'Blue-green mantém dois ambientes completos; trocar o router de volta para blue é um rollback imediato.',
      },
      {
        kind: 'single',
        prompt: 'O novo tarifário está em produção atrás de uma feature flag ativa para 20% dos clientes, e surgem queixas de faturas erradas. Qual é a ação mais rápida?',
        options: [
          'Reverter o commit e esperar pela pipeline',
          'Fazer rollback da base de dados',
          'Reiniciar todos os pods',
          'Desligar a feature flag',
        ],
        answer: 3,
        explanation: 'A flag funciona como kill switch: desligá-la retira a funcionalidade em segundos, sem build nem deploy.',
      },
      {
        kind: 'single',
        prompt: 'Vais remover a coluna `leitura_antiga` da base de dados e fazes rolling update. Qual é a abordagem segura?',
        options: [
          'Remover a coluna e fazer deploy do código na mesma release',
          'Fazer deploy com downtime planeado obrigatório',
          'Primeiro fazer deploy de código que já não usa a coluna; removê-la numa release seguinte',
          'Remover a coluna primeiro e só depois fazer deploy',
        ],
        answer: 2,
        explanation: 'Durante o rolling update a versão antiga ainda corre. O padrão expand/contract garante que ambas as versões funcionam com o schema em cada momento.',
      },
      {
        kind: 'multi',
        prompt: 'Que alterações exigem incrementar a versão MAJOR em semver? (escolhe todas as corretas)',
        options: [
          'Remover um endpoint público da API',
          'Corrigir um erro de arredondamento',
          'Tornar obrigatório um parâmetro que era opcional',
          'Adicionar um novo endpoint',
        ],
        answers: [0, 2],
        explanation: 'Remover endpoints ou tornar parâmetros obrigatórios quebra clientes existentes: MAJOR. Correções são PATCH e novos endpoints são MINOR.',
      },
      {
        kind: 'order',
        prompt: 'Ordena os passos de um canary release bem feito.',
        items: [
          'Deploy da nova versão ao lado da atual',
          'Encaminhar 5% do tráfego para a nova versão',
          'Comparar taxa de erros e latência com a versão atual',
          'Aumentar gradualmente o tráfego',
          'Promover a 100% e retirar a versão antiga',
        ],
        explanation: 'O canary avança por etapas, sempre validado por métricas, até substituir totalmente a versão anterior.',
      },
      {
        kind: 'input',
        prompt: 'O último deploy do Deployment `contadores-api` está a falhar. Que comando kubectl usas para voltar à revisão anterior?',
        placeholder: 'kubectl ...',
        accept: [
          'kubectl rollout undo deployment/contadores-api',
          'kubectl rollout undo deployment contadores-api',
          'kubectl rollout undo deploy/contadores-api',
          'kubectl rollout undo deploy contadores-api',
        ],
        explanation: '`kubectl rollout undo` repõe a revisão anterior do Deployment, recriando os pods com a imagem antiga.',
      },
      {
        kind: 'single',
        prompt: 'Qual é a diferença entre Continuous Delivery e Continuous Deployment?',
        options: [
          'Delivery é para frontend, Deployment para backend',
          'Em Deployment, cada alteração aprovada pela pipeline vai para produção sem intervenção humana',
          'Delivery não usa testes automáticos',
          'São sinónimos',
        ],
        answer: 1,
        explanation: 'Em ambas o código está sempre pronto a ir para produção; em Continuous Deployment o último passo também é automático.',
      },
    ],
  },
};

export default skill;
