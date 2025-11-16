import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const apiclient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json"
    },
    withCredentials: true
});


const get_chat_sessions = async ()=>{
    const response =  await apiclient.get('/chat_data/get_chat_session')
    return response
}

export {get_chat_sessions}