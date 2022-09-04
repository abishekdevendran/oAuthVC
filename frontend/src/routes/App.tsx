import React, { useContext } from 'react'
import { Link, Navigate } from 'react-router-dom'
import UserContext from '../contexts/UserContext';

const App = () => {
  const {user}=useContext(UserContext);
  if(user.isLoggedIn){
    return <Navigate to="/vc" state={{from:true}}/>
  }
  else{
    return <Navigate to="/login" state={{from:true}}/>
  }
}

export default App