import type { Skill } from '../../types';

const skill: Skill = {
  id: 'security',
  title: 'DevSecOps',
  subtitle: 'Segurança desde o primeiro commit',
  icon: 'shield',
  tier: 3,
  x: 0.16,
  deps: ['ci', 'docker'],
  xp: 250,
  summary:
    'Integra segurança na pipeline em vez de a deixar para o fim: análise de código, dependências e imagens, gestão de segredos e uma supply chain de software confiável.',
  topics: [
    'Shift-left e o custo dos bugs tardios',
    'SAST, DAST e SCA',
    'Scanning de imagens com Trivy',
    'Gestão de segredos',
    'SBOM e supply chain',
    'Least privilege nas pipelines',
  ],
  lessons: [
    {
      id: 'shift-left',
      title: 'Shift-left e tipos de análise',
      minutes: 6,
      blocks: [
        {
          type: 'p',
          text: 'Durante anos, a segurança era um *gate* no fim: uma auditoria antes de ir para produção. O problema? Descobrir uma vulnerabilidade na véspera do go-live é caro e stressante. **Shift-left** significa trazer a segurança para o início do ciclo, onde corrigir é barato.',
        },
        {
          type: 'flow',
          steps: ['IDE / pre-commit', 'Pipeline CI', 'Registry', 'Deploy', 'Runtime'],
          caption: 'Quanto mais à esquerda detetares, mais barato é corrigir',
        },
        {
          type: 'p',
          text: 'DevSecOps não é uma equipa nova: é a **responsabilidade partilhada**. Os developers recebem feedback de segurança no merge request, tal como recebem o resultado dos testes.',
        },
        { type: 'h', text: 'As três grandes famílias' },
        {
          type: 'list',
          items: [
            '**SAST** (Static Application Security Testing): analisa o código-fonte sem o executar. Ex.: Semgrep, CodeQL, SonarQube.',
            '**SCA** (Software Composition Analysis): verifica dependências de terceiros contra bases de CVEs. Ex.: Dependabot, Renovate, Trivy, OWASP Dependency-Check.',
            '**DAST** (Dynamic Application Security Testing): ataca a aplicação a correr, como um atacante faria. Ex.: OWASP ZAP.',
          ],
        },
        {
          type: 'compare',
          left: 'SAST',
          right: 'DAST',
          rows: [
            ['Analisa código-fonte', 'Testa a aplicação em execução'],
            ['Corre cedo, em cada commit', 'Corre num ambiente de staging'],
            ['Aponta a linha exata do problema', 'Mostra o pedido HTTP que explora a falha'],
            ['Pode ter falsos positivos', 'Não vê código que não é exposto'],
          ],
        },
        {
          type: 'code',
          lang: 'yaml',
          caption: '.gitlab-ci.yml — SAST com Semgrep em cada merge request',
          code: `sast:
  stage: test
  image: semgrep/semgrep:latest
  script:
    - semgrep scan --config p/owasp-top-ten --error --sarif -o semgrep.sarif
  artifacts:
    reports:
      sast: semgrep.sarif
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"`,
        },
        {
          type: 'callout',
          variant: 'info',
          title: 'Mais de 80% do código é de terceiros',
          text: 'Numa aplicação Node ou Java típica, a maior parte do código vem de dependências. Por isso o **SCA** costuma ser a análise com melhor retorno para começar.',
        },
        {
          type: 'quickcheck',
          question: 'Queres detetar uma SQL injection numa função da `contadores-api` antes de o código ser merged. Que tipo de análise é mais adequada?',
          options: [
            'DAST em produção',
            'SCA às dependências',
            'SAST no merge request',
            'Pentest anual',
          ],
          answer: 2,
          explanation: 'O SAST analisa o código-fonte e pode apontar a linha vulnerável logo no merge request, antes do merge.',
        },
      ],
    },
    {
      id: 'dependencias-imagens-segredos',
      title: 'Dependências, imagens e segredos',
      minutes: 7,
      blocks: [
        {
          type: 'p',
          text: 'Uma imagem Docker carrega um sistema operativo inteiro mais as tuas dependências. O **Trivy** analisa imagens, filesystems e repositórios à procura de CVEs, misconfigurations e segredos esquecidos.',
        },
        {
          type: 'terminal',
          lines: [
            {
              cmd: 'trivy image --severity HIGH,CRITICAL registry.eda.pt/contadores-api:1.4.2',
              out: 'registry.eda.pt/contadores-api:1.4.2 (debian 12.5)\nTotal: 3 (HIGH: 2, CRITICAL: 1)\n\n┌──────────────┬────────────────┬──────────┬───────────────────┬───────────────┐\n│   Library    │ Vulnerability  │ Severity │ Installed Version │ Fixed Version │\n├──────────────┼────────────────┼──────────┼───────────────────┼───────────────┤\n│ libssl3      │ CVE-2024-5535  │ CRITICAL │ 3.0.11-1          │ 3.0.14-1      │\n│ zlib1g       │ CVE-2023-45853 │ HIGH     │ 1:1.2.13-1        │               │\n└──────────────┴────────────────┴──────────┴───────────────────┴───────────────┘\n\nnode-pkg (package-lock.json)\n│ express      │ CVE-2024-29041 │ HIGH     │ 4.18.2            │ 4.19.2        │',
            },
          ],
        },
        {
          type: 'list',
          items: [
            'Usa imagens base mínimas (`distroless`, `alpine`, `-slim`): menos pacotes, menos CVEs.',
            'Falha a pipeline só para `CRITICAL` com correção disponível (`--ignore-unfixed`), para não bloquear por ruído.',
            'Reconstrói imagens regularmente: uma imagem sem CVEs hoje terá CVEs daqui a um mês.',
            'Automatiza updates de dependências com Renovate ou Dependabot.',
          ],
        },
        {
          type: 'code',
          lang: 'yaml',
          caption: 'GitHub Actions — bloquear imagens com CVEs críticos',
          code: `- name: Scan da imagem
  uses: aquasecurity/trivy-action@0.28.0
  with:
    image-ref: registry.eda.pt/contadores-api:\${{ github.sha }}
    severity: CRITICAL
    ignore-unfixed: true
    exit-code: '1'`,
        },
        { type: 'h', text: 'Nunca faças commit de segredos' },
        {
          type: 'p',
          text: 'Um token commitado fica no histórico Git **para sempre**, mesmo que o apagues no commit seguinte. Bots varrem repositórios públicos em minutos à procura de chaves AWS.',
        },
        {
          type: 'callout',
          variant: 'warn',
          title: 'Fizeste commit de uma password?',
          text: 'Primeiro **revoga e roda** o segredo — considera-o comprometido. Só depois limpa o histórico (`git filter-repo`). Apagar o ficheiro não chega.',
        },
        {
          type: 'compare',
          left: 'Errado',
          right: 'Certo',
          rows: [
            ['Password no `application.yml`', 'Lida de variável de ambiente ou secret store'],
            ['`.env` commitado no repositório', '`.env` no `.gitignore` + `.env.example`'],
            ['Token partilhado por email', 'HashiCorp Vault, AWS Secrets Manager, Azure Key Vault'],
            ['Segredos estáticos que nunca expiram', 'Credenciais de curta duração e rotação automática'],
          ],
        },
        {
          type: 'terminal',
          lines: [
            {
              cmd: 'gitleaks git --verbose',
              out: 'Finding:     DB_PASSWORD=Pr0d-C0nt4d0res!\nSecret:      Pr0d-C0nt4d0res!\nRuleID:      generic-api-key\nFile:        config/prod.env\nCommit:      9f3c2ab\nAuthor:      rui.santos\n\n2:14PM WRN leaks found: 1',
            },
          ],
        },
        {
          type: 'quickcheck',
          question: 'Descobres que uma chave de API foi commitada há 3 dias num repositório interno. Qual é o primeiro passo?',
          options: [
            'Apagar o ficheiro e fazer novo commit',
            'Tornar o repositório privado',
            'Esperar para ver se alguém a usou',
            'Revogar a chave e gerar uma nova',
          ],
          answer: 3,
          explanation: 'O segredo deve ser tratado como comprometido: revoga-o e roda-o primeiro. A limpeza do histórico vem depois.',
        },
      ],
    },
    {
      id: 'supply-chain-least-privilege',
      title: 'Supply chain, SBOM e least privilege',
      minutes: 7,
      blocks: [
        {
          type: 'p',
          text: 'Ataques como SolarWinds, Codecov ou o backdoor no `xz-utils` mostraram que o elo fraco pode ser a própria **cadeia de fornecimento**: uma dependência, uma action de CI ou o servidor de build.',
        },
        { type: 'h', text: 'SBOM: a lista de ingredientes' },
        {
          type: 'p',
          text: 'Um **SBOM** (Software Bill of Materials) lista todos os componentes e versões dentro do teu artefacto, em formatos como **CycloneDX** ou **SPDX**. Quando sai um novo CVE, sabes em segundos que serviços estão afetados.',
        },
        {
          type: 'terminal',
          lines: [
            {
              cmd: 'syft registry.eda.pt/contadores-api:1.4.2 -o cyclonedx-json > sbom.json',
              out: ' ✔ Loaded image\n ✔ Parsed image\n ✔ Cataloged contents\n   ├── ✔ Packages                        [412 packages]\n   └── ✔ Executables                     [1,203 executables]',
            },
            {
              cmd: 'grype sbom:sbom.json --only-fixed',
              out: 'NAME     INSTALLED  FIXED-IN  TYPE  VULNERABILITY   SEVERITY\nexpress  4.18.2     4.19.2    npm   GHSA-rv95-896h  Medium\nlibssl3  3.0.11-1   3.0.14-1  deb   CVE-2024-5535   Critical',
            },
          ],
        },
        {
          type: 'flow',
          steps: ['Build', 'Gera SBOM', 'Assina (cosign)', 'Verifica no deploy'],
          caption: 'Artefactos rastreáveis e verificáveis',
        },
        {
          type: 'p',
          text: 'Com **Sigstore/cosign** assinas imagens e anexas atestações (SBOM, proveniência SLSA). O cluster pode recusar imagens não assinadas pela tua pipeline.',
        },
        { type: 'h', text: 'Least privilege nas pipelines' },
        {
          type: 'p',
          text: 'Uma pipeline tem muitas vezes acesso a produção. Se for comprometida, o atacante herda esses poderes. Por isso cada job deve ter **só as permissões de que precisa**.',
        },
        {
          type: 'code',
          lang: 'yaml',
          caption: 'GitHub Actions com permissões mínimas e OIDC',
          code: `permissions:
  contents: read        # por defeito, só leitura

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: producao   # exige aprovação
    permissions:
      contents: read
      id-token: write       # OIDC: credenciais temporárias, sem chaves estáticas
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683  # v4.2.2 fixado por SHA
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/deploy-contadores
          aws-region: eu-west-1`,
        },
        {
          type: 'list',
          items: [
            'Fixa actions de terceiros por **SHA** do commit, não por tag mutável.',
            'Usa **OIDC** em vez de access keys guardadas como secrets.',
            'Protege branches e environments com aprovações obrigatórias.',
            'Não exponhas secrets a pipelines de merge requests vindos de forks.',
          ],
        },
        {
          type: 'quickcheck',
          question: 'Porque é preferível usar OIDC em vez de guardar uma access key da cloud como secret da pipeline?',
          options: [
            'As credenciais são temporárias e não existe chave estática para roubar',
            'O OIDC torna a pipeline mais rápida',
            'O OIDC dispensa permissões IAM',
            'As access keys não funcionam em GitHub Actions',
          ],
          answer: 0,
          explanation: 'Com OIDC a pipeline troca um token assinado por credenciais de curta duração. Não há segredo de longa duração que possa ser exfiltrado.',
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
        prompt: 'Sai um CVE crítico no `log4j`. A direção pergunta quais dos 60 serviços estão afetados. O que te permite responder em minutos?',
        options: [
          'Os logs de acesso do nginx',
          'Um SBOM gerado e guardado para cada artefacto',
          'Um scan DAST semanal',
          'A documentação do projeto',
        ],
        answer: 1,
        explanation: 'Um SBOM lista todos os componentes de cada artefacto; basta pesquisar pelo pacote e versão afetados.',
      },
      {
        kind: 'single',
        prompt: 'O Trivy bloqueia a pipeline por um CVE HIGH sem versão corrigida numa biblioteca do sistema base. Qual é a abordagem mais equilibrada?',
        options: [
          'Desativar o scan de imagens',
          'Ignorar todos os CVEs para sempre',
          'Fazer deploy manual sem passar pela pipeline',
          'Usar `--ignore-unfixed`, mudar para imagem base mínima e registar uma exceção com prazo',
        ],
        answer: 3,
        explanation: 'Sem correção disponível, bloquear não ajuda. Reduz superfície com imagem mínima e regista exceções justificadas e temporárias.',
      },
      {
        kind: 'single',
        prompt: 'Qual destas ferramentas é um exemplo de DAST?',
        options: ['OWASP ZAP', 'Semgrep', 'Dependabot', 'gitleaks'],
        answer: 0,
        explanation: 'O OWASP ZAP ataca a aplicação a correr. Semgrep é SAST, Dependabot é SCA e gitleaks deteta segredos.',
      },
      {
        kind: 'single',
        prompt: 'Este passo de pipeline foi apontado numa revisão de segurança. Qual é o problema principal?',
        code: `- uses: random-org/deploy-action@main
  with:
    aws_secret: \${{ secrets.AWS_SECRET_ACCESS_KEY }}`,
        options: [
          'Falta o `runs-on`',
          'O nome da action é demasiado genérico',
          'Usa uma action de terceiros por branch mutável e passa-lhe uma chave estática',
          'Os secrets não podem ser usados em `with`',
        ],
        answer: 2,
        explanation: 'Qualquer push para `main` dessa action corre na tua pipeline com a tua chave AWS. Fixa por SHA e usa OIDC com credenciais temporárias.',
      },
      {
        kind: 'multi',
        prompt: 'Quais destas práticas aplicam o princípio de least privilege numa pipeline? (escolhe todas as corretas)',
        options: [
          'Definir `permissions: contents: read` por defeito',
          'Dar permissões de administrador ao runner para evitar erros',
          'Usar OIDC com um role IAM limitado ao deploy',
          'Partilhar o mesmo token entre todos os projetos',
          'Exigir aprovação no environment de produção',
        ],
        answers: [0, 2, 4],
        explanation: 'Permissões mínimas por defeito, roles específicos e aprovações reduzem o impacto de uma pipeline comprometida. Admin e tokens partilhados fazem o contrário.',
      },
      {
        kind: 'order',
        prompt: 'Ordena os controlos de segurança pela ordem em que normalmente atuam no ciclo de vida (shift-left primeiro).',
        items: [
          'Hook pre-commit deteta segredos',
          'SAST e SCA no merge request',
          'Scan da imagem antes do push para o registry',
          'DAST no ambiente de staging',
          'Monitorização em runtime',
        ],
        explanation: 'Do mais à esquerda (máquina do developer) até produção: pre-commit, CI, registry, staging e runtime.',
      },
      {
        kind: 'input',
        prompt: 'Que comando Trivy usas para analisar a imagem local `contadores-api:latest`?',
        placeholder: 'trivy ...',
        accept: ['trivy image contadores-api:latest', 'trivy i contadores-api:latest'],
        explanation: '`trivy image <imagem>` analisa pacotes do SO e dependências da aplicação à procura de vulnerabilidades.',
      },
      {
        kind: 'multi',
        prompt: 'Um developer fez push de um `.env` com a password da base de dados de produção. Que ações são necessárias? (escolhe todas as corretas)',
        options: [
          'Rodar a password da base de dados',
          'Adicionar `.env` ao `.gitignore`',
          'Apenas apagar o ficheiro num novo commit, sem mais nada',
          'Limpar o histórico Git (ex.: `git filter-repo`) e avisar a equipa',
        ],
        answers: [0, 1, 3],
        explanation: 'O segredo está comprometido: roda-o, evita a repetição com `.gitignore` e limpa o histórico. Apagar num novo commit deixa-o no histórico.',
      },
    ],
  },
};

export default skill;
