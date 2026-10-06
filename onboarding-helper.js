/**
 * AtlasMed Onboarding Helper
 * Fornece funções e componentes para integrar o onboarding no seu app
 *
 * Uso:
 *   1. Adicione <script src="onboarding-helper.js"></script> no seu HTML
 *   2. Use: AtlasmedOnboarding.createButton() ou AtlasmedOnboarding.restartTour()
 */

const AtlasmedOnboarding = {
  /**
   * Reinicia o tour de onboarding
   * Remove o localStorage e recarrega a página
   */
  restartTour: function() {
    localStorage.removeItem('atlasmed_onboarding_done');
    location.reload();
  },

  /**
   * Cria um botão flutuante no canto inferior direito para ver o tour novamente
   * @param {Object} options - Opções de customização
   *   - position: 'bottom-right' | 'bottom-left' (padrão: 'bottom-right')
   *   - text: Texto do botão (padrão: '? Ajuda')
   *   - backgroundColor: Cor de fundo (padrão: '#12347f')
   *   - textColor: Cor do texto (padrão: '#fff')
   */
  createButton: function(options = {}) {
    const {
      position = 'bottom-right',
      text = '? Ajuda',
      backgroundColor = '#12347f',
      textColor = '#fff'
    } = options;

    // Criar botão
    const button = document.createElement('button');
    button.textContent = text;
    button.style.cssText = `
      position: fixed;
      ${position === 'bottom-left' ? 'left: 20px' : 'right: 20px'};
      bottom: 20px;
      padding: 12px 20px;
      border-radius: 50px;
      border: 0;
      background-color: ${backgroundColor};
      color: ${textColor};
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      z-index: 9998;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: all 0.2s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Efeitos hover
    button.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px)';
      this.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.2)';
    });

    button.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    });

    // Click para reiniciar tour
    button.addEventListener('click', () => {
      this.restartTour();
    });

    // Adicionar ao DOM
    document.body.appendChild(button);

    return button;
  },

  /**
   * Cria um botão em um elemento específico
   * @param {HTMLElement} container - Elemento pai
   * @param {Object} options - Opções de customização
   */
  createButtonIn: function(container, options = {}) {
    const {
      text = 'Ver tour novamente',
      className = 'onboarding-button'
    } = options;

    const button = document.createElement('button');
    button.textContent = text;
    button.className = className;
    button.style.cssText = `
      padding: 10px 18px;
      border-radius: 8px;
      border: 1px solid #ddd;
      background-color: #fff;
      color: #12347f;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    `;

    button.addEventListener('mouseenter', function() {
      this.style.borderColor = '#12347f';
      this.style.backgroundColor = '#f0f4fb';
    });

    button.addEventListener('mouseleave', function() {
      this.style.borderColor = '#ddd';
      this.style.backgroundColor = '#fff';
    });

    button.addEventListener('click', () => {
      this.restartTour();
    });

    if (container) {
      container.appendChild(button);
    }

    return button;
  },

  /**
   * Adiciona um link "Ver tour" em um menu de configurações
   * @param {HTMLElement} menuContainer - Elemento do menu
   */
  addToMenu: function(menuContainer) {
    const item = document.createElement('a');
    item.href = '#';
    item.textContent = '? Ver tour novamente';
    item.style.cssText = `
      display: block;
      padding: 10px 16px;
      color: #12347f;
      text-decoration: none;
      font-size: 14px;
      border-bottom: 1px solid #eee;
      cursor: pointer;
      transition: background 0.2s;
    `;

    item.addEventListener('mouseenter', function() {
      this.style.backgroundColor = '#f5f5f5';
    });

    item.addEventListener('mouseleave', function() {
      this.style.backgroundColor = 'transparent';
    });

    item.addEventListener('click', (e) => {
      e.preventDefault();
      this.restartTour();
    });

    if (menuContainer) {
      menuContainer.appendChild(item);
    }

    return item;
  },

  /**
   * Exemplo de como usar em HTML:
   *
   * // Opção 1: Botão flutuante no canto
   * <script>
   *   document.addEventListener('DOMContentLoaded', function() {
   *     AtlasmedOnboarding.createButton({
   *       position: 'bottom-right',
   *       text: '? Ajuda',
   *       backgroundColor: '#12347f'
   *     });
   *   });
   * </script>
   *
   * // Opção 2: Botão em um container específico
   * <button id="help-btn">Clique aqui</button>
   * <script>
   *   document.getElementById('help-btn').addEventListener('click', () => {
   *     AtlasmedOnboarding.restartTour();
   *   });
   * </script>
   *
   * // Opção 3: Link no menu
   * <nav id="menu"></nav>
   * <script>
   *   AtlasmedOnboarding.addToMenu(document.getElementById('menu'));
   * </script>
   */
};

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AtlasmedOnboarding;
}
