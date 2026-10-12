import type { Skill } from '../../types';

const skill: Skill = {
  id: 'k8s',
  title: 'Kubernetes',
  subtitle: 'Orquestra containers em escala',
  icon: 'k8s',
  tier: 3,
  x: 0.68,
  deps: ['docker', 'cloud'],
  xp: 300,
  summary:
    'Percebe como o Kubernetes mantém as tuas aplicações vivas: arquitetura, pods, deployments, services, configuração, probes, recursos e os primeiros passos com Helm.',
  topics: [
    'Arquitetura: control plane e nodes',
    'Pods, Deployments e Services',
    'Ingress, ConfigMaps e Secrets',
    'Probes e requests/limits',
    'kubectl no dia a dia',
    'Helm básico',
  ],
  lessons: [
    {
      id: 'arquitetura-pods',
      title: 'Arquitetura e pods',
      minutes: 7,
      blocks: [
        {
          type: 'p',
          text: 'O Docker corre containers numa máquina. Mas quem reinicia um container que morreu às 3h da manhã, ou distribui 20 réplicas da `contadores-api` por 5 servidores? É esse o trabalho do **Kubernetes**: um orquestrador que mantém o estado desejado.',
        },
        {
          type: 'p',
          text: 'Tudo assenta num **ciclo de reconciliação**: declaras o que queres (YAML), e os controllers trabalham continuamente para que o estado real coincida com o desejado.',
        },
        {
          type: 'flow',
          steps: ['kubectl apply', 'API server', 'etcd guarda', 'Scheduler', 'kubelet corre pod'],
          caption: 'O que acontece quando crias um recurso',
        },
        { type: 'h', text: 'Control plane e nodes' },
        {
          type: 'list',
          items: [
            '**kube-apiserver**: a porta de entrada; tudo (incluindo kubectl) fala com ele.',
            '**etcd**: base de dados chave-valor com todo o estado do cluster.',
            '**kube-scheduler**: decide em que node corre cada pod novo.',
            '**kube-controller-manager**: corre os controllers que reconciliam o estado.',
            'Em cada node: **kubelet** (gere os pods), **container runtime** (containerd) e **kube-proxy** (rede dos Services).',
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          title: 'Kubernetes gerido',
          text: 'Em EKS, AKS ou GKE, o fornecedor cloud gere o control plane por ti. Tu tratas dos nodes e das workloads.',
        },
        { type: 'h', text: 'O pod' },
        {
          type: 'p',
          text: 'O **pod** é a unidade mais pequena: um ou mais containers que partilham rede (o mesmo IP) e volumes. Os pods são **efémeros** — morrem e são substituídos por novos, com novo IP.',
        },
        {
          type: 'code',
          lang: 'yaml',
          caption: 'pod.yml — raramente crias pods diretamente, mas é bom ver um',
          code: `apiVersion: v1
kind: Pod
metadata:
  name: contadores-api
  labels:
    app: contadores-api
spec:
  containers:
    - name: api
      image: registry.eda.pt/contadores-api:1.5.0
      ports:
        - containerPort: 8080`,
        },
        {
          type: 'terminal',
          lines: [
            { cmd: 'kubectl apply -f pod.yml', out: 'pod/contadores-api created' },
            {
              cmd: 'kubectl get pods -o wide',
              out: 'NAME             READY   STATUS    RESTARTS   AGE   IP            NODE\ncontadores-api   1/1     Running   0          12s   10.244.1.17   aks-nodepool1-0',
            },
          ],
        },
        {
          type: 'quickcheck',
          question: 'Que componente decide em que node um pod novo vai correr?',
          options: ['kubelet', 'etcd', 'kube-proxy', 'kube-scheduler'],
          answer: 3,
          explanation: 'O scheduler avalia recursos disponíveis, afinidades e restrições, e atribui o pod a um node. O kubelet desse node arranca-o.',
        },
      ],
    },
    {
      id: 'deployments-services',
      title: 'Deployments, Services e Ingress',
      minutes: 8,
      blocks: [
        {
          type: 'p',
          text: 'Na prática não crias pods à mão. Crias um **Deployment**, que gere um ReplicaSet, que por sua vez garante que existe o número certo de pods. Se um pod morrer, aparece outro.',
        },
        {
          type: 'code',
          lang: 'yaml',
          caption: 'deployment.yml',
          code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: contadores-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: contadores-api
  template:
    metadata:
      labels:
        app: contadores-api
    spec:
      containers:
        - name: api
          image: registry.eda.pt/contadores-api:1.5.0
          ports:
            - containerPort: 8080`,
        },
        { type: 'h', text: 'Services: um endereço estável' },
        {
          type: 'p',
          text: 'Como os IPs dos pods mudam, um **Service** dá-lhes um nome DNS e IP estáveis e faz load balancing entre os pods que correspondem ao seu `selector` (por labels).',
        },
        {
          type: 'code',
          lang: 'yaml',
          caption: 'service.yml',
          code: `apiVersion: v1
kind: Service
metadata:
  name: contadores-api
spec:
  type: ClusterIP
  selector:
    app: contadores-api   # tem de coincidir com as labels dos pods
  ports:
    - port: 80
      targetPort: 8080`,
        },
        {
          type: 'compare',
          left: 'Tipo de Service',
          right: 'Para quê',
          rows: [
            ['ClusterIP (defeito)', 'Acesso interno no cluster: `http://contadores-api`'],
            ['NodePort', 'Abre uma porta em cada node (30000–32767)'],
            ['LoadBalancer', 'Pede um load balancer externo à cloud'],
            ['Ingress (recurso à parte)', 'Routing HTTP por host/path e TLS para vários Services'],
          ],
        },
        {
          type: 'code',
          lang: 'yaml',
          caption: 'ingress.yml — expõe a API em HTTPS',
          code: `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: contadores-api
spec:
  ingressClassName: nginx
  tls:
    - hosts: [api.eda.pt]
      secretName: api-eda-pt-tls
  rules:
    - host: api.eda.pt
      http:
        paths:
          - path: /contadores
            pathType: Prefix
            backend:
              service:
                name: contadores-api
                port:
                  number: 80`,
        },
        {
          type: 'terminal',
          lines: [
            { cmd: 'kubectl apply -f k8s/', out: 'deployment.apps/contadores-api created\nservice/contadores-api created\ningress.networking.k8s.io/contadores-api created' },
            { cmd: 'kubectl scale deployment contadores-api --replicas=5', out: 'deployment.apps/contadores-api scaled' },
            {
              cmd: 'kubectl get endpointslices -l kubernetes.io/service-name=contadores-api',
              out: 'NAME                   ADDRESSTYPE   PORTS   ENDPOINTS                                      AGE\ncontadores-api-7xk2p   IPv4          8080    10.244.1.17,10.244.2.9,10.244.0.31 + 2 more...   3m',
            },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Service sem endpoints?',
          text: 'Se o Service não encaminha tráfego, verifica primeiro se o `selector` coincide exatamente com as `labels` dos pods. É o erro mais comum.',
        },
        {
          type: 'quickcheck',
          question: 'Apagas manualmente um dos 3 pods de um Deployment com `replicas: 3`. O que acontece?',
          options: [
            'O Deployment fica com 2 réplicas até fazeres novo apply',
            'O ReplicaSet cria automaticamente um pod novo para voltar a 3',
            'O Deployment inteiro é apagado',
            'O Service deixa de funcionar',
          ],
          answer: 1,
          explanation: 'O controller deteta que o estado real (2) difere do desejado (3) e cria um novo pod. É a reconciliação em ação.',
        },
      ],
    },
    {
      id: 'config-probes-helm',
      title: 'Configuração, probes, recursos e Helm',
      minutes: 8,
      blocks: [
        {
          type: 'p',
          text: 'A mesma imagem tem de correr em dev, staging e produção. A configuração vive fora da imagem: em **ConfigMaps** (dados não sensíveis) e **Secrets** (passwords, tokens).',
        },
        {
          type: 'code',
          lang: 'yaml',
          caption: 'Excerto do Deployment com config, probes e recursos',
          code: `containers:
  - name: api
    image: registry.eda.pt/contadores-api:1.5.0
    envFrom:
      - configMapRef:
          name: contadores-config      # LOG_LEVEL, DB_HOST...
    env:
      - name: DB_PASSWORD
        valueFrom:
          secretKeyRef:
            name: contadores-db
            key: password
    resources:
      requests: { cpu: 250m, memory: 256Mi }
      limits:   { memory: 512Mi }
    readinessProbe:
      httpGet: { path: /health/ready, port: 8080 }
      periodSeconds: 5
    livenessProbe:
      httpGet: { path: /health/live, port: 8080 }
      initialDelaySeconds: 15
      periodSeconds: 10`,
        },
        {
          type: 'callout',
          variant: 'warn',
          title: 'Secrets não são cifrados por magia',
          text: 'Por defeito os Secrets são apenas **base64** no etcd. Ativa encryption at rest, restringe acesso com RBAC e considera o External Secrets Operator ligado a um Vault ou Key Vault.',
        },
        { type: 'h', text: 'Probes' },
        {
          type: 'compare',
          left: 'readinessProbe',
          right: 'livenessProbe',
          rows: [
            ['"Estou pronto para receber tráfego?"', '"Ainda estou vivo?"'],
            ['Falha: pod sai dos endpoints do Service', 'Falha: kubelet reinicia o container'],
            ['Útil no arranque e em sobrecarga', 'Útil para deadlocks'],
            ['Pode verificar dependências', 'Não deve depender da base de dados'],
          ],
        },
        { type: 'h', text: 'Requests e limits' },
        {
          type: 'list',
          items: [
            '**requests**: o que o scheduler reserva para o pod; usado para decidir o node.',
            '**limits** de memória: se ultrapassados, o container é morto (`OOMKilled`).',
            '**limits** de CPU: o container é *throttled*, não morto. Muitas equipas definem só request de CPU.',
            'Sem requests, o scheduler coloca pods às cegas e os nodes ficam sobrelotados.',
          ],
        },
        {
          type: 'terminal',
          lines: [
            {
              cmd: 'kubectl get pods',
              out: 'NAME                              READY   STATUS             RESTARTS      AGE\ncontadores-api-6d9f7c8b5d-4xkzp   0/1     CrashLoopBackOff   5 (32s ago)   4m',
            },
            {
              cmd: 'kubectl describe pod contadores-api-6d9f7c8b5d-4xkzp | grep -A3 "Last State"',
              out: '    Last State:     Terminated\n      Reason:       OOMKilled\n      Exit Code:    137\n      Started:      Mon, 12 Oct 2026 10:14:02 +0100',
            },
            {
              cmd: 'kubectl logs contadores-api-6d9f7c8b5d-4xkzp --previous',
              out: 'INFO  A carregar cache de tarifários (2.1 GB)...\nFATAL JavaScript heap out of memory',
            },
          ],
        },
        { type: 'h', text: 'Helm: o gestor de pacotes' },
        {
          type: 'p',
          text: 'O **Helm** empacota manifests num **chart** com templates e um `values.yaml`. Instalas a mesma aplicação em vários ambientes só mudando os values, com histórico de releases e rollback.',
        },
        {
          type: 'terminal',
          lines: [
            {
              cmd: 'helm upgrade --install contadores-api ./chart -f values-prod.yaml -n producao',
              out: 'Release "contadores-api" has been upgraded. Happy Helming!\nNAME: contadores-api\nNAMESPACE: producao\nSTATUS: deployed\nREVISION: 12',
            },
            { cmd: 'helm rollback contadores-api 11 -n producao', out: 'Rollback was a success! Happy Helming!' },
          ],
        },
        {
          type: 'quickcheck',
          question: 'Um pod aparece com `Reason: OOMKilled` e `Exit Code: 137`. Qual é a causa mais provável?',
          options: [
            'A readinessProbe falhou',
            'A imagem não existe no registry',
            'O container ultrapassou o limit de memória',
            'O limit de CPU foi atingido',
          ],
          answer: 2,
          explanation: 'OOMKilled indica que o container excedeu o limite de memória e foi terminado. Exceder CPU só causa throttling.',
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
        prompt: 'Criaste um Service, mas `kubectl get endpointslices` mostra-o sem endpoints, embora os pods estejam Running. Qual é a causa mais provável?',
        options: [
          'O `selector` do Service não coincide com as labels dos pods',
          'O cluster não tem Ingress controller',
          'Os pods não têm limits de CPU',
          'O Service devia ser do tipo LoadBalancer',
        ],
        answer: 0,
        explanation: 'Um Service encontra pods por labels. Se o selector não coincidir, fica sem endpoints. Também pode acontecer se os pods não estiverem Ready.',
      },
      {
        kind: 'single',
        prompt: 'A `contadores-api` demora 40 segundos a arrancar e recebe pedidos antes de estar pronta, devolvendo erros 503. O que resolve isto?',
        options: [
          'Aumentar o limit de memória',
          'Configurar uma readinessProbe',
          'Aumentar o número de réplicas',
          'Mudar o Service para NodePort',
        ],
        answer: 1,
        explanation: 'A readinessProbe mantém o pod fora dos endpoints do Service até estar pronto para receber tráfego.',
      },
      {
        kind: 'single',
        prompt: 'A livenessProbe verifica a ligação à base de dados. A base de dados fica lenta durante 2 minutos. O que pode acontecer?',
        options: [
          'Nada, as probes só correm no arranque',
          'O Service passa automaticamente para outra base de dados',
          'O scheduler move os pods para outro node',
          'O kubelet reinicia todos os pods em cascata, agravando o incidente',
        ],
        answer: 3,
        explanation: 'Uma liveness que depende de serviços externos reinicia containers saudáveis. A liveness deve verificar apenas o próprio processo.',
      },
      {
        kind: 'single',
        prompt: 'Onde fica guardado todo o estado do cluster (Deployments, Services, Secrets...)?',
        options: ['No kubelet de cada node', 'No kube-scheduler', 'No etcd', 'No container registry'],
        answer: 2,
        explanation: 'O etcd é a base de dados chave-valor do control plane; só o API server fala diretamente com ele.',
      },
      {
        kind: 'multi',
        prompt: 'Quais destas afirmações sobre requests e limits são verdadeiras? (escolhe todas as corretas)',
        options: [
          'O scheduler usa os requests para decidir em que node colocar o pod',
          'Exceder o limit de CPU faz o container ser morto com OOMKilled',
          'Exceder o limit de memória faz o container ser terminado',
          'Sem requests, os pods nunca são agendados',
        ],
        answers: [0, 2],
        explanation: 'Requests orientam o scheduling e exceder memória mata o container. Exceder CPU só causa throttling, e pods sem requests são agendados na mesma (mas às cegas).',
      },
      {
        kind: 'order',
        prompt: 'Ordena o que acontece desde `kubectl apply` de um Deployment até o container estar a correr.',
        items: [
          'kubectl envia o manifest ao API server',
          'O estado desejado é guardado no etcd',
          'O controller do Deployment cria o ReplicaSet e os pods',
          'O scheduler atribui cada pod a um node',
          'O kubelet do node arranca os containers',
        ],
        explanation: 'API server → etcd → controllers criam objetos → scheduler escolhe o node → kubelet executa via container runtime.',
      },
      {
        kind: 'input',
        prompt: 'Um pod está em CrashLoopBackOff. Que comando usas para ver os logs da execução ANTERIOR do container do pod `api-7f9c`?',
        placeholder: 'kubectl ...',
        accept: [
          'kubectl logs api-7f9c --previous',
          'kubectl logs api-7f9c -p',
          'kubectl logs --previous api-7f9c',
          'kubectl logs -p api-7f9c',
        ],
        explanation: '`--previous` (ou `-p`) mostra os logs do container que terminou, onde normalmente está o erro que causou o crash.',
      },
      {
        kind: 'single',
        prompt: 'Qual é a vantagem principal do Helm neste cenário: a mesma aplicação em dev, staging e produção com réplicas e domínios diferentes?',
        code: `helm upgrade --install contadores-api ./chart -f values-staging.yaml -n staging
helm upgrade --install contadores-api ./chart -f values-prod.yaml -n producao`,
        options: [
          'Um único chart com templates, parametrizado por ficheiros de values por ambiente',
          'O Helm substitui a necessidade de um cluster Kubernetes',
          'O Helm compila a imagem Docker automaticamente',
          'O Helm cifra os Secrets no etcd',
        ],
        answer: 0,
        explanation: 'O Helm separa os templates dos valores; cada ambiente usa o mesmo chart com values diferentes, com histórico e rollback por release.',
      },
    ],
  },
};

export default skill;
