import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, RouterProvider,createBrowserRouter, Route, createRoutesFromElements } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { AuthProvider } from './context/AuthContext.jsx'
import { ChatProvider } from './context/ChatContext.jsx'
import Layout from './Layout.jsx'
import App from './App.jsx'
import Login from './Components/Login.jsx'
import Signup from './Components/Signup.jsx'
import WelcomePage from './Components/WelcomePage/WelcomePage.jsx'
import PrivateRoute from './Components/PrivateRoute.jsx'
import Home from './Components/Home.jsx'
import NewChat from './Components/NewChat.jsx'
import NoHeaderFooterLayout from './NoHeaderFooterLayout.jsx'
import ChatPage from './Components/chatPage.jsx'
const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Layout with header/footer */}
      <Route element={<Layout />}>
        <Route index element={<WelcomePage />} />
        <Route element={<PrivateRoute />}>
          <Route path="/home" element={<Home />} />
          <Route path="/new-chat" element={<NewChat/>}/>
          <Route path="/chat/:pdfId" element={<ChatPage />} />
        </Route>
      </Route>

      {/* Layout without header/footer */}
      <Route element={<NoHeaderFooterLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Route>
    </>
  )
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
   <AuthProvider>
    <ChatProvider>
      <RouterProvider router={router} />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      </ChatProvider>
    </AuthProvider>
  </StrictMode>,
)
