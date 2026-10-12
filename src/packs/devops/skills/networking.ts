import type { Skill } from '../../types';

const skill: Skill = {
  id: 'networking',
  title: 'Redes & HTTP',
  subtitle: 'Como os serviços conversam',
  icon: 'network',
  tier: 0,
  x: 0.82,
  deps: [],
  xp: 100,
  summary:
    'Percebe o que acontece entre o pedido e a resposta: IPs, portas, DNS, HTTP e TLS, e as ferramentas para diagnosticar quando "a API não responde".',
  topics: [
    'IP, portas, TCP e UDP',
    'DNS e resolução de nomes',
    'HTTP: métodos, headers e status codes',
    'TLS e HTTPS',
    'curl na prática',
    'Diagnóstico com ping, dig e ss',
  ],
  lessons: [
    {
      id: 'ip-portas-dns',
      title: 'IP, portas, TCP/UDP e DNS',
      minutes: 7,
      blocks: [
        { type: 'h', text: 'Moradas e portas' },
        {
          type: 'p',
          text: 'Um **endereço IP** identifica uma máquina na rede; a **porta** identifica o serviço dentro dela. Juntos formam o destino de uma ligação, como `10.20.0.15:8080`.',
        },
        {
          type: 'compare',
          left: 'Porta',
          right: 'Serviço típico',
          rows: [
            ['22', 'SSH'],
            ['53', 'DNS'],
            ['80 / 443', 'HTTP / HTTPS'],
            ['5432', 'PostgreSQL'],
            ['8080', 'Aplicações em desenvolvimento (ex.: contadores-api)'],
          ],
        },
        {
          type: 'p',
          text: 'Endereços como `10.x.x.x`, `172.16-31.x.x` e `192.168.x.x` são **privados**: só existem dentro da rede interna. `127.0.0.1` (localhost) é sempre a própria máquina.',
        },
        { type: 'h', text: 'TCP vs UDP' },
        {
          type: 'compare',
          left: 'TCP',
          right: 'UDP',
          rows: [
            ['Ligação estabelecida (handshake)', 'Sem ligação: envia e esquece'],
            ['Garante ordem e entrega', 'Pode perder ou trocar pacotes'],
            ['HTTP/1.1, HTTP/2, SSH, bases de dados', 'DNS, streaming, métricas (StatsD)'],
            ['Mais overhead', 'Mais leve e rápido'],
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          title: 'E o HTTP/3?',
          text: 'O HTTP/3 corre sobre **QUIC**, um protocolo construído em cima de UDP que implementa fiabilidade e cifra por si. É por isso que vês tráfego UDP na porta 443.',
        },
        { type: 'h', text: 'DNS: a lista telefónica da Internet' },
        {
          type: 'flow',
          steps: ['Aplicação', 'Resolver local', 'Servidor DNS', 'Resposta (IP)', 'Ligação TCP'],
          caption: 'Antes de qualquer pedido, o nome tem de virar IP',
        },
        {
          type: 'terminal',
          lines: [
            {
              cmd: 'dig +short api.eda.pt',
              out: 'lb-prod.eda.pt.\n10.20.0.15',
            },
            {
              cmd: 'dig api.eda.pt A +noall +answer',
              out: 'api.eda.pt.      300  IN  CNAME  lb-prod.eda.pt.\nlb-prod.eda.pt.  60   IN  A      10.20.0.15',
            },
          ],
        },
        {
          type: 'list',
          items: [
            '**A / AAAA**: nome para IPv4 / IPv6.',
            '**CNAME**: alias para outro nome.',
            '**MX**: servidores de email; **TXT**: texto livre (verificações, SPF).',
            '**TTL**: segundos que a resposta pode ficar em cache.',
          ],
        },
        {
          type: 'quickcheck',
          question: 'Mudaste o registo A de `api.eda.pt` para um novo IP, mas alguns utilizadores continuam a chegar ao servidor antigo durante uma hora. Causa mais provável?',
          options: [
            'O servidor antigo está a roubar tráfego',
            'O TCP está a reenviar pacotes antigos',
            'O TTL do registo era alto e as respostas antigas ainda estão em cache',
            'O DNS só atualiza à meia-noite',
          ],
          answer: 2,
          explanation: 'Resolvers guardam a resposta durante o TTL. Antes de uma migração, baixa o TTL (ex.: para 60s) com antecedência.',
        },
      ],
    },
    {
      id: 'http-tls',
      title: 'HTTP e HTTPS',
      minutes: 7,
      blocks: [
        { type: 'h', text: 'Anatomia de um pedido HTTP' },
        {
          type: 'p',
          text: 'O HTTP é um protocolo de **pedido e resposta**. O cliente envia um método, um caminho e headers; o servidor responde com um status code, headers e, opcionalmente, um body.',
        },
        {
          type: 'code',
          lang: 'http',
          caption: 'Pedido e resposta (simplificados)',
          code: `GET /v1/contadores/PT0002000012345678/leituras HTTP/1.1
Host: api.eda.pt
Authorization: Bearer eyJhbGciOi...
Accept: application/json

HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{"contador":"PT0002000012345678","leituras":[{"data":"2026-10-01","kwh":412.6}]}`,
        },
        {
          type: 'compare',
          left: 'Método',
          right: 'Uso típico',
          rows: [
            ['GET', 'Ler um recurso (sem efeitos secundários)'],
            ['POST', 'Criar um recurso ou disparar uma ação'],
            ['PUT / PATCH', 'Substituir / atualizar parcialmente'],
            ['DELETE', 'Remover um recurso'],
          ],
        },
        { type: 'h', text: 'Status codes que vais ver todos os dias' },
        {
          type: 'list',
          items: [
            '**2xx** sucesso: `200 OK`, `201 Created`, `204 No Content`.',
            '**3xx** redirecionamento: `301` permanente, `304 Not Modified`.',
            '**4xx** erro do cliente: `400` pedido inválido, `401` sem autenticação, `403` sem permissão, `404` não existe, `429` demasiados pedidos.',
            '**5xx** erro do servidor: `500` erro interno, `502 Bad Gateway`, `503` indisponível, `504 Gateway Timeout`.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: '502 vs 504',
          text: 'Os dois vêm normalmente de um proxy ou load balancer. **502**: o backend respondeu mal ou fechou a ligação. **504**: o backend não respondeu a tempo.',
        },
        {
          type: 'quickcheck',
          question: 'A app móvel chama a API com um token expirado. Que status code deve a API devolver?',
          options: ['401 Unauthorized', '403 Forbidden', '404 Not Found', '500 Internal Server Error'],
          answer: 0,
          explanation: '`401` significa que a autenticação falhou ou falta. `403` é para quando a identidade é conhecida mas não tem permissão.',
        },
        { type: 'h', text: 'TLS: o S de HTTPS' },
        {
          type: 'p',
          text: 'O **TLS** cifra a ligação e prova a identidade do servidor através de um **certificado** assinado por uma autoridade (CA). Hoje usa-se TLS 1.2 ou 1.3; versões anteriores estão obsoletas.',
        },
        {
          type: 'flow',
          steps: ['TCP ligado', 'Client Hello', 'Certificado', 'Chaves trocadas', 'HTTP cifrado'],
          caption: 'Handshake TLS 1.3 (simplificado)',
        },
        {
          type: 'terminal',
          lines: [
            {
              cmd: 'openssl s_client -connect api.eda.pt:443 -servername api.eda.pt </dev/null 2>/dev/null | openssl x509 -noout -subject -enddate',
              out: 'subject=CN = api.eda.pt\nnotAfter=Dec 28 23:59:59 2026 GMT',
            },
          ],
        },
        {
          type: 'callout',
          variant: 'warn',
          title: 'Certificados expiram',
          text: 'Um certificado expirado deita abaixo um serviço tão bem como um bug. Automatiza a renovação (ex.: ACME/Let\'s Encrypt, cert-manager) e cria alertas para a data de expiração.',
        },
      ],
    },
    {
      id: 'curl-diagnostico',
      title: 'curl e diagnóstico de rede',
      minutes: 7,
      blocks: [
        { type: 'h', text: 'curl: o canivete suíço do HTTP' },
        {
          type: 'terminal',
          lines: [
            {
              cmd: 'curl -i https://api.eda.pt/health',
              out: 'HTTP/2 200\ncontent-type: application/json\ndate: Sun, 12 Oct 2026 09:51:12 GMT\n\n{"status":"ok","db":"ok"}',
            },
            {
              cmd: 'curl -s -X POST https://api.eda.pt/v1/leituras -H "Content-Type: application/json" -d \'{"contador":"PT0002000012345678","kwh":415.2}\'',
              out: '{"id":"lt_8f2c1","estado":"aceite"}',
            },
            {
              cmd: 'curl -s -o /dev/null -w "%{http_code} %{time_total}s\\n" https://api.eda.pt/health',
              out: '200 0.084s',
            },
          ],
        },
        {
          type: 'list',
          items: [
            '`-i` mostra os headers da resposta; `-v` mostra tudo, incluindo o handshake TLS.',
            '`-X` define o método; `-H` adiciona headers; `-d` envia um body.',
            '`-L` segue redirecionamentos; `--fail` devolve erro em respostas 4xx/5xx (útil em scripts).',
          ],
        },
        { type: 'h', text: 'Diagnosticar camada a camada' },
        {
          type: 'p',
          text: 'Quando "a API não responde", não adivinhes. Testa de baixo para cima: o nome resolve? A máquina responde? A porta está aberta? O serviço responde bem?',
        },
        {
          type: 'flow',
          steps: ['dig (DNS)', 'ping (rede)', 'nc / ss (porta)', 'curl (HTTP)', 'logs (app)'],
          caption: 'Do mais básico para o mais específico',
        },
        {
          type: 'terminal',
          lines: [
            {
              cmd: 'ping -c 3 10.20.0.15',
              out: '64 bytes from 10.20.0.15: icmp_seq=1 ttl=63 time=0.82 ms\n64 bytes from 10.20.0.15: icmp_seq=2 ttl=63 time=0.79 ms\n64 bytes from 10.20.0.15: icmp_seq=3 ttl=63 time=0.85 ms\n\n--- 10.20.0.15 ping statistics ---\n3 packets transmitted, 3 received, 0% packet loss',
            },
            { cmd: 'nc -zv 10.20.0.15 8080', out: 'nc: connect to 10.20.0.15 port 8080 (tcp) failed: Connection refused' },
            {
              cmd: 'sudo ss -tlnp',
              out: 'State   Recv-Q  Send-Q  Local Address:Port   Peer Address:Port  Process\nLISTEN  0       511     127.0.0.1:8080       0.0.0.0:*          users:(("server",pid=2314,fd=7))\nLISTEN  0       128     0.0.0.0:22           0.0.0.0:*          users:(("sshd",pid=812,fd=3))',
            },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Encontrado!',
          text: 'O `ss` mostra o serviço a escutar em `127.0.0.1:8080`, ou seja, só aceita ligações da própria máquina. Configura-o para escutar em `0.0.0.0` (ou no IP interno) e o "Connection refused" desaparece.',
        },
        {
          type: 'compare',
          left: 'Sintoma',
          right: 'Pista',
          rows: [
            ['Connection refused', 'Nada a escutar nessa porta/IP (ou firewall a rejeitar)'],
            ['Timeout', 'Firewall a descartar pacotes ou máquina inacessível'],
            ['Could not resolve host', 'Problema de DNS'],
            ['SSL certificate problem', 'Certificado expirado, autoassinado ou nome errado'],
          ],
        },
        {
          type: 'quickcheck',
          question: 'O `ping` a um servidor falha, mas `curl https://servidor/health` devolve 200. Como explicas?',
          options: [
            'O curl está a usar cache',
            'O DNS está errado',
            'O servidor está em baixo',
            'A firewall bloqueia ICMP (ping) mas permite TCP 443',
          ],
          answer: 3,
          explanation: 'Muitas redes bloqueiam ICMP. Um ping falhado não prova que a máquina está em baixo; testa sempre o protocolo e porta reais.',
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
        prompt: 'O load balancer devolve `504 Gateway Timeout` em pedidos à `contadores-api`. O que isto indica?',
        options: [
          'O cliente enviou um pedido mal formado',
          'O backend demorou demasiado a responder ao load balancer',
          'O certificado TLS expirou',
          'O recurso pedido não existe',
        ],
        answer: 1,
        explanation: '`504` é emitido por um intermediário quando o upstream não responde dentro do tempo limite, por exemplo devido a queries lentas à base de dados.',
      },
      {
        kind: 'single',
        prompt: 'Corres `curl http://10.20.0.15:8080` e recebes "Connection refused". O `ss -tlnp` no servidor mostra `127.0.0.1:8080`. Qual é a correção?',
        options: [
          'Configurar o serviço para escutar em `0.0.0.0` ou no IP interno',
          'Renovar o certificado TLS',
          'Baixar o TTL do DNS',
          'Usar `ping` em vez de `curl`',
        ],
        answer: 0,
        explanation: 'Um serviço ligado a `127.0.0.1` só aceita ligações locais. Tem de escutar numa interface acessível de fora.',
      },
      {
        kind: 'single',
        prompt: 'Porque é que o DNS usa normalmente UDP?',
        options: [
          'Porque o UDP é cifrado por omissão',
          'Porque o TCP não suporta a porta 53',
          'Porque o UDP garante a entrega',
          'Porque as consultas são pequenas e rápidas, e o handshake TCP seria overhead desnecessário',
        ],
        answer: 3,
        explanation: 'Uma pergunta e uma resposta curtas cabem num pacote. O DNS recorre a TCP para respostas grandes ou transferências de zona.',
      },
      {
        kind: 'single',
        prompt: 'Um utilizador autenticado tenta apagar o contador de outro cliente e a API recusa. Que status code é o mais adequado?',
        options: ['400 Bad Request', '401 Unauthorized', '403 Forbidden', '409 Conflict'],
        answer: 2,
        explanation: 'A identidade é conhecida (autenticado), mas não tem permissão para aquele recurso: `403`.',
      },
      {
        kind: 'multi',
        prompt: 'Quais destes status codes indicam um problema do lado do servidor ou da infraestrutura?',
        options: ['502 Bad Gateway', '404 Not Found', '503 Service Unavailable', '429 Too Many Requests', '500 Internal Server Error'],
        answers: [0, 2, 4],
        explanation: 'A família 5xx representa falhas do servidor. 404 e 429 são 4xx: a causa está no pedido do cliente (recurso inexistente ou excesso de pedidos).',
      },
      {
        kind: 'multi',
        prompt: 'O que te garante uma ligação HTTPS com um certificado válido?',
        options: [
          'Os dados viajam cifrados',
          'O servidor é quem diz ser (para aquele nome)',
          'A aplicação no servidor não tem vulnerabilidades',
          'Os dados não foram alterados em trânsito',
        ],
        answers: [0, 1, 3],
        explanation: 'O TLS dá confidencialidade, autenticação do servidor e integridade. Não diz nada sobre a segurança do código da aplicação.',
      },
      {
        kind: 'order',
        prompt: 'Ordena o que acontece quando o browser abre `https://api.eda.pt/health` pela primeira vez.',
        items: ['Resolução DNS do nome', 'Ligação TCP (handshake)', 'Handshake TLS', 'Envio do pedido HTTP GET', 'Resposta HTTP 200'],
        explanation: 'Primeiro o nome vira IP, depois estabelece-se a ligação TCP, sobre ela o TLS e só então circula HTTP cifrado.',
      },
      {
        kind: 'input',
        prompt: 'Que comando mostra só os endereços IP para que `api.eda.pt` resolve (resposta curta)?',
        accept: ['dig +short api.eda.pt', 'dig api.eda.pt +short', 'dig +short a api.eda.pt', 'dig +short api.eda.pt a'],
        placeholder: 'dig ...',
        explanation: '`dig +short` devolve apenas a resposta, sem as secções de detalhe.',
      },
    ],
  },
};

export default skill;
