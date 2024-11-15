import React, { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';

const LoginContext = createContext();

export const useLogin = () => useContext(LoginContext);

export const LoginProvider = ({ children }) => {
  const [isLogged , setisLogged] = useState(Cookies.get('jwtToken'));
  const [user , setUser] = useState('')

  let isLog = !!isLogged;

  const userAuthentication = async ()=> {
    try{
    const response = await fetch('http://127.0.0.1:5001/api/user/getUserInfo' , {
      method : 'GET',
      headers : {
        Authorization : `Bearer ${isLogged}`
      }
    });
    if (response.ok) {
      const data = await response.json();
      setUser(data.userDetails)
    }
  }catch(error) {
    console.log(error)
  }
  }

  useEffect(() => {
    userAuthentication()
  }, []);

  return (
    <LoginContext.Provider value={{user, isLog }}>
      {children}
    </LoginContext.Provider>
  );
};