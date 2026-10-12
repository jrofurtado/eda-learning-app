import type { Skill } from '../../types';

const skill: Skill = {
  id: 'cloud',
  title: 'Fundamentos de Cloud',
  subtitle: 'Infraestrutura a pedido, com cabeça',
  icon: 'cloud',
  tier: 1,
  x: 0.86,
  deps: ['networking', 'linux'],
  xp: 150,
  summary:
    'Percebe como funciona a cloud por dentro: modelos de serviço, regiões e zonas, redes virtuais, IAM com privilégio mínimo e como não ter sustos na fatura.',
  topics: [
    'IaaS, PaaS e SaaS',
    'Regiões e zonas de disponibilidade',
    'Compute, storage e rede (VPC, subnets, security groups)',
    'IAM e privilégio mínimo',
    'Modelo de responsabilidade partilhada',
    'Consciência de custos',
  ],
  lessons: [
    {
      id: 'modelos-e-regioes',
      title: 'Modelos de serviço e geografia',
      minutes: 6,
      blocks: [
        { type: 'h', text: 'O que é, afinal, "a cloud"?' },
        {
          type: 'p',
          text: 'Cloud é usar centros de dados de outra empresa **a pedido**, através de uma API, pagando pelo que consomes. Em vez de comprar um servidor e esperar semanas, pedes uma VM e tens uma pronta em segundos.',
        },
        {
          type: 'p',
          text: 'A grande questão é: **quanto queres gerir tu?** É isso que distingue os modelos de serviço.',
        },
        {
          type: 'list',
          items: [
            '**IaaS** (Infrastructure as a Service): recebes VMs, discos e redes. Tu geres o sistema operativo para cima. Ex.: AWS EC2, Azure Virtual Machines.',
            '**PaaS** (Platform as a Service): entregas o código ou o container, o fornecedor gere SO, patches e escala. Ex.: Azure App Service, AWS Elastic Beanstalk, bases de dados geridas como RDS.',
            '**SaaS** (Software as a Service): usas a aplicação pronta. Ex.: Microsoft 365, GitHub, Salesforce.',
          ],
        },
        {
          type: 'flow',
          steps: ['On-premises', 'IaaS', 'PaaS', 'SaaS'],
          caption: 'Da esquerda para a direita: menos coisas para gerires, menos controlo fino.',
        },
        {
          type: 'quickcheck',
          question: 'A equipa quer publicar o `contadores-api` sem gerir patches do sistema operativo nem servidores. Que modelo encaixa melhor?',
          options: ['IaaS', 'PaaS', 'SaaS', 'On-premises'],
          answer: 1,
          explanation: 'Em PaaS entregas a aplicação e o fornecedor trata do SO, patches e infraestrutura subjacente. IaaS obrigaria a gerir as VMs.',
        },
        { type: 'h', text: 'Regiões e zonas de disponibilidade' },
        {
          type: 'p',
          text: 'Uma **região** é uma área geográfica (ex.: `eu-south-2` em Espanha na AWS, `West Europe` na Azure). Cada região tem várias **zonas de disponibilidade (AZs)**: centros de dados isolados, com energia e rede independentes, ligados por fibra de baixa latência.',
        },
        {
          type: 'compare',
          left: 'Distribuir por AZs',
          right: 'Distribuir por regiões',
          rows: [
            ['Protege contra falha de um centro de dados', 'Protege contra falha de uma região inteira'],
            ['Latência entre AZs: ~1–2 ms', 'Latência entre regiões: dezenas de ms'],
            ['Padrão para qualquer serviço de produção', 'Para requisitos de DR exigentes'],
            ['Custo extra moderado', 'Custo e complexidade elevados'],
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          title: 'Soberania de dados',
          text: 'Para dados de clientes de uma utility europeia, a escolha da região não é só técnica: o RGPD e políticas internas podem obrigar a manter dados dentro da UE.',
        },
        {
          type: 'terminal',
          lines: [
            { cmd: 'aws ec2 describe-availability-zones --region eu-south-2 --query "AvailabilityZones[].ZoneName" --output text', out: 'eu-south-2a\teu-south-2b\teu-south-2c' },
          ],
        },
      ],
    },
    {
      id: 'primitivas',
      title: 'Compute, storage e rede',
      minutes: 7,
      blocks: [
        { type: 'h', text: 'As três primitivas' },
        {
          type: 'p',
          text: 'Quase tudo na cloud é construído com três peças: **compute** (onde corre o código), **storage** (onde ficam os dados) e **rede** (como tudo comunica).',
        },
        {
          type: 'compare',
          left: 'Tipo',
          right: 'Exemplos AWS / Azure',
          rows: [
            ['VMs', 'EC2 / Virtual Machines'],
            ['Containers geridos', 'ECS, EKS / Container Apps, AKS'],
            ['Serverless', 'Lambda / Functions'],
            ['Object storage', 'S3 / Blob Storage'],
            ['Block storage (discos)', 'EBS / Managed Disks'],
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Object vs block',
          text: 'Object storage (S3, Blob) é ideal para ficheiros, backups e exportações de leituras: barato, quase infinito, acedido por HTTP. Block storage é um disco ligado a uma VM, para bases de dados e sistemas de ficheiros.',
        },
        { type: 'h', text: 'Rede virtual: VPC e subnets' },
        {
          type: 'p',
          text: 'Uma **VPC** (AWS) ou **VNet** (Azure) é a tua rede privada isolada na cloud, com um bloco CIDR como `10.20.0.0/16`. Dentro dela crias **subnets**, cada uma numa AZ.',
        },
        {
          type: 'list',
          items: [
            '**Subnet pública:** tem rota para um Internet Gateway. Aqui vive o load balancer.',
            '**Subnet privada:** sem entrada direta da Internet. Aqui vivem a aplicação e a base de dados.',
            'Para sair para a Internet (atualizações, APIs externas), as subnets privadas usam um **NAT Gateway**.',
          ],
        },
        {
          type: 'flow',
          steps: ['Internet', 'Load balancer', 'App (privada)', 'Base de dados'],
          caption: 'Arquitetura típica em três camadas.',
        },
        { type: 'h', text: 'Security groups' },
        {
          type: 'p',
          text: 'Um **security group** é uma firewall *stateful* associada a cada recurso. Por omissão tudo o que entra é negado; abres só o necessário. Por ser stateful, as respostas a pedidos permitidos saem automaticamente.',
        },
        {
          type: 'code',
          lang: 'hcl',
          caption: 'Security group da base de dados: só aceita tráfego vindo da app.',
          code: `resource "aws_security_group_rule" "db_from_app" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  security_group_id        = aws_security_group.db.id
  source_security_group_id = aws_security_group.app.id
}`,
        },
        {
          type: 'callout',
          variant: 'warn',
          title: 'Nunca 0.0.0.0/0 na base de dados',
          text: 'Abrir a porta `5432` ou `22` a `0.0.0.0/0` expõe o serviço a toda a Internet. Bots fazem scan a estas portas em minutos.',
        },
        {
          type: 'quickcheck',
          question: 'Onde deves colocar a base de dados do `contadores-api`?',
          options: ['Numa subnet pública com IP público', 'Numa subnet privada, com security group que só aceita a app', 'Numa subnet pública, protegida por password forte', 'Fora da VPC, para ser mais rápida'],
          answer: 1,
          explanation: 'A base de dados não deve ser alcançável a partir da Internet. Subnet privada e security group restrito à app reduzem drasticamente a superfície de ataque.',
        },
      ],
    },
    {
      id: 'iam-custos',
      title: 'IAM, responsabilidade e custos',
      minutes: 7,
      blocks: [
        { type: 'h', text: 'IAM: quem pode fazer o quê' },
        {
          type: 'p',
          text: 'O **IAM** (Identity and Access Management) controla identidades (utilizadores, grupos, *roles* e identidades de serviço) e as permissões que têm. Na Azure, o equivalente é o Entra ID com **RBAC**.',
        },
        {
          type: 'p',
          text: 'O princípio-chave é o **privilégio mínimo**: cada identidade tem só as permissões que precisa, nos recursos que precisa, durante o tempo que precisa.',
        },
        {
          type: 'code',
          lang: 'json',
          caption: 'Política AWS: a app só pode ler e escrever num bucket específico.',
          code: `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject"],
      "Resource": "arn:aws:s3:::eda-leituras-export/*"
    }
  ]
}`,
        },
        {
          type: 'list',
          items: [
            'Usa **roles** para aplicações (instance profiles, managed identities), nunca chaves de acesso no código.',
            'Ativa **MFA** para todas as pessoas, sobretudo contas com privilégios.',
            'Não uses a conta *root* no dia a dia.',
            'Prefere acesso temporário (SSO, `aws sso login`) a chaves de longa duração.',
          ],
        },
        {
          type: 'quickcheck',
          question: 'Uma Lambda precisa de ler ficheiros de um bucket S3. Qual é a melhor forma de lhe dar acesso?',
          options: ['Colocar access keys de um utilizador admin nas variáveis de ambiente', 'Tornar o bucket público', 'Criar um role com permissão `s3:GetObject` nesse bucket e associá-lo à Lambda', 'Dar `AdministratorAccess` à Lambda para evitar erros'],
          answer: 2,
          explanation: 'Um role com permissões mínimas dá credenciais temporárias e rodadas automaticamente, sem segredos no código e sem acesso a mais do que o necessário.',
        },
        { type: 'h', text: 'Responsabilidade partilhada' },
        {
          type: 'compare',
          left: 'O fornecedor é responsável',
          right: 'Tu és responsável',
          rows: [
            ['Segurança física dos centros de dados', 'Configuração de IAM e permissões'],
            ['Hardware, rede física, hipervisor', 'Security groups e exposição de serviços'],
            ['Serviços geridos (patches do RDS, etc.)', 'Patches do SO nas tuas VMs (IaaS)'],
            ['Disponibilidade da infraestrutura', 'Cifrar e fazer backup dos teus dados'],
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          text: 'Resumo clássico: o fornecedor trata da segurança **da** cloud; tu tratas da segurança **na** cloud. Quanto mais gerido o serviço, mais a linha se desloca para o fornecedor.',
        },
        { type: 'h', text: 'Consciência de custos' },
        {
          type: 'list',
          items: [
            '**Tags** obrigatórias (`equipa`, `projeto`, `ambiente`) para saber quem gasta o quê.',
            '**Budgets e alertas** (AWS Budgets, Azure Cost Management) antes de haver surpresas.',
            '**Desligar ambientes** de dev e teste fora de horas pode cortar até ~65% desse custo.',
            '**Rightsizing:** uma VM a 5% de CPU está sobredimensionada.',
            'Cuidado com o **tráfego de saída** (egress) e NAT Gateways: são custos escondidos frequentes.',
          ],
        },
        {
          type: 'terminal',
          lines: [
            { cmd: 'aws ce get-cost-and-usage --time-period Start=2026-09-01,End=2026-10-01 --granularity MONTHLY --metrics UnblendedCost --group-by Type=TAG,Key=projeto --output text', out: 'GROUPS\tprojeto$contadores-api\nMETRICS\tUnblendedCost\t1843.27\tUSD\nGROUPS\tprojeto$portal-clientes\nMETRICS\tUnblendedCost\t962.10\tUSD\nGROUPS\tprojeto$\nMETRICS\tUnblendedCost\t411.55\tUSD' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'O grupo sem nome',
          text: 'Aquele `projeto$` vazio são 411 USD em recursos sem tag. É por aí que começa qualquer limpeza de custos.',
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
        prompt: 'O `contadores-api` corre em duas VMs, ambas na mesma zona de disponibilidade. Um incidente elétrico deita abaixo esse centro de dados. O que acontece?',
        options: [
          'Nada, a cloud move as VMs automaticamente para outra região',
          'O serviço fica indisponível, porque não há redundância entre AZs',
          'Só metade dos pedidos falha',
          'O load balancer cria novas VMs noutra AZ sem configuração nenhuma',
        ],
        answer: 1,
        explanation: 'Duas VMs na mesma AZ partilham o mesmo ponto de falha. Para alta disponibilidade, distribui instâncias por pelo menos duas AZs.',
      },
      {
        kind: 'single',
        prompt: 'Qual é a diferença essencial entre uma subnet pública e uma privada?',
        options: [
          'A pública tem rota para um Internet Gateway; a privada não recebe tráfego direto da Internet',
          'A privada é cifrada e a pública não',
          'A pública é gratuita e a privada é paga',
          'A privada só funciona com IPv6',
        ],
        answer: 0,
        explanation: 'O que torna uma subnet "pública" é a rota para o Internet Gateway. Subnets privadas saem para a Internet via NAT, mas não aceitam ligações de entrada diretas.',
      },
      {
        kind: 'single',
        prompt: 'Numa base de dados gerida (ex.: RDS ou Azure Database for PostgreSQL), quem é responsável por definir quem consegue ligar-se a ela?',
        options: [
          'O fornecedor de cloud',
          'Ninguém, é automático',
          'O fabricante do PostgreSQL',
          'Tu, através de rede, security groups e utilizadores da base de dados',
        ],
        answer: 3,
        explanation: 'Mesmo em serviços geridos, a configuração de acesso (rede, firewall, credenciais, IAM) é sempre responsabilidade do cliente no modelo de responsabilidade partilhada.',
      },
      {
        kind: 'single',
        prompt: 'Esta política foi atribuída ao role da aplicação. Qual é o principal problema?',
        code: `{
  "Effect": "Allow",
  "Action": "s3:*",
  "Resource": "*"
}`,
        options: [
          'A sintaxe JSON está errada',
          'Falta a permissão para EC2',
          'Viola o privilégio mínimo: dá todas as ações S3 em todos os buckets',
          'Não tem problema, é a configuração recomendada',
        ],
        answer: 2,
        explanation: 'Wildcards em ação e recurso dão acesso a apagar ou ler qualquer bucket da conta. Restringe às ações e ao bucket de que a app realmente precisa.',
      },
      {
        kind: 'multi',
        prompt: 'A fatura cloud do mês subiu 40% sem explicação. Que medidas ajudam a perceber e controlar o custo? (escolhe todas as corretas)',
        options: [
          'Exigir tags de projeto e equipa em todos os recursos',
          'Configurar budgets com alertas',
          'Dar permissões de administrador a todos para corrigirem mais depressa',
          'Rever recursos subutilizados e ambientes de dev ligados 24/7',
        ],
        answers: [0, 1, 3],
        explanation: 'Tags dão visibilidade, budgets avisam cedo e rightsizing/desligar ambientes cortam desperdício. Mais permissões não resolvem custos e aumentam o risco.',
      },
      {
        kind: 'multi',
        prompt: 'Quais destes são exemplos de PaaS? (escolhe todas as corretas)',
        options: [
          'Azure App Service',
          'AWS EC2',
          'Amazon RDS',
          'Microsoft 365',
        ],
        answers: [0, 2],
        explanation: 'App Service e RDS gerem a plataforma por ti (SO, patches, motor). EC2 é IaaS (geres a VM) e Microsoft 365 é SaaS (aplicação pronta).',
      },
      {
        kind: 'order',
        prompt: 'Ordena o caminho de um pedido HTTPS de um cliente até à base de dados numa arquitetura típica de três camadas.',
        items: [
          'Cliente na Internet',
          'Load balancer na subnet pública',
          'Aplicação na subnet privada',
          'Base de dados na subnet privada',
        ],
        explanation: 'Só o load balancer está exposto. A aplicação e a base de dados vivem em subnets privadas, cada camada aceitando apenas tráfego da anterior.',
      },
      {
        kind: 'input',
        prompt: 'Que bloco CIDR, escrito em notação IPv4, representa "qualquer endereço" e nunca deve ser aberto na porta 22 de uma VM de produção?',
        accept: ['0.0.0.0/0'],
        placeholder: 'x.x.x.x/x',
        explanation: '`0.0.0.0/0` corresponde a toda a Internet IPv4. Para SSH, usa um bastion, SSM Session Manager ou restringe ao IP da VPN corporativa.',
      },
    ],
  },
};

export default skill;
