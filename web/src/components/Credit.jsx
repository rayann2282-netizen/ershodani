// سطر صغير آخر كل صفحة: مين سوّى الموقع، ورابط حسابه في LinkedIn.
const LINKEDIN = 'https://www.linkedin.com/in/rayan-alqahtani-2532a635a'

export function Credit() {
  return (
    <footer className="credit caption muted">
      مؤسس الموقع: ريان القحطاني ·{' '}
      <a href={LINKEDIN} target="_blank" rel="noopener noreferrer">
        <bdi dir="ltr">LinkedIn</bdi>
      </a>
    </footer>
  )
}
