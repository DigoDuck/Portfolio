import { FiAlertCircle } from "react-icons/fi";

// Erro em ícone + texto na cor da tinta: o vermelho é a cor de sinal da marca,
// e usá-lo aqui confundiria "caminho" com "falha".
export default function ErrorNote({ children, role = "alert", className = "" }) {
  return (
    <p role={role} className={`flex items-start gap-2 text-sm text-ink ${className}`}>
      <FiAlertCircle aria-hidden="true" className="mt-0.5 shrink-0" />
      {children}
    </p>
  );
}
