import './version.js';
import { css } from '@vaadin/vaadin-themable-mixin/register-styles.js';

const sizing = css`
:host {
  --lumo-size-xs: 1.625rem;
  --lumo-size-s: 1.875rem;
  --lumo-size-m: 2.25rem;
  --lumo-size-l: 2.75rem;
  --lumo-size-xl: 3.5rem;

  /* Icons */
  --lumo-icon-size-s: 1.25em;
  --lumo-icon-size-m: 1.5em;
  --lumo-icon-size-l: 2.25em;
  /* For backwards compatibility */
  --lumo-icon-size: var(--lumo-icon-size-m);
}
`;
const $tpl = document.createElement('template');
$tpl.innerHTML = `<style>${sizing.toString().replace(':host', 'html')}</style>`;
document.head.appendChild($tpl.content);

export { sizing };
