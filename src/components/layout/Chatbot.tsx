import React, { useState, useRef, useEffect, FormEvent } from 'react';
import { TbMessageChatbotFilled } from "react-icons/tb";
import { FaChevronDown } from "react-icons/fa6";
import { IoSend } from "react-icons/io5";
import { FaCircle } from "react-icons/fa";
import ReactMarkdown from 'react-markdown';

type Message = {
  text: string;
  sender: 'user' | 'bot';
};

type ChatbotProps = {
  primaryColor?: string;
};

export default function Chatbot({ primaryColor = '#2563eb' }: ChatbotProps) {
  const [isBotChatOn, setIsBotChatOn] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatBoxRef = useRef<HTMLDivElement>(null);

  // Match backend endpoint
  const API_URL = '/api/user/chatbot';

  const gradientStyle: React.CSSProperties = {
    background: `linear-gradient(135deg, ${primaryColor}, #1e40af)`,
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
    display: 'inline-block'
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    const messageToSend = inputMessage.trim(); // Capture value immediately
    if (!messageToSend) return;

    const userMessage: Message = { text: messageToSend, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: messageToSend })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("the responese log showing data came back: ",data)

      if ('error' in data) {
        setMessages(prev => [
          ...prev,
          { text: `Server error: ${data.details ?? data.error}`, sender: 'bot' }
        ]);
        return;
      }

      const botText = data.results_text ?? 'No results found.';
      setMessages(prev => [...prev, { text: botText, sender: 'bot' }]);

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { text: 'Server error. Please try again.', sender: 'bot' }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Chat box animation
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.style.transform = isBotChatOn ? 'scale(1)' : 'scale(0.5)';
      chatBoxRef.current.style.opacity = isBotChatOn ? '1' : '0';
    }
  }, [isBotChatOn]);

  return (
    <>
      {/* Chat box */}
      <div
        ref={chatBoxRef}
        className={`fixed bottom-24 right-8 z-50 w-96 h-[32rem] bg-white shadow-xl rounded-xl flex flex-col transition-all duration-300 ease-in-out transform ${isBotChatOn ? 'scale-100 opacity-100' : 'scale-50 opacity-100'} overflow-hidden border border-gray-200`}
        style={{ display: isBotChatOn ? 'flex' : 'none' }}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <button
            onClick={() => {
              setIsBotChatOn(false);
              setMessages([]);
            }}
            className="absolute top-3 right-3 w-6 h-6 rounded-full group bg-gray-200 hover:bg-red-100 hover:cursor-pointer flex items-center justify-center transition-colors duration-200"
          >
             <svg 
                className="w-3 h-3 text-gray-600 group-hover:text-red-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
          </button>


          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-medium to-primary-dull flex items-center justify-center">
              <TbMessageChatbotFilled className="text-white text-lg" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">Finance Assistant</h2>
              <p className="text-xs text-gray-600">Powered by AI</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">Ask me about financial accounts, analytics, or insights</p>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[#defcf6] flex items-center justify-center">
                <TbMessageChatbotFilled className="text-primary-dull text-2xl" />
              </div>
              <p className="text-sm font-medium text-gray-600">Welcome to Finance System</p>
              <p className="text-xs text-gray-500 mt-1">How can I assist with your financial queries?</p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`mb-4 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs p-4 rounded-2xl relative ${
                  message.sender === 'user' 
                    ? 'bg-primary-dull text-white rounded-lg rounded-tr-none' 
                    : 'bg-white text-gray-800 border border-gray-200 rounded-lg rounded-tl-none shadow-sm'
                }`}
              >
                {message.sender === 'user' ? (
                    message.text
                ) : (
                    // Use the safe ReactMarkdown component
                    <ReactMarkdown
                        components={{
                            // Style the unordered list (bullets) to have padding and less margin
                            ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                            
                            // Style the ordered list (numbers)
                            ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2 space-y-2 text-lg" {...props} />,
                            
                            // Style individual list items to remove huge gaps
                            li: ({node, ...props}) => <li className="my-0.5 pl-1 leading-snug" {...props} />,
                            
                            // Style paragraphs: default markdown p tags have huge margins. We remove them inside lists.
                            p: ({node, ...props}) => <p className="mb-2 last:mb-0 whitespace-pre-wrap" {...props} />,
                            
                            // Style bold text to stand out
                            strong: ({node, ...props}) => <span className="font-bold text-gray-900" {...props} />,
                            
                            // Handle links if any
                            a: ({node, ...props}) => <a className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
                        }}
                    >
                        {message.text}
                    </ReactMarkdown>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="mb-4 flex justify-start">
              <div className="bg-white text-gray-800 p-4 rounded-tl-none rounded-lg border border-gray-200 shadow-sm relative">
                <div className="flex space-x-1">
                  <FaCircle className="text-primary-dull animate-bounce" size={8} />
                  <FaCircle className="text-primary-dull animate-bounce" style={{ animationDelay: '0.2s' }} size={8} />
                  <FaCircle className="text-primary-dull animate-bounce" style={{ animationDelay: '0.4s' }} size={8} />
                </div>
                
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-dull/70 focus:border-transparent text-sm bg-gray-50"
              placeholder="Ask about financial reports, analytics..."
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-primary-medium to-primary-dull text-white p-3 rounded-xl transition-all duration-200 hover:from-primary-dull hover:to-[#006f57] focus:outline-none focus:ring-2 focus:ring-primary-dull focus:ring-offset-2 shadow-sm"
            >
              <IoSend size={16} />
            </button>
          </div>
        </form>
      </div>

      {/* Toggle button */}
      <button
        className="group fixed flex items-center justify-center bottom-6 right-6 z-40 w-14 h-14 hover:w-15 hover:h-15 transition-all duration-300 ease-in-out rounded-full shadow-lg bg-gradient-to-r from-primary-medium to-primary-dull hover:from-primary-dull hover:to-[#006f57] focus:outline-none focus:ring-2 focus:ring-primary-dull focus:ring-offset-2"
        onClick={() => setIsBotChatOn(!isBotChatOn)}
      >
        {isBotChatOn
          ? <FaChevronDown size={20} className="text-white transition-transform duration-300" />
          : <TbMessageChatbotFilled size={22} className="text-white transition-transform duration-300" />}
      </button>
    </>
  );
}