import type { Skill } from '../../types';

const skill: Skill = {
  id: 'docker',
  title: 'Containers com Docker',
  subtitle: 'Empacota uma vez, corre em todo o lado',
  icon: 'container',
  tier: 2,
  x: 0.72,
  deps: ['linux', 'networking'],
  xp: 200,
  summary:
    'Aprende a empacotar aplicações em imagens pequenas e seguras, a correr containers com volumes e redes, e a orquestrar ambientes locais com Docker Compose.',
  topics: [
    'Imagens vs containers',
    'Dockerfile com boas práticas',
    'Camadas, cache e multi-stage builds',
    'Volumes e redes',
    'Docker Compose',
    'Registries e tags',
  ],
  lessons: [
    {
      id: 'imagens-containers',
      title: 'Imagens e containers',
      minutes: 6,
      blocks: [
        { type: 'h', text: 'O problema que o Docker resolve' },
        {
          type: 'p',
          text: '"Na minha máquina funciona" acontece porque cada ambiente tem versões diferentes de runtime, bibliotecas e configuração. Um container empacota a aplicação **com tudo o que precisa**, e corre igual no portátil, no CI e em produção.',
        },
        {
          type: 'compare',
          left: 'Imagem',
          right: 'Container',
          rows: [
            ['Modelo só de leitura', 'Instância em execução de uma imagem'],
            ['Construída com `docker build`', 'Criado com `docker run`'],
            ['Feita de camadas imutáveis', 'Adiciona uma camada de escrita efémera'],
            ['Partilhada via registry', 'Vive num host; apagado, perde-se a camada de escrita'],
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          title: 'Container não é VM',
          text: 'Um container partilha o kernel do host e é isolado com *namespaces* e *cgroups* do Linux. Arranca em milissegundos e pesa megabytes, não gigabytes.',
        },
        {
          type: 'terminal',
          lines: [
            { cmd: 'docker run -d --name redis-cache -p 6379:6379 redis:7-alpine', out: 'Unable to find image \'redis:7-alpine\' locally\n7-alpine: Pulling from library/redis\nDigest: sha256:1b2c9a8e...\nStatus: Downloaded newer image for redis:7-alpine\n4f9e2c1a7b3d8e6f0a2b4c6d8e0f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f' },
            { cmd: 'docker ps', out: 'CONTAINER ID   IMAGE            COMMAND                  STATUS          PORTS                    NAMES\n4f9e2c1a7b3d   redis:7-alpine   "docker-entrypoint.s…"   Up 5 seconds    0.0.0.0:6379->6379/tcp   redis-cache' },
            { cmd: 'docker logs --tail 2 redis-cache', out: '1:M 12 Oct 2026 09:14:02.118 * Server initialized\n1:M 12 Oct 2026 09:14:02.118 * Ready to accept connections tcp' },
            { cmd: 'docker exec -it redis-cache redis-cli ping', out: 'PONG' },
          ],
        },
        {
          type: 'list',
          items: [
            '`-d` corre em background; `--name` dá um nome legível.',
            '`-p 6379:6379` mapeia `porta_host:porta_container`.',
            '`docker ps -a` mostra também containers parados.',
            '`docker stop` + `docker rm` (ou `docker rm -f`) para limpar.',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Limpeza periódica',
          text: '`docker system df` mostra quanto espaço ocupam imagens, containers e volumes; `docker system prune` remove o que já não está em uso (sem `--volumes`, os volumes ficam).',
        },
        {
          type: 'quickcheck',
          question: 'Apagas um container com `docker rm` e crias outro a partir da mesma imagem. O que acontece aos ficheiros que o primeiro escreveu dentro do container?',
          options: ['Ficam guardados na imagem', 'Passam automaticamente para o novo container', 'Ficam no registry', 'Perdem-se, a menos que estivessem num volume'],
          answer: 3,
          explanation: 'A camada de escrita pertence ao container e desaparece com ele. Dados que têm de sobreviver devem estar em volumes.',
        },
      ],
    },
    {
      id: 'dockerfile',
      title: 'Dockerfile, camadas e multi-stage',
      minutes: 8,
      blocks: [
        { type: 'h', text: 'Cada instrução é uma camada' },
        {
          type: 'p',
          text: 'Instruções como `RUN`, `COPY` e `ADD` criam camadas. O Docker reutiliza camadas da cache **até à primeira instrução que mudou**; daí para baixo, tudo é reconstruído.',
        },
        {
          type: 'compare',
          left: 'Cache desperdiçada',
          right: 'Cache aproveitada',
          rows: [
            ['`COPY . .` antes de instalar dependências', '`COPY package*.json ./` primeiro, depois `npm ci`'],
            ['Qualquer alteração ao código reinstala tudo', 'Só reinstala quando o lockfile muda'],
            ['Build de 3 minutos a cada mudança', 'Build de segundos no dia a dia'],
          ],
        },
        {
          type: 'code',
          lang: 'dockerfile',
          caption: 'Dockerfile multi-stage do contadores-api',
          code: `# syntax=docker/dockerfile:1

# ---- Stage 1: build ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

# ---- Stage 2: runtime ----
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
USER node
EXPOSE 3000
HEALTHCHECK CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "dist/server.js"]`,
        },
        {
          type: 'p',
          text: 'O **multi-stage build** usa uma stage com todas as ferramentas de compilação e copia só o resultado para uma imagem final limpa. Compiladores, código-fonte e dependências de desenvolvimento ficam para trás.',
        },
        {
          type: 'list',
          items: [
            'Usa imagens base pequenas e com versão fixa (`node:22-alpine`, `distroless`), nunca só `latest`.',
            'Corre como **utilizador não-root** (`USER node`).',
            'Cria um `.dockerignore` com `node_modules`, `.git`, `.env`, `dist`.',
            'Usa a forma JSON em `CMD` (`["node", "..."]`) para os sinais chegarem ao processo.',
            'Nunca copies segredos para a imagem: ficam nas camadas para sempre.',
          ],
        },
        {
          type: 'terminal',
          lines: [
            { cmd: 'docker build -t contadores-api:1.4.0 .', out: '[+] Building 4.2s (14/14) FINISHED\n => [build 2/6] WORKDIR /app                                  0.0s\n => CACHED [build 3/6] COPY package.json package-lock.json ./ 0.0s\n => CACHED [build 4/6] RUN npm ci                             0.0s\n => [build 5/6] COPY . .                                      0.1s\n => [build 6/6] RUN npm run build && npm prune --omit=dev     3.1s\n => [stage-1 4/5] COPY --from=build /app/dist ./dist          0.1s\n => exporting to image                                        0.3s\n => => naming to docker.io/library/contadores-api:1.4.0' },
            { cmd: 'docker images contadores-api', out: 'REPOSITORY       TAG       IMAGE ID       CREATED          SIZE\ncontadores-api   1.4.0     a91c3e7f2b10   10 seconds ago   182MB' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Repara no CACHED',
          text: 'Como só o código mudou, o `npm ci` veio da cache. A ordem das instruções poupou-te o passo mais lento.',
        },
        {
          type: 'quickcheck',
          question: 'Porque é que se copia `package.json` e `package-lock.json` antes de `COPY . .`?',
          options: ['Porque o Docker exige essa ordem', 'Para que a camada do `npm ci` só seja reconstruída quando as dependências mudam', 'Para reduzir o tamanho final da imagem', 'Para correr a aplicação como non-root'],
          answer: 1,
          explanation: 'Se o código mudar mas o lockfile não, as camadas até ao `npm ci` vêm da cache. Copiar tudo primeiro invalidaria a cache a cada alteração.',
        },
      ],
    },
    {
      id: 'volumes-redes-compose',
      title: 'Volumes, redes, Compose e registries',
      minutes: 8,
      blocks: [
        { type: 'h', text: 'Volumes: dados que sobrevivem' },
        {
          type: 'compare',
          left: 'Named volume',
          right: 'Bind mount',
          rows: [
            ['Gerido pelo Docker (`-v pgdata:/var/lib/...`)', 'Pasta do host (`-v ./src:/app/src`)'],
            ['Ideal para dados de bases de dados', 'Ideal para desenvolvimento com hot reload'],
            ['Portável entre hosts e sistemas', 'Depende do caminho no host'],
          ],
        },
        { type: 'h', text: 'Redes' },
        {
          type: 'p',
          text: 'Containers na mesma **rede bridge definida pelo utilizador** encontram-se pelo nome, graças ao DNS interno do Docker. A app liga-se a `db:5432`, não a um IP que muda a cada arranque. Atenção: dentro de um container, `localhost` é o próprio container.',
        },
        { type: 'h', text: 'Docker Compose' },
        {
          type: 'p',
          text: 'O **Compose** descreve uma aplicação multi-container num ficheiro `compose.yaml`. Um só `docker compose up` cria redes, volumes e containers pela ordem certa.',
        },
        {
          type: 'code',
          lang: 'yaml',
          caption: 'compose.yaml para desenvolvimento local',
          code: `services:
  api:
    build: .
    ports: ["3000:3000"]
    environment:
      DATABASE_URL: postgres://contadores:dev@db:5432/contadores
      REDIS_URL: redis://cache:6379
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: contadores
      POSTGRES_PASSWORD: dev
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U contadores"]
      interval: 5s
      retries: 5

  cache:
    image: redis:7-alpine

volumes:
  pgdata:`,
        },
        {
          type: 'terminal',
          lines: [
            { cmd: 'docker compose up -d', out: '[+] Running 5/5\n ✔ Network contadores_default  Created\n ✔ Volume "contadores_pgdata"  Created\n ✔ Container contadores-cache-1  Started\n ✔ Container contadores-db-1     Healthy\n ✔ Container contadores-api-1    Started' },
            { cmd: 'docker compose ps', out: 'NAME                 IMAGE                STATUS                   PORTS\ncontadores-api-1     contadores-api       Up 12 seconds            0.0.0.0:3000->3000/tcp\ncontadores-cache-1   redis:7-alpine       Up 18 seconds            6379/tcp\ncontadores-db-1      postgres:16-alpine   Up 18 seconds (healthy)  5432/tcp' },
            { cmd: 'docker compose logs -f api', out: 'contadores-api-1  | Ligado à base de dados contadores\ncontadores-api-1  | API a escutar na porta 3000' },
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          text: '`docker compose down` remove containers e redes mas mantém volumes. `docker compose down -v` apaga também os volumes (e os dados!).',
        },
        { type: 'h', text: 'Registries e tags' },
        {
          type: 'p',
          text: 'Um **registry** (Docker Hub, GitLab Container Registry, GHCR, Amazon ECR, Azure ACR) guarda e distribui imagens. A tag identifica a versão; usa versões semânticas ou o SHA do commit, não só `latest`.',
        },
        {
          type: 'flow',
          steps: ['docker build', 'docker tag', 'docker login', 'docker push', 'docker pull'],
        },
        {
          type: 'terminal',
          lines: [
            { cmd: 'docker tag contadores-api:1.4.0 registry.gitlab.eda.pt/plataforma/contadores-api:1.4.0', out: '' },
            { cmd: 'docker push registry.gitlab.eda.pt/plataforma/contadores-api:1.4.0', out: 'The push refers to repository [registry.gitlab.eda.pt/plataforma/contadores-api]\n5f70bf18a086: Pushed\ne2eb06d8af82: Layer already exists\n1.4.0: digest: sha256:7c1e4f...b92a size: 1782' },
          ],
        },
        {
          type: 'quickcheck',
          question: 'No `compose.yaml` acima, qual o host que a `api` usa para se ligar ao Postgres?',
          options: ['`localhost`', '`127.0.0.1`', '`db`', '`postgres.local`'],
          answer: 2,
          explanation: 'O Compose coloca os serviços numa rede comum e o DNS interno resolve o nome do serviço (`db`) para o IP do container certo.',
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
        prompt: 'A `api` em container não consegue ligar-se à base de dados, que corre noutro container da mesma rede Compose. A variável é `DATABASE_URL=postgres://app@localhost:5432/app`. Qual é a causa?',
        options: [
          'O Postgres não suporta containers',
          'Falta o `-p 5432:5432` no serviço da base de dados',
          '`localhost` aponta para o próprio container da api; deve usar o nome do serviço (ex.: `db`)',
          'O Compose não permite comunicação entre serviços',
        ],
        answer: 2,
        explanation: 'Cada container tem a sua própria interface de loopback. Na mesma rede, os serviços encontram-se pelo nome via DNS interno; publicar portas só é necessário para acesso a partir do host.',
      },
      {
        kind: 'single',
        prompt: 'Cada pequena alteração ao código faz o `docker build` reinstalar todas as dependências. Qual é a causa mais provável?',
        code: `FROM node:22-alpine
WORKDIR /app
COPY . .
RUN npm ci
CMD ["node", "dist/server.js"]`,
        options: [
          'O `COPY . .` antes do `npm ci` invalida a cache dessa camada sempre que qualquer ficheiro muda',
          'A imagem `alpine` não suporta cache',
          'Falta a instrução `EXPOSE`',
          'O `CMD` deveria estar em forma de shell',
        ],
        answer: 0,
        explanation: 'Copiar todo o código antes de instalar dependências faz com que qualquer alteração invalide a camada do `npm ci`. Copia primeiro só os ficheiros de dependências.',
      },
      {
        kind: 'single',
        prompt: 'Qual é a principal vantagem de um multi-stage build?',
        options: [
          'Permite correr vários containers ao mesmo tempo',
          'Substitui a necessidade de um registry',
          'Faz o build correr em várias máquinas',
          'A imagem final contém só o necessário para executar, sem ferramentas de build nem código-fonte',
        ],
        answer: 3,
        explanation: 'A stage de build tem compiladores e dependências de desenvolvimento; a imagem final copia só o resultado, ficando mais pequena e com menor superfície de ataque.',
      },
      {
        kind: 'single',
        prompt: 'Executaste `docker compose down -v` no ambiente local. O que aconteceu aos dados do Postgres guardados no volume `pgdata`?',
        options: [
          'Continuam intactos, o `down` nunca toca em volumes',
          'Foram apagados, porque `-v` remove também os volumes nomeados',
          'Foram enviados para o registry',
          'Ficaram guardados na imagem `postgres:16-alpine`',
        ],
        answer: 1,
        explanation: 'Sem `-v`, os volumes sobrevivem ao `down`. Com `-v`, são removidos juntamente com os containers e as redes.',
      },
      {
        kind: 'multi',
        prompt: 'Quais destas são boas práticas num Dockerfile de produção? (escolhe todas as corretas)',
        options: [
          'Correr a aplicação como utilizador não-root',
          'Fixar a versão da imagem base (ex.: `node:22-alpine`)',
          'Copiar o ficheiro `.env` com as passwords de produção para a imagem',
          'Usar `.dockerignore` para excluir `.git` e `node_modules`',
          'Usar sempre a tag `latest` na imagem base',
        ],
        answers: [0, 1, 3],
        explanation: 'Non-root, versões fixas e `.dockerignore` tornam a imagem segura e reproduzível. Segredos na imagem ficam expostos nas camadas, e `latest` torna builds imprevisíveis.',
      },
      {
        kind: 'multi',
        prompt: 'Quais afirmações sobre imagens e containers estão corretas? (escolhe todas as corretas)',
        options: [
          'Uma imagem é só de leitura e composta por camadas',
          'Vários containers podem ser criados a partir da mesma imagem',
          'Um container tem o seu próprio kernel, como uma VM',
          'Dados escritos no container sem volume perdem-se ao apagá-lo',
        ],
        answers: [0, 1, 3],
        explanation: 'Containers partilham o kernel do host; o isolamento vem de namespaces e cgroups. As restantes afirmações descrevem corretamente imagens, containers e a camada de escrita.',
      },
      {
        kind: 'order',
        prompt: 'Ordena os passos para levar uma nova versão da imagem do teu portátil até ao servidor, via registry privado.',
        items: [
          'docker build -t contadores-api:1.5.0 .',
          'docker tag contadores-api:1.5.0 registry.gitlab.eda.pt/plataforma/contadores-api:1.5.0',
          'docker push registry.gitlab.eda.pt/plataforma/contadores-api:1.5.0',
          'docker pull registry.gitlab.eda.pt/plataforma/contadores-api:1.5.0 (no servidor de destino)',
        ],
        explanation: 'Constróis a imagem, dás-lhe o nome completo com o registry, fazes push (já autenticado com `docker login`) e só depois o servidor de destino a consegue descarregar.',
      },
      {
        kind: 'input',
        prompt: 'Que comando mostra todos os containers, incluindo os que estão parados?',
        accept: ['docker ps -a', 'docker ps --all', 'docker container ls -a', 'docker container ls --all', 'docker container list -a', 'docker container list --all'],
        placeholder: 'docker ...',
        explanation: '`docker ps` mostra só os containers em execução; com `-a` (ou `--all`) inclui também os parados.',
      },
    ],
  },
};

export default skill;
