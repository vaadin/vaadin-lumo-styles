module.exports = {
  files: require('./package.json').files,
  from: [
    "const $_documentContainer = document.createElement('template');",
    "$_documentContainer.innerHTML = `"
  ],
  to: [
    "import { html } from '@polymer/polymer/lib/utils/html-tag.js';",
    "const $_documentContainer = html`"
  ]
}
