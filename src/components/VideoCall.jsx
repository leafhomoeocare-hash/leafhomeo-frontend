import React, { useEffect, useRef, useState } from "react";
import { Video as VideoIcon, VideoOff, Mic, MicOff, PhoneOff, Monitor, MonitorOff, Signal, Clock, X, User, AlertCircle, RefreshCw, FileText } from "lucide-react";
import { getVideoToken, endVideoCall } from "../api/videoApi";
import * as TwilioVideo from 'twilio-video';
import axios from 'axios';

const VideoCall = ({ appointmentId, onEndCall, userType = 'patient' }) => {
  const [room, setRoom] = useState(null);
  const [localTracks, setLocalTracks] = useState([]);
  const [remoteParticipants, setRemoteParticipants] = useState([]);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [error, setError] = useState(null);
  const [participantCount, setParticipantCount] = useState(0);
  const [connectionQuality, setConnectionQuality] = useState('unknown');
  const [callDuration, setCallDuration] = useState(0);
  
  // Pre-call states
  const [callState, setCallState] = useState('pre-call'); // 'pre-call', 'connecting', 'in-call', 'ended', 'reconnecting'
  const [permissionError, setPermissionError] = useState(null);
  const [showEndCallConfirm, setShowEndCallConfirm] = useState(false);
  const [networkStatus, setNetworkStatus] = useState('connected'); // 'connected', 'reconnecting', 'disconnected'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Consultation form states (doctor only)
  const [showConsultationForm, setShowConsultationForm] = useState(true); // Show by default for doctors
  const [consultationNotes, setConsultationNotes] = useState('');
  const [submittingForm, setSubmittingForm] = useState(false);

  // Comprehensive consultation form states
  const [formData, setFormData] = useState({
    chiefComplaints: '',
    appetite: '',
    thirst: '',
    desire: '',
    aversion: '',
    habits: '',
    stool: '',
    urine: '',
    perspiration: '',
    menWomen: '',
    sleep: '',
    dream: '',
    thermal: '',
    amelioration: '',
    aggravation: '',
    otherComplaints: '',
    levelsOfHealth: '',
    perception: '',
    screenshots: []
  });
  const [savedFormData, setSavedFormData] = useState(null); // For save functionality

  const localVideoRef = useRef(null);
  const localAudioRef = useRef(null);
  const participantVideoRefs = useRef({});
  const participantAudioRefs = useRef({});
  const screenShareRef = useRef(null);
  const previewVideoRef = useRef(null);

  useEffect(() => {
    console.log("VideoCall component mounted with appointmentId:", appointmentId);
    console.log("Type of appointmentId:", typeof appointmentId);

    if (!appointmentId || appointmentId === "undefined" || appointmentId === "null") {
      console.error("Invalid appointmentId provided:", appointmentId);
      setError("Invalid appointment ID provided. Please navigate from the appointments page.");
      setCallState('ended');
      return;
    }

    // Load saved form data if exists
    const savedDraft = localStorage.getItem(`consultation_draft_${appointmentId}`);
    if (savedDraft) {
      try {
        const parsedData = JSON.parse(savedDraft);
        setFormData(parsedData);
        console.log("Loaded saved form data:", parsedData);
      } catch (err) {
        console.error("Error parsing saved form data:", err);
      }
    }

    initializePreCall();

    return () => {
      cleanupRoom();
    };
  }, [appointmentId]);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus('connected');
      if (room && callState === 'reconnecting') {
        setCallState('in-call');
      }
    };

    const handleOffline = () => {
      setNetworkStatus('disconnected');
      if (room) {
        setCallState('reconnecting');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [room, callState]);

  // Call duration timer
  useEffect(() => {
    let interval;
    if (room && callState === 'in-call') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [room, callState]);

  const initializePreCall = async () => {
    try {
      setCallState('pre-call');
      await checkPermissionsAndShowPreview();
    } catch (err) {
      console.error('Error in pre-call initialization:', err);
      setPermissionError(err.message);
      setCallState('ended');
    }
  };

  const checkPermissionsAndShowPreview = async () => {
    try {
      // Use Twilio's createLocalTracks as per their documentation
      const tracks = await TwilioVideo.createLocalTracks({
        audio: true,
        video: { width: 640, height: 480, frameRate: 24, facingMode: 'user' }
      });
      
      setLocalTracks(tracks);
      
      // Show preview using Twilio's attach method
      const localVideoTrack = tracks.find(track => track.kind === 'video');
      if (localVideoTrack && previewVideoRef.current) {
        previewVideoRef.current.innerHTML = '';
        const mediaElement = localVideoTrack.attach();
        mediaElement.className = 'w-full h-full object-cover';
        previewVideoRef.current.appendChild(mediaElement);
      }
      
      setPermissionError(null);
    } catch (err) {
      console.error('Permission error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionError('Camera and microphone access are required for video consultation. Please allow access in your browser settings and try again.');
      } else if (err.name === 'NotFoundError') {
        setPermissionError('No camera or microphone found. Please connect a camera and microphone and try again.');
      } else {
        setPermissionError('Failed to access camera and microphone. Please check your devices and try again.');
      }
      throw err;
    }
  };

  const initializeTwilio = async () => {
    try {
      console.log('Twilio Video SDK imported successfully');
      return Promise.resolve();
    } catch (err) {
      console.error('Error initializing Twilio:', err);
      setError('Failed to initialize video service');
      setIsLoading(false);
      throw err;
    }
  };

  const cleanupRoom = async () => {
    if (room) {
      try {
        // Clear participant check interval if it exists
        if (room.participantCheckInterval) {
          clearInterval(room.participantCheckInterval);
        }
        
        room.disconnect();
        setRoom(null);
      } catch (err) {
        console.error('Error disconnecting room:', err);
      }
    }

    // Clean up local tracks using Twilio's stop method
    localTracks.forEach(track => {
      track.stop();
      track.detach().forEach(element => element.remove());
    });
    setLocalTracks([]);

    // Clean up preview video
    if (previewVideoRef.current) {
      previewVideoRef.current.innerHTML = '';
    }

    // Clean up local video
    if (localVideoRef.current) {
      localVideoRef.current.innerHTML = '';
    }
    if (localAudioRef.current) {
      localAudioRef.current.innerHTML = '';
    }
    if (screenShareRef.current) {
      screenShareRef.current.innerHTML = '';
    }

    // Clean up participant videos
    Object.values(participantVideoRefs.current).forEach(container => {
      if (container) {
        container.innerHTML = '';
      }
    });
    Object.values(participantAudioRefs.current).forEach(container => {
      if (container) {
        container.innerHTML = '';
      }
    });
    participantVideoRefs.current = {};
    participantAudioRefs.current = {};
  };

  const joinRoom = async () => {
    try {
      setCallState('connecting');
      setError(null);

      console.log("=== Starting joinRoom ===");
      console.log("Requesting video token for appointment:", appointmentId);
      
      const response = await getVideoToken(appointmentId);
      console.log("Video token response:", response);

      if (response.status !== 1) {
        throw new Error(response.message || "Failed to get video token");
      }

      const { token, roomName } = response.data;
      console.log("Token received, room name:", roomName);
      console.log("Attempting to connect to Twilio room:", roomName);

      // Connect to room using pre-acquired tracks (Twilio best practice)
      const room = await TwilioVideo.connect(token, {
        name: roomName,
        tracks: localTracks,
        dominantSpeaker: true,
        networkQuality: { local: 1, remote: 1 }
      });
      
      console.log("Successfully connected to room:", room.name);
      console.log("Room SID:", room.sid);
      console.log("Local participant identity:", room.localParticipant.identity);

      setRoom(room);
      const initialParticipantCount = room.participants.size + 1;
      setParticipantCount(initialParticipantCount);
      console.log("Initial participant count:", initialParticipantCount);
      console.log("Room participants size:", room.participants.size);

      // Handle connection quality
      room.on('networkQualityLevelChanged', (quality) => {
        const levels = ['unknown', 'poor', 'low', 'medium', 'high', 'excellent'];
        setConnectionQuality(levels[quality] || 'unknown');
      });

      // Handle reconnection
      room.on('reconnecting', () => {
        setCallState('reconnecting');
        setNetworkStatus('reconnecting');
      });

      room.on('reconnected', () => {
        setCallState('in-call');
        setNetworkStatus('connected');
      });

      room.on('disconnected', () => {
        console.log('Room disconnected - other party ended the call');
        setCallState('ended');
        // Notify backend that call has ended
        endVideoCall(appointmentId).catch(err => {
          console.error('Error notifying backend of disconnection:', err);
        });
        if (onEndCall) {
          onEndCall();
        }
      });

      // Handle dominant speaker
      room.on('dominantSpeakerChanged', (participant) => {
        console.log('Dominant speaker changed:', participant?.identity);
      });

      // Handle remote participants joining
      room.on("participantConnected", (participant) => {
        console.log("=== PARTICIPANT CONNECTED EVENT ===");
        console.log("Participant connected:", participant.identity, participant.sid);
        console.log("Total participants in room:", room.participants.size);
        setParticipantCount(room.participants.size + 1);
        addParticipant(participant);
        
        // Always transition to in-call when someone joins
        console.log("Transitioning to in-call state");
        setCallState('in-call');
      });

      // Handle remote participants leaving
      room.on("participantDisconnected", (participant) => {
        console.log("Participant disconnected:", participant.identity);
        setParticipantCount(room.participants.size);
        removeParticipant(participant);
        
        // If no one else is in the room, end the call for both sides
        if (room.participants.size === 0) {
          console.log("All participants left, ending call for both sides");
          setTimeout(() => {
            endCall();
          }, 3000); // Wait 3 seconds before ending to handle temporary reconnections
        }
      });

      // Handle existing participants
      console.log("Checking for existing participants...");
      room.participants.forEach((participant) => {
        console.log("Found existing participant:", participant.identity);
        addParticipant(participant);
      });

      // Set initial state based on whether there are participants
      const initialState = room.participants.size > 0 ? 'in-call' : 'connecting';
      setCallState(initialState);
      console.log("Initial call state set to:", initialState, "with", room.participants.size, "existing participants");
      
      // Periodic check for participants (backup mechanism)
      const participantCheckInterval = setInterval(() => {
        const currentSize = room.participants.size;
        console.log("Periodic participant check:", currentSize, "participants");
        if (currentSize > 0) {
          console.log("Found participants, transitioning to in-call");
          setCallState('in-call');
        }
      }, 2000);
      
      // Store interval ID for cleanup
      room.participantCheckInterval = participantCheckInterval;
      
      } catch (err) {
        console.error("Error joining room:", err);
        setError(err.message || "Failed to join video call");
        setCallState('ended');
      }
  };

  const attachLocalTrack = (track, container) => {
    console.log("Attaching local track:", track.kind, "to container:", container);
    
    if (container) {
      container.innerHTML = '';
      const mediaElement = track.attach();
      mediaElement.className = 'w-full h-full object-cover';
      if (track.kind === 'audio') {
        mediaElement.className = 'hidden';
      }
      container.appendChild(mediaElement);
      console.log("Local track attached successfully");
    } else {
      console.log("Container is null for local track:", track.kind);
    }
  };

  const addParticipant = (participant) => {
    console.log("Adding participant:", participant.identity, participant.sid);
    setRemoteParticipants((prev) => {
      // Check if participant already exists
      if (prev.some(p => p.sid === participant.sid)) {
        console.log("Participant already exists, not adding again");
        return prev;
      }
      console.log("Adding new participant to state");
      return [...prev, participant];
    });

    // Attach tracks when they're subscribed
    participant.tracks.forEach((publication) => {
      if (publication.isSubscribed) {
        attachTrackToParticipant(participant, publication.track);
      }
    });

    participant.on("trackSubscribed", (track) => {
      console.log("Track subscribed for participant:", participant.identity, track.kind);
      attachTrackToParticipant(participant, track);
    });

    participant.on("trackUnsubscribed", (track) => {
      console.log("Track unsubscribed for participant:", participant.identity, track.kind);
      detachTrackFromParticipant(participant, track);
    });
  };

  const removeParticipant = (participant) => {
    setRemoteParticipants((prev) => prev.filter((p) => p !== participant));

    participant.tracks.forEach((publication) => {
      if (publication.track) {
        publication.track.detach().forEach(element => element.remove());
      }
    });

    if (participantVideoRefs.current[participant.sid]) {
      participantVideoRefs.current[participant.sid].innerHTML = '';
    }
    if (participantAudioRefs.current[participant.sid]) {
      participantAudioRefs.current[participant.sid].innerHTML = '';
    }
  };

  const attachTrackToParticipant = (participant, track) => {
    console.log("Attaching track to participant:", participant.identity, track.kind);
    
    if (track.kind === "video") {
      const container = participantVideoRefs.current[participant.sid];
      console.log("Video container for participant:", participant.sid, container);
      
      if (container) {
        // Clear existing content
        container.innerHTML = '';
        
        const mediaElement = track.attach();
        mediaElement.className = 'w-full h-full object-cover';
        container.appendChild(mediaElement);
        console.log("Video track attached successfully");
      } else {
        console.log("Video container not found for participant:", participant.sid, "will attach when ref is available");
        // Store track for later attachment when ref becomes available
        if (!participant.pendingTracks) {
          participant.pendingTracks = [];
        }
        participant.pendingTracks.push(track);
      }
    } else if (track.kind === "audio") {
      const container = participantAudioRefs.current[participant.sid];
      console.log("Audio container for participant:", participant.sid, container);
      
      if (container) {
        container.innerHTML = '';
        const mediaElement = track.attach();
        mediaElement.className = 'hidden';
        container.appendChild(mediaElement);
        console.log("Audio track attached successfully");
      } else {
        console.log("Audio container not found for participant:", participant.sid, "will attach when ref is available");
        // Store track for later attachment when ref becomes available
        if (!participant.pendingTracks) {
          participant.pendingTracks = [];
        }
        participant.pendingTracks.push(track);
      }
    }
  };

  const detachTrackFromParticipant = (participant, track) => {
    track.detach().forEach(element => element.remove());
    
    if (track.kind === "video" && participantVideoRefs.current[participant.sid]) {
      participantVideoRefs.current[participant.sid].innerHTML = '';
    } else if (track.kind === "audio" && participantAudioRefs.current[participant.sid]) {
      participantAudioRefs.current[participant.sid].innerHTML = '';
    }
  };

  const toggleAudio = () => {
    localTracks.forEach(localTrack => {
      if (localTrack.kind === 'audio') {
        if (localTrack.isEnabled) {
          localTrack.disable();
          setIsAudioEnabled(false);
        } else {
          localTrack.enable();
          setIsAudioEnabled(true);
        }
      }
    });
  };

  const toggleVideo = () => {
    localTracks.forEach(localTrack => {
      if (localTrack.kind === 'video') {
        if (localTrack.isEnabled) {
          localTrack.disable();
          setIsVideoEnabled(false);
        } else {
          localTrack.enable();
          setIsVideoEnabled(true);
        }
      }
    });
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        // Use browser's getDisplayMedia for screen sharing
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { width: 1920, height: 1080 },
          audio: false
        });
        
        // Handle user cancellation of screen selection
        stream.getVideoTracks()[0].onended = () => {
          console.log('Screen sharing stopped by user');
          setIsScreenSharing(false);
          const screenTrack = localTracks.find(t => t.name === 'screen');
          if (screenTrack) {
            if (room) {
              room.localParticipant.unpublishTrack(screenTrack);
            }
            screenTrack.stop();
            screenTrack.detach().forEach(el => el.remove());
            setLocalTracks(prev => prev.filter(t => t !== screenTrack));
            if (screenShareRef.current) {
              screenShareRef.current.innerHTML = '';
            }
          }
        };
        
        const screenTrack = await TwilioVideo.LocalVideoTrack.fromMediaStream(stream, {
          name: 'screen'
        });
        
        setLocalTracks(prev => [...prev, screenTrack]);
        attachLocalTrack(screenTrack, screenShareRef.current);
        
        if (room) {
          room.localParticipant.publishTrack(screenTrack);
        }
        
        setIsScreenSharing(true);
      } else {
        const screenTrack = localTracks.find(t => t.name === 'screen');
        if (screenTrack) {
          if (room) {
            room.localParticipant.unpublishTrack(screenTrack);
          }
          screenTrack.stop();
          screenTrack.detach().forEach(el => el.remove());
          
          setLocalTracks(prev => prev.filter(t => t !== screenTrack));
          if (screenShareRef.current) {
            screenShareRef.current.innerHTML = '';
          }
        }
        setIsScreenSharing(false);
      }
    } catch (err) {
      console.error('Error toggling screen share:', err);
      if (err.name === 'NotAllowedError') {
        setError('Screen sharing permission denied. Please allow screen access and try again.');
      } else {
        setError('Failed to toggle screen sharing');
      }
    }
  };

  const endCall = async () => {
    setShowEndCallConfirm(false);

    // End the call first regardless of form status
    try {
      await endVideoCall(appointmentId);
    } catch (err) {
      console.error('Error notifying backend of call end:', err);
    }

    await cleanupRoom();
    setCallState('ended');

    if (onEndCall) {
      onEndCall();
    }
  };

  const handleSaveForm = async () => {
    try {
      // Save form data locally (could be saved to backend as draft)
      setSavedFormData({...formData});
      localStorage.setItem(`consultation_draft_${appointmentId}`, JSON.stringify(formData));
      alert('Form saved successfully! You can submit it later.');
    } catch (err) {
      console.error('Error saving form:', err);
      alert('Failed to save form. Please try again.');
    }
  };

  const handleLaterSubmit = () => {
    // Hide form but keep data saved
    setShowConsultationForm(false);
    alert('Form saved. You can submit it later from the appointment details.');
  };

  const handleSubmitForm = async () => {
    if (!formData.chiefComplaints.trim()) {
      alert('Please fill in at least the chief complaints before submitting.');
      return;
    }

    try {
      setSubmittingForm(true);
      console.log('Submitting consultation form for appointment:', appointmentId);
      console.log('Form data:', formData);
      const token = sessionStorage.getItem("token");
      const API = axios.create({
        baseURL: import.meta.env.VITE_API_URL,
      });
      API.interceptors.request.use((config) => {
        if (token) {
          config.headers.Authorization = token;
        }
        return config;
      });

      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('appointmentId', appointmentId);
      formDataToSend.append('chiefComplaints', formData.chiefComplaints);
      formDataToSend.append('appetite', formData.appetite);
      formDataToSend.append('thirst', formData.thirst);
      formDataToSend.append('desire', formData.desire);
      formDataToSend.append('aversion', formData.aversion);
      formDataToSend.append('habits', formData.habits);
      formDataToSend.append('stool', formData.stool);
      formDataToSend.append('urine', formData.urine);
      formDataToSend.append('perspiration', formData.perspiration);
      formDataToSend.append('menWomen', formData.menWomen);
      formDataToSend.append('sleep', formData.sleep);
      formDataToSend.append('dream', formData.dream);
      formDataToSend.append('thermal', formData.thermal);
      formDataToSend.append('amelioration', formData.amelioration);
      formDataToSend.append('aggravation', formData.aggravation);
      formDataToSend.append('otherComplaints', formData.otherComplaints);
      formDataToSend.append('levelsOfHealth', formData.levelsOfHealth);
      formDataToSend.append('perception', formData.perception);
      formDataToSend.append('callDuration', callDuration);

      // Add screenshots
      formData.screenshots.forEach((file) => {
        formDataToSend.append('screenshots', file);
      });

      const response = await API.post("/api/v1/appointment/submit-consultation", formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Consultation submission response:', response.data);

      if (response.data.status === 1) {
        console.log('Consultation submitted successfully');
        alert('Consultation submitted successfully!');

        // Clear local storage draft
        localStorage.removeItem(`consultation_draft_${appointmentId}`);

        // Don't end the call automatically - just hide the form
        setShowConsultationForm(false);
      } else {
        console.error('Consultation submission failed:', response.data.message);
        alert('Failed to submit consultation: ' + response.data.message);
      }
    } catch (err) {
      console.error('Error submitting consultation:', err);
      alert('Failed to submit consultation. Please try again.');
    } finally {
      setSubmittingForm(false);
    }
  };



  const handleEndCallClick = () => {
    if (callState === 'in-call' || callState === 'connecting') {
      setShowEndCallConfirm(true);
    } else {
      endCall();
    }
  };

  const getConnectionQualityColor = () => {
    switch (connectionQuality) {
      case 'excellent':
      case 'high':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-orange-500';
      case 'poor':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const hasRemoteParticipants = remoteParticipants.length > 0;

  // Debug logging (always runs)
  useEffect(() => {
    console.log("Call state changed:", callState);
    console.log("Remote participants count:", remoteParticipants.length);
    console.log("Has remote participants:", hasRemoteParticipants);
  }, [callState, remoteParticipants.length, hasRemoteParticipants]);

  // Attach local tracks when room and refs are available
  useEffect(() => {
    if (room && localTracks.length > 0) {
      const localVideoTrack = localTracks.find(track => track.kind === 'video');
      const localAudioTrack = localTracks.find(track => track.kind === 'audio');
      
      console.log("Attempting to attach local tracks:", { localVideoTrack, localAudioTrack, localVideoRef: localVideoRef.current, localAudioRef: localAudioRef.current });
      
      if (localVideoTrack && localVideoRef.current) {
        localVideoRef.current.innerHTML = '';
        const mediaElement = localVideoTrack.attach();
        mediaElement.className = 'w-full h-full object-cover';
        mediaElement.muted = true; // Mute local audio to prevent feedback
        localVideoRef.current.appendChild(mediaElement);
        console.log("Local video track attached");
      }
      
      if (localAudioTrack && localAudioRef.current) {
        localAudioRef.current.innerHTML = '';
        const mediaElement = localAudioTrack.attach();
        mediaElement.className = 'hidden';
        localAudioRef.current.appendChild(mediaElement);
        console.log("Local audio track attached");
      }
    }
  }, [room, localTracks, callState]);

  // Attach remote participant tracks when refs become available
  useEffect(() => {
    remoteParticipants.forEach(participant => {
      const videoContainer = participantVideoRefs.current[participant.sid];
      const audioContainer = participantAudioRefs.current[participant.sid];
      
      // Attach any pending tracks first
      if (participant.pendingTracks && participant.pendingTracks.length > 0) {
        participant.pendingTracks.forEach(track => {
          if (track.kind === 'video' && videoContainer && videoContainer.children.length === 0) {
            console.log("Attaching pending video track for participant:", participant.sid);
            videoContainer.innerHTML = '';
            const mediaElement = track.attach();
            mediaElement.className = 'w-full h-full object-cover';
            videoContainer.appendChild(mediaElement);
          } else if (track.kind === 'audio' && audioContainer && audioContainer.children.length === 0) {
            console.log("Attaching pending audio track for participant:", participant.sid);
            audioContainer.innerHTML = '';
            const mediaElement = track.attach();
            mediaElement.className = 'hidden';
            audioContainer.appendChild(mediaElement);
          }
        });
        participant.pendingTracks = [];
      }
      
      // Attach currently subscribed tracks
      participant.tracks.forEach(publication => {
        if (publication.isSubscribed && publication.track) {
          if (publication.track.kind === 'video' && videoContainer && videoContainer.children.length === 0) {
            console.log("Attaching video track for participant:", participant.sid);
            videoContainer.innerHTML = '';
            const mediaElement = publication.track.attach();
            mediaElement.className = 'w-full h-full object-cover';
            videoContainer.appendChild(mediaElement);
          } else if (publication.track.kind === 'audio' && audioContainer && audioContainer.children.length === 0) {
            console.log("Attaching audio track for participant:", participant.sid);
            audioContainer.innerHTML = '';
            const mediaElement = publication.track.attach();
            mediaElement.className = 'hidden';
            audioContainer.appendChild(mediaElement);
          }
        }
      });
    });
  }, [remoteParticipants]);

  // Pre-call Screen
  if (callState === 'pre-call') {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-8 py-6">
            <h1 className="text-white text-2xl font-semibold">Video Call</h1>
            <p className="text-teal-100 text-sm mt-1">Appointment #{appointmentId}</p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Video Preview */}
            <div className="relative bg-gray-900 rounded-2xl overflow-hidden mb-6 aspect-video">
              <div
                ref={previewVideoRef}
                className="w-full h-full"
              />
              
              {/* Preview Label */}
              <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                <span className="text-white text-sm font-medium">Camera Preview</span>
              </div>
            </div>

            {/* Permission Error */}
            {permissionError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                  <div>
                    <p className="text-red-800 font-medium text-sm">Permission Required</p>
                    <p className="text-red-600 text-sm mt-1">{permissionError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-teal-50 rounded-xl p-4 mb-6">
              <h3 className="text-teal-800 font-semibold mb-2 text-sm">Before joining:</h3>
              <ul className="text-teal-700 text-sm space-y-1">
                <li>• Ensure you're in a quiet, well-lit environment</li>
                <li>• Test your microphone and camera</li>
                <li>• Use a stable internet connection</li>
                <li>• Have your medical information ready</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={joinRoom}
                disabled={!!permissionError}
                className="flex-1 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
              >
                Join Call
              </button>
              <button
                onClick={endCall}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-4 rounded-xl font-semibold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Connecting/Waiting Screen
  if (callState === 'connecting') {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-600 to-cyan-600 px-8 py-6">
            <h1 className="text-white text-2xl font-semibold">
              Waiting for other person
            </h1>
            <p className="text-teal-100 text-sm mt-1">Appointment #{appointmentId}</p>
          </div>

          {/* Content */}
          <div className="p-8 text-center">
            {/* Video Preview */}
            <div className="relative bg-gray-900 rounded-2xl overflow-hidden mb-6 aspect-video">
              <div ref={localVideoRef} className="w-full h-full"></div>
              <div ref={localAudioRef}></div>
              
              {/* Waiting Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="text-center">
                  <div className="bg-white/95 backdrop-blur-sm rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-3 border-teal-500 border-t-transparent"></div>
                  </div>
                  <p className="text-white text-lg font-medium">
                    Other person will join shortly
                  </p>
                  <p className="text-white/80 text-sm mt-1">Please stay on this screen</p>
                </div>
              </div>

              {/* Local Video Label */}
              <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                <span className="text-white text-sm font-medium">You</span>
              </div>
            </div>

            {/* Timer */}
            <div className="flex items-center justify-center gap-2 text-teal-600 mb-6">
              <Clock size={20} />
              <span className="font-mono text-xl font-semibold">{formatDuration(callDuration)}</span>
            </div>

            {/* Quick Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={toggleAudio}
                className={`p-4 rounded-xl transition-all ${
                  isAudioEnabled 
                    ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' 
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                {isAudioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
              </button>

              <button
                onClick={toggleVideo}
                className={`p-4 rounded-xl transition-all ${
                  isVideoEnabled 
                    ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' 
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                {isVideoEnabled ? <VideoIcon size={24} /> : <VideoOff size={24} />}
              </button>

              <button
                onClick={handleEndCallClick}
                className="p-4 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-all"
              >
                <PhoneOff size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Reconnecting Screen
  if (callState === 'reconnecting') {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden p-8 text-center">
          <div className="bg-amber-50 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <RefreshCw size={40} className="text-amber-500 animate-spin" />
          </div>
          <h2 className="text-gray-800 text-2xl font-semibold mb-2">Reconnecting...</h2>
          <p className="text-gray-500 mb-6">Connection interrupted. Please wait while we reconnect.</p>
          <div className="flex items-center justify-center gap-2 text-amber-600">
            <Signal size={20} />
            <span className="font-medium">Restoring connection</span>
          </div>
        </div>
      </div>
    );
  }

  // Error Screen
  if (error && callState === 'ended') {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden p-8 text-center">
          <div className="bg-red-50 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <PhoneOff size={40} className="text-red-500" />
          </div>
          <h2 className="text-gray-800 text-2xl font-semibold mb-2">Connection Error</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={joinRoom}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={endCall}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Call Ended Screen
  if (callState === 'ended') {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden p-8 text-center">
          <div className="bg-teal-50 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <VideoIcon size={40} className="text-teal-600" />
          </div>
          <h2 className="text-gray-800 text-2xl font-semibold mb-2">Call Ended</h2>
          <p className="text-gray-500 mb-2">Call duration: {formatDuration(callDuration)}</p>
          <p className="text-gray-400 text-sm mb-6">Thank you for using our service</p>
          <button
            onClick={onEndCall}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-teal-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-teal-100 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-teal-100 p-2 rounded-lg">
              <VideoIcon size={20} className="text-teal-600" />
            </div>
            <div>
              <h1 className="text-gray-800 font-semibold text-sm">Video Call</h1>
              <p className="text-gray-500 text-xs">Appointment #{appointmentId}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Call Duration */}
          <div className="flex items-center gap-2 bg-teal-50 text-teal-700 px-3 py-1.5 rounded-lg">
            <Clock size={16} />
            <span className="font-mono text-sm font-medium">{formatDuration(callDuration)}</span>
          </div>

          {/* Connection Quality */}
          <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-lg">
            <Signal size={16} className={`${connectionQuality === 'excellent' || connectionQuality === 'high' ? 'text-green-600' : connectionQuality === 'medium' ? 'text-yellow-500' : 'text-red-500'}`} />
            <span className="text-gray-600 text-xs font-medium capitalize">{connectionQuality}</span>
          </div>

          {/* Toggle Form Button (Doctor Only) */}
          {userType === 'doctor' && (
            <button
              onClick={() => setShowConsultationForm(!showConsultationForm)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                showConsultationForm 
                  ? 'bg-teal-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FileText size={16} />
              {showConsultationForm ? 'Hide Form' : 'Show Form'}
            </button>
          )}
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 relative flex min-h-0">
        {/* Video Section */}
        <div className={`relative p-4 flex-1 min-h-0 ${showConsultationForm && userType === 'doctor' ? '' : 'w-full'}`}>
        {hasRemoteParticipants ? (
          // Remote participant big screen, local video picture-in-picture
          <div className="h-full w-full relative bg-slate-900 rounded-2xl overflow-hidden shadow-xl">
            {/* Remote Participant - Big Screen */}
            {remoteParticipants.map((participant) => (
              <div key={participant.sid} className="absolute inset-0">
                <div 
                  ref={(el) => participantVideoRefs.current[participant.sid] = el}
                  className="w-full h-full"
                ></div>
                <div 
                  ref={(el) => participantAudioRefs.current[participant.sid] = el}
                ></div>
                
                {/* Participant Name */}
                <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-xl">
                  <span className="text-white text-sm font-medium">
                    {participant.identity || 'Other Person'}
                  </span>
                </div>
              </div>
            ))}

            {/* Local Video - Picture-in-Picture (Small) */}
            <div className="absolute bottom-4 right-4 w-48 h-36 bg-slate-800 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20">
              {isVideoEnabled ? (
                <div ref={localVideoRef} className="w-full h-full"></div>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                  <User size={48} className="text-white" />
                </div>
              )}
              <div ref={localAudioRef}></div>
              
              {/* Local Video Label */}
              <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg">
                <span className="text-white text-xs font-medium">You</span>
              </div>

              {/* Status Indicators */}
              <div className="absolute top-2 right-2 flex gap-1">
                {!isAudioEnabled && (
                  <div className="bg-red-500 p-1.5 rounded-lg">
                    <MicOff size={12} className="text-white" />
                  </div>
                )}
                {!isVideoEnabled && (
                  <div className="bg-red-500 p-1.5 rounded-lg">
                    <VideoOff size={12} className="text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Screen Share Display (Full screen when sharing) */}
            {isScreenSharing && (
              <div className="absolute inset-0 bg-gray-900 z-30">
                <div ref={screenShareRef} className="w-full h-full"></div>
                <div className="absolute top-4 left-4 bg-green-600 px-3 py-1.5 rounded-lg flex items-center gap-2">
                  <Monitor size={16} className="text-white" />
                  <span className="text-white text-sm font-medium">Screen Sharing</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Full screen local video when waiting (no one has joined yet)
          <div className="h-full w-full relative bg-slate-900 rounded-2xl overflow-hidden shadow-xl">
            {isVideoEnabled ? (
              <div ref={localVideoRef} className="w-full h-full"></div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                <User size={96} className="text-white" />
              </div>
            )}
            <div ref={localAudioRef}></div>
            
            {/* Waiting Room Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="text-center bg-white/95 backdrop-blur-sm rounded-2xl p-8 max-w-md">
                <div className="bg-teal-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-3 border-teal-500 border-t-transparent"></div>
                </div>
                <h2 className="text-gray-800 text-xl font-semibold mb-2">
                  Waiting for other person
                </h2>
                <p className="text-gray-500 mb-4">
                  The other person will join shortly. Please stay on this screen.
                </p>
                <div className="flex items-center justify-center gap-2 text-teal-600">
                  <Clock size={16} />
                  <span className="font-mono text-lg font-semibold">{formatDuration(callDuration)}</span>
                </div>
              </div>
            </div>

            {/* Local Video Label */}
            <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-xl">
              <span className="text-white text-sm font-medium">You</span>
            </div>

            {/* Status Indicators */}
            <div className="absolute top-4 right-4 flex gap-2">
              {!isAudioEnabled && (
                <div className="bg-red-500 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <MicOff size={14} className="text-white" />
                  <span className="text-white text-xs font-medium">Muted</span>
                </div>
              )}
              {!isVideoEnabled && (
                <div className="bg-red-500 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <VideoOff size={14} className="text-white" />
                  <span className="text-white text-xs font-medium">Off</span>
                </div>
              )}
            </div>
          </div>
        )}
        </div>

        {/* Consultation Form Sidebar (Doctor Only) */}
        {showConsultationForm && userType === 'doctor' && (
          <div className="w-96 bg-white border-l border-teal-100 p-4 overflow-y-auto">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-teal-100 p-2 rounded-lg">
                <FileText size={16} className="text-teal-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Consultation Notes</h3>
                <p className="text-xs text-gray-400">Fill while talking to patient</p>
              </div>
            </div>

            {/* Appointment Info */}
            <div className="bg-teal-50 rounded-xl p-3 border border-teal-100 mb-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-gray-500 font-semibold mb-1">Appointment ID</p>
                  <p className="text-xs font-bold text-gray-900">#{appointmentId}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold mb-1">Duration</p>
                  <p className="text-xs font-bold text-gray-900">{formatDuration(callDuration)}</p>
                </div>
              </div>
            </div>

            {/* Comprehensive Consultation Form */}
            <div className="space-y-4">
              {/* Chief Complaints & Associate Symptoms */}
              <div>
                <label className="text-xs font-bold text-gray-700 mb-2 block">
                  CHIEF COMPLAINTS & ASSOCIATE SYMPTOMS
                </label>
                <textarea
                  value={formData.chiefComplaints}
                  onChange={(e) => setFormData({...formData, chiefComplaints: e.target.value})}
                  rows={4}
                  placeholder="Enter chief complaints and associate symptoms..."
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-gray-800 resize-none text-sm"
                />
              </div>

              {/* Personal History */}
              <div className="bg-gray-50 rounded-xl p-4">
                <label className="text-xs font-bold text-gray-700 mb-3 block">
                  PERSONAL HISTORY
                </label>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Appetite</label>
                    <input
                      type="text"
                      value={formData.appetite}
                      onChange={(e) => setFormData({...formData, appetite: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Appetite details"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Thirst</label>
                    <input
                      type="text"
                      value={formData.thirst}
                      onChange={(e) => setFormData({...formData, thirst: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Thirst details"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Desire</label>
                    <input
                      type="text"
                      value={formData.desire}
                      onChange={(e) => setFormData({...formData, desire: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Desire details"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Aversion</label>
                    <input
                      type="text"
                      value={formData.aversion}
                      onChange={(e) => setFormData({...formData, aversion: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Aversion details"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Habits</label>
                    <input
                      type="text"
                      value={formData.habits}
                      onChange={(e) => setFormData({...formData, habits: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Habits details"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Stool</label>
                    <input
                      type="text"
                      value={formData.stool}
                      onChange={(e) => setFormData({...formData, stool: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Stool details"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Urine</label>
                    <input
                      type="text"
                      value={formData.urine}
                      onChange={(e) => setFormData({...formData, urine: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Urine details"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Perspiration</label>
                    <input
                      type="text"
                      value={formData.perspiration}
                      onChange={(e) => setFormData({...formData, perspiration: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Perspiration details"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">For Men/Women</label>
                    <input
                      type="text"
                      value={formData.menWomen}
                      onChange={(e) => setFormData({...formData, menWomen: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Men/Women specific details"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Sleep</label>
                    <input
                      type="text"
                      value={formData.sleep}
                      onChange={(e) => setFormData({...formData, sleep: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Sleep details"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Dream</label>
                    <input
                      type="text"
                      value={formData.dream}
                      onChange={(e) => setFormData({...formData, dream: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Dream details"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Thermal</label>
                    <input
                      type="text"
                      value={formData.thermal}
                      onChange={(e) => setFormData({...formData, thermal: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Thermal details"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Amelioration</label>
                    <input
                      type="text"
                      value={formData.amelioration}
                      onChange={(e) => setFormData({...formData, amelioration: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Amelioration details"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Aggravation</label>
                    <input
                      type="text"
                      value={formData.aggravation}
                      onChange={(e) => setFormData({...formData, aggravation: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Aggravation details"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Any other complaints</label>
                    <input
                      type="text"
                      value={formData.otherComplaints}
                      onChange={(e) => setFormData({...formData, otherComplaints: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Other complaints"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Levels Of Health</label>
                    <input
                      type="text"
                      value={formData.levelsOfHealth}
                      onChange={(e) => setFormData({...formData, levelsOfHealth: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="Levels of health"
                    />
                  </div>
                </div>
              </div>

              {/* Upload Screenshots */}
              <div>
                <label className="text-xs font-bold text-gray-700 mb-2 block">
                  Upload Screenshots (Max 5)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    if (formData.screenshots.length + files.length > 5) {
                      alert('Maximum 5 screenshots allowed');
                      return;
                    }
                    setFormData({...formData, screenshots: [...formData.screenshots, ...files]});
                  }}
                  className="w-full p-2 border-2 border-gray-200 rounded-xl text-sm"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.screenshots.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Screenshot ${index + 1}`}
                        className="w-16 h-16 object-cover rounded-lg border"
                      />
                      <button
                        onClick={() => {
                          const newScreenshots = formData.screenshots.filter((_, i) => i !== index);
                          setFormData({...formData, screenshots: newScreenshots});
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Perception */}
              <div>
                <label className="text-xs font-bold text-gray-700 mb-2 block">
                  Perception
                </label>
                <textarea
                  value={formData.perception}
                  onChange={(e) => setFormData({...formData, perception: e.target.value})}
                  rows={4}
                  placeholder="Enter perception details..."
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-gray-800 resize-none text-sm"
                />
              </div>

              {/* Form Actions */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleSaveForm}
                  disabled={submittingForm}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {submittingForm ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleLaterSubmit}
                  disabled={submittingForm}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  Later
                </button>
                <button
                  onClick={handleSubmitForm}
                  disabled={submittingForm}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {submittingForm ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="bg-white border-t border-teal-100 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-center gap-3">
          {/* Microphone */}
          <button
            onClick={toggleAudio}
            className={`relative group p-4 rounded-2xl transition-all shadow-md ${
              isAudioEnabled 
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' 
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
            title={isAudioEnabled ? 'Mute' : 'Unmute'}
          >
            {isAudioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
            <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {isAudioEnabled ? 'Mute' : 'Unmute'}
            </span>
          </button>

          {/* Video */}
          <button
            onClick={toggleVideo}
            className={`relative group p-4 rounded-2xl transition-all shadow-md ${
              isVideoEnabled 
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' 
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
            title={isVideoEnabled ? 'Stop Video' : 'Start Video'}
          >
            {isVideoEnabled ? <VideoIcon size={24} /> : <VideoOff size={24} />}
            <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {isVideoEnabled ? 'Stop Video' : 'Start Video'}
            </span>
          </button>

          {/* Screen Share */}
          <button
            onClick={toggleScreenShare}
            className={`relative group p-4 rounded-2xl transition-all shadow-md ${
              isScreenSharing 
                ? 'bg-teal-600 hover:bg-teal-700 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
          >
            {isScreenSharing ? <MonitorOff size={24} /> : <Monitor size={24} />}
            <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
            </span>
          </button>

          {/* End Call */}
          <button
            onClick={handleEndCallClick}
            className="relative group p-4 rounded-2xl bg-red-500 hover:bg-red-600 text-white transition-all shadow-md ml-4"
            title="End Call"
          >
            <PhoneOff size={24} />
            <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              End Call
            </span>
          </button>
        </div>
      </div>

      {/* End Call Confirmation Dialog */}
      {showEndCallConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="bg-red-50 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <PhoneOff size={32} className="text-red-500" />
              </div>
              <h3 className="text-gray-800 text-xl font-semibold mb-2">End Call?</h3>
              <p className="text-gray-500">
                Are you sure you want to end this video call? This action cannot be undone.
              </p>
              {userType === 'doctor' && !consultationNotes.trim() && (
                <p className="text-amber-600 text-sm mt-2 font-medium">
                  Please fill in consultation notes before ending the call.
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEndCallConfirm(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={endCall}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
              >
                End Call
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCall;