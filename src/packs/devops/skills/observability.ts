import type { Skill } from '../../types';

const skill: Skill = {
  id: 'observability',
  title: 'Observabilidade',
  subtitle: 'Perceber o sistema em produção',
  icon: 'observability',
  tier: 4,
  x: 0.78,
  deps: ['k8s'],
  xp: 300,
  summary:
    'Aprende a responder a "o que está a falhar e porquê?" com logs, métricas e traces, usando Prometheus, Grafana e OpenTelemetry, e a criar alertas que acordam pessoas só quando vale a pena.',
  topics: [
    'Os três pilares: logs, métricas e traces',
    'Prometheus e PromQL essencial',
    'Dashboards em Grafana',
    'OpenTelemetry e tracing distribuído',
    'Golden signals, RED e USE',
    'Boas práticas de alerting',
  ],
  lessons: [
    {
      id: 'pilares',
      title: 'Logs, métricas e traces',
      minutes: 6,
      blocks: [
        { type: 'h', text: 'Monitorização vs observabilidade' },
        {
          type: 'p',
          text: '**Monitorização** responde a perguntas que já conhecias ("o CPU passou 90%?"). **Observabilidade** é a capacidade de responder a perguntas novas sobre o sistema a partir dos dados que ele emite, sem fazer deploy de código novo.',
        },
        {
          type: 'compare',
          left: 'Sinal',
          right: 'Para que serve',
          rows: [
            ['**Logs**: eventos discretos com contexto', 'Detalhe de um erro concreto: stack trace, ID do pedido'],
            ['**Métricas**: números agregados no tempo', 'Tendências e alertas: taxa de erros, latência p99, memória'],
            ['**Traces**: o percurso de um pedido entre serviços', 'Onde está a lentidão numa cadeia de chamadas'],
            ['**Profiles** (o "quarto pilar")', 'Que função consome CPU ou memória em produção'],
          ],
        },
        {
          type: 'p',
          text: 'Em Kubernetes, os logs devem ir para **stdout/stderr** e ser recolhidos por um agente (Fluent Bit, Promtail/Alloy) para um backend como Loki ou Elasticsearch. Nunca escrevas logs para ficheiros dentro do container.',
        },
        {
          type: 'code',
          lang: 'json',
          caption: 'Log estruturado da contadores-api (fácil de filtrar e correlacionar)',
          code: `{
  "ts": "2026-10-12T09:41:07.215Z",
  "level": "error",
  "service": "contadores-api",
  "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
  "msg": "falha ao gravar leitura",
  "contador_id": "PT0002000123456789",
  "erro": "timeout ao contactar leituras-db"
}`,
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Incluir o `trace_id` em cada log é o truque que liga os três pilares: do alerta (métrica) saltas para o trace lento e daí para os logs exatos desse pedido.',
        },
        {
          type: 'callout',
          variant: 'warn',
          text: 'Cuidado com a **cardinalidade**: nunca uses IDs de utilizador ou de contador como labels de métricas. Cada valor único cria uma nova série temporal e pode derrubar o Prometheus. Esse detalhe pertence aos logs e traces.',
        },
        {
          type: 'quickcheck',
          question: 'Um pedido à contadores-api demora 4 s e passa por 5 serviços. Que sinal te diz mais depressa onde está a lentidão?',
          options: ['Logs de acesso do ingress', 'Uma métrica de CPU do nó', 'Um trace distribuído do pedido', 'O número de pods em execução'],
          answer: 2,
          explanation: 'O trace mostra cada span com a sua duração, revelando imediatamente qual o serviço ou chamada que consome a maior parte dos 4 s.',
        },
        {
          type: 'flow',
          steps: ['Alerta (métrica)', 'Dashboard', 'Trace lento', 'Logs do pedido', 'Causa'],
          caption: 'Um fluxo de investigação típico, do sintoma à causa.',
        },
      ],
    },
    {
      id: 'prometheus-grafana',
      title: 'Prometheus, PromQL e Grafana',
      minutes: 8,
      blocks: [
        { type: 'h', text: 'Como o Prometheus funciona' },
        {
          type: 'p',
          text: 'O Prometheus faz **pull**: de X em X segundos faz scrape ao endpoint `/metrics` de cada alvo e guarda séries temporais identificadas por nome e labels. Em Kubernetes, os alvos são descobertos automaticamente (ex.: com `ServiceMonitor` do Prometheus Operator).',
        },
        {
          type: 'code',
          lang: 'text',
          caption: 'Excerto de GET /metrics da contadores-api',
          code: `# HELP http_requests_total Total de pedidos HTTP
# TYPE http_requests_total counter
http_requests_total{method="POST",route="/leituras",status="201"} 184223
http_requests_total{method="POST",route="/leituras",status="500"} 312
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{route="/leituras",le="0.1"} 170012
http_request_duration_seconds_bucket{route="/leituras",le="0.5"} 183950
http_request_duration_seconds_bucket{route="/leituras",le="+Inf"} 184535`,
        },
        {
          type: 'list',
          items: [
            '**Counter**: só sobe (pedidos, erros). Usa-se quase sempre com `rate()`.',
            '**Gauge**: sobe e desce (memória, fila, temperatura).',
            '**Histogram**: distribui valores por buckets, para calcular percentis com `histogram_quantile()`.',
          ],
        },
        { type: 'h', text: 'PromQL essencial' },
        {
          type: 'code',
          lang: 'promql',
          caption: 'Queries que vais usar todos os dias',
          code: `# Pedidos por segundo (média dos últimos 5 min)
sum(rate(http_requests_total{service="contadores-api"}[5m]))

# Taxa de erro (percentagem de 5xx)
sum(rate(http_requests_total{status=~"5.."}[5m]))
  / sum(rate(http_requests_total[5m]))

# Latência p99 por rota
histogram_quantile(0.99,
  sum by (le, route) (rate(http_request_duration_seconds_bucket[5m])))`,
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'Prefere **percentis** (p95, p99) a médias para latência. Uma média de 120 ms pode esconder 1% de utilizadores a esperar 6 s.',
        },
        {
          type: 'quickcheck',
          question: 'Porque se usa `rate(http_requests_total[5m])` em vez de `http_requests_total` diretamente num gráfico?',
          options: [
            'Porque o counter é cumulativo; rate() dá a variação por segundo',
            'Porque o counter é uma gauge disfarçada',
            'Porque rate() converte o valor em percentagem',
            'Porque sem rate() o Prometheus não devolve dados',
          ],
          answer: 0,
          explanation: 'Um counter só cresce (e reinicia a 0 quando o processo reinicia). rate() calcula a taxa por segundo e trata os resets corretamente.',
        },
        { type: 'h', text: 'Grafana: dashboards que contam uma história' },
        {
          type: 'list',
          items: [
            'Começa pelo topo com os sinais que o utilizador sente: tráfego, erros, latência.',
            'Usa variáveis (ambiente, namespace, serviço) em vez de duplicar dashboards.',
            'Guarda dashboards como código (JSON em Git, provisioning ou Grafana Operator).',
            'Um painel sem dono nem propósito é ruído: apaga-o.',
          ],
        },
        {
          type: 'terminal',
          lines: [
            {
              cmd: 'kubectl -n monitoring port-forward svc/prometheus-operated 9090',
              out: 'Forwarding from 127.0.0.1:9090 -> 9090\nForwarding from [::1]:9090 -> 9090',
            },
            {
              cmd: 'curl -s \'localhost:9090/api/v1/query?query=up{job="contadores-api"}\' | jq \'.data.result[].value[1]\'',
              out: '"1"\n"1"\n"0"',
            },
          ],
        },
        {
          type: 'p',
          text: 'Aquele `"0"` diz-te que uma das três réplicas não está a responder ao scrape. A métrica `up` é o teu primeiro sanity check.',
        },
      ],
    },
    {
      id: 'otel-alerting',
      title: 'OpenTelemetry, golden signals e alertas',
      minutes: 7,
      blocks: [
        { type: 'h', text: 'OpenTelemetry: instrumenta uma vez, envia para onde quiseres' },
        {
          type: 'p',
          text: 'O **OpenTelemetry (OTel)** é o standard da CNCF para gerar e transportar traces, métricas e logs. Instrumentas a aplicação com o SDK OTel e envias por **OTLP** para um **Collector**, que encaminha para Tempo, Jaeger, Prometheus, Loki ou um fornecedor comercial.',
        },
        {
          type: 'flow',
          steps: ['App + SDK OTel', 'OTLP', 'OTel Collector', 'Backends', 'Grafana'],
          caption: 'Trocar de backend passa a ser mudar a configuração do Collector, não o código.',
        },
        {
          type: 'code',
          lang: 'yaml',
          caption: 'Variáveis de ambiente no Deployment para auto-instrumentação',
          code: `env:
  - name: OTEL_SERVICE_NAME
    value: contadores-api
  - name: OTEL_EXPORTER_OTLP_ENDPOINT
    value: http://otel-collector.monitoring:4317
  - name: OTEL_RESOURCE_ATTRIBUTES
    value: deployment.environment=prod,service.version=1.14.2
  - name: OTEL_TRACES_SAMPLER
    value: parentbased_traceidratio
  - name: OTEL_TRACES_SAMPLER_ARG
    value: "0.1"   # amostra 10% dos traces`,
        },
        { type: 'h', text: 'O que medir: três métodos' },
        {
          type: 'compare',
          left: 'Método',
          right: 'Sinais',
          rows: [
            ['**Golden signals** (Google SRE)', 'Latência, tráfego, erros, saturação'],
            ['**RED** (para serviços/pedidos)', 'Rate, Errors, Duration'],
            ['**USE** (para recursos: CPU, disco, rede)', 'Utilization, Saturation, Errors'],
          ],
        },
        {
          type: 'quickcheck',
          question: 'Queres analisar se os discos dos nós da base de dados são um gargalo. Que método é mais adequado?',
          options: ['RED', 'DORA', 'USE', 'CALMS'],
          answer: 2,
          explanation: 'USE foi pensado para recursos físicos/virtuais: utilização, saturação (ex.: fila de I/O) e erros do disco.',
        },
        { type: 'h', text: 'Alertas que não te fazem odiar o on-call' },
        {
          type: 'list',
          items: [
            'Alerta sobre **sintomas** que o utilizador sente (erros, latência), não sobre causas (CPU a 80%).',
            'Cada alerta que acorda alguém tem de ser **acionável** e ter um **runbook**.',
            'Usa `for:` para evitar alertas por picos de segundos.',
            'Separa severidades: `page` (agora) vs `ticket` (horário laboral).',
          ],
        },
        {
          type: 'code',
          lang: 'yaml',
          caption: 'PrometheusRule — taxa de erro alta na contadores-api',
          code: `groups:
  - name: contadores-api
    rules:
      - alert: ContadoresApiErrosAltos
        expr: |
          sum(rate(http_requests_total{service="contadores-api",status=~"5.."}[5m]))
            / sum(rate(http_requests_total{service="contadores-api"}[5m])) > 0.02
        for: 10m
        labels:
          severity: page
        annotations:
          summary: "Mais de 2% de erros 5xx na contadores-api"
          runbook_url: https://wiki.eda.pt/runbooks/contadores-api-erros`,
        },
        {
          type: 'callout',
          variant: 'warn',
          title: 'Fadiga de alertas',
          text: 'Se o on-call recebe 40 alertas por noite, vai começar a ignorá-los, incluindo o verdadeiro. Revê regularmente: um alerta que ninguém age deve ser corrigido ou apagado.',
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
        prompt: 'Um programador quer adicionar o label `contador_id` (milhões de valores) à métrica `http_requests_total`. Qual é o problema?',
        options: [
          'Os labels não podem ter números',
          'O Prometheus ignora labels com mais de 10 caracteres',
          'Os counters não aceitam labels',
          'Explosão de cardinalidade: milhões de séries temporais novas',
        ],
        answer: 3,
        explanation: 'Cada combinação única de labels é uma série. IDs de alta cardinalidade pertencem a logs ou traces, não a métricas.',
      },
      {
        kind: 'single',
        prompt: 'Qual destes alertas segue melhor as boas práticas de paging?',
        options: [
          'CPU do nó acima de 80% durante 1 minuto',
          'Mais de 2% de erros 5xx sentidos pelos utilizadores durante 10 minutos',
          'Um pod reiniciou uma vez',
          'O disco tem 50% de ocupação',
        ],
        answer: 1,
        explanation: 'Alertar sobre sintomas que afetam utilizadores, com duração mínima, é acionável. Os outros são causas possíveis que podem não ter impacto.',
      },
      {
        kind: 'single',
        prompt: 'O que calcula esta query?',
        code: `histogram_quantile(0.95,
  sum by (le) (rate(http_request_duration_seconds_bucket{service="contadores-api"}[5m])))`,
        options: [
          'A latência abaixo da qual ficam 95% dos pedidos nos últimos 5 minutos',
          'A latência média dos pedidos',
          'A percentagem de pedidos com sucesso',
          'O número de pedidos acima de 0,95 s',
        ],
        answer: 0,
        explanation: 'histogram_quantile(0.95, ...) estima o percentil 95 a partir dos buckets do histograma.',
      },
      {
        kind: 'single',
        prompt: 'Qual é a principal vantagem de instrumentar com OpenTelemetry e enviar para um Collector?',
        options: [
          'Os dados deixam de precisar de armazenamento',
          'Elimina a necessidade de dashboards',
          'Desacopla a instrumentação do backend: mudas de fornecedor sem alterar código',
          'Torna os logs desnecessários',
        ],
        answer: 2,
        explanation: 'OTel é vendor-neutral. O Collector recebe OTLP e exporta para um ou vários backends, configurável sem rebuild da aplicação.',
      },
      {
        kind: 'multi',
        prompt: 'Quais fazem parte dos quatro golden signals? (escolhe todas as corretas)',
        options: ['Latência', 'Número de commits', 'Erros', 'Saturação', 'Cobertura de testes'],
        answers: [0, 2, 3],
        explanation: 'Os golden signals do livro de SRE da Google são latência, tráfego, erros e saturação. Commits e cobertura de testes não descrevem o comportamento em produção.',
      },
      {
        kind: 'multi',
        prompt: 'Na contadores-api em Kubernetes, que práticas de logging são recomendadas? (escolhe todas as corretas)',
        options: [
          'Escrever logs estruturados (JSON) para stdout',
          'Incluir o trace_id em cada linha de log',
          'Guardar logs num ficheiro dentro do container',
          'Registar passwords para facilitar debugging',
        ],
        answers: [0, 1],
        explanation: 'stdout permite que o agente do cluster recolha os logs; o trace_id liga logs a traces. Ficheiros no container perdem-se e segredos nunca vão para logs.',
      },
      {
        kind: 'order',
        prompt: 'Ordena um fluxo de investigação eficaz após um alerta de latência:',
        items: ['Receber o alerta da métrica de latência', 'Abrir o dashboard do serviço', 'Abrir um trace lento (exemplar)', 'Filtrar os logs pelo trace_id', 'Identificar a causa e mitigar'],
        explanation: 'Do sintoma agregado (métrica) para o caso concreto (trace) e daí para o detalhe (logs).',
      },
      {
        kind: 'input',
        prompt: 'Que função PromQL usas para obter a taxa por segundo de um counter num intervalo, como em `___(http_requests_total[5m])`?',
        accept: ['rate', 'rate()', 'irate', 'irate()'],
        placeholder: 'função',
        explanation: '`rate()` dá a taxa média por segundo no intervalo e trata resets do counter. `irate()` usa só os dois últimos pontos.',
      },
    ],
  },
};

export default skill;
