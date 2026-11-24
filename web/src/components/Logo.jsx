import logo from '../assets/logo.jpg'

// بلاطة الشعار. لو الاسم جنبها نخلي alt فاضي، ولو لحالها alt="ارشدني".
export function LogoTile({ large = false, alone = false }) {
  return (
    <div className={large ? 'logo-tile logo-tile--lg' : 'logo-tile'}>
      <img src={logo} alt={alone ? 'ارشدني' : ''} />
    </div>
  )
}

// البلاطة + كلمة «ارشدني».
export function LogoLockup({ large = false }) {
  return (
    <div className="logo-lockup">
      <LogoTile large={large} />
      <span>ارشدني</span>
    </div>
  )
}
