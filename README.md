# Treino de Associação

Um jogo interativo de aprendizado baseado em perguntas e respostas, desenvolvido para facilitar a memorização através de associações visuais e auditivas.

## Características

### Sistema de Jogo
- **Sistema de níveis**: Perguntas organizadas em grupos de 5 itens
- **Pontuação**: Sistema de pontos que recompensa acertos sem uso de dicas
- **Ordem aleatória**: Opção de embaralhar as perguntas
- **Partículas animadas**: Efeitos visuais ao acertar respostas

### Dicas Visuais
- **Dica de cor**: Cada pergunta recebe uma cor única baseada em hash
- **Dica de posição**: Perguntas aparecem em posições consistentes na tela
- **Dica de letras**: Mostra as primeiras letras da resposta (configurável 0-3 letras)

### Funcionalidades de Áudio
- **Síntese de voz**: Leitura automática das perguntas
- **Seleção de voz**: Escolha entre diferentes vozes disponíveis no navegador
- **Sons de feedback**: Efeitos sonoros para acertos e erros (configuráveis)

### Personalização
- **Modo escuro**: Interface adaptável para diferentes preferências visuais
- **Configurações persistentes**: Preferências salvas automaticamente
- **Arquivo salvo**: O último arquivo JSON carregado é mantido entre sessões

## Formato do Arquivo JSON

O jogo utiliza arquivos JSON com o seguinte formato:

```json
[
  {
    "question": "hello",
    "answer": "ola"
  },
  {
    "question": "world",
    "answer": "mundo"
  },
  {
    "question": "cat",
    "answer": "gato"
  }
]
```

### Campos Obrigatórios
- `question`: A pergunta ou termo a ser exibido
- `answer`: A resposta correta esperada

### Regras
- O arquivo deve ser um array JSON válido
- Cada objeto deve conter os campos `question` e `answer`
- Respostas devem ser digitadas exatamente como especificadas (case-sensitive)
- Suporta letras (a-z), espaços e apóstrofos

## Como Usar

### Iniciando o Jogo
1. Abra o arquivo HTML no navegador
2. Clique no ícone de configurações (engrenagem azul)
3. Clique em "Selecionar Arquivo" e escolha seu arquivo JSON
4. O jogo iniciará automaticamente

### Jogando
1. Uma pergunta aparecerá na tela com dicas visuais
2. Digite a resposta usando o teclado
3. Pressione **Enter** para confirmar
4. Se errar, a resposta correta será exibida
5. Acertos sem usar a dica de resposta aumentam sua pontuação
6. Complete todos os grupos para terminar o jogo

### Controles
- **Letras (a-z)**: Digite a resposta
- **Espaço**: Adiciona espaço na resposta
- **Apóstrofo (')**: Adiciona apóstrofo na resposta
- **Backspace**: Remove o último caractere
- **Enter**: Confirma a resposta

## Configurações

### Panel de Configurações
Acesse clicando no ícone de engrenagem no canto superior esquerdo.

#### Dicas
- **Número de letras da dica**: Controla quantas letras iniciais da resposta são mostradas (0-3)
- **Dica de Cor**: Ativa/desativa cores únicas para cada pergunta
- **Dica de Posição**: Ativa/desativa posicionamento consistente na tela

#### Gameplay
- **Ordem Aleatória**: Embaralha as perguntas a cada novo jogo

#### Áudio
- **Som de Acerto**: Ativa/desativa som ao acertar (requer arquivo `right.mp3`)
- **Som de Erro**: Ativa/desativa som ao errar (requer arquivo `wrong.mp3`)
- **Voz da leitura**: Selecione uma voz para leitura automática das perguntas

#### Visual
- **Modo Escuro**: Alterna entre tema claro e escuro

## Arquivos Necessários

### Obrigatórios
- `index.html`: Arquivo principal do jogo (este arquivo)
- Arquivo JSON com perguntas e respostas

### Opcionais (para sons)
- `right.mp3`: Som de resposta correta
- `wrong.mp3`: Som de resposta errada

## Armazenamento

O jogo utiliza armazenamento persistente para:
- **Preferências do usuário**: Todas as configurações são salvas automaticamente
- **Último arquivo**: O conteúdo do último arquivo JSON carregado é preservado

## Tecnologias Utilizadas

- HTML5
- CSS3 (com suporte a modo escuro)
- JavaScript (Vanilla)
- Web Speech API (síntese de voz)
- FileReader API (leitura de arquivos)
- Storage API (persistência de dados)

## Compatibilidade

- Navegadores modernos com suporte a:
  - ES6+ JavaScript
  - Web Speech API
  - FileReader API
  - Storage API
- Testado em Chrome, Firefox, Edge e Safari

## Solução de Problemas

### O arquivo não está sendo carregado
- Verifique se o arquivo é um JSON válido
- Certifique-se de que cada objeto tem `question` e `answer`
- Abra o console do navegador (F12) para ver mensagens de erro

### A voz não está funcionando
- Verifique se o navegador suporta Web Speech API
- Algumas vozes podem não estar disponíveis em todos os sistemas
- Tente selecionar uma voz diferente nas configurações

### Sons não estão tocando
- Certifique-se de que os arquivos `right.mp3` e `wrong.mp3` estão no mesmo diretório
- Alguns navegadores bloqueiam áudio até interação do usuário
- Verifique se os sons estão habilitados nas configurações

### Preferências não estão sendo salvas
- Verifique o console do navegador (F12) para erros de storage
- Certifique-se de que o navegador permite armazenamento local
- Alguns modos de navegação privada podem bloquear storage

## Licença

Este projeto é de código aberto e pode ser usado livremente para fins educacionais.
