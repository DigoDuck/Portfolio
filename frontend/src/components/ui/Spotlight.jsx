import { useRef, useState } from "react";

// Destaque circular que segue o mouse (ver .spotlight-layer em index.css).
// Renderiza os filhos e, a partir do primeiro hover de mouse, uma cópia deles
// na cor de sinal recortada por uma máscara circular. A cópia é decorativa:
// aria-hidden, sem eventos de ponteiro, e nunca montada em toque.
//
// Regras de uso: o elemento não pode ter padding (a cópia é absoluta sobre a
// caixa de padding e desalinharia do original), e space-y ou gap devem ficar
// num filho interno (senão a cópia vira mais um irmão espaçado).
export default function Spotlight({ as: Tag = "div", className = "", style, children }) {
  const [armed, setArmed] = useState(false);
  const layerRef = useRef(null);
  // Dentro de um <p>, só elementos de frase são válidos.
  const Layer = Tag === "p" ? "span" : "div";

  // Posição direto no DOM via variáveis CSS: sem re-render a cada movimento.
  const follow = (e) => {
    const layer = layerRef.current;
    if (e.pointerType !== "mouse" || !layer) return;
    const box = e.currentTarget.getBoundingClientRect();
    layer.style.setProperty("--spot-x", `${e.clientX - box.left}px`);
    layer.style.setProperty("--spot-y", `${e.clientY - box.top}px`);
    layer.dataset.active = "true";
  };

  const arm = (e) => {
    if (e.pointerType !== "mouse") return;
    setArmed(true);
    follow(e);
  };

  const hide = () => {
    if (layerRef.current) layerRef.current.dataset.active = "false";
  };

  return (
    <Tag
      data-spotlight
      className={`relative ${className}`}
      style={style}
      onPointerEnter={arm}
      onPointerMove={follow}
      onPointerLeave={hide}
    >
      {children}
      {armed && (
        <Layer
          ref={layerRef}
          data-spotlight-layer
          aria-hidden="true"
          className="spotlight-layer pointer-events-none absolute inset-0 block select-none !text-signal [&_*]:!border-transparent [&_*]:!text-signal"
        >
          {children}
        </Layer>
      )}
    </Tag>
  );
}
