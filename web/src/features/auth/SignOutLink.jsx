import { useNavigate } from 'react-router'
import { useAuth } from './AuthContext.jsx'

// رابط صغير «اطلع من حسابك»: يطلع من Supabase ويرجعه لصفحة الدخول.
export function SignOutLink() {
  const { signOut, isGuest } = useAuth()
  const navigate = useNavigate()

  async function handleClick() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <button type="button" className="link muted" style={{ alignSelf: 'center', marginInlineStart: 0 }} onClick={handleClick}>
      {isGuest ? 'اطلع من وضع الضيف (بتضيع بياناتك)' : 'اطلع من حسابك'}
    </button>
  )
}
