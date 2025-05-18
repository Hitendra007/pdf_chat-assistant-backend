import axios from 'axios';
// const API_BASE_URL = 'http://localhost:8000/api/v1';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const websocket_url = import.meta.env.VITE_WEBSOCKET_URL;

const apiclient = axios.create({
    baseURL:API_BASE_URL,
    headers:{
        "Content-Type":"application/json"
    },
    withCredentials:true
});


const signup = async (email , password) => {
    const response = await apiclient.post('/auth/register/',{email,password});
    return response;
}

const login = async (email , password) => {
    const response = await apiclient.post('/auth/login/',{email,password});
    return response;
}

const logout = async () => {
    const response = await apiclient.get('/auth/logout/');
    return response;
}

const checkAuthStatus = async () => {
    const response = await apiclient.get('/auth/authStatus/');
    return response;
}   

export {signup,login,logout,checkAuthStatus,API_BASE_URL,websocket_url};