import type { Skill } from '../../types';

const skill: Skill = {
  id: 'ansible',
  title: 'Gestão de Configuração',
  subtitle: 'Servidores configurados como código',
  icon: 'ansible',
  tier: 2,
  x: 0.12,
  deps: ['scripting'],
  xp: 200,
  summary:
    'Aprende a configurar dezenas de servidores de forma repetível com Ansible: inventários, playbooks idempotentes, roles reutilizáveis e segredos protegidos com Vault.',
  topics: [
    'Inventário e comandos ad-hoc',
    'Playbooks, tasks e módulos',
    'Idempotência e handlers',
    'Variáveis e templates Jinja2',
    'Roles e estrutura de projeto',
    'Ansible Vault para segredos',
  ],
  lessons: [
    {
      id: 'inventario-ad-hoc',
      title: 'Inventário e comandos ad-hoc',
      minutes: 6,
      blocks: [
        {
          type: 'p',
          text: 'Imagina que a equipa tem 40 servidores a correr a `contadores-api` e precisa de atualizar um pacote em todos. Fazer SSH um a um é lento e propenso a erros. O **Ansible** resolve isto: descreves o estado desejado e ele aplica-o a todos os hosts.',
        },
        {
          type: 'compare',
          left: 'Configuração manual',
          right: 'Gestão de configuração',
          rows: [
            ['SSH servidor a servidor', 'Um comando para toda a frota'],
            ['Passos na cabeça de alguém', 'Estado desejado em ficheiros YAML'],
            ['Servidores divergem com o tempo', 'Configuração consistente e repetível'],
            ['Difícil de auditar', 'Versionado em Git, revisto em merge request'],
          ],
        },
        { type: 'h', text: 'Agentless por SSH' },
        {
          type: 'p',
          text: 'O Ansible é **agentless**: não precisas de instalar nada nos servidores geridos, basta SSH e Python. Tudo corre a partir de um *control node* (o teu portátil ou um runner de CI).',
        },
        {
          type: 'flow',
          steps: ['Control node', 'Lê inventário', 'Liga por SSH', 'Executa módulo', 'Reporta estado'],
          caption: 'O ciclo de execução do Ansible',
        },
        { type: 'h', text: 'O inventário' },
        {
          type: 'p',
          text: 'O **inventário** lista os hosts e organiza-os em grupos. Pode ser INI ou YAML; o formato YAML é o mais legível em projetos modernos.',
        },
        {
          type: 'code',
          lang: 'yaml',
          caption: 'inventory/producao.yml',
          code: `all:
  children:
    web:
      hosts:
        web01.eda.local:
        web02.eda.local:
    db:
      hosts:
        db01.eda.local:
          ansible_user: dbadmin
  vars:
    ansible_user: deploy
    ansible_python_interpreter: /usr/bin/python3`,
        },
        { type: 'h', text: 'Comandos ad-hoc' },
        {
          type: 'p',
          text: 'Para ações rápidas e pontuais usas comandos **ad-hoc** com `ansible <padrão> -m <módulo> -a <argumentos>`. São ótimos para diagnóstico, mas não substituem playbooks versionados.',
        },
        {
          type: 'terminal',
          lines: [
            {
              cmd: 'ansible web -i inventory/producao.yml -m ping',
              out: 'web01.eda.local | SUCCESS => {\n    "changed": false,\n    "ping": "pong"\n}\nweb02.eda.local | SUCCESS => {\n    "changed": false,\n    "ping": "pong"\n}',
            },
            {
              cmd: 'ansible all -i inventory/producao.yml -a "uptime"',
              out: 'web01.eda.local | CHANGED | rc=0 >>\n 10:42:13 up 31 days,  2:10,  0 users,  load average: 0.21, 0.18, 0.12\nweb02.eda.local | CHANGED | rc=0 >>\n 10:42:13 up 31 days,  2:09,  0 users,  load average: 0.35, 0.22, 0.15\ndb01.eda.local | CHANGED | rc=0 >>\n 10:42:14 up 12 days,  5:51,  0 users,  load average: 1.02, 0.97, 0.90',
            },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Antes de mexer em produção',
          text: 'Usa `--check` (dry run) e `--diff` para ver o que mudaria sem alterar nada. E `--limit web01.eda.local` para testar num só host.',
        },
        {
          type: 'quickcheck',
          question: 'O que precisa um servidor gerido para o Ansible o conseguir configurar?',
          options: [
            'Um agente Ansible instalado e a correr como serviço',
            'Acesso SSH e Python disponível',
            'Uma porta HTTP aberta para o control node',
            'Docker instalado',
          ],
          answer: 1,
          explanation: 'O Ansible é agentless: liga-se por SSH e executa módulos Python temporariamente no host gerido.',
        },
      ],
    },
    {
      id: 'playbooks-idempotencia',
      title: 'Playbooks, módulos e idempotência',
      minutes: 7,
      blocks: [
        {
          type: 'p',
          text: 'Um **playbook** é um ficheiro YAML com uma ou mais *plays*. Cada play aplica uma lista de **tasks** a um grupo de hosts, e cada task usa um **módulo** (`apt`, `copy`, `template`, `service`, `user`...).',
        },
        {
          type: 'code',
          lang: 'yaml',
          caption: 'site.yml — instala e configura o nginx para a contadores-api',
          code: `- name: Configurar servidores web
  hosts: web
  become: true
  tasks:
    - name: Instalar nginx
      ansible.builtin.apt:
        name: nginx
        state: present
        update_cache: true

    - name: Copiar configuração do site
      ansible.builtin.template:
        src: templates/contadores.conf.j2
        dest: /etc/nginx/sites-enabled/contadores.conf
        mode: '0644'
      notify: Recarregar nginx

    - name: Garantir nginx ativo no arranque
      ansible.builtin.service:
        name: nginx
        state: started
        enabled: true

  handlers:
    - name: Recarregar nginx
      ansible.builtin.service:
        name: nginx
        state: reloaded`,
        },
        { type: 'h', text: 'Idempotência: o superpoder' },
        {
          type: 'p',
          text: 'Um módulo **idempotente** descreve um estado (`state: present`), não uma ação. Correr o playbook uma ou dez vezes dá o mesmo resultado: na segunda execução, nada muda e o Ansible reporta `ok` em vez de `changed`.',
        },
        {
          type: 'terminal',
          lines: [
            {
              cmd: 'ansible-playbook -i inventory/producao.yml site.yml',
              out: 'PLAY [Configurar servidores web] ***********************************\n\nTASK [Instalar nginx] **********************************************\nchanged: [web01.eda.local]\nchanged: [web02.eda.local]\n\nTASK [Copiar configuração do site] *********************************\nchanged: [web01.eda.local]\nchanged: [web02.eda.local]\n\nRUNNING HANDLER [Recarregar nginx] *********************************\nchanged: [web01.eda.local]\nchanged: [web02.eda.local]\n\nPLAY RECAP *********************************************************\nweb01.eda.local : ok=4  changed=3  unreachable=0  failed=0\nweb02.eda.local : ok=4  changed=3  unreachable=0  failed=0',
            },
            {
              cmd: 'ansible-playbook -i inventory/producao.yml site.yml',
              out: 'PLAY RECAP *********************************************************\nweb01.eda.local : ok=4  changed=0  unreachable=0  failed=0\nweb02.eda.local : ok=4  changed=0  unreachable=0  failed=0',
            },
          ],
        },
        {
          type: 'compare',
          left: 'Não idempotente',
          right: 'Idempotente',
          rows: [
            ['`shell: echo "x" >> /etc/hosts`', '`lineinfile:` com `line: x`'],
            ['`command: useradd joana`', '`user: name=joana state=present`'],
            ['`shell: systemctl restart nginx` sempre', 'Handler só quando a config muda'],
            ['Duplica linhas a cada execução', 'Converge para o estado desejado'],
          ],
        },
        {
          type: 'callout',
          variant: 'warn',
          title: 'Cuidado com shell e command',
          text: 'Os módulos `shell` e `command` correm sempre e reportam `changed`. Prefere um módulo dedicado; se não houver, usa `creates:`, `removes:` ou `changed_when:` para manter a idempotência.',
        },
        {
          type: 'p',
          text: 'Os **handlers** só correm quando uma task os notifica *e* essa task reportou `changed`. Assim o nginx só é recarregado quando a configuração mudou de facto.',
        },
        {
          type: 'quickcheck',
          question: 'Corres o mesmo playbook duas vezes seguidas sem alterações. O que esperas ver no PLAY RECAP da segunda vez?',
          options: [
            'failed=1, porque o nginx já está instalado',
            'changed igual ao da primeira execução',
            'changed=0, porque o estado já é o desejado',
            'unreachable=1, porque o host já foi configurado',
          ],
          answer: 2,
          explanation: 'Com módulos idempotentes, a segunda execução encontra tudo no estado desejado e não altera nada: changed=0.',
        },
      ],
    },
    {
      id: 'roles-variaveis-vault',
      title: 'Roles, templates e Vault',
      minutes: 8,
      blocks: [
        {
          type: 'p',
          text: 'Quando o playbook cresce, organizas o código em **roles**: pacotes reutilizáveis com tasks, handlers, templates e variáveis por defeito. Uma role `nginx` pode servir a `contadores-api` e o portal de clientes.',
        },
        {
          type: 'code',
          lang: 'text',
          caption: 'Estrutura gerada por ansible-galaxy init roles/nginx',
          code: `roles/nginx/
├── defaults/main.yml    # variáveis por defeito (prioridade mais baixa)
├── vars/main.yml        # variáveis internas da role
├── tasks/main.yml       # tasks principais
├── handlers/main.yml    # handlers
├── templates/           # ficheiros Jinja2 (.j2)
├── files/               # ficheiros estáticos
└── meta/main.yml        # dependências e metadados`,
        },
        { type: 'h', text: 'Variáveis e templates Jinja2' },
        {
          type: 'p',
          text: 'As variáveis podem vir de `defaults/`, `group_vars/`, `host_vars/`, do playbook ou da linha de comandos (`-e`). Os **templates Jinja2** usam-nas para gerar ficheiros diferentes por ambiente.',
        },
        {
          type: 'code',
          lang: 'jinja',
          caption: 'roles/nginx/templates/contadores.conf.j2',
          code: `upstream contadores_api {
{% for host in groups['app'] %}
    server {{ host }}:{{ app_port | default(8080) }};
{% endfor %}
}

server {
    listen 80;
    server_name {{ server_name }};

    location / {
        proxy_pass http://contadores_api;
    }
}`,
        },
        {
          type: 'list',
          items: [
            '`group_vars/web.yml` aplica-se a todos os hosts do grupo `web`.',
            '`host_vars/web01.eda.local.yml` sobrepõe-se para um host específico.',
            '`-e "app_port=9090"` (extra vars) tem a prioridade mais alta de todas.',
            '`defaults/main.yml` da role tem a prioridade mais baixa: é fácil de sobrepor.',
          ],
        },
        { type: 'h', text: 'Ansible Vault para segredos' },
        {
          type: 'p',
          text: 'Passwords de base de dados e tokens nunca vão em claro para o Git. O **Ansible Vault** cifra ficheiros (AES-256) e o Ansible decifra-os em memória durante a execução.',
        },
        {
          type: 'terminal',
          lines: [
            { cmd: 'ansible-vault create group_vars/db/vault.yml', out: 'New Vault password: \nConfirm New Vault password: ' },
            {
              cmd: 'head -2 group_vars/db/vault.yml',
              out: '$ANSIBLE_VAULT;1.1;AES256\n36383962613964316231356534646330623537386536626338653564356536373763',
            },
            {
              cmd: 'ansible-playbook -i inventory/producao.yml site.yml --ask-vault-pass',
              out: 'Vault password: \n\nPLAY [Configurar base de dados] ************************************\n...',
            },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Convenção vault_',
          text: 'Guarda os segredos como `vault_db_password` no ficheiro cifrado e referencia-os em `vars.yml` com `db_password: "{{ vault_db_password }}"`. Assim consegues pesquisar que variáveis existem sem decifrar nada.',
        },
        {
          type: 'flow',
          steps: ['Escreve role', 'Testa com Molecule', 'ansible-lint', 'Merge request', 'Aplica via CI'],
          caption: 'Fluxo de trabalho moderno com Ansible',
        },
        {
          type: 'quickcheck',
          question: 'Definiste `app_port: 8080` em `defaults/main.yml` da role e `app_port: 9000` em `group_vars/web.yml`. Que valor é usado nos hosts do grupo web?',
          options: [
            '8080, porque a role tem sempre prioridade',
            'Dá erro por variável duplicada',
            'Depende da ordem alfabética dos ficheiros',
            '9000, porque group_vars sobrepõe os defaults da role',
          ],
          answer: 3,
          explanation: 'Os `defaults` de uma role têm a prioridade mais baixa precisamente para serem facilmente sobrepostos por group_vars, host_vars ou extra vars.',
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
        prompt: 'Uma task usa `command: useradd deploy`. Na segunda execução do playbook falha porque o utilizador já existe. Qual é a melhor correção?',
        options: [
          'Adicionar `ignore_errors: true` à task',
          'Substituir pelo módulo `ansible.builtin.user` com `state: present`',
          'Correr o playbook só uma vez',
          'Trocar `command` por `shell`',
        ],
        answer: 1,
        explanation: 'O módulo `user` é idempotente: cria o utilizador se não existir e não faz nada se já existir. Ignorar erros só esconde o problema.',
      },
      {
        kind: 'single',
        prompt: 'Alteras um template de configuração do nginx com `notify: Recarregar nginx`. Em que situação o handler corre?',
        options: [
          'Sempre que o playbook corre',
          'Apenas no primeiro host do grupo',
          'Quando a task do template reporta `changed`, no final da play',
          'Apenas se correres com `--check`',
        ],
        answer: 2,
        explanation: 'Os handlers só são executados quando notificados por uma task que mudou algo, e por defeito correm no fim da play.',
      },
      {
        kind: 'single',
        prompt: 'Qual destes ficheiros é seguro fazer commit no repositório Git do projeto Ansible?',
        options: [
          'Um `group_vars/db/vault.yml` cifrado com `ansible-vault`',
          'Um `.vault_pass` com a password do Vault',
          'Um `group_vars/db/vars.yml` com `db_password: Sup3rS3cret`',
          'Uma chave SSH privada do utilizador `deploy`',
        ],
        answer: 0,
        explanation: 'Ficheiros cifrados pelo Vault podem ir para o Git. A password do Vault, segredos em claro e chaves privadas nunca devem ser versionados.',
      },
      {
        kind: 'single',
        prompt: 'Queres ver que alterações um playbook faria em produção sem alterar nada. Que opções usas?',
        options: [
          '`--limit all`',
          '`--syntax-check`',
          '`-vvv`',
          '`--check --diff`',
        ],
        answer: 3,
        explanation: '`--check` faz um dry run e `--diff` mostra as diferenças nos ficheiros. `--syntax-check` só valida a sintaxe YAML.',
      },
      {
        kind: 'multi',
        prompt: 'Quais destas afirmações sobre o Ansible são verdadeiras? (escolhe todas as corretas)',
        options: [
          'É agentless e comunica com os hosts por SSH',
          'Os módulos `shell` e `command` são idempotentes por natureza',
          'Roles permitem reutilizar tasks, templates e handlers entre projetos',
          'Os templates usam a linguagem Jinja2',
          'O inventário só pode estar em formato INI',
        ],
        answers: [0, 2, 3],
        explanation: 'O Ansible é agentless, organiza código em roles e usa Jinja2. `shell`/`command` não são idempotentes e o inventário também pode ser YAML ou dinâmico.',
      },
      {
        kind: 'order',
        prompt: 'Ordena as variáveis da prioridade MAIS BAIXA para a MAIS ALTA.',
        items: [
          'defaults/main.yml da role',
          'group_vars do grupo',
          'host_vars do host',
          'extra vars (-e na linha de comandos)',
        ],
        explanation: 'Os defaults da role são os mais fracos, depois group_vars, host_vars e, no topo, as extra vars passadas com `-e`.',
      },
      {
        kind: 'input',
        prompt: 'Que comando ad-hoc usas para testar a ligação a todos os hosts do grupo `web` (inventário por defeito)?',
        placeholder: 'ansible ...',
        accept: ['ansible web -m ping', 'ansible web -m ansible.builtin.ping', 'ansible -m ping web'],
        explanation: '`ansible web -m ping` corre o módulo ping em todos os hosts do grupo web e confirma SSH + Python funcionais.',
      },
      {
        kind: 'single',
        prompt: 'O que acontece quando corres este playbook pela terceira vez?',
        code: `- hosts: web
  tasks:
    - ansible.builtin.lineinfile:
        path: /etc/hosts
        line: "10.0.0.20 contadores-api.interno"`,
        options: [
          'A linha é adicionada pela terceira vez',
          'O ficheiro /etc/hosts é reescrito do zero',
          'Nada muda: a linha já existe e a task reporta ok',
          'Falha porque a linha é duplicada',
        ],
        answer: 2,
        explanation: '`lineinfile` garante que a linha existe; se já estiver presente, não faz nada. É o oposto de `echo >>`.',
      },
    ],
  },
};

export default skill;
