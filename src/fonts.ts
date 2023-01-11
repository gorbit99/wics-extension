export function injectFonts() {
  if (document.querySelector(".wics-font")) {
    return;
  }

  addFont(
    "https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&display=swap"
  );
  addFont(
    "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.1/css/all.min.css"
  );
}

function addFont(href: string) {
  const font = document.createElement("link");
  font.type = "text/css";
  font.rel = "stylesheet";
  font.href = href;
  font.classList.add("wics-font");
  document.head.append(font);
}
