import React, { createContext, useState, useEffect, useContext, useRef } from "react";
import { get_chat_sessions } from "../api/Chat";
import { useAuth } from "./AuthContext";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [chat_sessions, setChatSessions] = useState([]);
    const [loading, setLoading] = useState(false);
    const { isAuthenticated } = useAuth();
    const fetchingRef = useRef(false);

    const get_sessions = async () => {
        // Prevent multiple simultaneous calls
        if (fetchingRef.current) {
            return;
        }
        
        try {
            fetchingRef.current = true;
            setLoading(true);
            const response = await get_chat_sessions();
            setChatSessions(response.data.data.chat_sessions || []);
        } catch (error) {
            console.error("Can't fetch sessions", error);
            setChatSessions([]);
        } finally {
            fetchingRef.current = false;
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated && !fetchingRef.current) {
            get_sessions();
        } else if (!isAuthenticated) {
            setChatSessions([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]);

    return (
        <ChatContext.Provider value={{ chat_sessions, loading, refreshSessions: get_sessions }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => useContext(ChatContext);
