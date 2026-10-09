import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { 
  MessageSquare, 
  Send, 
  Search, 
  Check, 
  CheckCheck, 
  MessageCircle,
  ShieldAlert,
  Paperclip,
  Smile,
  Video,
  ChevronLeft,
  Phone,
  Info,
  MoreVertical,
  Plus,
  Shield,
  Activity
} from "lucide-react";

import PatientLayout from "../components/PatientLayout";
import DoctorLayout from "../components/DoctorLayout";
import { getContacts, getChatHistory, getContactById, editMessage, deleteMessage, getChatHistoryByAppointments, uploadAttachment } from "../api/chatApi";
import { getImageUrl } from "../utils/imageHelper";

export default function Chat() {
  const location = useLocation();
  const navigate = useNavigate();

  // Get current user from session storage
  const currentUser = JSON.parse(sessionStorage.getItem("user") || "{}");
  const userRole = currentUser.role; // "patient" or "doctor"
  const currentUserId = currentUser.id;

  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [appointmentConversations, setAppointmentConversations] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [remoteTyping, setRemoteTyping] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef(null);
  const [searchMessages, setSearchMessages] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, hasMore: false });
  const [loadingMore, setLoadingMore] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queuedMessages, setQueuedMessages] = useState([]);
  const [currentAppointmentId, setCurrentAppointmentId] = useState(null);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  // Use a ref for selectedContact to prevent socket recreation loop
  const selectedContactRef = useRef(selectedContact);
  useEffect(() => {
    selectedContactRef.current = selectedContact;
  }, [selectedContact]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Retry sending queued messages
      retryQueuedMessages();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load queued messages from localStorage on mount
    const storedQueue = localStorage.getItem('queuedMessages');
    if (storedQueue) {
      setQueuedMessages(JSON.parse(storedQueue));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Retry queued messages when coming back online
  const retryQueuedMessages = async () => {
    if (queuedMessages.length === 0 || !isConnected) return;

    const messagesToRetry = [...queuedMessages];
    setQueuedMessages([]);
    localStorage.removeItem('queuedMessages');

    for (const msg of messagesToRetry) {
      try {
        const data = await sendMessageToServer(msg);
        // Replace temporary message with real one
        setMessages(prev => prev.map(m => 
          m.id === msg.tempId ? { ...data, status: 'sent' } : m
        ));
      } catch (err) {
        console.error('Failed to retry message:', err);
        // Re-queue failed messages
        setQueuedMessages(prev => [...prev, msg]);
        localStorage.setItem('queuedMessages', JSON.stringify([...queuedMessages, msg]));
      }
    }
  };

  // Send message to server (helper function)
  const sendMessageToServer = (messagePayload) => {
    return new Promise((resolve, reject) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit("send_message", messagePayload, (ack) => {
          if (ack && ack.status === 1) {
            resolve(ack.data);
          } else {
            reject(new Error(ack?.error || "Failed to send message"));
          }
        });
      } else {
        reject(new Error("Socket not connected"));
      }
    });
  };

  // Load contacts list and auto-select contact if requested
  const fetchContactsList = async (selectIdAfterFetch = null) => {
    try {
      setLoadingContacts(true);
      const res = await getContacts();
      if (res.status === 1) {
        const contactsData = res.data || [];
        setContacts(contactsData);

        const targetId = selectIdAfterFetch || location.state?.selectUserId;
        if (targetId) {
          const numericId = parseInt(targetId, 10);
          const contactToSelect = contactsData.find(c => c.id === numericId);
          if (contactToSelect) {
            handleSelectContact(contactToSelect);
            // Clear router state to prevent auto-selecting on refreshes
            window.history.replaceState({}, document.title);
          } else {
            // Target user is not in active contacts (first time chat / no direct appointment record yet)
            // Fetch contact details from backend endpoint
            try {
              const contactRes = await getContactById(numericId);
              if (contactRes.status === 1 && contactRes.data) {
                const newContact = contactRes.data;
                // Add to contacts list locally
                setContacts(prev => [newContact, ...prev]);
                handleSelectContact(newContact);
                window.history.replaceState({}, document.title);
              }
            } catch (err) {
              console.error("Failed to load selectUserId contact details:", err);
            }
          }
        }
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

  // Initialize socket connection ONCE when component mounts
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    const socketUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
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
      // If the message belongs to the current conversation
      if (
        currentSelected &&
        (messageData.senderId === currentSelected.id || messageData.receiverId === currentSelected.id)
      ) {
        setMessages((prev) => [...prev, messageData]);
        
        // Update appointmentConversations state to add message to the correct appointment
        setAppointmentConversations((prev) => {
          return prev.map((conv) => {
            if (conv.appointment.id === messageData.appointmentId) {
              return {
                ...conv,
                messages: [...conv.messages, messageData]
              };
            }
            return conv;
          });
        });
        
        scrollToBottom();
        setRemoteTyping(false); // Stop typing indicator when message received
        // Acknowledge read by calling history endpoint to mark it read on server
        getChatHistory(currentSelected.id).catch(console.error);
      } else {
        // Increment unread count for the sender in the contacts list
        setContacts((prevContacts) => {
          // If the contact doesn't exist in our list yet, fetch contacts list to get them
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

    // Listen for typing indicators
    socketRef.current.on("user_typing", ({ userId: typingUserId }) => {
      const currentSelected = selectedContactRef.current;
      if (currentSelected && typingUserId === currentSelected.id) {
        setRemoteTyping(true);
      }
    });

    socketRef.current.on("user_stopped_typing", ({ userId: typingUserId }) => {
      const currentSelected = selectedContactRef.current;
      if (currentSelected && typingUserId === currentSelected.id) {
        setRemoteTyping(false);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []); // Only runs once on mount

  // Fetch chat history for selected contact
  const handleSelectContact = async (contact) => {
    setSelectedContact(contact);
    setIsMobileChatOpen(true);
    setLoadingMessages(true);
    setPagination({ currentPage: 1, totalPages: 1, hasMore: false });
    
    // Clear unread count for this contact locally
    setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, unreadCount: 0 } : c));

    try {
      // Fetch appointment-based chat history (last 3 appointments)
      const res = await getChatHistoryByAppointments(contact.id);
      if (res.status === 1) {
        setAppointmentConversations(res.data || []);
        // Set current appointment ID to the one marked as isCurrent
        if (res.data && res.data.length > 0) {
          const currentAppointment = res.data.find(conv => conv.appointment.isCurrent);
          setCurrentAppointmentId(currentAppointment ? currentAppointment.appointment.id : res.data[0].appointment.id);
          // Flatten messages for current view (show all messages from all appointments)
          const allMessages = res.data.flatMap(conv => conv.messages);
          setMessages(allMessages);
        } else {
          setMessages([]);
          setCurrentAppointmentId(null);
        }
      } else {
        // Show error message from backend
        alert(res.message || "Failed to load chat");
        setSelectedContact(null);
        setIsMobileChatOpen(false);
      }
    } catch (err) {
      console.error("Failed to fetch chat history:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to load chat";
      if (err.response?.status === 403) {
        alert(errorMessage);
        setSelectedContact(null);
        setIsMobileChatOpen(false);
      } else {
        alert(errorMessage);
      }
    } finally {
      setLoadingMessages(false);
    }
  };

  // Load more messages (pagination)
  const loadMoreMessages = async () => {
    if (!selectedContact || loadingMore || !pagination.hasMore) return;

    setLoadingMore(true);
    try {
      const nextPage = pagination.currentPage + 1;
      const res = await getChatHistory(selectedContact.id, nextPage);
      if (res.status === 1) {
        setMessages(prev => [...res.data, ...prev]);
        setPagination(res.pagination || { currentPage: nextPage, totalPages: 1, hasMore: false });
      }
    } catch (err) {
      console.error("Failed to load more messages:", err);
    } finally {
      setLoadingMore(false);
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

  // Handle sending message
  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !selectedContact) return;

    // Stop typing indicator before sending
    if (socketRef.current && isConnected) {
      socketRef.current.emit("typing_stop", { receiverId: selectedContact.id });
    }

    const messagePayload = {
      receiverId: selectedContact.id,
      message: newMessage.trim(),
      appointmentId: currentAppointmentId,
      timestamp: Date.now()
    };

    // Check if online and connected
    if (isOnline && socketRef.current && isConnected) {
      sendMessageToServer(messagePayload)
        .then((data) => {
          // Update messages state
          setMessages((prev) => [...prev, data]);
          
          // Update appointmentConversations state to add message to current appointment
          setAppointmentConversations((prev) => {
            return prev.map((conv) => {
              if (conv.appointment.id === currentAppointmentId) {
                return {
                  ...conv,
                  messages: [...conv.messages, data]
                };
              }
              return conv;
            });
          });
          
          setNewMessage("");
          setIsTyping(false);
          scrollToBottom();
          setContacts(prev => prev.map(c => c.id === selectedContact.id ? {
            ...c,
            lastMessage: {
              message: data.message,
              createdAt: data.createdAt
            }
          } : c));
        })
        .catch((err) => {
          console.error("Failed to send message:", err);
          // Show error alert for payment restrictions
          if (err.message && err.message.includes("payment")) {
            alert(err.message);
          } else {
            // Queue message for retry
            queueMessage(messagePayload);
          }
        });
    } else {
      // Queue message when offline
      queueMessage(messagePayload);
      setNewMessage("");
      setIsTyping(false);
    }
  };

  // Queue message for offline sending
  const queueMessage = (messagePayload) => {
    const queuedMessage = {
      ...messagePayload,
      tempId: `temp_${Date.now()}`,
      status: 'queued'
    };

    setQueuedMessages(prev => {
      const newQueue = [...prev, queuedMessage];
      localStorage.setItem('queuedMessages', JSON.stringify(newQueue));
      return newQueue;
    });

    const tempMessage = {
      id: queuedMessage.tempId,
      senderId: currentUserId,
      receiverId: messagePayload.receiverId,
      appointmentId: messagePayload.appointmentId,
      message: messagePayload.message,
      isRead: false,
      createdAt: new Date().toISOString(),
      status: 'queued'
    };

    // Show temporary message in UI
    setMessages(prev => [...prev, tempMessage]);
    
    // Update appointmentConversations state to add message to current appointment
    setAppointmentConversations((prev) => {
      return prev.map((conv) => {
        if (conv.appointment.id === currentAppointmentId) {
          return {
            ...conv,
            messages: [...conv.messages, tempMessage]
          };
        }
        return conv;
      });
    });

    // Show notification
    if (!isOnline) {
      alert('You are offline. Message will be sent when you reconnect.');
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      
      // Check file type (only images and documents)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only images and documents are allowed');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  // Handle file upload
  const handleFileUpload = async () => {
    if (!selectedFile) return;
    
    try {
      setUploadingFile(true);
      const response = await uploadAttachment(selectedFile);
      
      if (response.status === 1) {
        // Send message with attachment - keep text message if user typed something
        const messagePayload = {
          receiverId: selectedContact.id,
          message: newMessage.trim() || null, // Send null if no text, don't send "Attachment"
          appointmentId: currentAppointmentId,
          attachmentUrl: response.data.url,
          attachmentType: response.data.type,
          attachmentName: response.data.name,
          attachmentSize: response.data.size,
          timestamp: Date.now()
        };

        if (isOnline && socketRef.current && isConnected) {
          sendMessageToServer(messagePayload)
            .then((data) => {
              setMessages((prev) => [...prev, data]);
              setAppointmentConversations((prev) => {
                return prev.map((conv) => {
                  if (conv.appointment.id === currentAppointmentId) {
                    return {
                      ...conv,
                      messages: [...conv.messages, data]
                    };
                  }
                  return conv;
                });
              });
              
              setNewMessage("");
              setSelectedFile(null);
              setIsTyping(false);
              scrollToBottom();
              setContacts(prev => prev.map(c => c.id === selectedContact.id ? {
                ...c,
                lastMessage: {
                  message: data.message || data.attachmentName || 'Attachment',
                  createdAt: data.createdAt
                }
              } : c));
            })
            .catch((err) => {
              console.error("Failed to send message:", err);
              alert("Failed to send message. Please try again.");
            });
        } else {
          // Queue message if offline
          const queuedMessage = {
            tempId: Date.now(),
            ...messagePayload,
            status: 'queued'
          };
          setQueuedMessages(prev => [...prev, queuedMessage]);
          localStorage.setItem('queuedMessages', JSON.stringify([...queuedMessages, queuedMessage]));
          
          const tempMessage = {
            id: queuedMessage.tempId,
            senderId: currentUserId,
            receiverId: messagePayload.receiverId,
            appointmentId: messagePayload.appointmentId,
            message: messagePayload.message,
            attachmentUrl: messagePayload.attachmentUrl,
            attachmentType: messagePayload.attachmentType,
            attachmentName: messagePayload.attachmentName,
            attachmentSize: messagePayload.attachmentSize,
            isRead: false,
            createdAt: new Date().toISOString(),
            status: 'queued'
          };

          setMessages(prev => [...prev, tempMessage]);
          setAppointmentConversations((prev) => {
            return prev.map((conv) => {
              if (conv.appointment.id === currentAppointmentId) {
                return {
                  ...conv,
                  messages: [...conv.messages, tempMessage]
                };
              }
              return conv;
            });
          });

          setNewMessage("");
          setSelectedFile(null);
          alert('You are offline. Message will be sent when you reconnect.');
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload file. Please try again.");
    } finally {
      setUploadingFile(false);
    }
  };

  // Handle typing indicator
  let typingTimeout;
  const handleTyping = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    if (value.trim() && !isTyping && selectedContact && socketRef.current && isConnected) {
      setIsTyping(true);
      socketRef.current.emit("typing_start", { receiverId: selectedContact.id });
    }

    // Clear previous timeout
    clearTimeout(typingTimeout);

    // Set new timeout to stop typing indicator after 3 seconds of inactivity
    typingTimeout = setTimeout(() => {
      if (isTyping && socketRef.current && isConnected) {
        setIsTyping(false);
        socketRef.current.emit("typing_stop", { receiverId: selectedContact.id });
      }
    }, 3000);
  };

  // Handle message edit
  const handleEditMessage = (msg) => {
    setEditingMessage(msg.id);
    setEditText(msg.message);
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editText.trim() || !editingMessage) return;

    try {
      const res = await editMessage(editingMessage, editText);
      if (res.status === 1) {
        setMessages(prev => prev.map(msg => 
          msg.id === editingMessage ? { ...msg, message: editText.trim() } : msg
        ));
        setEditingMessage(null);
        setEditText("");
      }
    } catch (err) {
      console.error("Failed to edit message:", err);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingMessage(null);
    setEditText("");
  };

  // Handle message delete
  const handleDeleteMessage = async (messageId) => {
    if (!confirm("Are you sure you want to delete this message?")) return;

    try {
      const res = await deleteMessage(messageId);
      if (res.status === 1) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      }
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  };

  // Temporarily disabled - frontend developer overwhelmed
  // Handle file upload
  // const handleFileUpload = async (e) => {
  //   const file = e.target.files[0];
  //   if (!file) return;

  //   setUploadingFile(true);

  //   try {
  //     const res = await uploadAttachment(file);
  //     if (res.status === 1) {
  //       // Send message with attachment
  //       const messagePayload = {
  //         receiverId: selectedContact.id,
  //         message: "",
  //         attachmentUrl: res.data.url,
  //         attachmentType: res.data.type,
  //         attachmentName: res.data.name,
  //         attachmentSize: res.data.size
  //       };

  //       if (socketRef.current && isConnected) {
  //         socketRef.current.emit("send_message", messagePayload, (ack) => {
  //           if (ack && ack.status === 1) {
  //             setMessages((prev) => [...prev, ack.data]);
  //             scrollToBottom();
  //             setContacts(prev => prev.map(c => c.id === selectedContact.id ? {
  //               ...c,
  //               lastMessage: {
  //                 message: `📎 ${res.data.name}`,
  //                 createdAt: ack.data.createdAt
  //               }
  //             } : c));
  //           }
  //         });
  //       }
  //     }
  //   } catch (err) {
  //     console.error("Failed to upload file:", err);
  //     alert("Failed to upload file. Please try again.");
  //   } finally {
  //     setUploadingFile(false);
  //     if (fileInputRef.current) {
  //       fileInputRef.current.value = '';
  //     }
  //   }
  // };

  // Filter contacts by search query
  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Emoji list
  const commonEmojis = [
    '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂',
    '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛',
    '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨',
    '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😔', '😪',
    '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶',
    '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟',
    '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨',
    '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩',
    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
    '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤝', '💪'
  ];

  // Handle emoji selection
  const handleEmojiSelect = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Search messages in current conversation
  const filteredMessages = messages.filter(msg =>
    msg.message && msg.message.toLowerCase().includes(searchMessages.toLowerCase())
  );

  // Handle search navigation
  const scrollToSearchResult = (messageId) => {
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      messageElement.classList.add('bg-yellow-100');
      setTimeout(() => {
        messageElement.classList.remove('bg-yellow-100');
      }, 2000);
    }
  };

  // Group messages by Date
  const groupMessagesByDate = (msgList) => {
    const groups = {};
    msgList.forEach((msg) => {
      const date = new Date(msg.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  const formatMessageTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  const renderChatContent = () => {
    return (
      <div className="flex h-[calc(100vh-8.5rem)] min-h-[600px] overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_15px_50px_-15px_rgba(0,0,0,0.05)] relative font-sans">
        {/* Contacts Sidebar */}
        <div className={`w-full border-r border-slate-100 flex flex-col md:w-80 lg:w-[360px] flex-shrink-0 bg-white ${isMobileChatOpen ? "hidden md:flex" : "flex"}`}>
          
          {/* Sidebar Header */}
          <div className="p-5 pb-4 bg-white border-b border-slate-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-brand-light flex items-center justify-center text-brand-primary shadow-xs">
                  <MessageSquare size={18} className="stroke-[2.5]" />
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                  Chats
                </h2>
              </div>
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${isConnected ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                {isConnected ? "Connected" : "Reconnecting"}
              </span>
            </div>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search consults, doctors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl border border-slate-100 bg-slate-50/80 py-2.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-brand-primary/40 focus:bg-white focus:ring-4 focus:ring-brand-primary/5"
              />
            </div>
          </div>

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1 bg-white">
            {loadingContacts ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
                <span className="text-xs font-semibold text-slate-450 tracking-medium">Loading consultations...</span>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
                  <MessageCircle size={24} className="text-slate-350" />
                </div>
                <p className="text-sm font-bold text-slate-700">No chats found</p>
                <p className="text-xs text-slate-400 mt-2 max-w-[220px] leading-relaxed">
                  {userRole === "patient" 
                    ? "Book an appointment first or navigate to Doctors to start secure consulting."
                    : "No active patient consultations found."
                  }
                </p>
                {userRole === "patient" && (
                  <button 
                    onClick={() => navigate("/patient/doctors")}
                    className="mt-4 px-4 py-2 bg-brand-primary hover:bg-brand-hover text-white text-xs font-bold rounded-xl shadow-md shadow-brand-primary/10 transition-all active:scale-95"
                  >
                    Find a Doctor
                  </button>
                )}
              </div>
            ) : (
              filteredContacts.map((contact) => {
                const isSelected = selectedContact && selectedContact.id === contact.id;
                return (
                  <button
                    key={contact.id}
                    onClick={() => handleSelectContact(contact)}
                    className={`w-full flex items-center gap-3.5 p-3 rounded-2xl transition-all duration-200 text-left border relative ${
                      isSelected 
                        ? "bg-brand-light/65 border-brand-primary/15 text-brand-dark shadow-xs" 
                        : "hover:bg-slate-50/50 border-transparent text-slate-800 hover:border-slate-100"
                    }`}
                  >
                    {/* Active Selected Sidebar Indicator */}
                    {isSelected && (
                      <div className="absolute left-0 top-1/4 bottom-1/4 w-1.5 bg-brand-primary rounded-r-full" />
                    )}

                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {contact.image ? (
                        <img
                          src={getImageUrl(contact.image)}
                          alt={contact.name}
                          className="h-12 w-12 rounded-2xl object-cover border border-slate-150 shadow-2xs"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-2xl bg-brand-light flex items-center justify-center font-bold text-brand-dark text-base border border-brand-primary/10">
                          {contact.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      {/* Role Pill Indicator */}
                      <span className={`absolute -bottom-1.5 -right-1.5 flex px-1 py-0.5 rounded-md text-[8px] font-extrabold uppercase tracking-wider border border-white shadow-2xs ${contact.role === "doctor" ? "bg-indigo-600 text-white" : "bg-teal-600 text-white"}`}>
                        {contact.role === "doctor" ? "Doc" : "Pat"}
                      </span>
                    </div>

                    {/* Contact details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-sm truncate text-slate-900 leading-none">
                          {contact.name}
                        </h3>
                        {contact.lastMessage && (
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {new Date(contact.lastMessage.createdAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric"
                            })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500 truncate max-w-[160px] leading-tight">
                          {contact.lastMessage ? contact.lastMessage.message : (contact.specialization || "Start medical dialogue...")}
                        </p>
                        {contact.unreadCount > 0 && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-primary px-1.5 text-[10px] font-bold text-white shadow-xs animate-pulse">
                            {contact.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Pane */}
        <div className={`flex-1 flex flex-col bg-white ${!selectedContact ? "hidden md:flex items-center justify-center bg-slate-50/20 p-8 text-center" : "flex"}`}>
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="h-20 px-6 border-b border-slate-100 flex items-center justify-between bg-white shadow-2xs relative z-10">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setIsMobileChatOpen(false)}
                    className="p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-50 md:hidden transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <div className="relative">
                    {selectedContact.image ? (
                      <img
                        src={getImageUrl(selectedContact.image)}
                        alt={selectedContact.name}
                        className="h-12 w-12 rounded-2xl object-cover border border-slate-150 shadow-2xs"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-2xl bg-brand-light flex items-center justify-center font-bold text-brand-dark text-base border border-brand-primary/10">
                        {selectedContact.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-xs" />
                  </div>

                  <div>
                    <h3 className="font-extrabold text-[15px] text-slate-900 leading-tight">
                      {selectedContact.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400 font-semibold leading-none">
                      <Activity size={10} className="text-brand-primary animate-pulse" />
                      <span>
                        {selectedContact.role === "doctor"
                          ? `${selectedContact.specialization || "Homeopath"} • ${selectedContact.qualification || "BHMS"}`
                          : `Patient Profile • ${selectedContact.city || "Remote"}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center gap-1.5">
                  <div className="relative">
                    <button 
                      onClick={() => setShowSearchResults(!showSearchResults)}
                      aria-label="Search messages"
                      className="p-2.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
                    >
                      <Search size={18} />
                    </button>
                    {showSearchResults && (
                      <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-50">
                        <input
                          type="text"
                          placeholder="Search messages..."
                          value={searchMessages}
                          onChange={(e) => setSearchMessages(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-primary/40"
                          autoFocus
                        />
                        {searchMessages && filteredMessages.length > 0 && (
                          <div className="mt-2 max-h-48 overflow-y-auto">
                            {filteredMessages.map(msg => (
                              <button
                                key={msg.id}
                                onClick={() => {
                                  scrollToSearchResult(msg.id);
                                  setShowSearchResults(false);
                                }}
                                className="w-full text-left p-2 hover:bg-slate-50 rounded-lg text-sm truncate"
                              >
                                {msg.message}
                              </button>
                            ))}
                          </div>
                        )}
                        {searchMessages && filteredMessages.length === 0 && (
                          <p className="mt-2 text-xs text-slate-400 text-center">No messages found</p>
                        )}
                      </div>
                    )}
                  </div>
                  <button 
                    aria-label="Contact Information"
                    className="p-2.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    <Info size={18} />
                  </button>
                  <button 
                    aria-label="More Actions"
                    className="p-2.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
                  >
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>

              {/* Messages Grid Container */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f4f7f6]/40 relative">
                
                {/* Visual Backdrop pattern (gives a premium SAAS look) */}
                <div className="absolute inset-0 opacity-[0.015] pointer-events-none bg-[radial-gradient(#00b100_1px,transparent_1px)] [background-size:16px_16px]" />

                {/* Load More Button */}
                {pagination.hasMore && (
                  <div className="flex justify-center py-2 relative z-10">
                    <button
                      onClick={loadMoreMessages}
                      disabled={loadingMore}
                      className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                    >
                      {loadingMore ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                          Loading...
                        </span>
                      ) : (
                        'Load Earlier Messages'
                      )}
                    </button>
                  </div>
                )}

                {loadingMessages ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-brand-primary border-t-transparent animate-spin" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Syncing consultation logs...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-10 px-6 relative z-10">
                    <div className="w-16 h-16 bg-brand-light rounded-2xl flex items-center justify-center mb-4 border border-brand-primary/10 shadow-xs">
                      <MessageSquare size={24} className="text-brand-primary stroke-[2]" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">Secure Thread Started</p>
                    <p className="text-xs text-slate-400 mt-2 max-w-[280px] leading-relaxed">
                      Begin exchanging medical information, prescription logs, or symptom updates. This portal is secure and HIPAA compliant.
                    </p>
                  </div>
                ) : (
                  appointmentConversations.length > 0 ? (
                    appointmentConversations.map((conversation, convIndex) => (
                      <div key={conversation.appointment.id || 'legacy'} className="space-y-4 relative z-10 mb-8">
                        {/* Appointment Section Header */}
                        <div className={`bg-gradient-to-r ${conversation.appointment.appointmentId === 'LEGACY' ? 'from-amber-50/50 to-slate-50 border-amber-200/30' : 'from-brand-light/50 to-slate-50 border-brand-primary/20'} border rounded-2xl p-4 mb-4 shadow-sm`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${conversation.appointment.appointmentId === 'LEGACY' ? 'bg-amber-100' : 'bg-brand-primary/10'}`}>
                                {conversation.appointment.appointmentId === 'LEGACY' ? (
                                  <MessageCircle size={18} className="text-amber-600" />
                                ) : (
                                  <Activity size={18} className="text-brand-primary" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-bold uppercase tracking-wider ${conversation.appointment.appointmentId === 'LEGACY' ? 'text-amber-700' : 'text-brand-primary'}`}>
                                    {conversation.appointment.appointmentId === 'LEGACY' ? 'Previous Messages' : `Appointment #${conversation.appointment.appointmentId || conversation.appointment.id}`}
                                  </span>
                                  {conversation.appointment.appointmentId !== 'LEGACY' && (
                                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                                      conversation.appointment.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                      conversation.appointment.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                      'bg-slate-100 text-slate-600'
                                    }`}>
                                      {conversation.appointment.status}
                                    </span>
                                  )}
                                </div>
                                {conversation.appointment.appointmentId !== 'LEGACY' && (
                                  <div className="text-xs text-slate-500 font-semibold mt-1">
                                    {new Date(conversation.appointment.appointmentDateTime).toLocaleString("en-US", {
                                      weekday: 'short',
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                            {conversation.appointment.isCurrent && conversation.appointment.appointmentId !== 'LEGACY' && (
                              <span className="text-[9px] font-extrabold bg-brand-primary text-white px-2 py-1 rounded-full uppercase tracking-wider">
                                Current
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Messages for this appointment */}
                        {conversation.messages.length > 0 ? (
                          conversation.messages.map((msg) => {
                            const isMine = msg.senderId === currentUserId;
                            const isEditing = editingMessage === msg.id;
                            return (
                              <div
                                key={msg.id}
                                data-message-id={msg.id}
                                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                              >
                                <div
                                  className={`max-w-[65%] px-4 py-3 text-sm shadow-2xs transition-all relative ${
                                    isMine
                                      ? "bg-gradient-to-r from-brand-primary to-brand-hover text-white rounded-3xl rounded-tr-none"
                                      : "bg-white text-slate-800 border border-slate-150 rounded-3xl rounded-tl-none"
                                  }`}
                                >
                                  {isEditing ? (
                                    <div className="space-y-2">
                                      <textarea
                                        value={editText}
                                        onChange={(e) => setEditText(e.target.value)}
                                        className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-sm text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-white/30"
                                        rows={3}
                                        autoFocus
                                      />
                                      <div className="flex items-center gap-2 justify-end">
                                        <button
                                          onClick={handleCancelEdit}
                                          className="px-3 py-1 text-xs font-semibold bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                                        >
                                          Cancel
                                        </button>
                                        <button
                                          onClick={handleSaveEdit}
                                          className="px-3 py-1 text-xs font-semibold bg-white text-brand-primary hover:bg-white/90 rounded-lg transition-colors"
                                        >
                                          Save
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      {msg.attachmentUrl && (
                                        <div className="mb-2">
                                          {msg.attachmentType === 'image' ? (
                                            <img 
                                              src={msg.attachmentUrl} 
                                              alt="Attachment" 
                                              className="max-w-[200px] max-h-[200px] h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity object-cover"
                                              onClick={() => window.open(msg.attachmentUrl, '_blank')}
                                            />
                                          ) : (
                                            <div className="flex items-center gap-2 bg-white/10 p-2 rounded-lg">
                                              <Paperclip size={16} />
                                              <a 
                                                href={msg.attachmentUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-sm underline hover:text-white/80"
                                              >
                                                {msg.attachmentName || 'Document'}
                                              </a>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                      {msg.message && (
                                        <p className="leading-relaxed whitespace-pre-wrap font-medium">{msg.message}</p>
                                      )}
                                      <div className={`flex items-center justify-between mt-2 ${isMine ? "text-white/80" : "text-slate-400"}`}>
                                        <div className="flex items-center gap-1.5 text-[9px] font-bold">
                                          <span>{formatMessageTime(msg.createdAt)}</span>
                                          {isMine && (
                                            msg.isRead ? (
                                              <CheckCheck size={12} className="text-white" />
                                            ) : (
                                              <Check size={12} className="text-white/80" />
                                            )
                                          )}
                                        </div>
                                        {isMine && (
                                          <div className="flex items-center gap-1">
                                            <button
                                              onClick={() => handleEditMessage(msg)}
                                              className="p-1 hover:bg-white/10 rounded transition-colors"
                                              title="Edit message"
                                            >
                                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                              </svg>
                                            </button>
                                            <button
                                              onClick={() => handleDeleteMessage(msg.id)}
                                              className="p-1 hover:bg-white/10 rounded transition-colors"
                                              title="Delete message"
                                            >
                                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M3 6h18"/>
                                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                                              </svg>
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-xs text-slate-400">No messages in this appointment</p>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center py-10 px-6 relative z-10">
                      <div className="w-16 h-16 bg-brand-light rounded-2xl flex items-center justify-center mb-4 border border-brand-primary/10 shadow-xs">
                        <MessageSquare size={24} className="text-brand-primary stroke-[2]" />
                      </div>
                      <p className="text-sm font-bold text-slate-800">Secure Thread Started</p>
                      <p className="text-xs text-slate-400 mt-2 max-w-[280px] leading-relaxed">
                        Begin exchanging medical information, prescription logs, or symptom updates. This portal is secure and HIPAA compliant.
                      </p>
                    </div>
                  )
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Floating Input Footer Panel */}
              <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex items-center gap-3 relative">
                <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-1.5 px-4 focus-within:bg-white focus-within:border-brand-primary/40 focus-within:ring-4 focus-within:ring-brand-primary/5 transition-all relative">
                  {/* Attachment button - only for doctors */}
                  {userRole === 'doctor' && (
                    <>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx,.txt"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingFile}
                        className={`p-2 rounded-xl transition-all ${selectedFile ? 'text-brand-primary bg-slate-100' : 'text-slate-450 hover:text-brand-primary hover:bg-slate-100'} ${uploadingFile ? 'opacity-50 cursor-not-allowed' : ''}`}
                        aria-label="Attach file"
                      >
                        <Paperclip size={18} />
                      </button>
                    </>
                  )}
                  
                  <input
                    type="text"
                    placeholder="Send a secure prescription query or health update..."
                    value={newMessage}
                    onChange={handleTyping}
                    className="flex-1 bg-transparent border-0 outline-none text-sm placeholder-slate-455 py-2 text-slate-800"
                  />
                  <div className="relative" ref={emojiPickerRef}>
                    <button 
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      aria-label="Select emoji"
                      className={`p-2 rounded-xl transition-all ${showEmojiPicker ? 'text-brand-primary bg-slate-100' : 'text-slate-450 hover:text-brand-primary hover:bg-slate-100'}`}
                    >
                      <Smile size={18} />
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute bottom-full right-0 mb-2 p-3 bg-white border border-slate-200 rounded-2xl shadow-xl w-80 max-h-64 overflow-y-auto z-50">
                        <div className="grid grid-cols-10 gap-1">
                          {commonEmojis.map((emoji, index) => (
                            <button
                              key={index}
                              onClick={() => handleEmojiSelect(emoji)}
                              className="text-xl hover:bg-slate-100 rounded p-1 transition-colors"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Selected file preview */}
                {selectedFile && (
                  <div className="absolute -top-16 left-0 right-0 bg-white border border-slate-200 rounded-xl p-2 shadow-lg flex items-center gap-2 z-20">
                    {selectedFile.type.startsWith('image/') ? (
                      <img 
                        src={URL.createObjectURL(selectedFile)} 
                        alt="Preview" 
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Paperclip size={16} className="text-slate-400" />
                      </div>
                    )}
                    <div className="flex-1 flex flex-col">
                      <span className="text-xs text-slate-600 truncate max-w-[150px]">{selectedFile.name}</span>
                      <span className="text-xs text-slate-400">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={(!newMessage.trim() && !selectedFile) || uploadingFile}
                  onClick={selectedFile ? handleFileUpload : undefined}
                  className="h-11 w-11 rounded-2xl bg-brand-primary hover:bg-brand-primary/95 text-white flex items-center justify-center transition-all shadow-md shadow-brand-primary/15 hover:shadow-brand-primary/25 disabled:opacity-50 disabled:shadow-none active:scale-95 flex-shrink-0"
                >
                  {uploadingFile ? (
                    <div className="animate-spin">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                    </div>
                  ) : (
                    <Send size={16} className="stroke-[2]" />
                  )}
                </button>
              </form>

              {/* Typing Indicator */}
              {remoteTyping && (
                <div className="px-6 pb-2 flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-slate-400 font-medium">typing...</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 h-full bg-slate-50/20">
              <div className="w-16 h-16 bg-brand-light rounded-2xl flex items-center justify-center mb-4 border border-brand-primary/10 shadow-sm">
                <MessageSquare size={26} className="text-brand-primary" />
              </div>
              <h3 className="text-base font-bold text-slate-700">Secure Inbox</h3>
              <p className="text-xs text-slate-400 max-w-xs mt-1.5 leading-relaxed">
                Select a contact from the list on the left to start sending messages securely.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Dynamically wrap in the correct layout
  if (userRole === "patient") {
    return <PatientLayout>{renderChatContent()}</PatientLayout>;
  } else if (userRole === "doctor") {
    return <DoctorLayout>{renderChatContent()}</DoctorLayout>;
  } else {
    // Graceful fallback for admins or users without a correct role in sessionStorage
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-500 p-8 text-center">
        <ShieldAlert size={48} className="text-amber-500 mb-4 animate-bounce" />
        <h2 className="text-lg font-bold text-gray-700">Access Denied</h2>
        <p className="text-sm text-gray-400 max-w-xs mt-1.5">
          Only patients and doctors are authorized to access the chat portal.
        </p>
        <button
          onClick={() => navigate("/login")}
          className="mt-6 px-5 py-2.5 bg-brand-primary text-white rounded-xl text-sm font-semibold hover:bg-brand-primary/95 transition-all shadow-md shadow-brand-primary/20"
        >
          Return to Login
        </button>
      </div>
    );
  }
}
