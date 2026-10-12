import type { Skill } from '../../types';

const skill: Skill = {
  id: 'devops-architect',
  title: 'Arquiteto DevOps',
  subtitle: 'Desenhar plataformas que aceleram equipas',
  icon: 'crown',
  tier: 6,
  x: 0.5,
  deps: ['sre', 'security', 'iac'],
  xp: 1000,
  goal: true,
  summary:
    'O capstone: junta Git, CI, containers, IaC, Kubernetes, GitOps, observabilidade e segurança numa plataforma de entrega coerente, e aprende a medi-la, evoluí-la e liderar a sua adoção.',
  topics: [
    'Cultura DevOps: CALMS',
    'Métricas DORA (four keys)',
    'Platform engineering e IDPs',
    'Plataforma end-to-end: do commit à produção',
    'Golden paths, maturidade e DevEx',
    'FinOps e evolução contínua',
  ],
  lessons: [
    {
      id: 'cultura-metricas',
      title: 'Cultura, métricas DORA e platform engineering',
      minutes: 8,
      blocks: [
        { type: 'h', text: 'DevOps é primeiro cultura, depois ferramentas' },
        {
          type: 'p',
          text: 'Chegaste ao topo da árvore. Um arquiteto DevOps não é quem conhece mais ferramentas, é quem desenha **sistemas sociotécnicos** em que as equipas entregam valor depressa e com segurança.',
        },
        {
          type: 'compare',
          left: 'CALMS',
          right: 'Na prática',
          rows: [
            ['**C**ulture', 'Responsabilidade partilhada, postmortems blameless, "you build it, you run it"'],
            ['**A**utomation', 'Pipelines, IaC, GitOps: nada de passos manuais repetidos'],
            ['**L**ean', 'Lotes pequenos, WIP limitado, eliminar esperas e handoffs'],
            ['**M**easurement', 'DORA, SLOs, métricas de fluxo, decisões com dados'],
            ['**S**haring', 'Conhecimento, código e ferramentas partilhados entre equipas'],
          ],
        },
        { type: 'h', text: 'As four keys da DORA' },
        {
          type: 'compare',
          left: 'Métrica',
          right: 'O que mede',
          rows: [
            ['**Deployment frequency**', 'Com que frequência fazes deploy para produção (velocidade)'],
            ['**Lead time for changes**', 'Tempo do commit até estar em produção (velocidade)'],
            ['**Change failure rate**', '% de deploys que causam incidente ou rollback (estabilidade)'],
            ['**Time to restore service**', 'Tempo até recuperar de uma falha em produção (estabilidade)'],
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          title: 'Velocidade e estabilidade não são inimigas',
          text: 'A investigação DORA mostra que as equipas de elite são **simultaneamente** mais rápidas e mais estáveis. Lotes pequenos e frequentes falham menos e recuperam mais depressa. Relatórios recentes acrescentam a **taxa de rework** (deploys não planeados para corrigir problemas).',
        },
        {
          type: 'callout',
          variant: 'warn',
          text: 'Nunca uses DORA para comparar ou classificar equipas individualmente. Pela lei de Goodhart, quando uma métrica se torna objetivo, deixa de ser boa métrica: vais ter deploys vazios só para subir a frequência.',
        },
        {
          type: 'quickcheck',
          question: 'A equipa da contadores-api faz deploy 1 vez por mês, com change failure rate de 30%. Qual é a recomendação mais alinhada com DORA?',
          options: [
            'Reduzir para 1 deploy por trimestre para ter mais tempo de testes',
            'Adicionar mais uma camada de aprovação manual',
            'Lotes mais pequenos e deploys mais frequentes, com automação de testes e rollback',
            'Medir apenas a frequência de deploy',
          ],
          answer: 2,
          explanation: 'Lotes grandes são arriscados. Mudanças pequenas e frequentes, suportadas por automação, reduzem a taxa de falha e o tempo de recuperação.',
        },
        { type: 'h', text: 'Platform engineering' },
        {
          type: 'p',
          text: 'Pedir a cada equipa de produto que domine Terraform, Helm, Argo CD, OTel e políticas de segurança gera **carga cognitiva** enorme. Platform engineering trata a plataforma interna como um **produto**, com as equipas de desenvolvimento como clientes.',
        },
        {
          type: 'list',
          items: [
            '**IDP (Internal Developer Platform)**: o conjunto de capacidades self-service (criar serviço, ambiente, base de dados, pipeline).',
            '**Portal** (ex.: Backstage): a "montra" com catálogo de serviços, documentação, donos e templates.',
            '**Thinnest viable platform**: começa pelo mínimo que resolve dores reais, não por um mega-projeto.',
            'Mede adoção e satisfação: uma plataforma obrigatória e odiada falhou como produto.',
          ],
        },
        {
          type: 'flow',
          steps: ['Developer', 'Portal / API', 'Golden path', 'Capacidades', 'Infra'],
          caption: 'O IDP abstrai a complexidade sem a esconder totalmente: quem precisa pode descer de nível.',
        },
      ],
    },
    {
      id: 'plataforma-end-to-end',
      title: 'Desenhar a plataforma de entrega end-to-end',
      minutes: 8,
      blocks: [
        { type: 'h', text: 'Do commit à produção, peça a peça' },
        {
          type: 'p',
          text: 'Vamos desenhar a plataforma que leva uma alteração da contadores-api do portátil de um programador até aos clientes da EDA. Cada skill que dominaste é uma peça deste puzzle.',
        },
        {
          type: 'flow',
          steps: ['Git + MR', 'CI + scans', 'Imagem assinada', 'GitOps', 'K8s + OTel'],
          caption: 'IaC provisiona os clusters e a cloud por baixo de tudo isto; a segurança atravessa todas as fases.',
        },
        {
          type: 'list',
          ordered: true,
          items: [
            '**Git**: trunk-based, branches curtos, merge request com revisão e CODEOWNERS.',
            '**CI**: lint, testes, SAST, scan de dependências e de segredos; build da imagem uma única vez.',
            '**Supply chain**: imagem mínima, SBOM, scan (Trivy), assinatura (cosign) e push para o registry.',
            '**IaC**: OpenTofu provisiona rede, clusters, bases de dados geridas e IAM, com state remoto e plan revisto.',
            '**GitOps**: a CI atualiza a tag em dev; promoções por MR; Argo CD reconcilia cada cluster.',
            '**Runtime**: Kubernetes com políticas de admissão (Kyverno: só imagens assinadas), NetworkPolicies e segredos via External Secrets.',
            '**Observabilidade**: OTel → métricas, logs e traces; SLOs com alertas por burn rate.',
            '**Entrega progressiva**: canary com Argo Rollouts, análise automática dos SLIs e rollback automático.',
          ],
        },
        {
          type: 'code',
          lang: 'yaml',
          caption: '.gitlab-ci.yml — o esqueleto da pipeline da contadores-api',
          code: `stages: [test, build, secure, publish, deploy-dev]

test:
  stage: test
  script: [make lint, make test]

build:
  stage: build
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA .

secure:
  stage: secure
  script:
    - trivy image --exit-code 1 --severity CRITICAL,HIGH $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA
    - syft $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA -o spdx-json > sbom.json

publish:
  stage: publish
  script:
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA
    - cosign sign --yes $CI_REGISTRY_IMAGE@$(crane digest $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA)

deploy-dev:
  stage: deploy-dev
  script:   # não toca no cluster: só escreve no repositório de config
    - ./scripts/bump-tag.sh contadores-config dev $CI_COMMIT_SHORT_SHA
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH`,
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Build once, deploy many',
          text: 'A mesma imagem (o mesmo digest) passa por dev, staging e prod. Só a configuração muda por ambiente. Reconstruir por ambiente significa testar uma coisa e enviar outra para produção.',
        },
        {
          type: 'code',
          lang: 'yaml',
          caption: 'Canary com Argo Rollouts e análise automática',
          code: `strategy:
  canary:
    steps:
      - setWeight: 10
      - analysis:
          templates: [{ templateName: taxa-erro-slo }]
      - setWeight: 50
      - pause: { duration: 10m }
      - setWeight: 100`,
        },
        {
          type: 'compare',
          left: 'Decisão de arquitetura',
          right: 'Porquê',
          rows: [
            ['Pull (GitOps) em vez de push para produção', 'A CI não guarda credenciais de cluster; drift detetado'],
            ['Admissão só aceita imagens assinadas', 'Uma imagem que não passou pela pipeline nunca chega a correr'],
            ['Canary com análise de SLIs', 'Um deploy mau afeta 10% dos pedidos durante minutos, não 100%'],
            ['Clusters e cloud em IaC', 'Recuperação de desastre e novos ambientes são reprodutíveis'],
          ],
        },
        {
          type: 'quickcheck',
          question: 'Um atacante compromete um runner de CI. Que decisão desta arquitetura mais limita o impacto em produção?',
          options: [
            'Usar Prometheus em vez de outra ferramenta de métricas',
            'Deploy por pull (GitOps) com promoção a prod por MR aprovado e admissão de imagens assinadas',
            'Ter o state do OpenTofu em S3',
            'Usar Kustomize em vez de Helm',
          ],
          answer: 1,
          explanation: 'O runner não tem credenciais do cluster de produção, não consegue promover sem aprovação e uma imagem adulterada sem assinatura válida é rejeitada na admissão.',
        },
      ],
    },
    {
      id: 'evolucao-lideranca',
      title: 'Evolução e liderança técnica',
      minutes: 7,
      blocks: [
        { type: 'h', text: 'Golden paths: o caminho fácil é o caminho certo' },
        {
          type: 'p',
          text: 'Um **golden path** é um caminho suportado e opinativo para tarefas comuns: "criar um novo serviço HTTP em Go" gera o repositório, a pipeline, os manifests, os dashboards, os SLOs e o registo no catálogo em minutos.',
        },
        {
          type: 'list',
          items: [
            'É **recomendado**, não obrigatório: quem precisa de sair do caminho pode, assumindo a responsabilidade extra.',
            'Segurança e conformidade vêm **de série**: ninguém tem de se lembrar de ativar scans.',
            'É mantido como produto: versões, changelog, migrações assistidas.',
          ],
        },
        {
          type: 'compare',
          left: 'Guardrails',
          right: 'Gates',
          rows: [
            ['Políticas automáticas que impedem o perigoso (ex.: Kyverno)', 'Aprovações manuais de comités antes de cada release'],
            ['Feedback em segundos na pipeline', 'Espera de dias por uma reunião'],
            ['Escala com o número de equipas', 'Torna-se o gargalo da organização'],
          ],
        },
        { type: 'h', text: 'Maturidade: evoluir por passos' },
        {
          type: 'flow',
          steps: ['Manual', 'Automatizado', 'Self-service', 'Otimizado'],
          caption: 'Não saltes etapas: self-service sobre processos não automatizados só esconde caos.',
        },
        {
          type: 'p',
          text: 'Mede o ponto de partida (DORA, inquéritos de DevEx), escolhe o maior gargalo do fluxo de valor e ataca-o. Repete. Uma roadmap de plataforma guiada por dados vence sempre uma lista de ferramentas da moda.',
        },
        { type: 'h', text: 'FinOps: a fatura também é um sinal' },
        {
          type: 'list',
          items: [
            '**Visibilidade**: tags/labels obrigatórias (equipa, app, ambiente) aplicadas via IaC e políticas.',
            '**Showback/chargeback**: cada equipa vê o custo dos seus serviços (ex.: OpenCost/Kubecost).',
            '**Otimização**: rightsizing de requests, autoscaling, desligar dev fora de horas, instâncias spot para workloads tolerantes.',
            'Custo por unidade de negócio (ex.: € por milhão de leituras) é mais útil que a fatura total.',
          ],
        },
        {
          type: 'terminal',
          lines: [
            {
              cmd: 'kubectl top pods -n contadores',
              out: 'NAME                              CPU(cores)   MEMORY(bytes)\ncontadores-api-7c9f8d6b5-h2kq9    45m          180Mi\ncontadores-api-7c9f8d6b5-p8x2m    52m          176Mi',
            },
            {
              cmd: 'kubectl get deploy contadores-api -n contadores -o jsonpath=\'{.spec.template.spec.containers[0].resources.requests}\'',
              out: '{"cpu":"2","memory":"4Gi"}',
            },
          ],
        },
        {
          type: 'p',
          text: 'Pedidos de 2 CPU e 4 GiB para um uso real de ~50m e ~180Mi: estás a pagar por quase 40 vezes mais CPU do que usas. Rightsizing com base em dados (ex.: recomendações do VPA) é o FinOps mais rápido que existe.',
        },
        { type: 'h', text: 'DevEx: a experiência de quem desenvolve' },
        {
          type: 'p',
          text: 'Developer Experience assenta em três dimensões: **ciclos de feedback** rápidos, baixa **carga cognitiva** e **estado de flow** protegido. Pergunta regularmente às equipas o que as atrasa; a resposta raramente é a ferramenta que imaginavas.',
        },
        {
          type: 'quickcheck',
          question: 'As equipas queixam-se de que criar um novo serviço demora 3 semanas de tickets. Qual é a melhor aposta de plataforma?',
          options: [
            'Exigir que cada equipa aprenda todas as ferramentas da plataforma',
            'Criar um comité semanal para aprovar novos serviços',
            'Migrar todos os serviços para outra cloud',
            'Um golden path self-service que cria repositório, pipeline, manifests e observabilidade de base',
          ],
          answer: 3,
          explanation: 'Self-service opinativo elimina esperas e handoffs, reduz carga cognitiva e incorpora as boas práticas por defeito.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Parabéns, Arquiteto!',
          text: 'Liderar em DevOps é influenciar sem impor: mostra resultados com dados, constrói em conjunto com as equipas e celebra cada melhoria no fluxo. Agora vai construir.',
        },
      ],
    },
  ],
  quiz: {
    passScore: 0.8,
    draw: 8,
    questions: [
      {
        kind: 'single',
        prompt: 'A administração quer subir a "deployment frequency" e propõe um bónus para a equipa com mais deploys por mês. Qual é o maior risco?',
        options: [
          'As equipas passam a fazer deploys triviais para subir a métrica, sem melhorar a entrega de valor',
          'O Kubernetes não suporta muitos deploys por dia',
          'A métrica deixa de poder ser medida',
          'Nenhum: mais deploys é sempre melhor',
        ],
        answer: 0,
        explanation: 'Lei de Goodhart: incentivar diretamente uma métrica distorce-a. As métricas DORA servem para a equipa melhorar, não para ranking ou bónus.',
      },
      {
        kind: 'single',
        prompt: 'Após um deploy, a contadores-api em staging funciona, mas em produção falha com uma biblioteca em falta. A pipeline reconstrói a imagem para cada ambiente. Que princípio foi violado?',
        options: [
          'Infraestrutura imutável dos nós',
          'Build once, deploy many: o artefacto testado não é o que foi para produção',
          'Separação entre repositório de app e de config',
          'Reconciliação contínua',
        ],
        answer: 1,
        explanation: 'Reconstruir por ambiente cria artefactos diferentes. Promove o mesmo digest e varia apenas a configuração.',
      },
      {
        kind: 'single',
        prompt: 'Uma equipa quer que só imagens construídas pela pipeline oficial corram em produção. Que combinação implementa isto de forma robusta?',
        options: [
          'Pedir aos programadores que não façam push manual para o registry',
          'Usar a tag `latest` apenas em produção',
          'Assinar a imagem na pipeline (cosign) e usar uma política de admissão (Kyverno) que verifica a assinatura',
          'Fazer scan com Trivy apenas uma vez por mês',
        ],
        answer: 2,
        explanation: 'A assinatura prova a origem e a política de admissão impõe-na no cluster, mesmo que alguém tente aplicar um manifest com outra imagem.',
      },
      {
        kind: 'single',
        prompt: 'A canary de uma nova versão fica com 10% do tráfego e a taxa de erros desse subconjunto sobe para 4% (SLO exige < 0,1%). O que deve a plataforma fazer automaticamente?',
        options: [
          'Avançar para 50% para ter mais dados',
          'Pedir aprovação manual ao gestor de produto',
          'Escalar a canary para mais réplicas',
          'Abortar a rollout e voltar à versão estável, gerando alerta e registo',
        ],
        answer: 3,
        explanation: 'A análise automática dos SLIs existe para cortar o raio de impacto: aborta, reverte e notifica, sem esperar por humanos.',
      },
      {
        kind: 'single',
        prompt: 'A plataforma interna é obrigatória, mas um inquérito revela que 70% dos programadores a evitam com scripts próprios. Qual é o diagnóstico mais provável?',
        options: [
          'A plataforma não está a ser gerida como produto: não resolve as dores reais dos utilizadores',
          'Os programadores precisam de mais formação em Kubernetes',
          'A plataforma devia ter ainda mais aprovações manuais',
          'Os scripts próprios são sempre superiores',
        ],
        answer: 0,
        explanation: 'Platform engineering trata as equipas como clientes. Baixa adoção é feedback de produto: entrevista utilizadores e melhora o golden path.',
      },
      {
        kind: 'single',
        prompt: 'O custo cloud do cluster de dev da EDA duplicou num trimestre, mas ninguém sabe que equipa é responsável. Qual é o primeiro passo de FinOps?',
        options: [
          'Desligar o cluster de dev',
          'Impor labels/tags obrigatórias (equipa, app, ambiente) via IaC e políticas, e fazer showback por equipa',
          'Mudar todas as instâncias para spot',
          'Reduzir todos os requests para metade',
        ],
        answer: 1,
        explanation: 'Sem visibilidade de quem gasta o quê, qualquer otimização é às cegas. Atribuição de custos vem primeiro; depois rightsizing e automação.',
      },
      {
        kind: 'multi',
        prompt: 'Das métricas abaixo, quais são as four keys DORA que medem **estabilidade**? (escolhe todas as corretas)',
        options: [
          'Deployment frequency',
          'Change failure rate',
          'Lead time for changes',
          'Time to restore service',
          'Linhas de código por programador',
        ],
        answers: [1, 3],
        explanation: 'As four keys equilibram velocidade (deployment frequency, lead time) e estabilidade (change failure rate, time to restore). Linhas de código não são métrica DORA.',
      },
      {
        kind: 'multi',
        prompt: 'Estás a desenhar a plataforma para 40 equipas. Quais escolhas reduzem a carga cognitiva sem sacrificar segurança? (escolhe todas as corretas)',
        options: [
          'Golden paths com scans, SBOM e assinatura já incluídos no template de pipeline',
          'Cada equipa escreve a sua pipeline e o seu Helm chart do zero',
          'Guardrails automáticos (políticas de admissão) em vez de comités de aprovação',
          'Portal com catálogo de serviços, donos e documentação',
        ],
        answers: [0, 2, 3],
        explanation: 'Templates com segurança de série, políticas automáticas e um catálogo central escalam. Cada equipa reinventar tudo aumenta a carga e a inconsistência.',
      },
      {
        kind: 'order',
        prompt: 'Ordena o percurso de uma alteração na plataforma de entrega da contadores-api:',
        items: [
          'Merge request revisto e aprovado em Git',
          'CI corre testes e scans e constrói a imagem uma vez',
          'Imagem assinada e publicada no registry',
          'Tag atualizada no repositório de config por MR de promoção',
          'Argo CD sincroniza e Argo Rollouts faz canary com análise de SLIs',
        ],
        explanation: 'Revisão de código, CI com segurança, artefacto assinado, promoção declarativa em Git e entrega progressiva observada.',
      },
      {
        kind: 'input',
        prompt: 'Que métrica DORA mede o tempo desde o commit até a alteração estar a correr em produção? (em inglês)',
        accept: ['lead time for changes', 'lead time', 'change lead time', 'lead time for change'],
        placeholder: 'nome da métrica',
        explanation: '*Lead time for changes* mede a rapidez do fluxo do commit à produção; lotes pequenos e automação reduzem-no.',
      },
    ],
  },
};

export default skill;
