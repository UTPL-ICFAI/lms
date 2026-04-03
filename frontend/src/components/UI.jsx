export const Button = ({ children, variant = 'primary', size = 'md', ...props }) => {
  const baseStyles =
    'font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-2 min-h-[44px] sm:min-h-0 active:scale-[0.98]'
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-green-600 text-white hover:bg-green-700',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
  }
  const sizes = {
    sm: 'px-3 py-2 text-sm min-h-[40px] sm:min-h-[36px] sm:py-1',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg min-h-[48px]',
  }

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100`}
      {...props}
    >
      {children}
    </button>
  )
}

export const Input = ({ label, error, ...props }) => {
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-semibold mb-2">{label}</label>}
      <input
        className={`input ${error ? 'border-red-500' : 'border-gray-300'}`}
        {...props}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  )
}

export const Card = ({ children, title, className = '' }) => {
  return (
    <div className={`card ${className}`}>
      {title && (
        <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">{title}</h2>
      )}
      {children}
    </div>
  )
}

export const Badge = ({ children, variant = 'info' }) => {
  const variants = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  }
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${variants[variant]}`}>
      {children}
    </span>
  )
}

export const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 overflow-y-auto overscroll-contain"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-t-xl sm:rounded-lg shadow-lg w-full max-w-lg max-h-[min(92vh,900px)] flex flex-col mx-0 sm:mx-auto">
        <div className="flex justify-between items-center gap-3 p-4 sm:p-6 border-b shrink-0">
          <h2 className="text-lg sm:text-xl font-bold pr-2 break-words">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] shrink-0 flex items-center justify-center text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0">{children}</div>
      </div>
    </div>
  )
}

export const Table = ({ columns, data, actions, onEdit, onDelete, onRestore }) => {
  return (
    <div className="-mx-1 sm:mx-0 overflow-x-auto rounded-lg border border-gray-200 shadow-sm [scrollbar-gutter:stable]">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-gray-100">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-semibold whitespace-nowrap">
                {col.label}
              </th>
            ))}
            {actions && (
              <th className="px-3 sm:px-6 py-3 text-xs sm:text-sm font-semibold whitespace-nowrap">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row._id} className="table-row">
              {columns.map((col) => (
                <td key={col.key} className="px-3 sm:px-6 py-3 align-top break-words max-w-[240px] sm:max-w-none">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
              {actions && (
                <td className="px-3 sm:px-6 py-3 align-top">
                  <div className="flex flex-wrap gap-2">
                    {onEdit && (
                      <Button size="sm" variant="secondary" onClick={() => onEdit(row)}>
                        Edit
                      </Button>
                    )}
                    {onDelete && !row.isDeleted && (
                      <Button size="sm" variant="danger" onClick={() => onDelete(row._id)}>
                        Delete
                      </Button>
                    )}
                    {onRestore && row.isDeleted && (
                      <Button size="sm" variant="success" onClick={() => onRestore(row._id)}>
                        Restore
                      </Button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export const StatCard = ({ title, value, icon: Icon, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-600',
  }

  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-gray-600 text-sm">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold mt-2 break-words">{value}</p>
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg shrink-0 ${colors[color]}`}>
            <Icon size={32} />
          </div>
        )}
      </div>
    </div>
  )
}
