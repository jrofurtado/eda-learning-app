import type { Skill } from '../../types';

const skill: Skill = {
  id: 'gitops',
  title: 'GitOps',
  subtitle: 'Git como fonte de verdade',
  icon: 'gitops',
  tier: 4,
  x: 0.45,
  deps: ['cd', 'k8s'],
  xp: 300,
  summary:
    'Aprende a fazer deploy em Kubernetes declarando o estado desejado em Git e deixando o Argo CD ou o Flux reconciliar o cluster, com promoções entre ambientes feitas por merge request.',
  topics: [
    'Os quatro princípios GitOps',
    'Pull vs push deploys',
    'Argo CD e Flux',
    'Estrutura de repositórios (app vs config)',
    'Overlays por ambiente com Kustomize e Helm',
    'Drift detection e promoção via MR',
  ],
  lessons: [
    {
      id: 'principios',
      title: 'Princípios e o modelo pull',
      minutes: 6,
      blocks: [
        { type: 'h', text: 'O que é GitOps, afinal?' },
        {
          type: 'p',
          text: 'GitOps é uma forma de operar sistemas em que **o Git é a fonte de verdade** do estado desejado e um agente dentro do cluster garante, continuamente, que a realidade corresponde a esse estado.',
        },
        {
          type: 'list',
          ordered: true,
          items: [
            '**Declarativo**: o sistema é descrito como estado desejado (YAML, Helm, Kustomize).',
            '**Versionado e imutável**: esse estado vive em Git, com histórico completo.',
            '**Pulled automaticamente**: agentes puxam o estado desejado da fonte.',
            '**Reconciliado continuamente**: os agentes corrigem qualquer diferença entre desejado e real.',
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'Estes quatro princípios foram formalizados pelo **OpenGitOps** (CNCF). Se falta um deles, por exemplo a reconciliação contínua, não é bem GitOps: é só "YAML em Git".',
        },
        {
          type: 'compare',
          left: 'Push (CI faz deploy)',
          right: 'Pull (GitOps)',
          rows: [
            ['A pipeline corre `kubectl apply` ou `helm upgrade`', 'Um agente no cluster sincroniza a partir do Git'],
            ['A CI precisa de credenciais de admin do cluster', 'Credenciais ficam dentro do cluster; a CI só escreve em Git'],
            ['Alterações manuais no cluster ficam por detetar', 'Drift é detetado e pode ser revertido automaticamente'],
            ['Rollback = voltar a correr uma pipeline antiga', 'Rollback = `git revert`'],
          ],
        },
        {
          type: 'flow',
          steps: ['Commit config', 'Git', 'Agente deteta', 'Reconcilia', 'Cluster'],
          caption: 'No modelo pull, ninguém fora do cluster precisa de acesso à API do Kubernetes.',
        },
        {
          type: 'quickcheck',
          question: 'Qual é a grande vantagem de segurança do modelo pull face ao push?',
          options: [
            'Os containers ficam encriptados',
            'Não é preciso RBAC no cluster',
            'A pipeline de CI deixa de precisar de credenciais de escrita no cluster',
            'O Git passa a fazer scan de vulnerabilidades',
          ],
          answer: 2,
          explanation: 'O agente GitOps vive no cluster e só precisa de ler o Git. Um runner de CI comprometido já não tem as chaves de produção.',
        },
        {
          type: 'p',
          text: 'O papel da CI continua importante: build, testes, scan e push da imagem. Só o último passo muda: em vez de fazer deploy, a CI **atualiza a tag da imagem no repositório de configuração**.',
        },
      ],
    },
    {
      id: 'argocd-flux',
      title: 'Argo CD e Flux na prática',
      minutes: 7,
      blocks: [
        { type: 'h', text: 'Duas ferramentas, a mesma ideia' },
        {
          type: 'compare',
          left: 'Argo CD',
          right: 'Flux',
          rows: [
            ['UI web rica, visualização da árvore de recursos', 'Sem UI nativa; centrado em CLI e CRDs'],
            ['Recurso principal: `Application` / `ApplicationSet`', 'Recursos: `GitRepository`, `Kustomization`, `HelmRelease`'],
            ['Muito usado para multi-cluster com equipas a ver o estado', 'Leve, modular, ótimo para bootstrap e automação de imagens'],
            ['Projeto graduado CNCF', 'Projeto graduado CNCF'],
          ],
        },
        {
          type: 'code',
          lang: 'yaml',
          caption: 'Application do Argo CD para a contadores-api em produção',
          code: `apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: contadores-api-prod
  namespace: argocd
spec:
  project: energia
  source:
    repoURL: https://gitlab.eda.pt/plataforma/contadores-config.git
    targetRevision: main
    path: apps/contadores-api/overlays/prod
  destination:
    server: https://kubernetes.default.svc
    namespace: contadores
  syncPolicy:
    automated:
      prune: true      # apaga recursos removidos do Git
      selfHeal: true   # reverte alterações manuais (drift)
    syncOptions:
      - CreateNamespace=true`,
        },
        {
          type: 'terminal',
          lines: [
            {
              cmd: 'argocd app get contadores-api-prod',
              out: 'Name:               argocd/contadores-api-prod\nProject:            energia\nSync Policy:        Automated (Prune)\nSync Status:        OutOfSync from main (a41c9e2)\nHealth Status:      Healthy\n\nKIND        NAMESPACE   NAME            STATUS     HEALTH\nService     contadores  contadores-api  Synced     Healthy\nDeployment  contadores  contadores-api  OutOfSync  Healthy',
            },
            {
              cmd: 'argocd app diff contadores-api-prod',
              out: '===== apps/Deployment contadores/contadores-api ======\n<   replicas: 6\n---\n>   replicas: 4',
            },
          ],
        },
        {
          type: 'p',
          text: 'Alguém fez `kubectl scale --replicas=6` à mão. O Argo CD marca **OutOfSync** e, com `selfHeal: true`, volta a pôr 4 réplicas. Se 6 era o valor certo, a correção é um merge request.',
        },
        {
          type: 'callout',
          variant: 'warn',
          text: 'Se usas HorizontalPodAutoscaler, **não** declares `replicas` no Deployment gerido pelo GitOps (ou configura `ignoreDifferences`). Caso contrário, o HPA e o Argo CD ficam a lutar pelo mesmo campo.',
        },
        {
          type: 'terminal',
          lines: [
            {
              cmd: 'flux get kustomizations -n flux-system',
              out: 'NAME            REVISION              SUSPENDED  READY  MESSAGE\ncontadores-api  main@sha1:a41c9e2     False      True   Applied revision: main@sha1:a41c9e2\ninfra           main@sha1:a41c9e2     False      True   Applied revision: main@sha1:a41c9e2',
            },
          ],
        },
        {
          type: 'quickcheck',
          question: 'Com `prune: true`, o que acontece quando apagas o ficheiro de um ConfigMap no repositório de configuração?',
          options: [
            'Nada, o ConfigMap fica no cluster para sempre',
            'O Argo CD apaga o ConfigMap do cluster na próxima sincronização',
            'O Argo CD recria o ficheiro no Git',
            'A aplicação fica em estado Degraded permanentemente',
          ],
          answer: 1,
          explanation: 'Prune remove do cluster os recursos que deixaram de existir no Git, mantendo o cluster igual ao estado declarado.',
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Segredos nunca vão em claro para o repositório. Usa **Sealed Secrets**, **SOPS** (suportado nativamente pelo Flux) ou o **External Secrets Operator** a ler de um cofre como o Vault.',
        },
      ],
    },
    {
      id: 'repos-ambientes',
      title: 'Estrutura de repositórios, ambientes e promoção',
      minutes: 8,
      blocks: [
        { type: 'h', text: 'Repositório da app vs repositório de config' },
        {
          type: 'p',
          text: 'O padrão mais comum separa o **código da aplicação** (onde a CI faz build da imagem) do **repositório de configuração** (manifests por ambiente, lido pelo agente GitOps). Assim, uma alteração de réplicas não dispara um build e o histórico de deploys fica limpo.',
        },
        {
          type: 'code',
          lang: 'text',
          caption: 'contadores-config/ — estrutura com Kustomize',
          code: `apps/
  contadores-api/
    base/
      deployment.yaml
      service.yaml
      kustomization.yaml
    overlays/
      dev/
        kustomization.yaml     # 1 réplica, image tag :sha-a41c9e2
      staging/
        kustomization.yaml     # 2 réplicas
      prod/
        kustomization.yaml     # 4 réplicas, recursos maiores
        patch-resources.yaml
clusters/
  prod-lisboa/
    apps.yaml                  # que apps correm neste cluster`,
        },
        {
          type: 'code',
          lang: 'yaml',
          caption: 'overlays/prod/kustomization.yaml',
          code: `apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: contadores
resources:
  - ../../base
patches:
  - path: patch-resources.yaml
replicas:
  - name: contadores-api
    count: 4
images:
  - name: registry.eda.pt/energia/contadores-api
    newTag: "1.14.2"`,
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'Com **Helm** o padrão é semelhante: um chart comum e ficheiros `values-dev.yaml`, `values-staging.yaml`, `values-prod.yaml`. O Argo CD e o Flux (`HelmRelease`) suportam ambos.',
        },
        { type: 'h', text: 'Promoção por merge request' },
        {
          type: 'flow',
          steps: ['CI publica imagem', 'Bump tag em dev', 'MR para staging', 'MR para prod', 'Agente sincroniza'],
          caption: 'Promover uma versão é alterar a tag no overlay do ambiente seguinte.',
        },
        {
          type: 'terminal',
          lines: [
            {
              cmd: 'cd apps/contadores-api/overlays/prod && kustomize edit set image registry.eda.pt/energia/contadores-api:1.15.0',
              out: '',
            },
            {
              cmd: 'git commit -am "prod: promove contadores-api 1.15.0" && git push -o merge_request.create origin promo/contadores-1.15.0',
              out: '[promo/contadores-1.15.0 7d2e0b1] prod: promove contadores-api 1.15.0\n 1 file changed, 1 insertion(+), 1 deletion(-)\nremote: View merge request for promo/contadores-1.15.0:\nremote:   https://gitlab.eda.pt/plataforma/contadores-config/-/merge_requests/482',
            },
          ],
        },
        {
          type: 'list',
          items: [
            'O MR para `prod` exige aprovação (CODEOWNERS) e passa validações: `kustomize build`, kubeconform, políticas.',
            'Usa **tags imutáveis** (versão ou SHA), nunca `latest`: o Git tem de identificar exatamente o que corre.',
            'Rollback de produção = `git revert` do commit de promoção.',
            'Ferramentas como Argo CD Image Updater ou Flux Image Automation podem automatizar o bump em dev.',
          ],
        },
        {
          type: 'quickcheck',
          question: 'A versão 1.15.0 em produção está com erros. Qual é o rollback mais alinhado com GitOps?',
          options: [
            '`kubectl rollout undo` diretamente no cluster',
            'Apagar a Application do Argo CD',
            'Fazer push de uma nova imagem com a tag 1.15.0',
            '`git revert` do commit de promoção e merge',
          ],
          answer: 3,
          explanation: 'O Git é a fonte de verdade: revertes lá e o agente reconcilia. Um rollout undo manual seria revertido pelo selfHeal e não fica registado no histórico.',
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
        prompt: 'Uma equipa guarda os manifests em Git, mas a pipeline faz `kubectl apply` só quando há merge e nada verifica o cluster depois. Que princípio GitOps falta?',
        options: [
          'Declarativo',
          'Versionado',
          'Reconciliação contínua (e pull)',
          'Nenhum, isto já é GitOps completo',
        ],
        answer: 2,
        explanation: 'Sem um agente a puxar e reconciliar continuamente, o drift fica por detetar. É push deploy com YAML em Git.',
      },
      {
        kind: 'single',
        prompt: 'Com `selfHeal: true`, um operador muda à mão uma variável de ambiente no Deployment. O que acontece?',
        options: [
          'O Argo CD repõe o valor definido no Git',
          'O Argo CD faz commit da alteração no Git',
          'A alteração fica e a Application passa a Synced',
          'O pod é apagado e não volta a ser criado',
        ],
        answer: 0,
        explanation: 'Self-heal reconcilia o cluster com o Git, revertendo alterações manuais. O Git nunca é alterado pelo agente.',
      },
      {
        kind: 'single',
        prompt: 'Porque é má ideia usar a tag `latest` num overlay de produção num fluxo GitOps?',
        options: [
          'O Kubernetes não aceita a tag latest',
          'O Git deixa de identificar a versão exata em execução e rollbacks ficam ambíguos',
          'O Argo CD não consegue ler tags',
          'A imagem fica maior',
        ],
        answer: 1,
        explanation: 'Tags mutáveis quebram a rastreabilidade: o mesmo commit pode corresponder a imagens diferentes. Usa versões ou SHAs imutáveis.',
      },
      {
        kind: 'single',
        prompt: 'Porque se separa normalmente o repositório da aplicação do repositório de configuração?',
        options: [
          'Porque o Argo CD não lê repositórios com código-fonte',
          'Porque o Kustomize só funciona em repositórios vazios',
          'Para que o Git fique mais rápido',
          'Para separar o ciclo de build do ciclo de deploy e manter um histórico limpo de alterações por ambiente',
        ],
        answer: 3,
        explanation: 'Mudar réplicas ou promover uma versão não deve disparar builds, e o repositório de config passa a ser o registo auditável de deploys.',
      },
      {
        kind: 'multi',
        prompt: 'Quais são formas aceitáveis de gerir segredos num repositório GitOps? (escolhe todas as corretas)',
        options: [
          'Sealed Secrets',
          'Secrets Kubernetes em base64 em claro no Git',
          'SOPS com chaves geridas num KMS',
          'External Secrets Operator a ler de um cofre',
        ],
        answers: [0, 2, 3],
        explanation: 'Base64 não é encriptação. As outras três opções guardam no Git apenas dados encriptados ou referências a um cofre.',
      },
      {
        kind: 'order',
        prompt: 'Ordena a promoção de uma nova versão da contadores-api até produção:',
        items: [
          'A CI faz build, testes e push da imagem 1.15.0',
          'A tag é atualizada no overlay de dev',
          'MR aprovado atualiza o overlay de staging',
          'MR aprovado atualiza o overlay de prod',
          'O agente GitOps sincroniza o cluster de produção',
        ],
        explanation: 'A imagem é construída uma vez e promovida ambiente a ambiente através de alterações revistas no repositório de configuração.',
      },
      {
        kind: 'input',
        prompt: 'Que comando do Argo CD CLI mostra as diferenças entre o Git e o cluster para a aplicação `contadores-api-prod`?',
        accept: ['argocd app diff contadores-api-prod'],
        placeholder: 'argocd ...',
        explanation: '`argocd app diff <app>` compara o estado desejado (Git) com o estado vivo no cluster.',
      },
      {
        kind: 'multi',
        prompt: 'O Argo CD alterna constantemente entre Synced e OutOfSync no campo `spec.replicas` de um Deployment com HPA. Quais são correções adequadas? (escolhe todas as corretas)',
        options: [
          'Remover `replicas` do manifest no Git',
          'Configurar `ignoreDifferences` para `/spec/replicas`',
          'Aumentar o intervalo de sincronização para 24 h',
          'Desativar o selfHeal em todas as aplicações do cluster',
        ],
        answers: [0, 1],
        explanation: 'Dois controladores a gerir o mesmo campo lutam entre si. Deixa o HPA ser o dono de replicas; as outras opções só escondem o problema ou desligam proteções.',
      },
    ],
  },
};

export default skill;
