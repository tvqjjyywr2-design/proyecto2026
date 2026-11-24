const TRAZOS = {
  // Polo con cuello y tapeta de botones.
  'Adulto Masculino': (
    <>
      <path d="M9 4 4.5 5.8 3 10l2.6 1V20h12.8v-9L21 10l-1.5-4.2L15 4" />
      <path d="M9 4c0 1.7 1.3 3 3 3s3-1.3 3-3" />
      <path d="M12 7.4v3.2" />
    </>
  ),
  // Vestido con tirantes y cintura marcada.
  'Adulto Femenino': (
    <>
      <path d="M8 5h8l1 5-2 2 3 9H6l3-9-2-2 1-5Z" />
      <path d="M9 5V3M15 5V3" />
    </>
  ),
  // Remera infantil de cuello redondo.
  'Infantil Niños': (
    <>
      <path d="M9 4.5 5 6l-1.5 3.5L6 10.4V20h12v-9.6l2.5-.9L19 6l-4-1.5" />
      <path d="M9 4.5c0 1.6 1.3 2.9 3 2.9s3-1.3 3-2.9" />
    </>
  ),
  // Pollera con cintura y tiradores.
  'Infantil Niñas': (
    <>
      <path d="M8.5 4h7l1.5 4-1.8 2 2.8 10H4l2.8-10L5 8l3.5-4Z" />
      <path d="M7 8h10" />
      <path d="M8.5 3v2.5M15.5 3v2.5" />
    </>
  ),
}

// Etiqueta de precio como respaldo para un tipo desconocido.
const FALLBACK = (
  <>
    <path d="M4 4h7l9 9-7 7-9-9V4Z" />
    <circle cx="8.5" cy="8.5" r="1.2" />
  </>
)

function CategoryIcon({ tipo }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="30"
      height="30"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {TRAZOS[tipo] || FALLBACK}
    </svg>
  )
}

export default CategoryIcon
