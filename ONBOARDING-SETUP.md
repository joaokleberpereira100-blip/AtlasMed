# Setup do Onboarding do AtlasMed

## 📋 O que é

Um tour interativo visual que aparece **apenas uma vez** quando o aluno entra no `/app/` pela primeira vez. Mostra em 2 minutos como:
- Buscar por assunto
- Acessar a biblioteca
- Estudar PDFs
- Começar a usar a plataforma

## 🎯 Características

✅ **Não é intrusivo**: Fácil de pular ou fechar  
✅ **Responsivo**: Funciona em mobile, tablet e desktop  
✅ **LocalStorage**: Aparece apenas uma vez por usuário  
✅ **Navegação**: Anterior, próximo, ou pular para qualquer passo  
✅ **Teclado**: Setas para navegar, ESC para sair  
✅ **Rápido**: Menos de 2 minutos para completar  

## 🚀 Como integrar

### 1. Crie uma página HTML simples no `/app/`

Crie um arquivo chamado `index.html` que seja a página inicial do app:

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AtlasMed - Plataforma de Estudos</title>
  <style>
    /* Seus estilos aqui */
  </style>
</head>
<body>
  <!-- Seu conteúdo do app aqui -->
  
  <!-- Carregue o onboarding no final do body -->
  <iframe id="onboarding" src="onboarding.html" style="display: none;"></iframe>
  
  <script>
    // Mostrar onboarding se for primeira vez
    if (!localStorage.getItem('atlasmed_onboarding_done')) {
      const frame = document.getElementById('onboarding');
      frame.style.display = 'block';
      frame.style.position = 'fixed';
      frame.style.inset = '0';
      frame.style.border = 'none';
      frame.style.zIndex = '10000';
    }
  </script>
</body>
</html>
```

### 2. Alternativa: Carregue como script

Se você quer que o onboarding seja parte do HTML, inclua o código no seu arquivo principal:

```html
<!DOCTYPE html>
<html>
<head>
  <!-- Seu head -->
</head>
<body>
  <!-- Seu conteúdo -->
  
  <!-- Inclua o onboarding.html como parte do layout -->
  <script src="onboarding.js"></script>
</body>
</html>
```

## 📁 Estrutura de arquivos

```
/app/
  index.html              (página principal)
  onboarding.html         (o tour interativo)
  assets/                 (imagens, etc)
  js/                     (seu JavaScript)
  css/                    (seus estilos)
```

## ⚙️ Customização

### Mudar cores dos passos

No arquivo `onboarding.html`, localize:

```css
.ob-icon.step-1 {
  background: #e8eff9;    /* Cor do fundo */
  color: #12347f;         /* Cor do ícone */
}
```

### Mudar textos

Edite os textos dentro das `<div class="step">`:

```html
<h2>Seu novo título</h2>
<p>Seu novo texto</p>
```

### Mudar emojis

Substitua os emojis (👋, 🔍, 📚, etc) por outros ou use ícones SVG.

### Adicionar mais passos

1. Crie um novo `<div class="step hidden" id="step-6">`
2. Aumente `totalSteps = 6` no JavaScript
3. Adicione um novo `<span class="ob-dot">` na seção de dots

## 🔍 Como funciona

1. **Primeira visita**: O `localStorage` está vazio, então o onboarding aparece
2. **Usuário completa**: Ao finalizar, salva `atlasmed_onboarding_done: true` no localStorage
3. **Próximas visitas**: O onboarding não aparece (já foi visto)

Para **resetar o onboarding** (útil para testes):

```javascript
// No console do navegador:
localStorage.removeItem('atlasmed_onboarding_done');
```

## 📱 Responsividade

O onboarding funciona em:
- ✅ Desktop (520px+)
- ✅ Tablet (360px - 520px)
- ✅ Mobile (até 360px)

O tamanho modal se adapta automaticamente.

## 🎨 Estados do onboarding

| Estado | O que acontece |
|--------|----------------|
| **Primeira vez** | Modal aparece com overlay |
| **Navegação** | Botões Anterior/Próximo funcionam |
| **Pular** | Fecha e não aparece mais |
| **Teclado** | Setas esquerda/direita, ESC para sair |
| **Mobile** | Touch funciona normalmente |

## ✨ Melhorias futuras

Se quiser adicionar depois:
- Tooltip com destaque em elementos específicos (usando `z-index` e `position`)
- Animações de entrada e saída por passo
- Contadores de progresso (ex: "Passo 2 de 4")
- Vídeos curtos em cada passo
- Integração com analytics para rastrear conclusão

## 🔄 Botão "Ver tour novamente"

Os usuários podem querer rever o tour. Você pode adicionar um botão em qualquer lugar do seu app.

### Opção 1: Botão flutuante no canto (Recomendado)

```javascript
<script src="onboarding-helper.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', function() {
    AtlasmedOnboarding.createButton({
      position: 'bottom-right',    // 'bottom-right' ou 'bottom-left'
      text: '? Ajuda',
      backgroundColor: '#12347f',
      textColor: '#fff'
    });
  });
</script>
```

### Opção 2: Botão em um elemento específico

```html
<button id="help-btn" class="btn">Ver tour</button>

<script src="onboarding-helper.js"></script>
<script>
  document.getElementById('help-btn').addEventListener('click', () => {
    AtlasmedOnboarding.restartTour();
  });
</script>
```

### Opção 3: Link em um menu de configurações

```html
<nav id="user-menu">
  <!-- Seus outros itens de menu -->
</nav>

<script src="onboarding-helper.js"></script>
<script>
  AtlasmedOnboarding.addToMenu(document.getElementById('user-menu'));
</script>
```

### Opção 4: Chamar diretamente no console

```javascript
// Usuário pode executar no console do navegador:
AtlasmedOnboarding.restartTour();
```

## 🧪 Teste localmente

1. Abra `onboarding.html` no navegador
2. Teste navegação (Anterior, Próximo, Pular)
3. Feche e reabra (não deve aparecer mais)
4. Clique no botão "Ver tour novamente" (se implementar)
5. O tour deve aparecer novamente
6. Reset manual no console: `localStorage.removeItem('atlasmed_onboarding_done')` + `location.reload()`

## 📞 Suporte

O onboarding foi criado para ser:
- **Independente**: Não depende de bibliotecas externas
- **Leve**: Carrega muito rápido (~5KB)
- **Flexível**: Fácil de customizar
- **Acessível**: Funciona com teclado e mouse

Qualquer dúvida, adapte o `onboarding.html` conforme sua necessidade!
