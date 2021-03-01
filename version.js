class Lumo extends HTMLElement {
  static get version() {
    return '1.7.0-alpha2';
  }
}

customElements.define('vaadin-lumo-styles', Lumo);

export { Lumo };
