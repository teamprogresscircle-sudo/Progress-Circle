import React, { useState } from 'react';
import { MessageSquare, Send, Zap, X } from 'lucide-react';

const MessageBubble = React.memo(({ msg, isMe }) => (
    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-full gap-1`}>
        {!isMe && (
            <div className="flex items-center gap-2 ml-1 mb-0.5">
                <span className="text-[10px] font-medium text-[var(--text)]/40 font-inter">
                    {msg.sender?.name || 'Member'}
                </span>
            </div>
        )}
        <div
            className={`px-4 py-2.5 text-[12px] font-normal leading-relaxed break-words w-fit max-w-[90%] rounded-2xl font-inter ${
                isMe
                    ? 'bg-[var(--primary)]/15 text-[var(--text)] border border-[var(--primary)]/25 rounded-br-md'
                    : 'bg-[var(--surface2)] text-[var(--text)]/85 border border-[var(--border)]/15 rounded-bl-md'
            }`}
        >
            {msg.text}
        </div>
        <span className={`text-[9px] text-[var(--text)]/30 font-medium px-1 ${isMe ? 'text-right' : ''}`}>
            {new Date(msg.timestamp || msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
    </div>
));

const IntelligenceSidebar = ({
    messages = [],
    currentUser,
    onSendMessage,
    onClose
}) => {
    const [input, setInput] = useState('');

    const handleSend = (e) => {
        if (e && e.key && e.key !== 'Enter') return;
        if (!input.trim()) return;
        onSendMessage(input);
        setInput('');
    };

    return (
        <aside className="lg:col-span-3 h-full flex flex-col bg-[var(--surface)] relative border-l border-[var(--border)]/10 overflow-hidden font-inter rounded-l-2xl">
            <div className="flex-1 flex flex-col min-h-0 relative z-10">
                <div className="flex items-center justify-between p-5 sm:p-6 border-b border-[var(--border)]/10">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/12 flex items-center justify-center shrink-0">
                            <MessageSquare size={18} className="text-[var(--primary)]" />
                        </div>
                        <h3 className="text-[12px] font-bold text-[var(--text)]/80 uppercase tracking-wide font-outfit truncate">
                            Squad chat
                        </h3>
                    </div>
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2.5 rounded-xl bg-[var(--surface2)] border border-[var(--border)]/10 text-[var(--text)]/40 hover:text-[var(--text)] transition-colors shrink-0"
                            aria-label="Close chat"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto pc-scrollbar p-5 sm:p-6 space-y-4">
                        {messages.length > 0 ? (
                            messages.map((msg, i) => {
                                const isMe = String(msg.sender?._id || msg.sender?.id || msg.sender) === String(currentUser?._id || currentUser?.id);
                                return <MessageBubble key={msg._id || i} msg={msg} isMe={isMe} />;
                            })
                        ) : (
                            <div className="h-full min-h-[8rem] flex flex-col items-center justify-center text-center px-4 py-8 rounded-xl border border-dashed border-[var(--border)]/15 bg-[var(--bg)]/25">
                                <Zap size={26} className="text-[var(--text)]/12 mb-2" />
                                <p className="text-[12px] text-[var(--text)]/45">Say hi to your squad.</p>
                            </div>
                        )}
                    </div>

                    <div className="p-5 sm:p-6 pt-2">
                        <div className="flex items-stretch gap-2 rounded-xl bg-[var(--surface2)] border border-[var(--border)]/15 p-1.5 focus-within:border-[var(--primary)]/30 transition-colors">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend(e)}
                                placeholder="Message the squad…"
                                className="flex-1 min-w-0 bg-transparent border-none text-[13px] text-[var(--text)] placeholder:text-[var(--text)]/35 focus:outline-none px-3 py-2 font-inter"
                            />
                            <button
                                type="button"
                                onClick={() => handleSend()}
                                className="shrink-0 px-4 py-2 bg-[var(--primary)] rounded-lg text-white text-sm font-semibold shadow-sm hover:opacity-95 transition-opacity"
                                aria-label="Send"
                            >
                                <Send size={16} className="inline" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default React.memo(IntelligenceSidebar);
