import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import WelcomePage from './Components/WelcomePage/WelcomePage'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <WelcomePage></WelcomePage>
    </>
  )
}

export default App
