import type { Skill } from '../../types';

const skill: Skill = {
  id: 'scripting',
  title: 'Bash Scripting',
  subtitle: 'Automatiza o que é repetitivo',
  icon: 'script',
  tier: 1,
  x: 0.14,
  deps: ['linux'],
  xp: 150,
  summary:
    'Transforma sequências de comandos em scripts robustos e reutilizáveis, com tratamento de erros a sério e execução agendada com cron.',
  topics: [
    'Variáveis, argumentos e quoting',
    'Condicionais e testes',
    'Loops e funções',
    'Exit codes e set -euo pipefail',
    'Agendamento com cron',
    'Scripts de automação reais',
  ],
  lessons: [
    {
      id: 'variaveis-condicionais',
      title: 'Variáveis, argumentos e condicionais',
      minutes: 7,
      blocks: [
        { type: 'h', text: 'O teu primeiro script' },
        {
          type: 'p',
          text: 'Um script Bash é um ficheiro de texto com comandos. A primeira linha, o **shebang**, diz ao sistema que interpretador usar.',
        },
        {
          type: 'code',
          lang: 'bash',
          caption: 'verifica-api.sh',
          code: `#!/usr/bin/env bash
SERVICO="contadores-api"
URL="https://api.eda.pt/health"

echo "A verificar \${SERVICO} em \${URL}..."
curl --fail --silent "\${URL}" > /dev/null && echo "OK"`,
        },
        {
          type: 'terminal',
          lines: [
            { cmd: 'chmod +x verifica-api.sh', out: '' },
            { cmd: './verifica-api.sh', out: 'A verificar contadores-api em https://api.eda.pt/health...\nOK' },
          ],
        },
        { type: 'h', text: 'Variáveis e quoting' },
        {
          type: 'list',
          items: [
            'Atribuição **sem espaços**: `NOME="valor"` (com espaços, o Bash tenta correr um comando chamado `NOME`).',
            'Usa sempre aspas: `"$FICHEIRO"`. Sem elas, nomes com espaços partem-se em várias palavras.',
            '`$(comando)` guarda a saída de um comando: `HOJE=$(date +%F)`.',
            'Argumentos: `$1`, `$2`... `$#` é o número de argumentos e `"$@"` são todos eles.',
          ],
        },
        {
          type: 'compare',
          left: 'Aspas duplas "..."',
          right: 'Aspas simples \'...\'',
          rows: [
            ['Expandem variáveis: "Olá $USER"', 'Texto literal: \'Olá $USER\''],
            ['Expandem $(comando)', 'Não expandem nada'],
            ['Uso por omissão para variáveis', 'Ideais para padrões e JSON'],
          ],
        },
        { type: 'h', text: 'Tomar decisões' },
        {
          type: 'code',
          lang: 'bash',
          code: `AMBIENTE="\${1:-dev}"   # 1.º argumento, ou "dev" se não for passado

if [[ "$AMBIENTE" == "prod" ]]; then
  echo "Atenção: vais mexer em produção!"
elif [[ -f ".env.$AMBIENTE" ]]; then
  echo "A carregar .env.$AMBIENTE"
else
  echo "Ambiente desconhecido: $AMBIENTE" >&2
  exit 1
fi`,
          caption: 'Usa `[[ ]]`: mais seguro e expressivo do que `[ ]`',
        },
        {
          type: 'compare',
          left: 'Teste',
          right: 'Verdadeiro se...',
          rows: [
            ['-f ficheiro', 'Existe e é um ficheiro regular'],
            ['-d dir', 'Existe e é um diretório'],
            ['-z "$VAR"', 'A string está vazia'],
            ['"$a" == "$b"', 'As strings são iguais'],
            ['$n -gt 10', 'Número maior que 10 (também -lt, -eq, -ge)'],
          ],
        },
        {
          type: 'quickcheck',
          question: 'Qual destas linhas atribui corretamente uma variável em Bash?',
          options: ['DATA = $(date +%F)', 'DATA=$(date +%F)', '$DATA=$(date +%F)', 'set DATA $(date +%F)'],
          answer: 1,
          explanation: 'Não pode haver espaços à volta do `=` e o nome é escrito sem `$` na atribuição.',
        },
      ],
    },
    {
      id: 'loops-funcoes-erros',
      title: 'Loops, funções e exit codes',
      minutes: 8,
      blocks: [
        { type: 'h', text: 'Repetir sem copiar e colar' },
        {
          type: 'code',
          lang: 'bash',
          code: `SERVIDORES=(srv-eda01 srv-eda02 srv-eda03)

for srv in "\${SERVIDORES[@]}"; do
  echo "== $srv =="
  ssh "$srv" 'df -h / | tail -1'
done

# ler um ficheiro linha a linha
while IFS= read -r contador; do
  echo "A processar $contador"
done < contadores.txt`,
          caption: 'for para listas, while read para ficheiros',
        },
        {
          type: 'callout',
          variant: 'warn',
          title: 'Não faças for linha in $(cat ficheiro)',
          text: 'Isso parte o texto por espaços, não por linhas. Para ler linhas, usa `while IFS= read -r linha; do ...; done < ficheiro`.',
        },
        { type: 'h', text: 'Funções' },
        {
          type: 'code',
          lang: 'bash',
          code: `log() {
  echo "[$(date +%T)] $*" >&2
}

servico_ativo() {
  local nome="$1"
  systemctl is-active --quiet "$nome"
}

if servico_ativo contadores-api; then
  log "contadores-api está a correr"
else
  log "contadores-api em baixo!"
fi`,
        },
        {
          type: 'p',
          text: 'Usa `local` para variáveis dentro de funções, para não poluíres o resto do script. Uma função "devolve" verdadeiro ou falso através do **exit code** do último comando.',
        },
        { type: 'h', text: 'Exit codes: sucesso é zero' },
        {
          type: 'terminal',
          lines: [
            { cmd: 'grep -q "ERROR" /var/log/contadores-api/app.log; echo $?', out: '0' },
            { cmd: 'ls /nao/existe; echo $?', out: "ls: cannot access '/nao/existe': No such file or directory\n2" },
            { cmd: 'true && echo "correu" || echo "falhou"', out: 'correu' },
          ],
        },
        {
          type: 'p',
          text: 'Por omissão, o Bash **continua** depois de um comando falhar. Num script de deploy isso é perigoso: um `cd` falhado seguido de `rm -rf *` apaga o diretório errado.',
        },
        {
          type: 'code',
          lang: 'bash',
          caption: 'O cabeçalho que deves usar em quase todos os scripts',
          code: `#!/usr/bin/env bash
set -euo pipefail
# -e          termina ao primeiro comando que falhe
# -u          erro se usares uma variável não definida
# -o pipefail um pipeline falha se QUALQUER comando falhar

trap 'echo "Erro na linha $LINENO" >&2' ERR`,
        },
        {
          type: 'quickcheck',
          question: 'Com `set -euo pipefail`, o que acontece ao correr `curl -s "$URL" | jq .estado` se o curl falhar?',
          options: [
            'O script continua, porque o `jq` correu bem',
            'O script entra em ciclo infinito',
            'O pipeline falha e o script termina com erro',
            'O `jq` repete o pedido',
          ],
          answer: 2,
          explanation: 'Sem `pipefail`, o exit code do pipeline seria o do último comando (`jq`). Com ele, a falha do `curl` propaga-se e o `-e` termina o script.',
        },
      ],
    },
    {
      id: 'cron-automacao',
      title: 'Automação real e cron',
      minutes: 7,
      blocks: [
        { type: 'h', text: 'Um script de backup a sério' },
        {
          type: 'p',
          text: 'Vamos juntar tudo: um backup diário da base de dados da `contadores-api`, com rotação de ficheiros antigos e mensagens claras.',
        },
        {
          type: 'code',
          lang: 'bash',
          caption: '/opt/scripts/backup-db.sh',
          code: `#!/usr/bin/env bash
set -euo pipefail

DESTINO="/srv/backups/contadores"
RETENCAO_DIAS="\${RETENCAO_DIAS:-7}"
FICHEIRO="\${DESTINO}/contadores-$(date +%F_%H%M).sql.gz"

log() { echo "[$(date '+%F %T')] $*"; }

mkdir -p "$DESTINO"

log "Início do backup para $FICHEIRO"
pg_dump --no-owner contadores | gzip > "$FICHEIRO"

log "A remover backups com mais de $RETENCAO_DIAS dias"
find "$DESTINO" -name '*.sql.gz' -mtime +"$RETENCAO_DIAS" -delete

log "Concluído ($(du -h "$FICHEIRO" | cut -f1))"`,
        },
        {
          type: 'flow',
          steps: ['set -euo pipefail', 'Preparar destino', 'pg_dump | gzip', 'Rodar antigos', 'Registar'],
          caption: 'Estrutura do script',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Valida antes de correr',
          text: 'Corre `shellcheck backup-db.sh` antes de cada commit. Apanha aspas em falta, variáveis mal usadas e dezenas de armadilhas clássicas do Bash.',
        },
        { type: 'h', text: 'Agendar com cron' },
        {
          type: 'code',
          lang: 'text',
          code: `┌───────── minuto (0-59)
│ ┌─────── hora (0-23)
│ │ ┌───── dia do mês (1-31)
│ │ │ ┌─── mês (1-12)
│ │ │ │ ┌─ dia da semana (0-6, 0 = domingo)
│ │ │ │ │
30 2 * * * /opt/scripts/backup-db.sh >> /var/log/backup-db.log 2>&1`,
          caption: 'Todos os dias às 02:30, com saída e erros registados',
        },
        {
          type: 'terminal',
          lines: [
            { cmd: 'crontab -e', out: 'crontab: installing new crontab' },
            {
              cmd: 'crontab -l',
              out: '30 2 * * * /opt/scripts/backup-db.sh >> /var/log/backup-db.log 2>&1\n*/5 * * * * /opt/scripts/verifica-api.sh >> /var/log/verifica-api.log 2>&1',
            },
          ],
        },
        {
          type: 'compare',
          left: 'Expressão',
          right: 'Significado',
          rows: [
            ['*/5 * * * *', 'De 5 em 5 minutos'],
            ['0 8 * * 1-5', 'Dias úteis às 08:00'],
            ['0 0 1 * *', 'Dia 1 de cada mês à meia-noite'],
            ['15 3 * * 0', 'Domingos às 03:15'],
          ],
        },
        {
          type: 'callout',
          variant: 'warn',
          title: 'O cron não é o teu terminal',
          text: 'O cron corre com um `PATH` mínimo e sem as tuas variáveis de ambiente. Usa caminhos absolutos, define o que precisas no script e redireciona sempre a saída para um log.',
        },
        {
          type: 'quickcheck',
          question: 'Que expressão cron corre um script todos os dias úteis às 07:45?',
          options: ['7 45 * * 1-5', '45 7 1-5 * *', '45 7 * * 1-5', '* 7:45 * * 1-5'],
          answer: 2,
          explanation: 'A ordem é minuto, hora, dia do mês, mês e dia da semana. `1-5` no último campo é segunda a sexta.',
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
        prompt: 'Este script corre e apaga ficheiros no diretório errado. Porquê?',
        code: `#!/usr/bin/env bash
cd /srv/relatorios/tmp
rm -rf *`,
        options: [
          'O `rm -rf *` não aceita diretórios',
          'Falta o shebang',
          'O `cd` só funciona com caminhos relativos',
          'Se o `cd` falhar, o script continua e o `rm` corre no diretório atual',
        ],
        answer: 3,
        explanation: 'Sem `set -e` (ou `cd ... || exit 1`), uma falha no `cd` é ignorada e o `rm` apaga o conteúdo de onde o script estiver.',
      },
      {
        kind: 'single',
        prompt: 'A variável `FICHEIRO="relatório outubro.csv"`. Qual destes comandos funciona corretamente?',
        options: ['cp "$FICHEIRO" /srv/relatorios/', 'cp $FICHEIRO /srv/relatorios/', "cp '$FICHEIRO' /srv/relatorios/", 'cp FICHEIRO /srv/relatorios/'],
        answer: 0,
        explanation: 'As aspas duplas expandem a variável e mantêm o nome com espaço como um só argumento. As simples não expandem e sem aspas o nome parte-se em dois.',
      },
      {
        kind: 'single',
        prompt: 'O que imprime este excerto?',
        code: `verifica() { return 3; }
verifica
echo $?`,
        options: ['0', '1', '3', 'verifica'],
        answer: 2,
        explanation: '`$?` contém o exit code do último comando, neste caso o `return 3` da função.',
      },
      {
        kind: 'single',
        prompt: 'Um script funciona quando o corres à mão mas falha no cron com "pg_dump: command not found". Causa mais provável?',
        options: [
          'O cron não tem permissão para correr scripts',
          'O cron usa um PATH mínimo que não inclui o diretório do `pg_dump`',
          'O script tem de ter extensão `.cron`',
          'O cron só corre comandos internos do Bash',
        ],
        answer: 1,
        explanation: 'O ambiente do cron é muito reduzido. Usa caminhos absolutos (ex.: `/usr/bin/pg_dump`) ou define `PATH` no script ou no crontab.',
      },
      {
        kind: 'multi',
        prompt: 'O que faz `set -euo pipefail`? (escolhe todas as corretas)',
        options: [
          'Termina o script quando um comando falha',
          'Dá erro ao usar uma variável não definida',
          'Ativa a cor no terminal',
          'Faz um pipeline falhar se qualquer comando nele falhar',
          'Executa o script em modo de depuração, mostrando cada comando',
        ],
        answers: [0, 1, 3],
        explanation: '`-e`, `-u` e `-o pipefail` tornam o script estrito. Mostrar cada comando é o `set -x`.',
      },
      {
        kind: 'multi',
        prompt: 'Quais destas são boas práticas num script Bash de produção?',
        options: [
          'Usar aspas à volta das variáveis',
          'Correr `shellcheck` antes de publicar',
          'Assumir que o PATH é igual ao do teu terminal',
          'Usar `local` nas variáveis das funções',
        ],
        answers: [0, 1, 3],
        explanation: 'Quoting, análise estática e âmbito local evitam a maioria dos bugs. Nunca assumas o ambiente: o cron e os pipelines de CI têm ambientes diferentes.',
      },
      {
        kind: 'order',
        prompt: 'Ordena as partes de um script de backup bem estruturado.',
        items: ['#!/usr/bin/env bash', 'set -euo pipefail', 'Definir variáveis (destino, retenção)', 'Fazer o dump e comprimir', 'Remover backups antigos'],
        explanation: 'Shebang primeiro, depois o modo estrito, a configuração e só então as ações, terminando com a limpeza.',
      },
      {
        kind: 'input',
        prompt: 'Que comando abre o editor para alterares o crontab do teu utilizador?',
        accept: ['crontab -e'],
        placeholder: 'comando',
        explanation: '`crontab -e` edita e valida o crontab; `crontab -l` lista-o.',
      },
    ],
  },
};

export default skill;
