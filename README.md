# 🚀 Treinador de Associação com Repetição Espaçada (FSRS)

Este é um aplicativo web de arquivo único, baseado em navegador, para treinamento de associação (por exemplo, vocabulário, fatos) que implementa o algoritmo **FSRS (Free Spaced Repetition Scheduler)**.

Ele foi projetado para ser **simples, portátil e poderoso**. Por ser um único arquivo `index.html`, você pode salvá-lo e executá-lo totalmente **offline** no seu navegador. Todo o seu baralho e progresso de aprendizado são salvos diretamente no `localStorage` do seu navegador.

---
## ✨ Recursos Principais

* **Verdadeira Repetição Espaçada:** Implementa o moderno algoritmo FSRS para agendar cartões com base no seu desempenho, calculando a **Estabilidade (s)** e a **Dificuldade (d)** do cartão.
* **Aprendizagem Contextual:** Suporta a adição de múltiplas frases/sentenças de exemplo (`contexts`) a um cartão. Ao ser revisada, uma frase de contexto é escolhida **aleatoriamente** e exibida em uma caixa de dica no canto superior direito.
* **Destaque em Negrito:** Você pode marcar palavras específicas em suas frases de contexto com **dois asteriscos** (`**palavra**`). Essas marcações são automaticamente renderizadas como **texto em negrito** (`<b>`) na caixa de dica, permitindo que você destaque a flexão, o prefixo ou o elemento gramatical que deseja enfatizar.
* **Dois Modos de Aprendizagem:**
    * **Modo Avaliativo (FSRS):** Um modo de estudo sério que classifica seu desempenho (Novamente, Difícil, Bom, Fácil) com base na precisão da digitação (distância de Levenshtein) e no tempo de resposta. Este modo **atualiza** os dados FSRS do seu cartão.
    * **Modo Livre:** Um modo de prática de baixa pressão com dicas úteis (letra, cor e posição) que **não afeta** seu progresso FSRS.
* **Gerenciamento Completo de Baralhos:** Crie, edite e exclua múltiplos baralhos.
* **Importação/Exportação JSON:** Importe facilmente seus dados de aprendizado de um arquivo `.json`. O aplicativo também suporta a mesclagem de novos arquivos JSON com o conteúdo existente do baralho.
* **Preservação Inteligente de Dados FSRS:** Ao editar o JSON de um baralho, o aplicativo exibe apenas os campos `question`, `answer` e `contexts`. Ele preserva, atualiza ou redefine de forma inteligente os dados FSRS ocultos (`s`, `d`, etc.) quando você salva, garantindo que seu progresso nunca seja sobrescrito acidentalmente.
* **Comandos de Áudio:** Utiliza o Text-to-Speech (TTS) integrado do seu navegador para ler a "pergunta" em voz alta.
* **Sem Dependências:** Apenas um arquivo `index.html`. Sem servidor, sem etapa de _build_, sem necessidade de conexão com a internet.
* **Modo Escuro:** Alterna para uma visualização confortável.

---
## 🚀 Como Usar

1.  **Baixar:** Salve o arquivo **`index.html`** em seu computador.
2.  **Abrir:** Abra o arquivo `index.html` em qualquer navegador web moderno (como Chrome, Firefox ou Edge).
3.  **Criar um Baralho:** Você verá a tela "Selecione um Deck".
    * Clique no botão `+` para criar um novo baralho.
    * Dê um nome ao seu baralho (ex.: "Verbos Russos").
4.  **Adicionar Conteúdo (JSON):**
    * Clique no botão **"Editar/Importar JSON"**.
    * O conteúdo JSON deve ser um **array de objetos**, com cada objeto tendo as chaves obrigatórias (`question`, `answer`) e o array opcional `contexts`:

    ```json
    [
        {
            "question": "бабушка",
            "answer": "grandmother",
            "contexts": [
                "У **бáбушки** есть кот.",
                "**Бáбушка** говори́т: — Спаси́бо!"
            ]
        },
        {
            "question": "идти",
            "answer": "go",
            "contexts": [
                "Ва́ся **идёт** к бáбушке.",
                "Я **иду́** домо́й."
            ]
        }
    ]
    ```
5.  **Salvar e Jogar:**
    * Clique em **"Salvar"** no editor JSON.
    * Clique em **"Salvar"** no modal de Configurações.
    * Seu novo baralho aparecerá. Clique nele para começar a aprender!

---
## 🎮 Os Dois Modos de Aprendizagem

Você pode alternar entre os modos no painel de configurações (ícone `⚙️`).

### 1. Modo Avaliativo (FSRS)

Este é o **modo de estudo FSRS** principal.

* **Dica de Contexto:** Uma frase de contexto aleatória (se disponível) aparecerá no canto superior direito, destacando a palavra-alvo em **negrito** (se marcada com `**`).
* **Classificação:** Você deve digitar a "resposta" corretamente. Ao pressionar `Enter`, o aplicativo o classifica com base em:
    * **Precisão:** Usa a distância de Levenshtein para erros de digitação.
    * **Tempo:** Mede seu tempo de reação e tempo de digitação.
* **Progresso:** Com base em sua nota (Novamente, Difícil, Bom, Fácil), o aplicativo **atualiza os dados FSRS** do cartão e o agenda para uma revisão futura. Este progresso é salvo automaticamente.

### 2. Modo Livre

Este é um **modo de prática ou "revisão intensiva"** que **não afeta** seu agendamento FSRS.

* **Dicas:** Este modo oferece várias dicas para auxiliar na recordação, incluindo a **Dica de Contexto**.
* **Sem Classificação:** O aplicativo simplesmente verifica se sua resposta está correta ou incorreta.
* **Sem Progresso:** Seus dados FSRS (`s`, `d`, `dueDate`) **não** são alterados neste modo. É puramente para prática.

---
## 🛠️ Detalhes Técnicos

* **Persistência:** Todos os dados do baralho e dos cartões são armazenados no `localStorage` do navegador sob a chave `association_game_decks_fsrs`.
* **Estrutura de Dados do Cartão:**
    * Ao importar um JSON, você fornece apenas `{ "question": "...", "answer": "...", "contexts": ["..."] }`.
    * Internamente, o aplicativo expande isso para o formato completo do cartão FSRS:

        ```json
        {
            "question": "...",
            "answer": "...",
            "contexts": ["..."],
            "s": 0.1,  // Estabilidade
            "d": 0.5,  // Dificuldade
            "lastReview": null,
            "dueDate": null
        }
        ```
* **Lógica FSRS:** O aplicativo usa as funções `calculateRetention`, `calculateGrade` e `updateFsrsData` para gerenciar o agendamento dos cartões, seguindo de perto os princípios do algoritmo FSRS.
