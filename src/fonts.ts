export function injectFonts(shadowDom: ShadowRoot) {
  addFont(
    "//fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&display=swap",
    shadowDom
  );
  addFont(
    "//cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.1/css/all.min.css",
    shadowDom
  );
}

function addFont(href: string, shadowDom: ShadowRoot) {
  const font = document.createElement("link");
  font.type = "text/css";
  font.rel = "stylesheet";
  font.href = href;
  font.classList.add("wics-font");

  shadowDom.append(font.cloneNode(true));

  if (document.querySelector(`.wics-font[href="${href}"]`)) {
    return;
  }
  document.head.append(font);
}
