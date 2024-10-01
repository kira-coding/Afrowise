import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react'

import {createBrowserRouter, RouterProvider} from "react-router-dom"
import Home from './pages/Home'
import NotFound from './pages/NotFound'

const router = createBrowserRouter([
{
  path: "/",
  element: <Home/>,
  errorElement: <NotFound/>,
}
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChakraProvider>
      <RouterProvider router={router}/>
    </ChakraProvider>
  </StrictMode>,
)
