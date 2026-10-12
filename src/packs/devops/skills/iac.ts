import type { Skill } from '../../types';

const skill: Skill = {
  id: 'iac',
  title: 'Infrastructure as Code',
  subtitle: 'Infraestrutura versionada e reprodutível',
  icon: 'iac',
  tier: 3,
  x: 0.92,
  deps: ['cloud', 'ansible'],
  xp: 300,
  summary:
    'Aprende a descrever redes, máquinas e serviços cloud em código com Terraform/OpenTofu, para criares ambientes idênticos, revistos em merge request e sem cliques manuais na consola.',
  topics: [
    'Declarativo vs imperativo',
    'Providers, resources, variables e outputs',
    'State remoto e locking',
    'Workflow plan / apply',
    'Módulos reutilizáveis',
    'Deteção e correção de drift',
  ],
  lessons: [
    {
      id: 'porque-iac',
      title: 'Porquê Infrastructure as Code?',
      minutes: 5,
      blocks: [
        { type: 'h', text: 'Do clique na consola ao código revisto' },
        {
          type: 'p',
          text: 'Imagina que a equipa precisa de recriar o ambiente de staging da `contadores-api` depois de um erro humano. Se tudo foi feito à mão na consola cloud, ninguém sabe exatamente que regras de firewall, tamanhos de máquina ou tags existiam.',
        },
        {
          type: 'p',
          text: 'Com **Infrastructure as Code (IaC)** a infraestrutura vive num repositório Git: é versionada, revista em merge request e aplicada de forma automática e repetível.',
        },
        {
          type: 'compare',
          left: 'Imperativo (como fazer)',
          right: 'Declarativo (o que quero)',
          rows: [
            ['Sequência de passos: "cria VM, depois abre porta 443"', 'Estado final: "quero 1 VM com a porta 443 aberta"'],
            ['Correr duas vezes pode duplicar recursos', 'Idempotente: correr de novo não muda nada'],
            ['Scripts Bash, CLI da cloud', 'Terraform/OpenTofu, CloudFormation, Pulumi (híbrido)'],
            ['Tu calculas as diferenças', 'A ferramenta calcula o diff e aplica só o necessário'],
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          title: 'Terraform vs OpenTofu',
          text: 'Em 2023 a HashiCorp mudou a licença do Terraform para BSL. A comunidade criou o **OpenTofu** (Linux Foundation), um fork open source compatível. Os comandos são quase iguais: `terraform plan` passa a `tofu plan`.',
        },
        {
          type: 'p',
          text: 'E o Ansible? O Ansible brilha a **configurar** máquinas que já existem (pacotes, ficheiros, serviços). O Terraform brilha a **provisionar** recursos cloud (redes, VMs, bases de dados, DNS). Muitas equipas usam ambos.',
        },
        {
          type: 'list',
          items: [
            '**Reprodutibilidade**: dev, staging e produção nascem do mesmo código.',
            '**Auditoria**: o histórico Git diz quem mudou o quê e porquê.',
            '**Revisão**: alterações de rede passam por merge request como qualquer código.',
            '**Recuperação**: em caso de desastre, recrias tudo com um `apply`.',
          ],
        },
        {
          type: 'quickcheck',
          question: 'Corres `tofu apply` duas vezes seguidas sem mudar o código. O que acontece na segunda vez?',
          options: [
            'São criados recursos duplicados',
            'Nada muda: a infraestrutura já corresponde ao estado desejado',
            'Os recursos são destruídos e recriados',
            'O comando falha porque os recursos já existem',
          ],
          answer: 1,
          explanation: 'Ferramentas declarativas são idempotentes: comparam o desejado com o real e, sem diferenças, não fazem alterações ("No changes").',
        },
        {
          type: 'flow',
          steps: ['Escrever .tf', 'Merge request', 'plan revisto', 'apply', 'Infra real'],
          caption: 'O ciclo de vida típico de uma alteração de infraestrutura.',
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Regra de ouro: se mudaste algo na consola "só para testar", passa-o para código ou apaga-o. Alterações manuais são a origem do *drift*.',
        },
      ],
    },
    {
      id: 'terraform-basico',
      title: 'Terraform/OpenTofu: providers, resources e o ciclo plan/apply',
      minutes: 7,
      blocks: [
        { type: 'h', text: 'Os blocos de construção' },
        {
          type: 'list',
          items: [
            '**provider**: plugin que fala com uma API (AWS, Azure, GCP, Kubernetes, Cloudflare...).',
            '**resource**: algo que a ferramenta cria e gere (uma VM, um bucket, um registo DNS).',
            '**data**: lê algo que já existe, sem o gerir (ex.: a imagem mais recente de Ubuntu).',
            '**variable**: input parametrizável; **output**: valor exportado depois do apply.',
          ],
        },
        {
          type: 'code',
          lang: 'hcl',
          caption: 'main.tf — bucket para os exports da contadores-api',
          code: `terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region
}

variable "region" {
  type    = string
  default = "eu-west-1"
}

variable "ambiente" {
  type = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.ambiente)
    error_message = "ambiente tem de ser dev, staging ou prod."
  }
}

resource "aws_s3_bucket" "exports" {
  bucket = "eda-contadores-exports-\${var.ambiente}"
  tags = {
    app      = "contadores-api"
    ambiente = var.ambiente
  }
}

output "bucket_arn" {
  value = aws_s3_bucket.exports.arn
}`,
        },
        {
          type: 'p',
          text: 'Repara que a versão do provider está fixada com `~> 5.0`. O ficheiro `.terraform.lock.hcl` regista as versões exatas e **deve ir para o Git**, para que toda a equipa e a pipeline usem os mesmos binários.',
        },
        { type: 'h', text: 'O workflow' },
        {
          type: 'flow',
          steps: ['init', 'fmt / validate', 'plan', 'apply'],
          caption: 'init descarrega providers e configura o backend; plan mostra o diff; apply executa-o.',
        },
        {
          type: 'terminal',
          lines: [
            {
              cmd: 'tofu init',
              out: 'Initializing the backend...\nInitializing provider plugins...\n- Installing hashicorp/aws v5.72.1...\n\nOpenTofu has been successfully initialized!',
            },
            {
              cmd: 'tofu plan -var ambiente=staging -out=tfplan',
              out: 'OpenTofu will perform the following actions:\n\n  # aws_s3_bucket.exports will be created\n  + resource "aws_s3_bucket" "exports" {\n      + bucket = "eda-contadores-exports-staging"\n      + arn    = (known after apply)\n    }\n\nPlan: 1 to add, 0 to change, 0 to destroy.\n\nSaved the plan to: tfplan',
            },
            {
              cmd: 'tofu apply tfplan',
              out: 'aws_s3_bucket.exports: Creating...\naws_s3_bucket.exports: Creation complete after 2s\n\nApply complete! Resources: 1 added, 0 changed, 0 destroyed.\n\nOutputs:\n\nbucket_arn = "arn:aws:s3:::eda-contadores-exports-staging"',
            },
          ],
        },
        {
          type: 'callout',
          variant: 'warn',
          title: 'Lê sempre o plan',
          text: 'Os símbolos importam: `+` cria, `~` altera no sítio, `-` destrói e `-/+` **destrói e recria**. Um `-/+` numa base de dados de produção merece uma pausa e uma segunda opinião.',
        },
        {
          type: 'p',
          text: 'Guardar o plano com `-out=tfplan` e aplicar exatamente esse ficheiro garante que o que foi revisto é o que é aplicado, mesmo que alguém faça merge de outra alteração entretanto.',
        },
        {
          type: 'quickcheck',
          question: 'No output do plan aparece `-/+ resource "aws_db_instance" "main"`. O que significa?',
          options: [
            'A base de dados vai ser atualizada sem downtime',
            'A base de dados vai ser lida mas não alterada',
            'A base de dados vai ser destruída e criada de novo',
            'O recurso vai deixar de ser gerido pelo Terraform',
          ],
          answer: 2,
          explanation: '`-/+` indica substituição: um atributo que não pode ser mudado no sítio obriga a destruir e recriar. Numa base de dados isso pode significar perda de dados.',
        },
      ],
    },
    {
      id: 'state-modulos-drift',
      title: 'State remoto, módulos e drift',
      minutes: 8,
      blocks: [
        { type: 'h', text: 'O state: a memória da ferramenta' },
        {
          type: 'p',
          text: 'O ficheiro de **state** mapeia cada recurso do código ao objeto real na cloud (IDs, atributos). Sem ele, o Terraform não sabe o que já criou.',
        },
        {
          type: 'callout',
          variant: 'warn',
          text: 'Nunca faças commit do `terraform.tfstate` no Git: contém frequentemente **segredos em texto simples** (passwords de BD, chaves) e gera conflitos quando duas pessoas trabalham em paralelo.',
        },
        {
          type: 'code',
          lang: 'hcl',
          caption: 'backend.tf — state remoto em S3 com locking',
          code: `terraform {
  backend "s3" {
    bucket       = "eda-tfstate"
    key          = "contadores-api/staging.tfstate"
    region       = "eu-west-1"
    encrypt      = true
    use_lockfile = true   # lock nativo em S3 (antes usava-se DynamoDB)
  }
}`,
        },
        {
          type: 'p',
          text: 'O **locking** impede que duas execuções de `apply` corram em simultâneo sobre o mesmo state. Se a pipeline e um colega tentarem aplicar ao mesmo tempo, o segundo recebe `Error acquiring the state lock` e espera.',
        },
        { type: 'h', text: 'Módulos: não te repitas' },
        {
          type: 'p',
          text: 'Um **módulo** é uma pasta de ficheiros `.tf` com inputs e outputs. Em vez de copiar 200 linhas de rede para cada ambiente, chamas o mesmo módulo com parâmetros diferentes.',
        },
        {
          type: 'code',
          lang: 'hcl',
          caption: 'envs/prod/main.tf',
          code: `module "rede" {
  source  = "git::https://gitlab.eda.pt/plataforma/tf-modules.git//vpc?ref=v2.3.0"
  nome    = "contadores-prod"
  cidr    = "10.20.0.0/16"
  az_count = 3
}

module "api" {
  source     = "../../modules/servico-web"
  nome       = "contadores-api"
  subnet_ids = module.rede.private_subnet_ids
  replicas   = 4
}`,
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Fixa sempre a versão de módulos remotos (`?ref=v2.3.0`). Um módulo a apontar para `main` pode mudar a tua produção sem que ninguém tenha tocado no teu repositório.',
        },
        { type: 'h', text: 'Drift: quando a realidade foge do código' },
        {
          type: 'p',
          text: '**Drift** acontece quando alguém altera a infraestrutura por fora (consola, CLI, outro script). O próximo `plan` mostra a diferença e um `apply` reverte-a para o que está no código.',
        },
        {
          type: 'terminal',
          lines: [
            {
              cmd: 'tofu plan -refresh-only',
              out: 'Note: Objects have changed outside of OpenTofu\n\n  # aws_security_group.api has changed\n  ~ resource "aws_security_group" "api" {\n      ~ ingress = [\n          + { from_port = 22, to_port = 22, cidr_blocks = ["0.0.0.0/0"] },\n        ]\n    }',
            },
          ],
        },
        {
          type: 'list',
          items: [
            'Corre um `plan` agendado (ex.: todas as noites) na pipeline e alerta se houver diferenças.',
            'Restringe permissões de escrita na consola de produção.',
            'Se a alteração manual era legítima, passa-a para código; se não, faz `apply` para a reverter.',
            'Para trazer recursos criados à mão para o state, usa blocos `import`.',
          ],
        },
        {
          type: 'quickcheck',
          question: 'Um colega abriu a porta 22 para 0.0.0.0/0 diretamente na consola. Qual é a melhor resposta?',
          options: [
            'Apagar o ficheiro de state para forçar uma recriação',
            'Editar o ficheiro de state à mão para refletir a mudança',
            'Ignorar: o Terraform só gere o que criou',
            'Detetar com `plan`, discutir e aplicar o código para reverter a regra insegura',
          ],
          answer: 3,
          explanation: 'O plan deteta o drift; como a regra é insegura e não está no código, um apply repõe o estado desejado. Mexer no state à mão ou apagá-lo cria problemas muito maiores.',
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
        prompt: 'Qual é a principal diferença entre uma abordagem declarativa e uma imperativa de IaC?',
        options: [
          'Na declarativa descreves o estado final e a ferramenta calcula os passos',
          'A declarativa só funciona em AWS',
          'A imperativa é sempre idempotente',
          'A declarativa não precisa de state',
        ],
        answer: 0,
        explanation: 'Declarativo = "o quê". A ferramenta compara com a realidade e determina as ações necessárias, o que a torna idempotente.',
      },
      {
        kind: 'single',
        prompt: 'A pipeline falha com `Error acquiring the state lock`. Qual é a causa mais provável?',
        options: [
          'O provider AWS não foi instalado',
          'Outra execução (ou uma que terminou abruptamente) tem o lock do mesmo state',
          'O ficheiro .terraform.lock.hcl está corrompido',
          'Há um erro de sintaxe no main.tf',
        ],
        answer: 1,
        explanation: 'O lock protege o state de escritas concorrentes. Confirma que nenhuma execução está ativa antes de pensar em `force-unlock`.',
      },
      {
        kind: 'multi',
        prompt: 'Porque é que o `terraform.tfstate` não deve ir para o repositório Git? (escolhe todas as corretas)',
        options: [
          'Pode conter segredos em texto simples',
          'O Git não oferece locking, por isso execuções paralelas geram conflitos',
          'É um ficheiro binário que o Git não suporta',
          'É apagado e recriado automaticamente a cada plan',
        ],
        answers: [0, 1],
        explanation: 'O state guarda atributos sensíveis em claro e o Git não oferece locking. Usa um backend remoto encriptado com lock. É JSON e persiste entre execuções.',
      },
      {
        kind: 'single',
        prompt: 'Um módulo de rede partilhado é referenciado com `?ref=main`. Que risco existe?',
        options: [
          'Nenhum, `main` é sempre estável',
          'O módulo deixa de poder receber variáveis',
          'O plan torna-se mais lento',
          'Alterações ao módulo chegam à tua infraestrutura sem revisão do teu lado',
        ],
        answer: 3,
        explanation: 'Fixar uma tag (ex.: `v2.3.0`) torna os upgrades explícitos e revistos. Apontar para um branch é um alvo móvel.',
      },
      {
        kind: 'multi',
        prompt: 'Quais destas práticas ajudam a controlar o drift? (escolhe todas as corretas)',
        options: [
          'Correr `plan` agendado e alertar se houver diferenças',
          'Dar acesso de escrita à consola de produção a toda a equipa',
          'Passar para código alterações manuais legítimas',
          'Apagar o state sempre que há diferenças',
          'Restringir alterações manuais em produção',
        ],
        answers: [0, 2, 4],
        explanation: 'Deteção contínua, codificar o que é legítimo e limitar acessos manuais. Apagar o state faz a ferramenta "esquecer" recursos que continuam a existir.',
      },
      {
        kind: 'order',
        prompt: 'Ordena o workflow típico de uma alteração com OpenTofu numa pipeline:',
        items: ['tofu init', 'tofu validate', 'tofu plan -out=tfplan', 'Revisão do plan no merge request', 'tofu apply tfplan'],
        explanation: 'Primeiro inicializa backend e providers, valida, gera um plano guardado, revê-o e aplica exatamente esse plano.',
      },
      {
        kind: 'input',
        prompt: 'Que comando OpenTofu mostra as alterações que seriam feitas, sem as aplicar?',
        accept: ['tofu plan', 'terraform plan'],
        placeholder: 'tofu ...',
        explanation: '`tofu plan` (ou `terraform plan`) calcula o diff entre código, state e realidade sem alterar nada.',
      },
      {
        kind: 'single',
        prompt: 'O que faz este bloco?',
        code: `data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-noble-24.04-amd64-*"]
  }
}`,
        options: [
          'Cria uma nova imagem Ubuntu na conta AWS',
          'Lê a imagem Ubuntu 24.04 mais recente sem a gerir',
          'Apaga imagens Ubuntu antigas',
          'Define uma variável de input com o nome da imagem',
        ],
        answer: 1,
        explanation: 'Blocos `data` consultam recursos existentes. O resultado pode depois ser usado, por exemplo, em `ami = data.aws_ami.ubuntu.id`.',
      },
    ],
  },
};

export default skill;
