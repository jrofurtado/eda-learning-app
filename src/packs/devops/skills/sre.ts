import type { Skill } from '../../types';

const skill: Skill = {
  id: 'sre',
  title: 'SRE & Fiabilidade',
  subtitle: 'Fiabilidade medida, não prometida',
  icon: 'sre',
  tier: 5,
  x: 0.62,
  deps: ['observability', 'gitops'],
  xp: 400,
  summary:
    'Aprende a definir quanta fiabilidade é suficiente com SLIs, SLOs e error budgets, a gerir incidentes com calma e a reduzir o trabalho repetitivo para que a equipa invista em engenharia.',
  topics: [
    'SLI, SLO e SLA',
    'Error budgets e políticas',
    'Gestão de incidentes e on-call',
    'Postmortems blameless',
    'Redução de toil e capacity planning',
    'Introdução a chaos engineering',
  ],
  lessons: [
    {
      id: 'slo-error-budget',
      title: 'SLIs, SLOs e error budgets',
      minutes: 8,
      blocks: [
        { type: 'h', text: '100% não é o objetivo certo' },
        {
          type: 'p',
          text: 'Os utilizadores da app de leituras da EDA não distinguem 99,99% de 100% de disponibilidade, porque a rede móvel deles falha mais do que isso. Perseguir 100% torna cada alteração lenta e cara. **SRE** começa por decidir quanta fiabilidade é suficiente.',
        },
        {
          type: 'compare',
          left: 'Conceito',
          right: 'Exemplo para a contadores-api',
          rows: [
            ['**SLI** — indicador medido', 'Proporção de pedidos `POST /leituras` com resposta não-5xx em menos de 300 ms'],
            ['**SLO** — objetivo interno para o SLI', '99,9% dos pedidos bons, numa janela móvel de 28 dias'],
            ['**SLA** — contrato com consequências', 'Com um cliente empresarial: 99,5%, com créditos se falhar'],
            ['**Error budget** — 100% − SLO', '0,1% de pedidos podem falhar nesses 28 dias'],
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'O SLA deve ser sempre **mais folgado** que o SLO. O SLO é o alarme interno que te avisa muito antes de violares o contrato.',
        },
        {
          type: 'code',
          lang: 'text',
          caption: 'Quanto tempo de indisponibilidade cabe num SLO (janela de 30 dias)',
          code: `SLO      Error budget    Indisponibilidade permitida
99%      1%              ~7 h 12 min
99,5%    0,5%            ~3 h 36 min
99,9%    0,1%            ~43 min
99,95%   0,05%           ~21 min
99,99%   0,01%           ~4 min 19 s`,
        },
        {
          type: 'p',
          text: 'Cada "9" extra custa muito mais em redundância, processos e velocidade. Escolhe o SLO com o negócio, a partir do que os utilizadores realmente notam.',
        },
        { type: 'h', text: 'O error budget como ferramenta de decisão' },
        {
          type: 'list',
          items: [
            '**Budget saudável**: a equipa faz deploys frequentes e experimenta.',
            '**Budget a esgotar-se**: abranda, reforça testes e canary.',
            '**Budget esgotado**: congela features não críticas e prioriza fiabilidade até recuperar.',
            'A política é acordada **antes** entre produto e engenharia, para não ser discutida a meio de uma crise.',
          ],
        },
        {
          type: 'code',
          lang: 'promql',
          caption: 'Burn rate: a que velocidade estás a gastar o budget (SLO 99,9%)',
          code: `# erros na última hora / budget permitido
(
  sum(rate(http_requests_total{service="contadores-api",status=~"5.."}[1h]))
  / sum(rate(http_requests_total{service="contadores-api"}[1h]))
) / 0.001
# > 14.4 => esgotas 2% do budget mensal numa hora: page!`,
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Alertas por **burn rate** (multi-janela, ex.: 1 h e 5 min) são o padrão moderno: acordam o on-call quando o SLO está realmente em risco, não por cada pico isolado. Ferramentas como Sloth ou Pyrra geram estas regras a partir de uma definição de SLO.',
        },
        {
          type: 'quickcheck',
          question: 'O SLO é 99,9% em 28 dias e, a meio da janela, já gastaste 95% do error budget. O que diz uma boa política?',
          options: [
            'Acelerar os deploys para recuperar tempo',
            'Mudar o SLO para 99% para deixar de estar em risco',
            'Ignorar: só importa no fim da janela',
            'Priorizar trabalho de fiabilidade e limitar alterações arriscadas',
          ],
          answer: 3,
          explanation: 'O budget quase esgotado é o sinal para trocar features por fiabilidade. Baixar o SLO a meio só esconde o problema.',
        },
      ],
    },
    {
      id: 'incidentes',
      title: 'Incidentes, on-call e postmortems',
      minutes: 7,
      blocks: [
        { type: 'h', text: 'Quando tudo arde: estrutura acima de heroísmo' },
        {
          type: 'p',
          text: 'Num incidente, o objetivo número um é **mitigar o impacto**, não encontrar a causa raiz. Primeiro restauras o serviço (rollback, failover, feature flag off); a investigação profunda vem depois.',
        },
        {
          type: 'flow',
          steps: ['Deteção', 'Triagem', 'Mitigação', 'Resolução', 'Postmortem'],
          caption: 'O ciclo de vida de um incidente.',
        },
        {
          type: 'list',
          items: [
            '**Incident Commander (IC)**: coordena, decide, não faz debugging.',
            '**Ops/Técnico**: investiga e executa as ações de mitigação.',
            '**Comunicação**: atualiza a status page e os stakeholders a intervalos regulares.',
            '**Escriba**: regista a timeline no canal do incidente.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Mede a resposta',
          text: 'Acompanha **MTTD** (tempo até detetar) e **MTTR** (tempo até restaurar). Rollbacks rápidos via GitOps e feature flags são das maiores alavancas para baixar o MTTR.',
        },
        {
          type: 'p',
          text: 'Um on-call saudável tem rotações com pelo menos 6 a 8 pessoas, handoffs claros, runbooks atualizados, compensação justa e um número de pages por turno baixo. Um on-call esgotante é um risco de fiabilidade por si só.',
        },
        {
          type: 'quickcheck',
          question: 'Às 03:10 a taxa de erros dispara logo após um deploy da contadores-api. Qual é a primeira ação mais sensata?',
          options: [
            'Fazer rollback para a versão anterior e investigar depois',
            'Ler o código do commit linha a linha até encontrar o bug',
            'Esperar pela equipa de desenvolvimento às 09:00',
            'Escalar o número de réplicas para 50',
          ],
          answer: 0,
          explanation: 'Correlação forte com um deploy recente + rollback barato = mitigar primeiro. A causa raiz investiga-se com o serviço estável.',
        },
        { type: 'h', text: 'Postmortems blameless' },
        {
          type: 'p',
          text: 'Um postmortem **blameless** parte do princípio que as pessoas agiram de boa-fé com a informação que tinham. A pergunta não é "quem errou?", mas "que falha no sistema permitiu que isto acontecesse?".',
        },
        {
          type: 'code',
          lang: 'markdown',
          caption: 'Esqueleto de postmortem',
          code: `# INC-2026-117 — Falha na submissão de leituras

Impacto: 38 min, ~12% dos POST /leituras com erro 500; 6% do error budget mensal
Deteção: alerta de burn rate às 03:12 (deploy às 03:08)
Timeline: 03:08 deploy 1.15.0 · 03:12 page · 03:19 rollback · 03:46 normal
Causa: migração adicionou índice com lock na tabela leituras
Fatores contribuintes: staging com 1% dos dados; sem teste de migração com volume real
O que correu bem: rollback via git revert em 4 min
Ações:
  - [ ] Migrações online (CREATE INDEX CONCURRENTLY) — dono: @rita — até 30/10
  - [ ] Dataset anonimizado de volume real em staging — dono: @joao — até 15/11`,
        },
        {
          type: 'callout',
          variant: 'warn',
          text: 'Um postmortem sem ações com **dono e data** é só uma história. E "ter mais cuidado" não é uma ação: muda o sistema, não as pessoas.',
        },
      ],
    },
    {
      id: 'toil-capacidade-chaos',
      title: 'Toil, capacidade e chaos engineering',
      minutes: 7,
      blocks: [
        { type: 'h', text: 'Toil: o inimigo silencioso' },
        {
          type: 'p',
          text: '**Toil** é trabalho operacional manual, repetitivo, automatizável, reativo e sem valor duradouro: reiniciar o mesmo serviço todas as semanas, criar contas à mão, renovar certificados manualmente.',
        },
        {
          type: 'compare',
          left: 'Toil',
          right: 'Engenharia',
          rows: [
            ['Rodar certificados TLS à mão a cada 90 dias', 'cert-manager com renovação automática'],
            ['Limpar disco quando o alerta toca', 'Retenção de logs configurada e alerta de previsão'],
            ['Criar namespaces e quotas por ticket', 'Self-service na plataforma com templates'],
            ['Reiniciar pod com memory leak', 'Corrigir o leak; entretanto, limites e probes adequados'],
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'A Google recomenda que SREs não passem mais de **50%** do tempo em toil. O resto vai para projetos que reduzem o toil futuro e melhoram a fiabilidade.',
        },
        { type: 'h', text: 'Capacity planning' },
        {
          type: 'list',
          items: [
            'Mede a procura orgânica (crescimento de clientes) e inorgânica (ex.: fim do mês, quando todos submetem leituras).',
            'Faz testes de carga (k6, Locust) para saber quantos pedidos/s aguenta cada réplica.',
            'Mantém margem (headroom) para falhas: com 3 zonas, aguenta perder uma (N+1).',
            'Usa `predict_linear()` para prever quando um recurso se esgota.',
          ],
        },
        {
          type: 'code',
          lang: 'promql',
          caption: 'Alertar 4 dias antes de o volume da base de dados encher',
          code: `predict_linear(kubelet_volume_stats_available_bytes{persistentvolumeclaim="leituras-db"}[6h], 4 * 24 * 3600) < 0`,
        },
        { type: 'h', text: 'Chaos engineering: partir de propósito' },
        {
          type: 'p',
          text: 'Chaos engineering é fazer **experiências controladas** para ganhar confiança de que o sistema resiste a falhas reais, antes que elas aconteçam às 3 da manhã.',
        },
        {
          type: 'flow',
          steps: ['Estado estável', 'Hipótese', 'Injetar falha', 'Observar SLIs', 'Aprender'],
          caption: 'Começa pequeno (staging, raio de impacto limitado) e tem sempre um botão de parar.',
        },
        {
          type: 'terminal',
          lines: [
            {
              cmd: 'kubectl apply -f chaos/pod-kill-contadores.yaml',
              out: 'podchaos.chaos-mesh.org/pod-kill-contadores created',
            },
            {
              cmd: 'kubectl get pods -n contadores -w',
              out: 'NAME                              READY   STATUS        RESTARTS   AGE\ncontadores-api-7c9f8d6b5-h2kq9    1/1     Terminating   0          3d\ncontadores-api-7c9f8d6b5-p8x2m    1/1     Running       0          3d\ncontadores-api-7c9f8d6b5-zt4wn    0/1     Pending       0          0s\ncontadores-api-7c9f8d6b5-zt4wn    1/1     Running       0          6s',
            },
          ],
        },
        {
          type: 'quickcheck',
          question: 'Qual é a primeira coisa a definir antes de uma experiência de chaos engineering?',
          options: [
            'Que pods matar primeiro em produção',
            'O estado estável (SLIs normais) e a hipótese do que deve acontecer',
            'A data do próximo postmortem',
            'Um novo SLA com os clientes',
          ],
          answer: 1,
          explanation: 'Sem um estado estável mensurável e uma hipótese ("se um pod morrer, a taxa de erro fica abaixo de 0,1%"), não consegues tirar conclusões da experiência.',
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
        prompt: 'A equipa definiu SLO = 99,95% e SLA = 99,99% com um cliente. Qual é o problema?',
        options: [
          'Nenhum, são valores normais',
          'O SLA é mais exigente que o SLO: violas o contrato antes de o alarme interno disparar',
          'O SLO devia ser sempre 100%',
          'Um SLA nunca pode ter casas decimais',
        ],
        answer: 1,
        explanation: 'O SLO deve ser mais exigente que o SLA, funcionando como margem de segurança antes das consequências contratuais.',
      },
      {
        kind: 'single',
        prompt: 'Qual destes é o melhor SLI para a submissão de leituras?',
        options: [
          'Utilização média de CPU dos pods',
          'Número de pods em Running',
          'Número de deploys por semana',
          'Proporção de pedidos POST /leituras bem-sucedidos e com latência abaixo de 300 ms',
        ],
        answer: 3,
        explanation: 'Um bom SLI mede a experiência do utilizador como proporção de eventos bons sobre eventos totais.',
      },
      {
        kind: 'single',
        prompt: 'Durante um incidente, o Incident Commander deve principalmente...',
        options: [
          'Coordenar a resposta, delegar e tomar decisões',
          'Fazer ele próprio o debugging no código',
          'Escrever o postmortem enquanto o incidente decorre',
          'Identificar a pessoa culpada',
        ],
        answer: 0,
        explanation: 'O IC mantém a visão global e coordena papéis. Se estiver a fazer debugging, ninguém está a coordenar.',
      },
      {
        kind: 'single',
        prompt: 'Com um SLO de 99,9% numa janela de 30 dias, quanto tempo de indisponibilidade total cabe aproximadamente no error budget?',
        options: ['~4 minutos', '~7 horas', '~43 minutos', '~3 dias'],
        answer: 2,
        explanation: '0,1% de 30 dias = 0,001 × 43 200 min ≈ 43 min.',
      },
      {
        kind: 'multi',
        prompt: 'Quais destas tarefas são toil? (escolhe todas as corretas)',
        options: [
          'Renovar certificados à mão a cada 90 dias',
          'Desenhar a arquitetura multi-zona da plataforma',
          'Criar manualmente namespaces a pedido por ticket',
          'Escrever um postmortem de um incidente novo',
          'Reiniciar todas as semanas o mesmo serviço com memory leak',
        ],
        answers: [0, 2, 4],
        explanation: 'Toil é manual, repetitivo e automatizável, sem valor duradouro. Desenho de arquitetura e postmortems são trabalho de engenharia.',
      },
      {
        kind: 'order',
        prompt: 'Ordena as fases de um incidente:',
        items: ['Deteção', 'Triagem', 'Mitigação', 'Resolução', 'Postmortem'],
        explanation: 'Detetas, avalias a gravidade, mitigas o impacto, resolves a causa e aprendes com o postmortem.',
      },
      {
        kind: 'input',
        prompt: 'Que função PromQL usas para prever, por regressão linear, o valor de uma métrica no futuro (ex.: quando o disco enche)?',
        accept: ['predict_linear', 'predict_linear()'],
        placeholder: 'função',
        explanation: '`predict_linear(v[6h], segundos)` extrapola a tendência da série para o futuro e é ótima para alertas de capacidade.',
      },
      {
        kind: 'multi',
        prompt: 'Que características tem um bom postmortem blameless? (escolhe todas as corretas)',
        options: [
          'Ações concretas com dono e data',
          'Identifica quem errou para formação disciplinar',
          'Timeline factual com deteção, mitigação e impacto',
          'Conclui com "ter mais cuidado da próxima vez"',
        ],
        answers: [0, 2],
        explanation: 'Foca-se em factos e em mudanças no sistema. Culpabilizar pessoas ou pedir "mais cuidado" não previne a repetição.',
      },
    ],
  },
};

export default skill;
