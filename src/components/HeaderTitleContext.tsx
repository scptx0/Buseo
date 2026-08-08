import { createContext, useContext, useState } from 'react'

interface HeaderTitleContextValue {
  title: string | null
  setTitle: (title: string | null) => void
}

const HeaderTitleContext = createContext<HeaderTitleContextValue>({
  title: null,
  setTitle: () => {},
})

export function HeaderTitleProvider({ children }: { children: React.ReactNode }) {
  const [title, setTitle] = useState<string | null>(null)
  return (
    <HeaderTitleContext.Provider value={{ title, setTitle }}>
      {children}
    </HeaderTitleContext.Provider>
  )
}

export function useHeaderTitle() {
  return useContext(HeaderTitleContext)
}
