# Documento de Requisitos

## 1. Visão Geral da Aplicação

### 1.1 Nome da Aplicação
Construtor de Chat Multimodal e Gestor de Binários

### 1.2 Descrição
Aplicação web de chat local com capacidade de processar múltiplos tipos de arquivos (texto, imagem, vídeo, áudio, documentos), gerenciar modelos de inferência em formato binário (.gguf / .bin) e indexar conteúdos do armazenamento local como base de conhecimento (RAG). O sistema opera completamente offline, sem dependência de APIs externas.

## 2. Usuários e Cenários de Uso

### 2.1 Usuário-Alvo
Usuários que necessitam de processamento de linguagem natural e análise multimodal em ambiente local, com controle total sobre modelos e dados.

### 2.2 Cenários Principais
- Conversação com modelo de IA carregado localmente
- Upload e processamento de arquivos diversos (imagens, vídeos, áudios, documentos)
- Gestão de modelos binários e configuração de parâmetros de inferência
- Indexação automática de conteúdos armazenados para enriquecimento de respostas

## 3. Estrutura de Páginas e Funcionalidades

```
Aplicação Web
├── Página Principal (Interface de Chat)
│   ├── Área de Conversa
│   ├── Campo de Entrada
│   ├── Botão de Anexo
│   └── Ícone de Engrenagem (acesso ao Painel de Controle)
└── Painel de Controle
    ├── Gestor de Modelos
    ├── Controle de RAG
    ├── Controle de Resposta
    └── Configurações de Áudio
```

### 3.1 Página Principal (Interface de Chat)

#### 3.1.1 Área de Conversa
- Exibir histórico de mensagens do usuário e respostas do sistema
- Renderizar texto e arquivos processados (imagens, vídeos, áudios, documentos)
- Suportar rolagem para visualização de conversas longas

#### 3.1.2 Campo de Entrada
- Permitir digitação de texto
- Enviar mensagem ao pressionar Enter ou clicar em botão de envio

#### 3.1.3 Botão de Anexo
- Abrir seletor de arquivos do dispositivo
- Aceitar tipos: imagens, vídeos, documentos, áudios
- Anexar arquivo selecionado à mensagem

#### 3.1.4 Gestão de Sessões
- Persistir histórico de conversas no armazenamento local
- Fornecer opção para limpar histórico de chat

#### 3.1.5 Ícone de Engrenagem
- Posicionado no topo da interface
- Abrir Painel de Controle ao ser clicado

### 3.2 Painel de Controle

#### 3.2.1 Gestor de Modelos
- Listar modelos binários (.gguf / .bin) disponíveis no armazenamento interno
- Permitir seleção de modelo para carregamento
- Exibir status do modelo carregado (ativo/inativo)

#### 3.2.2 Controle de RAG
- Mapear pastas de armazenamento: fotos, vídeos, áudios, documentos
- Permitir definição de caminhos das pastas
- Indexar automaticamente conteúdos das pastas definidas como base de conhecimento

#### 3.2.3 Controle de Resposta
- Slider de Temperatura: ajustar criatividade da resposta (valores numéricos)
- Slider de Max Tokens: definir tamanho máximo da resposta (valores numéricos)

#### 3.2.4 Configurações de Áudio
- Chave de ativação/desativação de síntese de voz (TTS)
- Quando ativado, respostas do sistema são convertidas em áudio

## 4. Regras de Negócio e Lógica

### 4.1 Fluxo de Processamento de Mensagem
1. Usuário envia mensagem (texto e/ou arquivo anexado)
2. Sistema captura entrada e encaminha para motor de inferência
3. Motor processa entrada utilizando modelo carregado e base RAG
4. Sistema exibe resposta na área de conversa
5. Se TTS ativado, sistema reproduz resposta em áudio

### 4.2 Carregamento de Modelo
- Apenas um modelo pode estar ativo por vez
- Ao selecionar novo modelo, sistema descarrega modelo anterior
- Modelo deve estar em formato .gguf ou .bin

### 4.3 Indexação RAG
- Sistema lê conteúdos das pastas definidas em Controle de RAG
- Conteúdos indexados são utilizados como contexto adicional para respostas
- Indexação ocorre automaticamente ao definir/alterar caminhos das pastas

### 4.4 Parâmetros de Resposta
- Temperatura: controla aleatoriedade da resposta (valores típicos: 0.0 a 1.0)
- Max Tokens: limita quantidade de tokens gerados na resposta
- Alterações nos parâmetros aplicam-se imediatamente às próximas respostas

### 4.5 Persistência de Dados
- Histórico de chat armazenado localmente no dispositivo
- Configurações do Painel de Controle (modelo selecionado, caminhos RAG, parâmetros) persistidas localmente

## 5. Exceções e Casos Limite

| Situação | Comportamento Esperado |
|----------|------------------------|
| Nenhum modelo carregado | Sistema exibe mensagem informando necessidade de carregar modelo antes de iniciar conversa |
| Arquivo anexado em formato não suportado | Sistema exibe mensagem de erro indicando formatos aceitos |
| Pasta RAG inexistente ou inacessível | Sistema exibe aviso e ignora pasta na indexação |
| Valor de Temperatura fora do intervalo | Sistema ajusta automaticamente para valor mínimo ou máximo permitido |
| Valor de Max Tokens igual a zero ou negativo | Sistema utiliza valor padrão predefinido |
| Histórico de chat vazio ao tentar limpar | Sistema não executa ação |
| TTS ativado mas sem suporte no dispositivo | Sistema exibe aviso e desativa TTS automaticamente |

## 6. Critérios de Aceitação

1. Usuário acessa a Página Principal e visualiza interface de chat vazia
2. Usuário clica no ícone de engrenagem e acessa o Painel de Controle
3. Usuário seleciona e carrega modelo binário (.gguf ou .bin) no Gestor de Modelos
4. Usuário define caminhos das pastas de armazenamento no Controle de RAG
5. Usuário retorna à Página Principal e digita mensagem de texto no campo de entrada
6. Usuário clica em enviar e visualiza resposta do sistema na área de conversa
7. Usuário anexa arquivo (imagem, vídeo, áudio ou documento) e envia mensagem
8. Sistema processa arquivo e exibe resposta considerando conteúdo anexado e base RAG

## 7. Funcionalidades Não Implementadas Nesta Versão

- Suporte a múltiplos modelos carregados simultaneamente
- Edição ou exclusão de mensagens individuais no histórico
- Exportação de histórico de chat para arquivo externo
- Busca ou filtro no histórico de conversas
- Configuração avançada de parâmetros do motor de inferência além de Temperatura e Max Tokens
- Suporte a idiomas adicionais na interface além do Português
- Sincronização de dados entre dispositivos
- Notificações ou alertas de sistema
- Temas ou personalização visual da interface
- Gestão de múltiplas sessões de chat simultâneas
- Controle de versões de modelos binários
- Estatísticas de uso ou desempenho do sistema