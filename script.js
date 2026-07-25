window.addEventListener("scroll", () => {
  const posicion = window.scrollY;

  const fondoSlow = posicion * 0.4;

  document.body.style.backgroundPositionY = fondoSlow + "px";
});
