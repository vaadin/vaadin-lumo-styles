const fixme = `
/*
  FIXME(polymer-modulizer): the above comments were extracted
  from HTML and may be out of place here. Review them and
  then delete this comment!
*/
;`

module.exports = {
  files: require('./package.json').files,
  from: [
    "const $_documentContainer = document.createElement('template');",
    "$_documentContainer.innerHTML = `",
    fixme
  ],
  to: [
    "import { html } from '@polymer/polymer/lib/utils/html-tag.js';",
    "const $_documentContainer = html`",
    ""
  ]
}
