import type { Skill } from '../../types';

const skill: Skill = {
  id: 'linux',
  title: 'Linux & Terminal',
  subtitle: 'O teu novo melhor amigo',
  icon: 'terminal',
  tier: 0,
  x: 0.18,
  deps: [],
  xp: 100,
  summary:
    'Domina o terminal Linux: navegar no sistema de ficheiros, gerir permissões, processos e pacotes, e ligar-te a servidores remotos com confiança.',
  topics: [
    'Sistema de ficheiros e navegação',
    'Permissões, utilizadores e sudo',
    'Processos, serviços e systemd',
    'Gestão de pacotes (apt/dnf)',
    'Pipes, redirecionamento e grep',
    'SSH e chaves',
  ],
  lessons: [
    {
      id: 'filesystem-navegacao',
      title: 'Sistema de ficheiros e navegação',
      minutes: 6,
      blocks: [
        { type: 'h', text: 'Tudo começa na raiz: /' },
        {
          type: 'p',
          text: 'Em Linux não há `C:` nem `D:`. Existe uma única árvore que começa em `/`, e todos os discos, partições e até dispositivos aparecem algures dentro dela.',
        },
        {
          type: 'compare',
          left: 'Diretório',
          right: 'Para que serve',
          rows: [
            ['/etc', 'Configuração do sistema e dos serviços (ex.: `/etc/nginx/`)'],
            ['/var/log', 'Registos (logs) de sistema e aplicações'],
            ['/home/<utilizador>', 'Área pessoal de cada utilizador (`~`)'],
            ['/opt e /srv', 'Software instalado à parte e dados servidos'],
            ['/tmp', 'Ficheiros temporários, limpos no arranque'],
          ],
        },
        {
          type: 'p',
          text: 'Para te orientares precisas de três comandos: `pwd` (onde estou?), `ls` (o que há aqui?) e `cd` (vai para ali).',
        },
        {
          type: 'terminal',
          lines: [
            { cmd: 'pwd', out: '/home/joana' },
            { cmd: 'cd /var/log/contadores-api', out: '' },
            {
              cmd: 'ls -lh',
              out: 'total 4.2M\n-rw-r----- 1 contadores adm 3.9M Oct 12 09:41 app.log\n-rw-r----- 1 contadores adm 312K Oct 11 23:59 app.log.1.gz\ndrwxr-x--- 2 contadores adm 4.0K Oct 10 08:00 archive',
            },
            { cmd: 'cd -', out: '/home/joana' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Atalhos que poupam horas',
          text: '`Tab` completa nomes de ficheiros, `Ctrl+R` pesquisa no histórico de comandos e `cd -` volta ao diretório anterior. Usa-os desde o primeiro dia.',
        },
        { type: 'h', text: 'Ler e manipular ficheiros' },
        {
          type: 'list',
          items: [
            '`cat ficheiro` mostra tudo; `less ficheiro` permite navegar (sai com `q`).',
            '`head -n 20` e `tail -n 20` mostram o início e o fim; `tail -f` segue um log em tempo real.',
            '`cp`, `mv` e `rm` copiam, movem/renomeiam e apagam; `mkdir -p a/b/c` cria a árvore toda.',
            '`find /etc -name "*.conf"` procura ficheiros pelo nome.',
          ],
        },
        {
          type: 'callout',
          variant: 'warn',
          title: 'Não há caixote do lixo',
          text: '`rm -rf` apaga de imediato e sem confirmação. Antes de o correr, confirma o caminho com `ls` e nunca uses variáveis que possam estar vazias (ex.: `rm -rf $DIR/`).',
        },
        {
          type: 'p',
          text: 'Caminhos **absolutos** começam em `/` (ex.: `/etc/hosts`). Caminhos **relativos** partem do diretório atual: `..` é o diretório pai e `.` é o próprio.',
        },
        {
          type: 'quickcheck',
          question: 'Estás em `/var/log/contadores-api`. Para onde te leva `cd ../nginx`?',
          options: ['/nginx', '/var/log/contadores-api/nginx', '/var/log/nginx', '/home/nginx'],
          answer: 2,
          explanation: '`..` sobe um nível (para `/var/log`) e depois entra em `nginx`, ficando em `/var/log/nginx`.',
        },
      ],
    },
    {
      id: 'permissoes-processos',
      title: 'Permissões, processos e pacotes',
      minutes: 7,
      blocks: [
        { type: 'h', text: 'Quem pode fazer o quê' },
        {
          type: 'p',
          text: 'Cada ficheiro tem um **dono**, um **grupo** e permissões para três classes: dono (u), grupo (g) e outros (o). Cada classe pode ter leitura (r), escrita (w) e execução (x).',
        },
        {
          type: 'code',
          lang: 'text',
          code: `-rwxr-x--- 1 deploy contadores 2.1K Oct 12 deploy.sh
│└┬┘└┬┘└┬┘   └─┬──┘ └───┬────┘
│ u  g  o      dono      grupo
└ tipo (- ficheiro, d diretório, l link)`,
          caption: 'Como ler a saída de `ls -l`',
        },
        {
          type: 'p',
          text: 'Na notação octal, r=4, w=2 e x=1, somados por classe. Assim `750` significa rwx para o dono, r-x para o grupo e nada para os outros.',
        },
        {
          type: 'terminal',
          lines: [
            { cmd: 'chmod 750 deploy.sh', out: '' },
            { cmd: 'sudo chown deploy:contadores deploy.sh', out: '' },
            { cmd: 'chmod u+x,o-r backup.sh', out: '' },
            { cmd: 'id', out: 'uid=1001(joana) gid=1001(joana) groups=1001(joana),27(sudo),998(docker)' },
          ],
        },
        {
          type: 'callout',
          variant: 'warn',
          title: 'chmod 777 não é solução',
          text: 'Dar permissões a todos "para funcionar" abre uma porta a qualquer processo comprometido. Ajusta o dono/grupo certo e dá o mínimo necessário.',
        },
        {
          type: 'quickcheck',
          question: 'Um ficheiro de configuração com segredos deve ser lido só pelo dono. Que modo usas?',
          options: ['644', '600', '755', '777'],
          answer: 1,
          explanation: '`600` dá leitura e escrita ao dono (4+2) e nada ao grupo nem aos outros. `644` deixava qualquer utilizador ler os segredos.',
        },
        { type: 'h', text: 'Processos e serviços' },
        {
          type: 'p',
          text: 'Cada programa em execução é um processo com um **PID**. Em servidores modernos, os serviços de longa duração são geridos pelo **systemd** através do `systemctl`.',
        },
        {
          type: 'terminal',
          lines: [
            {
              cmd: 'ps aux | grep contadores',
              out: 'contad+  2314  3.1  4.2 812340 171220 ?  Ssl  08:00  12:04 /opt/contadores-api/bin/server\njoana    9921  0.0  0.0   6432   2240 pts/0 S+  09:45   0:00 grep contadores',
            },
            {
              cmd: 'systemctl status contadores-api',
              out: '● contadores-api.service - API de leitura de contadores\n     Loaded: loaded (/etc/systemd/system/contadores-api.service; enabled)\n     Active: active (running) since Sun 2026-10-12 08:00:03 WEST; 1h 45min ago\n   Main PID: 2314 (server)',
            },
            { cmd: 'sudo systemctl restart contadores-api', out: '' },
            {
              cmd: 'journalctl -u contadores-api --since "10 min ago"',
              out: 'Oct 12 09:46:10 srv-eda01 server[10233]: listening on :8080\nOct 12 09:46:10 srv-eda01 server[10233]: connected to postgres',
            },
          ],
        },
        {
          type: 'list',
          items: [
            '`top` ou `htop`: CPU e memória em tempo real.',
            '`kill PID` envia SIGTERM (pede para terminar); `kill -9 PID` (SIGKILL) só em último recurso.',
            '`df -h` mostra espaço em disco; `du -sh *` mostra o que ocupa espaço no diretório.',
          ],
        },
        { type: 'h', text: 'Instalar software' },
        {
          type: 'compare',
          left: 'Debian / Ubuntu (apt)',
          right: 'RHEL / Fedora (dnf)',
          rows: [
            ['sudo apt update', 'sudo dnf check-update'],
            ['sudo apt install nginx', 'sudo dnf install nginx'],
            ['sudo apt upgrade', 'sudo dnf upgrade'],
            ['apt search jq', 'dnf search jq'],
          ],
        },
      ],
    },
    {
      id: 'pipes-ssh',
      title: 'Pipes, redirecionamento e SSH',
      minutes: 7,
      blocks: [
        { type: 'h', text: 'Pequenas ferramentas, grandes combinações' },
        {
          type: 'p',
          text: 'A filosofia Unix é ter ferramentas que fazem uma coisa bem e combiná-las. O **pipe** `|` envia a saída de um comando para a entrada do seguinte.',
        },
        {
          type: 'flow',
          steps: ['cat app.log', 'grep ERROR', 'cut campo', 'sort | uniq -c', 'sort -rn'],
          caption: 'Um pipeline que conta os erros mais frequentes',
        },
        {
          type: 'terminal',
          lines: [
            {
              cmd: "grep ERROR app.log | awk '{print $5}' | sort | uniq -c | sort -rn | head -3",
              out: '    412 DbTimeout\n     87 InvalidMeterId\n     12 UpstreamUnavailable',
            },
          ],
        },
        { type: 'h', text: 'Redirecionamento' },
        {
          type: 'compare',
          left: 'Operador',
          right: 'Efeito',
          rows: [
            ['cmd > f', 'Escreve stdout em f (substitui o conteúdo)'],
            ['cmd >> f', 'Acrescenta stdout ao fim de f'],
            ['cmd 2> f', 'Envia stderr (erros) para f'],
            ['cmd > f 2>&1', 'Envia stdout e stderr para f'],
            ['cmd < f', 'Usa f como stdin'],
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          title: 'stdout vs stderr',
          text: 'Cada processo tem três canais: stdin (0), stdout (1) e stderr (2). Separar erros da saída normal permite, por exemplo, guardar resultados e ver os erros no ecrã.',
        },
        {
          type: 'quickcheck',
          question: 'Queres guardar toda a saída de um backup, incluindo erros, no fim de `backup.log` sem apagar o que já lá está. Qual escolhes?',
          options: [
            './backup.sh > backup.log',
            './backup.sh 2> backup.log',
            './backup.sh | backup.log',
            './backup.sh >> backup.log 2>&1',
          ],
          answer: 3,
          explanation: '`>>` acrescenta em vez de substituir e `2>&1` redireciona o stderr para onde o stdout já está a ir.',
        },
        { type: 'h', text: 'SSH: o teu acesso aos servidores' },
        {
          type: 'p',
          text: 'O SSH dá-te um terminal seguro numa máquina remota. Em vez de passwords, usa **chaves**: a privada fica contigo, a pública vai para o servidor.',
        },
        {
          type: 'terminal',
          lines: [
            {
              cmd: 'ssh-keygen -t ed25519 -C "joana@eda.pt"',
              out: 'Generating public/private ed25519 key pair.\nYour identification has been saved in /home/joana/.ssh/id_ed25519\nYour public key has been saved in /home/joana/.ssh/id_ed25519.pub',
            },
            { cmd: 'ssh-copy-id deploy@srv-eda01', out: 'Number of key(s) added: 1' },
            { cmd: 'ssh deploy@srv-eda01', out: 'Welcome to Ubuntu 24.04.1 LTS\ndeploy@srv-eda01:~$' },
            { cmd: 'scp relatorio.csv deploy@srv-eda01:/srv/relatorios/', out: 'relatorio.csv        100%   48KB   2.1MB/s   00:00' },
          ],
        },
        {
          type: 'code',
          lang: 'ssh-config',
          caption: '~/.ssh/config: escreve `ssh eda01` em vez do comando todo',
          code: `Host eda01
    HostName srv-eda01.interno.eda.pt
    User deploy
    IdentityFile ~/.ssh/id_ed25519`,
        },
        {
          type: 'callout',
          variant: 'warn',
          title: 'A chave privada nunca sai do teu portátil',
          text: 'Nunca partilhes `id_ed25519` (sem `.pub`), nem a coloques num repositório. Protege-a com uma passphrase e usa o `ssh-agent`.',
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
        prompt: 'O serviço `contadores-api` deixou de responder após um deploy. Qual é o melhor primeiro passo para perceber porquê?',
        options: [
          'Reiniciar o servidor com `sudo reboot`',
          'Ver o estado e os logs com `systemctl status` e `journalctl -u contadores-api`',
          'Correr `chmod -R 777 /opt/contadores-api`',
          'Reinstalar o sistema operativo',
        ],
        answer: 1,
        explanation: 'Antes de agir, recolhe informação: o estado do serviço e os logs recentes normalmente mostram a causa (porta ocupada, configuração inválida, etc.).',
      },
      {
        kind: 'single',
        prompt: 'O que faz `chmod 640 config.yml`?',
        options: [
          'Dono lê e escreve; grupo só lê; outros sem acesso',
          'Dono lê, escreve e executa; grupo lê; outros leem',
          'Todos leem; só o dono escreve',
          'Dono só lê; grupo lê e escreve; outros sem acesso',
        ],
        answer: 0,
        explanation: '6 = 4+2 (rw) para o dono, 4 (r) para o grupo e 0 para os outros.',
      },
      {
        kind: 'single',
        prompt: 'Um disco está a 100%. Que comando te ajuda a descobrir que diretórios ocupam mais espaço em `/var`?',
        options: ['df -h /var', 'ls -la /var', 'free -h', 'sudo du -sh /var/* | sort -h'],
        answer: 3,
        explanation: '`df` mostra só o uso total do sistema de ficheiros; `du -sh` mede cada diretório e `sort -h` ordena por tamanho legível.',
      },
      {
        kind: 'single',
        prompt: 'Qual a diferença entre `kill 2314` e `kill -9 2314`?',
        options: [
          'Nenhuma, são sinónimos',
          'O primeiro apaga o executável, o segundo só para o processo',
          'O primeiro envia SIGTERM e deixa o processo terminar com ordem; o segundo (SIGKILL) mata-o de imediato sem limpeza',
          'O segundo reinicia o processo automaticamente',
        ],
        answer: 2,
        explanation: 'SIGTERM pode ser tratado pela aplicação para fechar ligações e gravar estado. SIGKILL não pode ser intercetado, por isso usa-o só quando o processo não responde.',
      },
      {
        kind: 'multi',
        prompt: 'Quais destas práticas de SSH são recomendadas? (escolhe todas as corretas)',
        options: [
          'Usar chaves ed25519 em vez de passwords',
          'Colocar a chave privada no repositório para a equipa a usar',
          'Proteger a chave privada com uma passphrase',
          'Desativar o login direto como root no servidor',
          'Partilhar a mesma chave privada entre todos os colegas',
        ],
        answers: [0, 2, 3],
        explanation: 'Chaves modernas com passphrase e sem login de root reduzem muito a superfície de ataque. Cada pessoa deve ter a sua chave e a privada nunca é partilhada.',
      },
      {
        kind: 'multi',
        prompt: 'Que comandos mostram as últimas linhas de um log e continuam a seguir novas entradas?',
        options: ['tail -f app.log', 'head -f app.log', 'less +F app.log', 'cat app.log'],
        answers: [0, 2],
        explanation: '`tail -f` segue o ficheiro; `less +F` faz o mesmo dentro do `less` (Ctrl+C para parar de seguir). `head` e `cat` não seguem.',
      },
      {
        kind: 'order',
        prompt: 'Ordena o pipeline para contar quantas vezes cada IP aparece no log e mostrar os mais frequentes primeiro.',
        items: ["awk '{print $1}' access.log", 'sort', 'uniq -c', 'sort -rn'],
        explanation: 'Extrais o campo do IP, ordenas para juntar repetidos (o `uniq` só conta linhas adjacentes) e depois ordenas numericamente de forma decrescente.',
      },
      {
        kind: 'input',
        prompt: 'Que comando mostra o caminho completo do diretório onde estás?',
        accept: ['pwd'],
        placeholder: 'comando',
        explanation: '`pwd` (print working directory) mostra o caminho absoluto atual.',
      },
    ],
  },
};

export default skill;
