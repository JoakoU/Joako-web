window.addEventListener("scroll", () => {
  const posicion = window.scrollY;
  const fondoSlow = posicion * 0.3;
  document.body.style.backgroundPositionY = -200 + fondoSlow + "px";
});
