import { Link } from 'react-router'
import { BackIcon } from './Icons.jsx'
import { LogoTile } from './Logo.jsx'

// رأس الشاشات اللي فيها رجوع: السهم يمين، والشعار يسار.
// `children` هو اللي يجي في النص (مثل «خطتك» أو شريط التقدم).
export function BackHeader({ to, label = 'رجوع', children }) {
  return (
    <header className="header">
      <Link to={to} className="icon-btn" aria-label={label}>
        <BackIcon />
      </Link>
      {children}
      <div className="header__end">
        <LogoTile alone />
      </div>
    </header>
  )
}

// شريط «خطوة ١ من ٢» يتعبى من اليمين.
export function Steps({ step, total = 2, percent }) {
  const steps = ['١', '٢', '٣']
  return (
    <div className="stack steps">
      <div className="caption semibold muted">
        خطوة {steps[step - 1]} من {steps[total - 1]}
      </div>
      <div className="progress">
        <div className="progress__fill" style={{ width: `${percent ?? (step / total) * 100}%` }} />
      </div>
    </div>
  )
}
