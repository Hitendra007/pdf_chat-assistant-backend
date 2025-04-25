import React, { createContext, useState, useEffect, useContext } from "react";
import { get_chat_sessions } from "../api/Chat";
import { useAuth } from "./AuthContext";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [chat_sessions, setChatSessions] = useState([]);
    const { isAuthenticated } = useAuth();

    const get_sessions = async () => {
        try {
            const response = await get_chat_sessions();
            console.log("Chat sessions:", response);
            setChatSessions(response.data.data.chat_sessions);
        } catch (error) {
            console.error("Can't fetch sessions", error);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            get_sessions();
        }
    }, [isAuthenticated]);

    return (
        <ChatContext.Provider value={{ chat_sessions }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => useContext(ChatContext);
