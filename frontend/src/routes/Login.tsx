import React, { useContext, useState } from "react";
import toast from "react-hot-toast";
import { Navigate, useNavigate } from "react-router-dom";
import UserContext from "../contexts/UserContext";

const Login = () => {
  const URL = import.meta.env.PROD
    ? "https://" + window.location.hostname
    : "http://" + window.location.hostname + ":5000";
  const { user, setUser } = useContext(UserContext);
  const [data, setData] = useState({ username: "", password: "" });
  const navigate=useNavigate();
  const signInHandler = async (e) => {
    e.preventDefault();
    console.log(data);
    try {
      const res = await fetch(`${URL}/api/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Access-Control-Allow-Origin": URL,
        },
        body: JSON.stringify({
          username: data.username,
          password: data.password,
        }),
      });
      if(res.status===401){
        toast("Invalid Credentials");
        return;
      }
      const resData = await res.json();
      console.log(resData);
      setUser({ name: data.username, isLoggedIn: true });
      navigate("/vc");
    } catch (err) {
      console.log(err);
    }
  };
  if (user?.isLoggedIn) {
    console.log("here omw to lobby");
    return <Navigate to="/vc" state={{ from: true }} />;
  } else {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <form
          onSubmit={signInHandler}
          className="max-w-sm rounded overflow-hidden shadow-lg text-center w-5/6 bg-bg-secondary p-5 py-9"
        >
          <h1 className="text-4xl font-semibold text-primary mb-5">Login</h1>
          <h2 className="text-xl font-semibold text-primary mb-5">Name:</h2>
          <input
            required
            type="text"
            name="username"
            placeholder="ex: minister-of-fame"
            onChange={(e) => setData({ ...data, username: e.target.value })}
            className="bg-bg-secondary border-b-2 border-brand-tertiary focus:outline-none focus:border-brand-primary focus:border-brand-primary-lg py-2 px-4 rounded text-brand-primary-lg"
          />
          <h2 className="text-xl font-semibold text-primary mb-5">Password:</h2>
          <input
            required
            type="password"
            name="username"
            placeholder="ex: minister-of-fame"
            onChange={(e) => setData({ ...data, password: e.target.value })}
            className="bg-bg-secondary border-b-2 border-brand-tertiary focus:outline-none focus:border-brand-primary focus:border-brand-primary-lg py-2 px-4 rounded text-brand-primary-lg"
          />
          <div className="mt-5 flex items-center justify-center">
            <button
              className="bg-brand-primary text-brand-tertiary font-bold py-2 px-4 rounded mx-2 hover:scale-110 transition-all"
              type="submit"
            >
              Sign in
            </button>
            <button
              onClick={() =>
                window.open(+ URL + "/auth/google", "_self")
              }
              className="bg-brand-primary text-brand-tertiary font-bold py-2 px-4 rounded mx-2 hover:scale-110 transition-all"
            >
              Sign in with google
            </button>
          </div>
        </form>
      </div>
    );
  }
};

export default Login;
