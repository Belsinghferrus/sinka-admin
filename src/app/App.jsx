import { RouterProvider } from 'react-router-dom';
import AuthProvider from '../context/AuthProvider.jsx';
import router from './router.jsx';

export function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
