import React, { useState } from "react";
import { Link , useNavigate} from "react-router-dom";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import Cookies from 'js-cookie'

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLogged, setIsLogged] = useState(Cookies.get('jwtToken'));
  
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [userLogin, setUserLogin] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    let name = e.target.name;
    let value = e.target.value;

    setUserLogin({ ...userLogin, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        "http://127.0.0.1:5001/api/user/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(userLogin),
        }
      );

      if (response.ok) {
        const data = await response.json();
        Storetoken(data.jwtToken);
        alert("Login successfully");
        setUserLogin({
          email: "",
          password: "",
        });
        navigate('/');
        window.location.reload();
      } else {
        alert("login fails");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to fetch");
    }
    // Handle login logic here
    // console.log("Login attempt with:", email, password);
  };

  const Storetoken = (serverToken) => {
    return Cookies.set("jwtToken", serverToken, { expires: 2 / 1440 });
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
      <div className="max-w-md w-full space-y-8 p-10 bg-gray-800 rounded-xl shadow-lg z-10">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-white">Welcome Back</h2>
          <p className="mt-2 text-sm text-gray-400">Sign in to your account</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="relative">
            <label className="text-sm font-bold text-gray-300 tracking-wide">
              Email
            </label>
            <div className="flex items-center mt-2">
              <FaEnvelope className="w-5 h-5 text-gray-400 absolute ml-3" />
              <input
                className="w-full text-base px-4 py-2 pl-10 border-2 border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 bg-gray-900 text-white"
                type="email"
                name="email"
                value={userLogin.email}
                onChange={handleChange}
                placeholder="mail@example.com"
                required
              />
            </div>
          </div>
          <div className="relative">
            <label className="text-sm font-bold text-gray-300 tracking-wide">
              Password
            </label>
            <div className="flex items-center mt-2">
              <FaLock className="w-5 h-5 text-gray-400 absolute ml-3" />
              <input
                className="w-full text-base px-4 py-2 pl-10 border-2 border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 bg-gray-900 text-white pr-10"
                type={showPassword ? "text" : "password"}
                name="password"
                value={userLogin.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                className="absolute right-3 text-gray-400 focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="w-full flex justify-center bg-gradient-to-r from-purple-500 to-pink-500 hover:bg-gradient-to-l hover:from-pink-500 hover:to-purple-500 text-gray-100 p-4 rounded-full tracking-wide font-semibold shadow-lg cursor-pointer transition ease-in duration-500"
            >
              Sign in
            </button>
          </div>
        </form>
        <div className="flex items-center justify-between mt-4">
          <span className="w-1/5 border-b dark:border-gray-600 lg:w-1/5"></span>
          <Link
            to="/auth/signup"
            className="text-xs text-center text-gray-400 uppercase hover:text-purple-500"
          >
            or sign up
          </Link>
          <span className="w-1/5 border-b dark:border-gray-600 lg:w-1/5"></span>
        </div>
      </div>
    </div>
  );
}

export default Login;