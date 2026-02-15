/**
 * CallMaker24 Chatbot Widget
 * Embeddable chatbot for external websites
 */

(function () {
  "use strict";

  // Configuration
  let config = {
    widgetId: "",
    botName: "Chat Support",
    welcomeMessage:
      "Hello! How can I help you today? I can help with order status, tracking, returns, and more.",
    primaryColor: "#667eea",
    position: "bottom-right",
    avatar: "🤖",
    apiEndpoint: window.location.origin + "/api/chatbot/chat",
    customerEmail: "", // Pre-set customer email for automatic verification
    customerPhone: "", // Pre-set customer phone for automatic verification
    customerId: "", // Pre-set customer ID for automatic verification
  };

  let isOpen = false;
  let messages = [];
  let widgetContainer = null;
  let detectedEmail = ""; // Email auto-detected from chat messages
  let detectedPhone = ""; // Phone auto-detected from chat messages
  let verifiedCustomerId = ""; // Customer ID returned after successful verification
  let verifiedCustomerEmail = ""; // Customer email returned after successful verification

  // Initialize widget
  function init(options) {
    config = { ...config, ...options };
    messages = [
      {
        id: Date.now(),
        text: config.welcomeMessage,
        sender: "bot",
        timestamp: new Date().toISOString(),
      },
    ];

    // Wait for DOM to be ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", createWidget);
    } else {
      createWidget();
    }
  }

  // Create widget HTML
  function createWidget() {
    // Create container
    widgetContainer = document.createElement("div");
    widgetContainer.id = "cm24-chatbot-widget";
    widgetContainer.style.cssText = getContainerStyles();

    // Add widget HTML
    widgetContainer.innerHTML = getWidgetHTML();

    // Append to body
    document.body.appendChild(widgetContainer);

    // Attach event listeners
    attachEventListeners();

    // Add CSS
    injectStyles();
  }

  // Get container positioning styles
  function getContainerStyles() {
    const positions = {
      "bottom-right": "bottom: 20px; right: 20px;",
      "bottom-left": "bottom: 20px; left: 20px;",
      "top-right": "top: 20px; right: 20px;",
      "top-left": "top: 20px; left: 20px;",
    };

    return `
      position: fixed;
      ${positions[config.position] || positions["bottom-right"]}
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    `;
  }

  // Get widget HTML
  function getWidgetHTML() {
    return `
      <!-- Chat Window -->
      <div id="cm24-chat-window" style="display: none; margin-bottom: 16px;">
        <div style="background: white; border-radius: 12px; box-shadow: 0 20px 50px rgba(0,0,0,0.2); width: 380px; max-width: 90vw; overflow: hidden;">
          <!-- Header -->
          <div id="cm24-header" style="background: ${config.primaryColor}; color: white; padding: 16px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="font-size: 28px;">${config.avatar}</div>
              <div>
                <div style="font-weight: 600; font-size: 16px;">${config.botName}</div>
                <div style="font-size: 12px; opacity: 0.9;">Online</div>
              </div>
            </div>
            <button id="cm24-close-btn" style="background: transparent; border: none; color: white; cursor: pointer; padding: 8px; border-radius: 4px; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='transparent'">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
            </button>
          </div>
          
          <!-- Messages Area -->
          <div id="cm24-messages" style="height: 400px; overflow-y: auto; padding: 16px; background: #f9fafb;">
            ${renderMessages()}
          </div>
          
          <!-- Input Area -->
          <div style="padding: 16px; border-top: 1px solid #e5e7eb; background: white;">
            <div style="display: flex; gap: 8px;">
              <input 
                id="cm24-input" 
                type="text" 
                placeholder="Type a message..."
                style="flex: 1; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; outline: none;"
              />
              <button 
                id="cm24-send-btn"
                style="background: ${config.primaryColor}; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px; transition: opacity 0.2s;"
                onmouseover="this.style.opacity='0.9'"
                onmouseout="this.style.opacity='1'"
              >
                Send
              </button>
            </div>
            <div id="cm24-typing" style="display: none; margin-top: 8px; font-size: 12px; color: #6b7280;">
              <span class="cm24-typing-dots">Bot is typing</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Trigger Button -->
      <button 
        id="cm24-trigger-btn"
        style="background: ${config.primaryColor}; color: white; border: none; padding: 16px 24px; border-radius: 50px; cursor: pointer; box-shadow: 0 10px 30px rgba(0,0,0,0.2); font-weight: 600; font-size: 16px; display: flex; align-items: center; gap: 8px; transition: transform 0.2s, box-shadow 0.2s;"
        onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 15px 40px rgba(0,0,0,0.25)'"
        onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 10px 30px rgba(0,0,0,0.2)'"
      >
        <span style="font-size: 24px;">${config.avatar}</span>
        <span>Chat</span>
      </button>
    `;
  }

  // Render messages
  function renderMessages() {
    return messages
      .map(
        (msg) => `
      <div style="display: flex; justify-content: ${msg.sender === "user" ? "flex-end" : "flex-start"}; margin-bottom: 12px;">
        <div style="
          max-width: 70%;
          padding: 12px;
          border-radius: 12px;
          font-size: 14px;
          line-height: 1.5;
          ${
            msg.sender === "user"
              ? `background: ${config.primaryColor}; color: white;`
              : "background: white; color: #1f2937; box-shadow: 0 2px 8px rgba(0,0,0,0.08);"
          }
        ">
          ${escapeHtml(msg.text)}
        </div>
      </div>
    `,
      )
      .join("");
  }

  // Attach event listeners
  function attachEventListeners() {
    const triggerBtn = document.getElementById("cm24-trigger-btn");
    const closeBtn = document.getElementById("cm24-close-btn");
    const sendBtn = document.getElementById("cm24-send-btn");
    const input = document.getElementById("cm24-input");

    if (triggerBtn) {
      triggerBtn.addEventListener("click", openChat);
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", closeChat);
    }

    if (sendBtn) {
      sendBtn.addEventListener("click", sendMessage);
    }

    if (input) {
      input.addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
          sendMessage();
        }
      });
    }
  }

  // Open chat window
  function openChat() {
    isOpen = true;
    const chatWindow = document.getElementById("cm24-chat-window");
    const triggerBtn = document.getElementById("cm24-trigger-btn");

    if (chatWindow) {
      chatWindow.style.display = "block";
      chatWindow.style.animation = "cm24-slideUp 0.3s ease-out";
    }

    if (triggerBtn) {
      triggerBtn.style.display = "none";
    }

    // Focus input
    setTimeout(() => {
      const input = document.getElementById("cm24-input");
      if (input) input.focus();
    }, 100);
  }

  // Close chat window
  function closeChat() {
    isOpen = false;
    const chatWindow = document.getElementById("cm24-chat-window");
    const triggerBtn = document.getElementById("cm24-trigger-btn");

    if (chatWindow) {
      chatWindow.style.display = "none";
    }

    if (triggerBtn) {
      triggerBtn.style.display = "flex";
    }
  }

  // Send message
  function sendMessage() {
    const input = document.getElementById("cm24-input");
    if (!input || !input.value.trim()) return;

    const messageText = input.value.trim();
    input.value = "";

    // Add user message
    messages.push({
      id: Date.now(),
      text: messageText,
      sender: "user",
      timestamp: new Date().toISOString(),
    });

    updateMessages();

    // Show typing indicator
    showTyping(true);

    // Send to API
    // Auto-detect email in user message
    var emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
    var emailMatch = messageText.match(emailRegex);
    if (emailMatch) {
      detectedEmail = emailMatch[1];
    }

    // Auto-detect phone number in user message
    var phoneRegex = /(?:\+?1?[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/;
    var phoneMatch = messageText.match(phoneRegex);
    if (phoneMatch) {
      detectedPhone = phoneMatch[0];
    }

    // Determine customer identity to send (verified ID takes priority)
    var customerId = verifiedCustomerId || config.customerId || "";
    var customerEmail = verifiedCustomerEmail || config.customerEmail || detectedEmail || "";
    var customerPhone = config.customerPhone || detectedPhone || "";

    fetch(config.apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: messageText,
        widgetId: config.widgetId,
        conversationId: getConversationId(),
        customerEmail: customerEmail,
        customerPhone: customerPhone,
        customerId: customerId,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        showTyping(false);
        // If the response indicates the customer is now verified, save the identity for subsequent requests
        if (data.isVerified) {
          if (data.customerId) {
            verifiedCustomerId = data.customerId;
          }
          if (data.customerEmail) {
            verifiedCustomerEmail = data.customerEmail;
          }
          if (data.customerName) {
            var header = document.getElementById("cm24-header");
            if (header) {
              var nameDiv = header.querySelector(
                "div > div:last-child > div:first-child",
              );
              if (nameDiv && !nameDiv.dataset.verified) {
                nameDiv.textContent =
                  config.botName + " — Hi, " + data.customerName + "!";
                nameDiv.dataset.verified = "true";
              }
            }
          }
        }
        // Add bot response
        messages.push({
          id: Date.now(),
          text: data.response || "I'm sorry, I couldn't process that request.",
          sender: "bot",
          timestamp: new Date().toISOString(),
        });

        updateMessages();
      })
      .catch((error) => {
        showTyping(false);
        console.error("Chat error:", error);

        // Add error message
        messages.push({
          id: Date.now(),
          text: "Sorry, I'm having trouble connecting. Please try again.",
          sender: "bot",
          timestamp: new Date().toISOString(),
        });

        updateMessages();
      });
  }

  // Update messages display
  function updateMessages() {
    const messagesContainer = document.getElementById("cm24-messages");
    if (messagesContainer) {
      messagesContainer.innerHTML = renderMessages();
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  // Show/hide typing indicator
  function showTyping(show) {
    const typing = document.getElementById("cm24-typing");
    if (typing) {
      typing.style.display = show ? "block" : "none";
    }
  }

  // Get or create conversation ID
  function getConversationId() {
    let convId = localStorage.getItem("cm24_conversation_id");
    if (!convId) {
      convId =
        "conv_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
      localStorage.setItem("cm24_conversation_id", convId);
    }
    return convId;
  }

  // Escape HTML
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // Inject CSS animations
  function injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes cm24-slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes cm24-typingDots {
        0%, 20% { content: '.'; }
        40% { content: '..'; }
        60%, 100% { content: '...'; }
      }
      
      .cm24-typing-dots::after {
        content: '...';
        animation: cm24-typingDots 1.5s infinite;
      }
      
      #cm24-messages::-webkit-scrollbar {
        width: 6px;
      }
      
      #cm24-messages::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 10px;
      }
      
      #cm24-messages::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 10px;
      }
      
      #cm24-messages::-webkit-scrollbar-thumb:hover {
        background: #a1a1a1;
      }
      
      @media (max-width: 640px) {
        #cm24-chat-window > div {
          width: calc(100vw - 32px) !important;
          max-height: calc(100vh - 100px);
        }
        
        #cm24-messages {
          height: calc(100vh - 300px) !important;
          max-height: 400px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Expose API
  window.cm24 =
    window.cm24 ||
    function () {
      const args = Array.prototype.slice.call(arguments);
      const command = args[0];
      const options = args[1];

      if (command === "init") {
        init(options);
      } else if (command === "open") {
        openChat();
      } else if (command === "close") {
        closeChat();
      } else if (command === "sendMessage") {
        const input = document.getElementById("cm24-input");
        if (input) {
          input.value = options.message;
          sendMessage();
        }
      }
    };

  // Process queued commands
  if (window.cm24.q) {
    window.cm24.q.forEach(function (args) {
      window.cm24.apply(null, args);
    });
  }
})();
