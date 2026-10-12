import type { Pack } from '../types';
import linux from './skills/linux';
import git from './skills/git';
import networking from './skills/networking';
import scripting from './skills/scripting';
import collab from './skills/collab';
import cloud from './skills/cloud';
import ci from './skills/ci';
import docker from './skills/docker';
import ansible from './skills/ansible';
import security from './skills/security';
import cd from './skills/cd';
import k8s from './skills/k8s';
import iac from './skills/iac';
import observability from './skills/observability';
import gitops from './skills/gitops';
import sre from './skills/sre';
import architect from './skills/devops-architect';

const devops: Pack = {
  id: 'devops',
  name: 'DevOps',
  tagline: 'Do primeiro commit à produção fiável.',
  description:
    'Uma jornada completa pelas práticas, ferramentas e cultura DevOps: dos fundamentos de Linux e Git até pipelines, containers, Kubernetes, GitOps e SRE.',
  goalTitle: 'Arquiteto DevOps',
  tiers: [
    { name: 'Fundamentos', description: 'As bases sobre as quais tudo assenta.' },
    { name: 'Ferramentas', description: 'Colaborar, automatizar e conhecer a cloud.' },
    { name: 'Automação', description: 'Pipelines, containers e configuração repetível.' },
    { name: 'Plataforma', description: 'Entregar, orquestrar e proteger em escala.' },
    { name: 'Operações Modernas', description: 'Ver tudo e declarar tudo em Git.' },
    { name: 'Fiabilidade', description: 'Produção que dorme descansada.' },
    { name: 'Objetivo', description: 'Juntar todas as peças.' },
  ],
  skills: [
    linux, git, networking,
    scripting, collab, cloud,
    ansible, ci, docker,
    security, cd, k8s, iac,
    gitops, observability,
    sre,
    architect,
  ],
  milestones: [
    {
      id: 'foundations',
      title: 'Fundações Sólidas',
      description: 'Dominaste Linux, Git e Redes — o alicerce de qualquer engenheiro.',
      icon: 'foundation',
      skills: ['linux', 'git', 'networking'],
    },
    {
      id: 'pipeline-builder',
      title: 'Construtor de Pipelines',
      description: 'Do merge request ao deploy, tudo automatizado.',
      icon: 'ci',
      skills: ['collab', 'ci', 'cd'],
    },
    {
      id: 'container-captain',
      title: 'Capitão de Containers',
      description: 'Empacotas e orquestras aplicações como um profissional.',
      icon: 'k8s',
      skills: ['docker', 'k8s'],
    },
    {
      id: 'infra-architect',
      title: 'Mestre da Infraestrutura',
      description: 'Infraestrutura na cloud, descrita em código e reproduzível.',
      icon: 'iac',
      skills: ['cloud', 'ansible', 'iac'],
    },
    {
      id: 'production-guardian',
      title: 'Guardião da Produção',
      description: 'Segurança, observabilidade e fiabilidade sob controlo.',
      icon: 'shield',
      skills: ['security', 'observability', 'sre'],
    },
    {
      id: 'devops-architect',
      title: 'Arquiteto DevOps',
      description: 'Completaste a árvore inteira. Lendário.',
      icon: 'crown',
      skills: ['devops-architect'],
    },
  ],
  ranks: [
    { title: 'Recruta', minMastered: 0 },
    { title: 'DevOps Júnior', minMastered: 3 },
    { title: 'DevOps Intermédio', minMastered: 7 },
    { title: 'DevOps Sénior', minMastered: 12 },
    { title: 'Arquiteto DevOps', minMastered: 17 },
  ],
};

export default devops;
