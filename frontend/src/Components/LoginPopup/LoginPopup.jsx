import React, { useState } from 'react';
import './LoginPopup.css';
import { assets } from '../../assets/assets';
import api from '../../api';

const LoginPopup = ({ setShowLogin, setUser }) => {
  const [currState, setCurrState] = useState("Login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleLogin = () => {
    console.log("Login request payload:", username, password);

    api.post("/token/", {
      username: username,
      password: password,
    })
      .then((res) => {
        console.log("Login success:", res.data);
        localStorage.setItem("access", res.data.access);
        localStorage.setItem("refresh", res.data.refresh);
        localStorage.setItem("username", username);
        if (setUser) setUser(username);
        setShowLogin(false);
      })
      .catch((err) => {
        console.error("Login failed:", err.response?.data || err);
        alert("Login failed. Please check your credentials.");
      });
  };

  return (
    <div className="login-popup">
      <div className="login-popup-container">
        <div className="login-popup-title">
          <h2>{currState}</h2>
          <img onClick={() => setShowLogin(false)} src={assets.cross_icon} alt="close" />
        </div>

        <div className="login-popup-inputs">
          {currState === "Sign Up" && (
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <input
            type="text"
            placeholder="Your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button onClick={currState === "Login" ? handleLogin : () => alert("Sign up not implemented yet")}>
          {currState === "Login" ? "Login" : "Create account"}
        </button>

        <div className="login-popup-condition">
          <input type="checkbox" />
          <p>By continuing, I agree to the terms of use & privacy policy.</p>
        </div>

        {currState === "Login" ? (
          <p>Create a new account? <span onClick={() => setCurrState("Sign Up")}>Click here</span></p>
        ) : (
          <p>Already have an account? <span onClick={() => setCurrState("Login")}>Login here</span></p>
        )}
      </div>
    </div>
  );
};

export default LoginPopup;