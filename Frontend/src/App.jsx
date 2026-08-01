import {RouterProvider} from "react-router"
import {router} from "./app.routes.jsx"
import { AuthProvider} from "./features/auth/auth.context.jsx"

function App() {
 

  return (
    <AuthProvide>
    <RouterProvider router={router} />
    </AuthProvide>
  )
}

export default App
