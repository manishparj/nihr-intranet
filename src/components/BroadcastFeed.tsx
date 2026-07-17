import React, { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, Avatar, Space, Upload, Tooltip, Popconfirm, Tag, message, App, Badge } from 'antd';
import { SendOutlined, FileTextOutlined, PaperClipOutlined, LinkOutlined, DeleteOutlined, EditOutlined, MessageOutlined, BellOutlined, CloseOutlined, CheckOutlined } from '@ant-design/icons';
import { BroadcastMessage } from '../types';

interface BroadcastFeedProps {
  messages: BroadcastMessage[];
  isAdmin: boolean;
  onSendMessage: (text: string, file?: { name: string; data: string; type: string }, link?: string) => Promise<void>;
  onDeleteMessage: (id: string) => Promise<void>;
  isWhatsAppTheme?: boolean;
  onNewMessage?: (messages: BroadcastMessage[]) => void;
}

const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const start = ctx.currentTime;

    const notes = [
      { freq: 880, time: 0.0 },   // A5
      { freq: 1175, time: 0.28 }, // D6
      { freq: 1568, time: 0.60 }, // G6
      { freq: 1175, time: 1.0 },  // D6
    ];

    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(note.freq, start + note.time);

      gain.gain.setValueAtTime(0.0001, start + note.time);
      gain.gain.exponentialRampToValueAtTime(0.35, start + note.time + 0.02);
      gain.gain.setValueAtTime(0.35, start + note.time + 0.22);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + note.time + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start + note.time);
      osc.stop(start + note.time + 0.45);
    });
  } catch (err) {
    console.warn(err);
  }
};

export const BroadcastFeed: React.FC<BroadcastFeedProps> = ({
  messages,
  isAdmin,
  onSendMessage,
  onDeleteMessage,
  isWhatsAppTheme = false,
  onNewMessage,
}) => {
  const { message } = App.useApp();
  const [inputText, setInputText] = useState('');
  const [inputLink, setInputLink] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; data: string; type: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  // Ref for auto-scrolling to bottom
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  
  // FIX: Use a persistent notification state that survives re-renders
  const [notification, setNotification] = useState<{
    show: boolean;
    count: number;
    messageIds: string[];
    timestamp: number;
  }>(() => {
    const saved = localStorage.getItem('broadcast_notification');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Date.now() - parsed.timestamp < 3600000) {
          return parsed;
        }
      } catch (e) {}
    }
    return {
      show: false,
      count: 0,
      messageIds: [],
      timestamp: 0
    };
  });

  // FIX: Save notification state to localStorage whenever it changes
  useEffect(() => {
    if (notification.show) {
      localStorage.setItem('broadcast_notification', JSON.stringify(notification));
    } else {
      localStorage.removeItem('broadcast_notification');
    }
  }, [notification]);

  const prevCountRef = useRef(messages.length);
  const latestMessageIdRef = useRef<string | null>(
    messages.length > 0 ? messages[0].id : null
  );
  const eventSourceRef = useRef<EventSource | null>(null);
  const notificationCountRef = useRef(notification.count);

  useEffect(() => {
    notificationCountRef.current = notification.count;
  }, [notification.count]);

  // Auto-scroll to bottom function
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior
      });
    }
  };

  // Scroll to bottom when messages change (new messages)
  useEffect(() => {
    if (shouldAutoScroll) {
      scrollToBottom('smooth');
    }
  }, [messages, shouldAutoScroll]);

  // Initial scroll to bottom on mount
  useEffect(() => {
    setTimeout(() => {
      scrollToBottom('auto');
    }, 100);
  }, []);

  // Detect user scroll to determine if auto-scroll should continue
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
    setShouldAutoScroll(isAtBottom);
  };

  // SSE listener for public users
  useEffect(() => {
    if (isAdmin) return;

    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connectSSE = () => {
      try {
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }

        console.log('[BroadcastFeed] Establishing SSE connection...');
        const eventSource = new EventSource('/api/broadcasts/stream');
        eventSourceRef.current = eventSource;

        eventSource.onmessage = (event) => {
          try {
            const latestMessages = JSON.parse(event.data);
            // Sort by timestamp ascending (oldest first) for WhatsApp-style display
            const sortedMessages = latestMessages.sort((a: BroadcastMessage, b: BroadcastMessage) => 
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );

            if (sortedMessages.length > 0) {
              const latestId = sortedMessages[sortedMessages.length - 1].id;
              if (latestId !== latestMessageIdRef.current) {
                console.log('[BroadcastFeed] New message received via SSE');
                
                if (!isMuted) {
                  playNotificationSound();
                }
                
                // Get new message IDs
                const newMessageIds = sortedMessages
                  .filter(msg => msg.id !== latestMessageIdRef.current)
                  .map(msg => msg.id);
                
                setNotification(prev => {
                  if (!prev.show) {
                    return {
                      show: true,
                      count: newMessageIds.length,
                      messageIds: newMessageIds,
                      timestamp: Date.now()
                    };
                  }
                  
                  const allMessageIds = [...prev.messageIds, ...newMessageIds];
                  const uniqueIds = [...new Set(allMessageIds)];
                  
                  return {
                    show: true,
                    count: uniqueIds.length,
                    messageIds: uniqueIds,
                    timestamp: Date.now()
                  };
                });
                
                latestMessageIdRef.current = latestId;
                
                if (onNewMessage) {
                  onNewMessage(sortedMessages);
                }
                
                // Auto-scroll to bottom on new message
                if (shouldAutoScroll) {
                  setTimeout(() => scrollToBottom('smooth'), 100);
                }
              }
            }
          } catch (error) {
            console.error('[BroadcastFeed] Error processing SSE message:', error);
          }
        };

        eventSource.onerror = (error) => {
          console.warn('[BroadcastFeed] SSE connection lost, reconnecting...', error);
          eventSource.close();
          if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
          }
          reconnectTimeout = setTimeout(connectSSE, 5000);
        };

        eventSource.onopen = () => {
          console.log('[BroadcastFeed] SSE connection established successfully');
        };

      } catch (error) {
        console.error('[BroadcastFeed] Failed to establish SSE connection:', error);
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
        }
        reconnectTimeout = setTimeout(connectSSE, 5000);
      }
    };

    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
      console.log('[BroadcastFeed] SSE connection closed');
    };
  }, [isAdmin, isMuted, onNewMessage, shouldAutoScroll]);

  // Detect messages prop changes
  useEffect(() => {
    if (!isAdmin && messages.length > prevCountRef.current) {
      const currentLatestId = messages.length > 0 ? messages[messages.length - 1].id : null;
      if (currentLatestId && currentLatestId !== latestMessageIdRef.current) {
        console.log('[BroadcastFeed] New message detected from props');
        
        if (!isMuted) {
          playNotificationSound();
        }
        
        const newMessageIds = messages
          .slice(prevCountRef.current)
          .map(msg => msg.id);
        
        setNotification(prev => {
          if (!prev.show) {
            return {
              show: true,
              count: newMessageIds.length,
              messageIds: newMessageIds,
              timestamp: Date.now()
            };
          }
          
          const allMessageIds = [...prev.messageIds, ...newMessageIds];
          const uniqueIds = [...new Set(allMessageIds)];
          
          return {
            show: true,
            count: uniqueIds.length,
            messageIds: uniqueIds,
            timestamp: Date.now()
          };
        });
        
        latestMessageIdRef.current = currentLatestId;
        
        // Auto-scroll to bottom on new message
        if (shouldAutoScroll) {
          setTimeout(() => scrollToBottom('smooth'), 100);
        }
      }
    }
    prevCountRef.current = messages.length;
  }, [messages, isAdmin, isMuted, shouldAutoScroll]);

  const clearNotification = () => {
    setNotification({
      show: false,
      count: 0,
      messageIds: [],
      timestamp: 0
    });
    localStorage.removeItem('broadcast_notification');
    console.log('[BroadcastFeed] Notification cleared by user');
  };

  const markMessagesAsRead = () => {
    setNotification(prev => ({
      ...prev,
      count: 0,
      messageIds: []
    }));
    message.success('Messages marked as read');
    console.log('[BroadcastFeed] Messages marked as read');
  };

  const handleSend = async () => {
    if (!inputText.trim() && !attachedFile && !inputLink.trim()) {
      return;
    }

    setSending(true);
    try {
      await onSendMessage(inputText, attachedFile || undefined, inputLink || undefined);
      setInputText('');
      setInputLink('');
      setAttachedFile(null);
      setShowLinkInput(false);
      message.success('Announcement broadcasted successfully.');
      
      // Scroll to bottom after sending
      setTimeout(() => scrollToBottom('smooth'), 100);
    } catch (e) {
      message.error('Failed to broadcast announcement.');
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = (file: File) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      message.error('Unsupported file type. Please upload PDF, Word Doc, or Image.');
      return false;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachedFile({
        name: file.name,
        data: reader.result as string,
        type: file.type.startsWith('image/') ? 'image' : file.type.includes('pdf') ? 'pdf' : 'word',
      });
      message.success(`${file.name} attached.`);
    };
    reader.readAsDataURL(file);
    return false;
  };

  const downloadAttachment = (fileName: string, base64Data: string) => {
    const link = document.createElement('a');
    link.href = base64Data;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTimeSince = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const shouldShowNotification = notification.show && notification.count > 0;

  // Sort messages for WhatsApp-style (oldest first)
  const sortedMessages = [...messages].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <Card 
      title={
        isWhatsAppTheme ? (
          <div className="flex items-center justify-between w-full gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar 
                size="large" 
                className="bg-[#128C7E] text-white flex-shrink-0 flex items-center justify-center font-bold text-sm shadow-inner"
                style={{ border: '2px solid #25D366' }}
              >
                NIHR
              </Avatar>
              <div className="min-w-0">
                <div className="font-extrabold text-xs sm:text-sm text-white flex items-center gap-2 flex-wrap">
                  🟢 ICMR-NIHR URGENT BROADCAST CHANNEL
                  <Tag color="#25D366" className="text-[9px] font-bold border-0 uppercase text-slate-900 animate-pulse m-0 px-1.5 py-0.5">PRIORITY</Tag>
                </div>
                <div className="text-[10px] text-emerald-100 flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-[#25D366] rounded-full inline-block animate-ping"></span>
                  <span>Super Admin Official Stream (Read-Only for Public)</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isAdmin && (
                <Tooltip title={` new message${notification.count > 1 ? 's' : ''}` || 'No new messages'}>
                  <Badge 
                    offset={[-5, 5]} 
                    size="small"
                    className="cursor-pointer"
                  >
                    <Button
                      type="text"
                      size="small"
                      className="text-white hover:text-emerald-200 hover:bg-white/10 rounded-full h-8 w-8 flex items-center justify-center border border-white/10 flex-shrink-0"
                      onClick={() => {
                        // Scroll to bottom when bell clicked
                        scrollToBottom('smooth');
                      }}
                    >
                      <BellOutlined className={notification.count > 0 ? 'animate-bounce' : ''} />
                    </Button>
                  </Badge>
                </Tooltip>
              )}
              <Tooltip title={isMuted ? "Unmute bulletin notification tone" : "Mute bulletin notification tone"}>
                <Button
                  type="text"
                  size="small"
                  className="text-white hover:text-emerald-200 hover:bg-white/10 rounded-full h-8 w-8 flex items-center justify-center border border-white/10 flex-shrink-0"
                  onClick={() => {
                    const nextMuted = !isMuted;
                    setIsMuted(nextMuted);
                    if (!nextMuted) {
                      playNotificationSound();
                    }
                  }}
                >
                  {isMuted ? "🔇" : "🔊"}
                </Button>
              </Tooltip>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full gap-2">
            <Space><MessageOutlined className="text-[#005EB8]" /><span>Broadcast Bulletin Channel</span></Space>
            <div className="flex items-center gap-2">
              {!isAdmin && (
                <Tooltip title={`new message${notification.count > 1 ? 's' : ''}` ||  'No new messages'}>
                  <Badge 
                    offset={[-5, 5]} 
                    size="small"
                    className="cursor-pointer"
                  >
                    <Button
                      type="text"
                      size="small"
                      className="text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full h-8 w-8 flex items-center justify-center border border-slate-200 dark:border-zinc-800 flex-shrink-0"
                      onClick={() => {
                        scrollToBottom('smooth');
                      }}
                    >
                      <BellOutlined className={notification.count > 0 ? 'animate-bounce' : ''} />
                    </Button>
                  </Badge>
                </Tooltip>
              )}
              <Tooltip title={isMuted ? "Unmute bulletin notification tone" : "Mute bulletin notification tone"}>
                <Button
                  type="text"
                  size="small"
                  className="text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full h-8 w-8 flex items-center justify-center border border-slate-200 dark:border-zinc-800 flex-shrink-0"
                  onClick={() => {
                    const nextMuted = !isMuted;
                    setIsMuted(nextMuted);
                    if (!nextMuted) {
                      playNotificationSound();
                    }
                  }}
                >
                  {isMuted ? "🔇" : "🔊"}
                </Button>
              </Tooltip>
            </div>
          </div>
        )
      }
      variant="outlined"
      className={`shadow-md rounded-xl overflow-hidden border ${
        isWhatsAppTheme 
          ? 'border-[#075E54] bg-[#efeae2] dark:bg-[#0b141a]' 
          : 'border-slate-200 dark:border-zinc-800'
      }`}
      styles={{
        header: isWhatsAppTheme ? { backgroundColor: '#075E54', borderBottom: 'none', padding: '12px 16px' } : undefined
      }}
    >
      <div className="flex flex-col h-[520px]">
        {/* Notification Banner */}
        {!isAdmin && shouldShowNotification && (
          <div 
            className={`mb-3 p-3 rounded-xl shadow-lg border ${
              isWhatsAppTheme 
                ? 'bg-[#25D366] border-[#1a9e4f] text-white' 
                : 'bg-blue-500 border-blue-600 text-white'
            }`}
            style={{
              animation: 'slideDown 0.5s ease-out'
            }}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <BellOutlined className="text-lg animate-bounce flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-sm block truncate">
                    📢 new message{notification.count > 1 ? 's' : ''} received!
                  </span>
                  <span className="text-xs opacity-80 block">
                    {getTimeSince(notification.timestamp)} • Click bell icon to view
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                <Button 
                  type="text" 
                  size="small"
                  icon={<CheckOutlined />}
                  className="text-white hover:text-white/80 hover:bg-white/20 border border-white/30 rounded-lg text-xs"
                  onClick={markMessagesAsRead}
                >
                  Mark Read
                </Button>
                <Button 
                  type="text" 
                  size="small"
                  icon={<CloseOutlined />}
                  className="text-white hover:text-white/80 hover:bg-white/20 border border-white/30 rounded-lg text-xs"
                  onClick={clearNotification}
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Messages List - WhatsApp style (new messages at bottom) */}
        <div 
          ref={messagesContainerRef}
          className={`flex-1 overflow-y-auto p-4 rounded-xl mb-4 border broadcast-messages-container ${
            isWhatsAppTheme 
              ? 'bg-[#efeae2] dark:bg-[#111b21] border-transparent' 
              : 'bg-slate-50 dark:bg-zinc-900/40 border-slate-200 dark:border-zinc-800'
          }`}
          style={isWhatsAppTheme ? {
            backgroundImage: 'radial-gradient(#dfdcd6 1px, transparent 1.5px), radial-gradient(#dfdcd6 1px, transparent 1.5px)',
            backgroundSize: '24px 24px',
            backgroundPosition: '0 0, 12px 12px'
          } : undefined}
          onScroll={handleScroll}
        >
          {/* New messages indicator at bottom */}
          {!isAdmin && notification.count > 0 && (
            <div className="flex justify-center mb-4 sticky top-0 z-10">
              <div className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-md animate-pulse ${
                isWhatsAppTheme 
                  ? 'bg-[#25D366] text-white' 
                  : 'bg-blue-500 text-white'
              }`}>
                new message{notification.count > 1 ? 's' : ''}
              </div>
            </div>
          )}

          {sortedMessages.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-slate-400">
              <MessageOutlined className="text-4xl mb-2 text-slate-300" />
              <p className="text-xs">No active broadcasts listed.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedMessages.map((msg) => {
                const isSystem = msg.senderName === 'Super Admin';
                
                // Check if this is a new message
                const isNewMessage = !isAdmin && notification.messageIds.includes(msg.id);
                
                const bubbleClass = isWhatsAppTheme
                  ? (isSystem 
                      ? `bg-[#d9fdd3] dark:bg-[#005c4b] text-slate-900 dark:text-zinc-100 rounded-tr-none border border-[#c1ebd0]/30 shadow-sm ${isNewMessage ? 'ring-2 ring-[#25D366] dark:ring-[#25D366] animate-pulse' : ''}` 
                      : `bg-white dark:bg-[#202c33] text-slate-800 dark:text-zinc-200 rounded-tl-none border border-slate-100 dark:border-zinc-800 shadow-sm ${isNewMessage ? 'ring-2 ring-blue-400 dark:ring-blue-400 animate-pulse' : ''}`)
                  : (isSystem 
                      ? `bg-[#005EB8] text-white rounded-tr-none ${isNewMessage ? 'ring-2 ring-blue-300 animate-pulse' : ''}` 
                      : `bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 rounded-tl-none border border-slate-200 dark:border-zinc-700 ${isNewMessage ? 'ring-2 ring-blue-400 animate-pulse' : ''}`);

                return (
                  <div key={msg.id} className={`flex flex-col ${isSystem ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-xl ${bubbleClass}`}>
                      <div className="flex justify-between items-center mb-1 gap-4">
                        <span className={`text-[10px] uppercase tracking-wider ${isWhatsAppTheme ? (isSystem ? 'text-[#075E54] dark:text-[#25D366] font-extrabold' : 'text-blue-600 dark:text-blue-400 font-extrabold') : 'font-bold opacity-90'}`}>
                          {msg.senderName}
                        </span>
                        <span className="text-[9px] text-slate-400 dark:text-zinc-400 flex items-center gap-1">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {isWhatsAppTheme && (
                            <span className="text-[#34b7f1] text-[10px] font-bold">✓✓</span>
                          )}
                        </span>
                      </div>

                      {msg.text && <p className={isWhatsAppTheme ? 'text-xs text-slate-800 dark:text-zinc-100 whitespace-pre-wrap leading-relaxed m-0 font-medium' : 'text-xs whitespace-pre-wrap leading-relaxed m-0'}>{msg.text}</p>}

                      {msg.link && (
                        <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-zinc-700/50">
                          <a 
                            href={msg.link.startsWith('http') ? msg.link : `https://${msg.link}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs flex items-center gap-1 font-bold text-[#0275d8] dark:text-blue-400 hover:underline"
                          >
                            <LinkOutlined /> {msg.link}
                          </a>
                        </div>
                      )}

                      {msg.fileName && msg.fileData && (
                        <div className="mt-2 p-2 rounded-lg flex items-center justify-between gap-3 text-xs bg-slate-100/80 dark:bg-zinc-900/60 text-slate-700 dark:text-zinc-300">
                          <div className="flex items-center gap-2 truncate">
                            <FileTextOutlined className="text-base text-emerald-600 flex-shrink-0" />
                            <span className="truncate font-semibold">{msg.fileName}</span>
                          </div>
                          <Button 
                            size="small" 
                            type="link" 
                            className="p-0 h-auto text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                            onClick={() => downloadAttachment(msg.fileName || 'file', msg.fileData || '')}
                          >
                            Download
                          </Button>
                        </div>
                      )}

                      {isAdmin && (
                        <div className="flex justify-end gap-2 mt-2 pt-1 border-t border-slate-100 dark:border-zinc-700/30">
                          <Popconfirm
                            title="Delete this message?"
                            onConfirm={() => onDeleteMessage(msg.id)}
                            okText="Yes"
                            cancelText="No"
                          >
                            <Button 
                              size="small" 
                              type="text" 
                              danger 
                              icon={<DeleteOutlined className={isSystem ? 'text-red-500/80 hover:text-red-600' : 'text-red-500'} />} 
                              className="p-1 h-auto"
                            />
                          </Popconfirm>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {/* Invisible element for scrolling to bottom */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Controls */}
        {isAdmin ? (
          <div className="space-y-2">
            {attachedFile && (
              <div className="p-2 bg-blue-50 dark:bg-zinc-800 border border-blue-100 dark:border-zinc-700 rounded-lg flex items-center justify-between text-xs">
                <span className="text-slate-700 dark:text-zinc-300 flex items-center gap-1.5 font-medium">
                  <PaperClipOutlined /> {attachedFile.name}
                </span>
                <Button size="small" danger type="link" className="p-0 h-auto" onClick={() => setAttachedFile(null)}>
                  Remove
                </Button>
              </div>
            )}

            {showLinkInput && (
              <Input
                placeholder="Enter custom external URL/link (e.g., https://icmr.gov.in)"
                prefix={<LinkOutlined className="text-slate-400" />}
                value={inputLink}
                onChange={(e) => setInputLink(e.target.value)}
                allowClear
                size="middle"
                className="rounded-lg"
              />
            )}

            <div className="flex items-center gap-2">
              <Upload
                beforeUpload={handleFileUpload}
                showUploadList={false}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
              >
                <Tooltip title="Attach Document (PDF, Word, Image)">
                  <Button icon={<PaperClipOutlined />} className="rounded-xl h-10 w-10 flex justify-center items-center" />
                </Tooltip>
              </Upload>

              <Tooltip title="Add external Link">
                <Button 
                  icon={<LinkOutlined />} 
                  className={`rounded-xl h-10 w-10 flex justify-center items-center ${showLinkInput ? 'bg-blue-50 dark:bg-zinc-800' : ''}`}
                  onClick={() => setShowLinkInput(!showLinkInput)}
                />
              </Tooltip>

              <Input.TextArea
                placeholder="Type your official announcement here..."
                autoSize={{ minRows: 1, maxRows: 3 }}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onPressEnter={(e) => {
                  if (!e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="flex-1 rounded-xl py-2"
              />

              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={sending}
                onClick={handleSend}
                className="h-10 rounded-xl px-5 flex items-center"
              >
                Broadcast
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-100 dark:bg-zinc-800/80 p-3 rounded-xl text-center text-xs text-slate-500 dark:text-zinc-400">
            ℹ️ Broadcast channel is read-only. Only Super Admins can post.
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }
        
        .animate-slideDown {
          animation: slideDown 0.5s ease-out;
        }
        
        .animate-bounce {
          animation: bounce 1s ease-in-out infinite;
        }
        
        .animate-pulse {
          animation: pulse 2s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </Card>
  );
};