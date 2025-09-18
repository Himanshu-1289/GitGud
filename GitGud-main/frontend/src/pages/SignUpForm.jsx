import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useContext,useState } from 'react';
import {AuthContext} from '@/context/auth-context'
import { axiosInstance } from '@/axios';
const SignUpForm = () => {
  const navigate = useNavigate();
  const { setAccessToken, setRefreshToken } = useContext(AuthContext);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== repeatPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    if (!agreeTerms) {
      setErrorMsg("You must agree to the Terms and Privacy Policy.");
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await axiosInstance.post('/register', {
        username: name,
        email,
        password,
      });

      setAccessToken(response?.data?.ACCESS_TOKEN);
      setRefreshToken(response?.data?.REFRESH_TOKEN);

      navigate('/home');
    } catch (error) {
      console.error(error);
      if (error.response?.data?.detail) {
        setErrorMsg(error.response.data.detail);
      } else {
        setErrorMsg("Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-normal text-white mb-2">Hello!</h1>
        <p className="text-xl text-white">We are glad to see you :)</p>
      </div>

      {errorMsg && (
        <div className="mb-4 px-4 py-2 text-sm text-white bg-red-500 rounded">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-white text-sm mb-1">Name</label>
            <input
              type="text"
              className="w-full bg-transparent border border-white rounded-full px-4 py-2 text-white"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-white text-sm mb-1">Email Address</label>
            <input
              type="email"
              className="w-full bg-transparent border border-white rounded-full px-4 py-2 text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-white text-sm mb-1">Password</label>
            <input
              type="password"
              className="w-full bg-transparent border border-white rounded-full px-4 py-2 text-white"
              placeholder="xxxxxxxx"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-white text-sm mb-1">Repeat Password</label>
            <input
              type="password"
              className="w-full bg-transparent border border-white rounded-full px-4 py-2 text-white"
              placeholder="xxxxxxxx"
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="form-checkbox rounded text-teal-500 border-white border transition cursor-pointer"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
            />
            <span className="ml-2 text-white text-sm">
              I agree <a href="#" className="underline">Terms of Service</a> and <a href="#" className="underline">Privacy Policy</a>
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-full transition cursor-pointer"
        >
          {isLoading ? 'Signing up...' : 'Sign Up'}
        </button>
      </form>
    </div>
  );
};

export default SignUpForm;
