import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import {
  MessageSquare,
  Send,
  Search,
  Check,
  CheckCheck,
  MessageCircle,
  ChevronLeft,
  Activity
} from "lucide-react";

import AdminLayout from "../../components/AdminLayout";
import { getContacts, getChatHistory } from "../../api/chatApi";
import { getImageUrl } from "../../utils/imageHelper";
import useDebounce from "../../hooks/useDebounce";

export default function AdminChat() {
  const navigate = useNavigate();

  // Get current user from session storage
  const currentUser = JSON.parse(sessionStorage.getItem("user") || "{}");
  const currentUserId = currentUser.id;

  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState("");

  // Debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  // Use a ref for selectedContact to prevent socket recreation loop
  const selectedContactRef = useRef(selectedContact);
  useEffect(() => {
    selectedContactRef.current = selectedContact;
  }, [selectedContact]);

  // Load contacts list
  const fetchContactsList = async () => {
    try {
      setLoadingContacts(true);
      const res = await getContacts();
      if (res.status === 1) {
        const contactsData = res.data || [];
        setContacts(contactsData);
      }
    } catch (err) {
      console.error("Failed to load contacts:", err);
    } finally {
      setLoadingContacts(false);
    }
  };

  useEffect(() => {
    fetchContactsList();
  }, []);

  // Initialize socket connection
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    const socketUrl = import.meta.env.VITE_API_URL;
    console.log("🔌 Connecting to socket.io server:", socketUrl);

    socketRef.current = io(socketUrl, {
      auth: { token },
      transports: ["websocket", "polling"]
    });

    socketRef.current.on("connect", () => {
      console.log("✅ Socket connected successfully");
      setIsConnected(true);
    });

    socketRef.current.on("disconnect", () => {
      console.log("❌ Socket disconnected");
      setIsConnected(false);
    });

    socketRef.current.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
      setIsConnected(false);
    });

    // Listen for incoming messages
    socketRef.current.on("receive_message", (messageData) => {
      console.log("📩 Received new message:", messageData);
      
      const currentSelected = selectedContactRef.current;
      if (
        currentSelected &&
        (messageData.senderId === currentSelected.id || messageData.receiverId === currentSelected.id)
      ) {
        setMessages((prev) => [...prev, messageData]);
        scrollToBottom();
        getChatHistory(currentSelected.id).catch(console.error);
      } else {
        setContacts((prevContacts) => {
          const senderExists = prevContacts.some(c => c.id === messageData.senderId);
          if (!senderExists) {
            fetchContactsList();
            return prevContacts;
          }
          return prevContacts.map((c) => {
            if (c.id === messageData.senderId) {
              return {
                ...c,
                unreadCount: (c.unreadCount || 0) + 1,
                lastMessage: {
                  message: messageData.message,
                  createdAt: messageData.createdAt
                }
              };
            }
            return c;
          });
        });
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);



  // Fetch chat history for selected contact
  const handleSelectContact = async (contact) => {
    setSelectedContact(contact);
    setIsMobileChatOpen(true);
    setLoadingMessages(true);
    
    setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, unreadCount: 0 } : c));

    try {
      // Use simple getChatHistory API - admin will always be the one fetching
      const res = await getChatHistory(contact.id);
      
      if (res.status === 1) {
        setMessages(res.data || []);
      } else {
        alert(res.message || "Failed to load chat");
        setSelectedContact(null);
        setIsMobileChatOpen(false);
      }
    } catch (err) {
      console.error("Failed to fetch chat history:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to load chat";
      alert(errorMessage);
      setSelectedContact(null);
      setIsMobileChatOpen(false);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Scroll messages pane to bottom
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // Filter contacts based on search
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  // Handle sending message
  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !selectedContact) return;

    const messagePayload = {
      receiverId: selectedContact.id,
      message: newMessage.trim(),
      appointmentId: null, // Admin-patient chat doesn't need appointment
      timestamp: Date.now()
    };

    if (socketRef.current && isConnected) {
      socketRef.current.emit("send_message", messagePayload, (ack) => {
        if (ack && ack.status === 1) {
          setMessages((prev) => [...prev, ack.data]);
          setNewMessage("");
          scrollToBottom();
          setContacts(prev => prev.map(c => c.id === selectedContact.id ? {
            ...c,
            lastMessage: {
              message: ack.data.message,
              createdAt: ack.data.createdAt
            }
          } : c));
        } else {
          console.error("Failed to send message:", ack?.error);
          alert(ack?.error || "Failed to send message");
        }
      });
    } else {
      alert("Not connected to server. Please try again.");
    }
  };

  return (
    <AdminLayout>
      <div className="flex h-[calc(100vh-140px)] rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm">
        {/* Contacts Sidebar */}
        <div className={`w-full md:w-80 flex flex-col border-r border-gray-200 ${isMobileChatOpen ? 'hidden md:flex' : 'flex'}`}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Support Chat</h2>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-green-500"
              />
            </div>
          </div>

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto">
            {loadingContacts ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-8 h-8 rounded-full border-2 border-green-600 border-t-transparent animate-spin" />
                <span className="text-xs text-gray-500 mt-2">Loading patients...</span>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <MessageCircle size={24} className="text-gray-400 mb-3" />
                <p className="text-sm font-semibold text-gray-700">No patients found</p>
                <p className="text-xs text-gray-400 mt-2">Patients who message you will appear here</p>
              </div>
            ) : (
              filteredContacts.map((contact) => {
                const isSelected = selectedContact && selectedContact.id === contact.id;
                return (
                  <button
                    key={contact.id}
                    onClick={() => handleSelectContact(contact)}
                    className={`w-full flex items-center gap-3 p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-green-50' : ''
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      {contact.image ? (
                        <img
                          src={getImageUrl(contact.image)}
                          alt={contact.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-700 text-sm">
                          {contact.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      {contact.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                          {contact.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm text-gray-900 truncate">{contact.name}</h3>
                        {contact.lastMessage && (
                          <span className="text-xs text-gray-400">
                            {new Date(contact.lastMessage.createdAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric"
                            })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {contact.lastMessage ? contact.lastMessage.message : 'Start conversation...'}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${!selectedContact ? 'hidden md:flex items-center justify-center bg-gray-50' : 'flex'}`}>
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="h-16 px-4 border-b border-gray-200 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsMobileChatOpen(false)}
                    className="md:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div className="flex items-center gap-3">
                    {selectedContact.image ? (
                      <img
                        src={getImageUrl(selectedContact.image)}
                        alt={selectedContact.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-700 text-sm">
                        {selectedContact.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">{selectedContact.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Activity size={10} className="text-green-600" />
                        <span>Patient • {selectedContact.city || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-8 h-8 rounded-full border-2 border-green-600 border-t-transparent animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageSquare size={32} className="text-gray-400 mb-3" />
                    <p className="text-sm text-gray-500">No messages yet</p>
                    <p className="text-xs text-gray-400 mt-1">Start the conversation</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => {
                      const isMine = msg.senderId === currentUserId;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
                              isMine
                                ? "bg-green-600 text-white rounded-br-none"
                                : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                            }`}
                          >
                            <p>{msg.message}</p>
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <span className="text-xs opacity-70">
                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              {isMine && (
                                <div className="flex items-center">
                                  {msg.isRead ? (
                                    <CheckCheck size={12} />
                                  ) : (
                                    <Check size={12} />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-green-500"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare size={48} className="text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Support Chat</h3>
              <p className="text-sm text-gray-500 max-w-sm">
                Select a patient from the contacts list to start chatting. This is for support purposes only.
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}