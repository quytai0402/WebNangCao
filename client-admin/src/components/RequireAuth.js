import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import MyContext from '../contexts/MyContext';

function RequireAuth({ children }) {
  const context = useContext(MyContext);
  
  if (!context.token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

export default RequireAuth;