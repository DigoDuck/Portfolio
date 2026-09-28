// Grid de duas colunas usado pelas seções abaixo do hero: título à esquerda,
// conteúdo à direita, uma régua separando cada seção da anterior.
export default function Section({ id, title, children }) {
  const headingId = `${id}-title`;

  return (
    <section id={id} aria-labelledby={headingId} className="scroll-mt-16 border-t border-rule">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-8 md:grid-cols-12 md:gap-6 md:py-24">
        <h2 id={headingId} className="text-title font-bold md:col-span-3">
          {title}
        </h2>
        <div className="md:col-span-9">{children}</div>
      </div>
    </section>
  );
}
