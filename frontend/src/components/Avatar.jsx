// Reusable avatar — shows photo if available, otherwise initials
export default function Avatar({ name = '', avatarUrl = null, size = 32, className = '' }) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  const style = {
    width:  size,
    height: size,
    minWidth: size,
    fontSize: size * 0.36,
  }

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        style={style}
        className={`rounded-full object-cover ${className}`}
        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
      />
    )
  }

  return (
    <div
      style={style}
      className={`rounded-full bg-primary-600 flex items-center justify-center text-white font-bold flex-shrink-0 ${className}`}
    >
      {initials}
    </div>
  )
}
