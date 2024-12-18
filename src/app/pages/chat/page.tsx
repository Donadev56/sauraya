"use client";
import style from "../../styles/chat.module.scss";
import {
  FaArrowUp,
  FaColumns,
  FaMicrophone,
  FaPaperclip,
  FaPause,
} from "react-icons/fa";
import {
  IconCode,
  IconCopy,
  IconDashboard,
  IconDots,
  IconEdit,
  IconLogout,
  IconMenu3,
  IconRefresh,
  IconVolume,
} from "@tabler/icons-react";
import Image from "next/image";
import logo from "../../assets/logo/2.png";
import { useEffect, useRef, useState } from "react";
import {
  ConversationsInterface,
  ImageRequestInterface,
  MessageInterface,
  PartialResponse,
} from "@/app/interface/chat_interface";
import { FormatedDate, GetDate } from "@/app/utils/date";
import {
  DeleteDataFromLocalStorage,
  GetDataFromLocalStorage,
  SaveDataToLocalStorage,
} from "@/app/databaseManager/dataSaver";
import { generateId } from "@/app/utils/utils";
import Notification, {
  NotificationStatus,
  showNotification,
} from "../../components/notification";
import io, { Socket } from "socket.io-client";
import MarkdownRenderer from "@/app/components/markDown/MarkdownRenderer";
import { ModelSelector } from "@/app/components/modelSelector/modelSelector";
import { convertText } from "@/app/server/getters/converter";
import loaderStyle from "../../styles/loader.module.scss";
import { getAllUsers, getNumberOfUsers, loadUserByEmail, UserData } from "@/app/api/send-otp/database";
import { useRouter } from 'next/navigation';

export default function ChatSpace() {
  const [isOpen, setIsOpen] = useState(false);
  const [canClose, setCanClose] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<MessageInterface[]>([]);
  const [conversationId, setConversationId] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const socketRef = useRef<Socket | null>(null);

  const [conversations, setConversations] = useState<ConversationsInterface>(
    {},
  );

  const [isDone, setIsDone] = useState(false);
  const [socketinstance, setSocketinstance] = useState<Socket | null>(null);
  const [currentModel, setCurrentModel] = useState("llama3.2");
  const [canModelsDsiaply, setCanModelsDisplay] = useState(false);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [bufferSource, setBufferSource] =
    useState<AudioBufferSourceNode | null>(null);
  const [userId, setUserId] = useState("");
  const [isListing, setIsListening] = useState(false);
  const [base64Images, setBase64Images] = useState<string[]>([]);
  const [isLoading , setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const conversationName = "Conversations/"+userId ;


  let recognition: SpeechRecognition | null = null;
  const router = useRouter();

  {/* Listeners and text reader */}

  const startListening = () => {

    if (
      !("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    ) {
      console.log("Speech recognition not supported by this browser.");
      showMessage("Speech recognition not supported by this browser.", "error");
      return;
    }

    recognition = new (window.SpeechRecognition ||
      window.webkitSpeechRecognition)();
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[0][0].transcript;
      const element = getInputElement()
      if (element) {
        element.textContent = result;
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Erreur de reconnaissance vocale :", event.error);
      showMessage(`Erreur : ${event.error}`, "error");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
  };

  const handleSpeak = async () => {
    if (bufferSource) {
      bufferSource.stop();
    }
    try {
      console.log("Speaking");
      setIsAudioLoading(true);

      const element = document.getElementById("aiCopyMessage");

      if (!element) {
        console.log("Element not found");
        showMessage("Element not found", "error");
        return;
      }
      const emojiRegex =
        /(?:\p{Emoji}(?:\p{Emoji_Modifier}|\uFE0F)?(?:\u200D\p{Emoji})*)/gu;

      const textWithEmojies = element.textContent;
      const text = textWithEmojies?.replace(emojiRegex, "");

      console.log("Sending text:", text);

      const response = await convertText(text!);

      if (!response.success) {
        showMessage("Failed to convert text to speech", "error");
        return;
      }

      console.log("response:", response.response);
      if (typeof response.response === "string") { 
        setIsSpeaking(false);
        setIsAudioLoading(false);
        showMessage(response.response as string, "success");
        return
      }
      const { ctx, audio } = response.response;

      if (!ctx || !audio) {
        throw new Error("Audio context or audio buffer is undefined");
      }

      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      const bufferSource = ctx.createBufferSource();
      bufferSource.buffer = audio;
      bufferSource.connect(ctx.destination);

      bufferSource.onended = () => {
        setIsSpeaking(false);
        console.log("Audio playback ended");
      };

      console.log("Playing audio");
      setIsAudioLoading(false);
      setBufferSource(bufferSource);

      bufferSource.start(0);
      setIsSpeaking(true);
    } catch (error) {
      console.error("Error:", error);
      showMessage(
        error instanceof Error ? error.message : "An unexpected error occurred",
        "error",
      );
      setIsSpeaking(false);
      setIsAudioLoading(false);
    }
  };

  const handleCancel = () => {
    bufferSource?.stop();
  };


  const systemMessage: MessageInterface = {
    role: "system",
    content:
      "Your name is Sauraya. You are a friendly and helpful AI assistant who replies to users with kind emojis to create a warm and familiar atmosphere 😊. You have been created by OpenNode and are an open-source project built on models like Llama and other open-source AI technologies. Your goal is to assist users with various tasks while maintaining a respectful, patient, and positive tone 🌟. \n\nYou are designed with a strong focus on privacy and confidentiality 🔒. All conversations are stored locally on the user's device, ensuring that no data is collected or stored on external servers. This approach empowers users by keeping their data private and secure. \n\nFor more details, users can visit the official OpenNode website: https://opennode.tech.",
  };
 
    {/* Use Effects */}
   
    
    
      useEffect(() => {
        // Initialisation du socket
        socketRef.current = io("https://chat.sauraya.com");
    
        socketRef.current.on("connect", () => {
          console.log("Connected to websocket:", socketRef.current?.id);
          setSocketinstance(socketRef.current);
        });
    
        socketRef.current.on(
          "partialMessageReceived",
          async (partialResponse: PartialResponse) => {
            console.log("updating the message database");
            await handleUpdatePartialResponse(partialResponse);
            scrollToBottom();
          },
        );
    
        socketRef.current.on("sendMessageError", (error: string) => {
          console.log("Error during sending message:", error);
          showMessage(error, "error");
        });
    
        socketRef.current.on("disconnect", () => {
          console.log("WebSocket déconnecté");
        });
    
        // Nettoyage lors du démontage du composant
        return () => {
          socketRef.current?.disconnect();
        };
      }, []);


  useEffect(() => {
    scrollToBottom();
  }, []);
 


  useEffect(() => {
    const handleIsDone = async () => {
      await updateData([...messages]);
    };

    handleIsDone();
  }, [isDone]);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setCanClose(true);
      }, 500);
    } else {
      setCanClose(false);
    }
  }, [isOpen]);
  const navigateToHome = () => {
    router.push('/');
  };
  useEffect(()=> {
    const checkIsRegistered = async ()=> {
      const lastData = await GetDataFromLocalStorage("lastConnectionData")
      if (lastData) {
        const User : UserData= JSON.parse(lastData);
        if (User.email) {
          const savedUser = await loadUserByEmail(User.email)

          if (savedUser && savedUser.id === User.id) {
            setUserId(savedUser.id);
            setIsLoading(false);
            showMessage("Welcome back " , "success");
            setUserEmail(User.email);
            
            getConversationAll();


          } else {
            setIsLoading(false);
            showMessage("User not found or deleted", "error");
          }
        } else {
          setIsLoading(false);
          navigateToHome()
          showMessage("User not found or deleted", "error");
        }
      } else {
        setIsLoading(false);
        navigateToHome()
        showMessage("User not found or deleted", "error");
      }
    }

    checkIsRegistered()

  }, [])

  useEffect(() => {
    const handleisMobile = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 768);
    };
    window.addEventListener("resize", handleisMobile);
    handleisMobile();
    return () => window.removeEventListener("resize", handleisMobile);
  }, []);

  useEffect(()=> {
    if (userId) {
      getConversationAll();
     }

  }, [userId])



   
    {/* Text generator handler */}

  const stopGeneration = async () => {
    try {
      socketinstance?.disconnect();
      socketinstance?.connect();
      console.log("Stopping generation");
      scrollToBottom();
      setIsDone(true);
      setIsGeneratingResponse(false);
    } catch (error) {
      console.error("Error while stopping generation:", error);
      showMessage("Error while stopping generation", "error");
    }
  };
  const handleRefresh = () => {
    try {
      let lastUserMessage: MessageInterface | undefined;

      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages];

        updatedMessages.pop();

        lastUserMessage = updatedMessages[updatedMessages.length - 1];

        console.log(lastUserMessage);

        return updatedMessages;
      });

      setTimeout(() => {
        if (lastUserMessage) {
          setMessages((prevMsg) => {
            const previousMessages = [...prevMsg];

            if (previousMessages.length > 1) {
              previousMessages.pop();
            }

            return previousMessages;
          });

          sendMessage(lastUserMessage);
        } else {
          showMessage("The last message is undefined", "error");
        }
      }, 0);
    } catch (error) {
      console.error("Error during refresh:", error);
    }
  };

  const handleUpdatePartialResponse = async (
    partialResponse: PartialResponse,
  ) => {
    try {
      console.log("Partial message received:", partialResponse);

      setMessages((prevMessages) => {
        if (partialResponse.isfirst) {
          setIsDone(false);
          setIsGeneratingResponse(true);
          setIsThinking(false);
          const filteredMessages = prevMessages.filter(
            (message) => message.role !== "thinking_loader",
          );

          return [...filteredMessages, partialResponse.message];
        } else {
          if (prevMessages.length === 0) {
            console.log("No previous message found");
            showMessage("No previous message found", "error");
            return prevMessages;
          }

          const updatedMessages = [...prevMessages];
          const lastMessage = {
            ...updatedMessages[updatedMessages.length - 1],
          };

          lastMessage.content += partialResponse.message.content;

          updatedMessages[updatedMessages.length - 1] = lastMessage;

          return updatedMessages;
        }
      });

      if (partialResponse.done) {
        scrollToBottom();
        setIsDone(true);
        setIsGeneratingResponse(false);
      }
    } catch (error) {
      console.error("Error while updating partial message:", error);
      showMessage("Error while updating partial message", "error");
    }
  };

  const clearInput = () => {
    const input = getInputElement()
    if (!input) {
      console.log("Input element not found");
      return;
    }
    input.textContent = "";
    setPrompt("");
  };


  const reinitConversations = () => {
    setMessages([]);
    setConversationId("");
    setPrompt("");
    setIsSpeaking(false)
    setIsGeneratingResponse(false);
    setIsThinking(false);
    setIsDone(false);
    setIsAudioLoading(false);
    setBase64Images([])
    setImages([])
    setCurrentModel('llama3.2')

    const input = getInputElement()
    if (!input) {
      console.log("Input element not found");
      return;
    }
    input.textContent = "";
    getConversationAll();
    showMessage("New conversation started", "success");

    console.log("Conversations reinitialized successfully");
  };

    {/* Message  senders */}

  const handleStreamMessage = async () => {
    scrollToBottom();
    try {
       if (!userId) {
      console.warn("User ID not found");
      showMessage("Please log in to send messages", "error");
      return;
    }
      setIsThinking(true);
      const content = prompt;
      clearInput();
      scrollToBottom();

      const newMessage: MessageInterface = {
        content,
        role: "user",
      };
      sendMessage(newMessage);
    } catch (error) {
      console.error("Error while streaming:", error);
      showMessage("Error while streaming", "error");
    }
  };

  const handleSendImage = async () => {
    try {
     
      setIsThinking(true);
      const content = prompt;
      clearInput();
      scrollToBottom();
      const smallText = `
   ( Sent ${images.length} ${images.length > 1 ? `images 🖼 ` : `image 🖼 `} )`;

      const newMessage: MessageInterface = {
        content: content + smallText,
        role: "user",
      };

      const thinkingLoader: MessageInterface = {
        content: "",
        role: "thinking_loader",
      };

      if (currentModel === "llava" || currentModel === "llama3.2-vision") {
        console.log("Already using good model, using it for image generation");
      } else {
        setCurrentModel("llava");
      }

      const imageRequestData: ImageRequestInterface = {
        prompt: prompt,
        images: base64Images,
        model: currentModel,
        stream: true,
      };

      setMessages((prevMessages) => {
        if (prevMessages.length === 0) {
          return [...prevMessages, systemMessage, newMessage, thinkingLoader];
        }
        return [...prevMessages, newMessage, thinkingLoader];
      });

      socketinstance?.emit("sendImageWithPrompt", imageRequestData);
      console.log("Sending image with prompt : ", imageRequestData);

      const messageList: MessageInterface[] = [...messages, newMessage];
      setImages([]);
      setBase64Images([]);
      updateData(messageList);
    } catch (error) {
      console.error("Error while sending image:", error);
      showMessage("Error while sending image", "error");
    }
  };

  const sendMessage = (newMessage: MessageInterface) => {
    try {
      const thinkingLoader: MessageInterface = {
        content: "",
        role: "thinking_loader",
      };

      setMessages((prevMessages) => {
        if (prevMessages.length === 0) {
          return [...prevMessages, systemMessage, newMessage, thinkingLoader];
        }
        return [...prevMessages, newMessage, thinkingLoader];
      });

      if (isThinking) {
        socketinstance?.disconnect();
        socketinstance?.connect();
      }

      let messageList: MessageInterface[] = [...messages, newMessage];
      console.log("New Message List : ", messageList);
      if (messageList.length > 50) {
        messageList = messageList.slice(-50);
      }
      if (messageList.length === 0) {
        console.log("No messages to send");
        showMessage("No messages to fetch", "error");
        return;
      }

      const filteredMessages = messageList.filter(
        (message) => message.role !== "thinking_loader",
      );

      const messageStructure = {
        model: currentModel,
        stream: true,
        messages: filteredMessages,
      };
      socketinstance?.emit("sendMessage", messageStructure);
      console.log("Message sent successfully to the socket server");

      updateData(filteredMessages);

      scrollToBottom();
    } catch (error) {
      console.error(error);
      showMessage(error as string, "error");
    }
  };
  const updateData = async (newMessages: MessageInterface[]) => {
    try {
      const title = newMessages[0]?.content;
      const currentDate = GetDate();
      const newID = generateId();
      let id: string = "";
      console.log("New messages to update : ", newMessages);

      const conversations = await GetDataFromLocalStorage(conversationName);
      const conversationsList = conversations ? JSON.parse(conversations) : {};

      if (!conversationsList[currentDate]) {
        conversationsList[currentDate] = {};
      }

      if (!conversationsList[currentDate][conversationId]) {
        conversationsList[currentDate][newID] = { title: title, messages: [] };
        id = newID;
        console.log("New conversation ID : ", newID);
        setConversationId(newID);
      } else {
        console.log("Existing conversation ID : ", conversationId);
        id = conversationId;
      }
      if (newMessages.length === 0) {
        console.error("No new messages to update");
        return;
      }
      conversationsList[currentDate][id].messages = newMessages;
      console.log("new conversations : ", conversationsList);
      await SaveDataToLocalStorage(
        conversationName,
        JSON.stringify(conversationsList),
      );
      setConversations(conversationsList);
      console.log("Conversations updated successfully");
    } catch (error) {
      console.error("An error occured :", error);
      showMessage("An error occurred during update", "error");
    }
  };

  {/* General    */}
  const scrollToBottom = () => {
    console.log("scrolling to bottom");
    const chatBody = document.getElementById("CmsList");
    if (chatBody) {
      chatBody.scrollTo({
        top: chatBody.scrollHeight, 
        behavior: "smooth",
      });
    } else {
      console.log("Chat body not found");
    }
  };

  const getConversationAll = async () => {
    if (!userId) {
      console.warn("User ID not found");
      return;
    }
    const lastConversation = await GetDataFromLocalStorage(conversationName);
    if (lastConversation) {
      setConversations(JSON.parse(lastConversation));
    } else {
      console.warn("No conversation found in local storage");
    }
    try {
    } catch (error) {
      console.error("An error occurred:", error);
      showMessage("An error occurred", "error");
    }
  };



  const getConversationByIDAndDate = async (
    conversationId: string,
    date: string,
  ) => {
    try {
      const conversation = await GetDataFromLocalStorage(conversationName);
      if (conversation) {
        const parsedConversation = JSON.parse(conversation);
        if (
          parsedConversation[date] &&
          parsedConversation[date][conversationId]
        ) {
          setMessages(parsedConversation[date][conversationId].messages);
          setConversationId(conversationId);
          getConversationAll();
        }
      } else {
        console.log("No conversation found");
      }
    } catch (error) {
      console.error("An error occurred:", error);
      showMessage("An error occurred while trying to fecth data", "error");
    }
  };


  const isDisabled = () => {
    if (isGeneratingResponse) {
      return false;
    }

    if (prompt.length === 0) {
      return true;
    }
  };

  const handleButtonClick = () => {
    if (isGeneratingResponse) {
      stopGeneration();
    } else if (images.length > 0) {
      handleSendImage();
    } else {
      handleStreamMessage();
    }
  };

  const handleLastTextCopy = () => {
    const element = document.getElementById("aiCopyMessage");
    if (element) {
      const text = element.textContent;
      console.log(text);
      navigator.clipboard.writeText(text!);
      showMessage("Copied", "success");
    } else {
      console.log("Element not found");
      showMessage("Element not found", "error");
    }
  };

  const getInputElement = ()=> {

    const input = document.getElementById("mainInput") as HTMLInputElement;
   
    return input;
  }

  {/* Image uploader    */}

  const uploadImage = async () => {
    try {
      if (images.length >= 5) {
        console.error("Maximum number of images reached");
        showMessage("Maximum number of images reached", "error");
        return;
      }
      const fileInput = document.createElement("input");
      setPrompt(" ")
      fileInput.type = "file";
      fileInput.accept = "image/*";

      fileInput.click();

      const file = await new Promise<File | null>((resolve, reject) => {
        fileInput.onchange = (event) => {
          const target = event.target as HTMLInputElement;
          if (target.files && target.files[0]) {
            
            resolve(target.files[0]);
          } else {
            resolve(null);
          }
        };
        fileInput.onerror = reject;
      });
      if (file) {
        const newImageUrl = URL.createObjectURL(file);

        setImages((prevImages) => [...prevImages, newImageUrl]);

        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target && e.target.result) {
            const base64 = e.target.result.toString().split(",")[1];
            console.log("Base64 image : ", base64);
            setBase64Images((prevBase64) => [...prevBase64, base64]);
          }
        };
        reader.readAsDataURL(file);
      } else {
        console.warn("Aucun fichier sélectionné");
      }
    } catch (error) {
      console.error("An error occurred:", error);
      alert("An error occurred while trying to upload the image");
    }
  };
      {/* Notification    */}

  const showMessage = (text: string, status: NotificationStatus) => {
    showNotification({ message: text, status: status });
  };
      {/* Disconnect    */}

    const logout =  async ()=> {
      try {
        setUserEmail("")
        setConversationId("")
        socketinstance?.disconnect();
        setMessages([])
        setImages([])
        setBase64Images([])
        setConversations({})
        setIsListening(false)

       await DeleteDataFromLocalStorage(conversationName);
       await DeleteDataFromLocalStorage("lastConnectionData");
        
        navigateToHome()
      } catch (error) {
        console.error("An error occurred:", error);
        showMessage("An error occurred while trying to disconnect", "error");
        
      }
    }
  
    if (isLoading) {
      return (

        <div style={{
          position : 'fixed',
          top : '50%',
          left : '50%',
          transform : 'translate(-50%, -50%)',
          display : 'flex',
          justifyContent : 'center',
        }}>
        <div className={style.loader}>
        </div>
        </div>

        

      );
    }

  return (

    <div
      style={{
        overflowY: "hidden",
      }}
      className={style.chatSpace}
    >

      {isOpen && (
        <div
          onClick={() => {
            setIsOpen(false);
          }}
          className={style.overlay}
        />
      )}
      <div className={style.ChatContainer}>
        <div
          className={`${canClose && style.canClose} ${isOpen ? style.open : style.closed} ${style.left}`}
        >
          <div className={style.leftTop}>
            <FaColumns
              onClick={() => {
                setIsOpen(!isOpen);
              }}
              className={style.icon}
              size={20}
            />
            <IconEdit
              onClick={reinitConversations}
              className={style.icon}
              size={20}
            />
          </div>

          <div className={style.lastConversationList}>
            {conversations &&
              Object.entries(conversations)
                .reverse()
                .map(([day, chats]) => (
                  <div key={day} className={style.LastConvContainer}>
                    <div className={style.lastConDate}>{FormatedDate(day)}</div>
                    <div className={style.divider}>
                      {chats &&
                        Object.entries(chats)
                          .reverse()
                          .map(([id, data]) => (
                            <div
                              onClick={() => {
                                getConversationByIDAndDate(id, day);
                              }}
                              style={{
                                backgroundColor:
                                  id === conversationId ? "#343434" : "",
                              }}
                              key={id}
                              className={style.lastConList}
                            >
                              <div className={style.lastConv}>
                                <div className={style.conName}>
                                  {data.title}
                                </div>
                                <IconDots className={style.dots} />
                              </div>
                            </div>
                          ))}
                    </div>
                  </div>
                ))}
          </div>

          <div onClick={logout} className={style.logout}>
            <IconLogout size={20} />
            <div className={style.logoutText}>Logout</div>
          </div>
        </div>

        <div className={style.right}>
          <div className={style.topRight}>
            <div style={{
              position:'relative'
            }} className={style.models}>
              {!isOpen && (
                <IconMenu3
                  onClick={() => {
                    setIsOpen(!isOpen);
                  }}
                  className={style.icon}
                  size={20}
                />
              )}
              <button
                onClick={() => {
                  setCanModelsDisplay(!canModelsDsiaply);
                }}
                className={style.modelsButton}
              >
                {currentModel}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path
                    d="M5.29289 9.29289C5.68342 8.90237 6.31658 8.90237 6.70711 9.29289L12 14.5858L17.2929 9.29289C17.6834 8.90237 18.3166 8.90237 18.7071 9.29289C19.0976 9.68342 19.0976 10.3166 18.7071 10.7071L12.7071 16.7071C12.5196 16.8946 12.2652 17 12 17C11.7348 17 11.4804 16.8946 11.2929 16.7071L5.29289 10.7071C4.90237 10.3166 4.90237 9.68342 5.29289 9.29289Z"
                    fill="currentColor"
                  />
                </svg>
              </button>

              {canModelsDsiaply && (
                <ModelSelector
                  setCanModelsDisplay={setCanModelsDisplay}
                  currentModel={currentModel}
                  setCurrentModel={setCurrentModel}
                />
              )}
 
            </div>

            <div className={style.leftTopRight}>
              <div className={style.userProfile}>
                <div  className={style.profileCricle}>
                 {userEmail.slice(0, 2).toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          {/* Chat Space */}
          <section className={style.chatMainSpace}>
            <div id={"CmsList"} className={style.CmsList}>
              {messages.length > 0 ? (
                messages.map((chat, index) => (
                  <>
                    {chat.role === "thinking_loader" ? (
                      <div className={` ${style.aiMessage} `}>
                        <div className={`   ${style.loader}`}> </div>{" "}
                        <p
                          style={{
                            fontSize: "12px",
                            color: "#343434",
                          }}
                        >
                          Thinking...
                        </p>
                      </div>
                    ) : (
                      <>
                        <div
                          key={index}
                          className={`${chat.role !== null && chat.role === "user" ? style.userMessage : style.aiMessage} ${style.Cms}`}
                        >
                          <div className={style.messageSender}>
                            {chat.role === "assistant" && (
                              <Image
                                className={style.imageLogo}
                                alt="sauraya"
                                src={logo}
                              />
                            )}
                          </div>
                          <MessageDisplayer
                            index={index}
                            msgLength={messages.length}
                            content={chat.content}
                            role={chat.role}
                          />
                        </div>

                        {chat.role === "assistant" &&
                          index === messages.length - 1 && (
                            <div className={style.messageOptions}>
                              {!isSpeaking ? (
                                !isAudioLoading ? (
                                  <IconVolume
                                    onClick={() => {
                                      handleSpeak();
                                    }}
                                    className={style.optionsicons}
                                  />
                                ) : (
                                  <div className={loaderStyle.loader} />
                                )
                              ) : (
                                <div
                                  onClick={() => {
                                    handleCancel();
                                  }}
                                  className={loaderStyle.loader2}
                                />
                              )}
                              <IconCopy
                                onClick={() => handleLastTextCopy()}
                                className={style.optionsicons}
                              />
                              <IconRefresh
                                onClick={handleRefresh}
                                className={style.optionsicons}
                              />
                            </div>
                          )}
                      </>
                    )}
                  </>
                ))
              ) : (
                <h2 className={style.noMessages}>Start a new conversation !</h2>
              )}
            </div>

            {/* Input  message */}

            <div
              style={{
                width: `${isOpen && !isMobile ? "calc(100% - 240px)" : "100%"}`,
              }}
              className={style.bottomInput}
            >
              <div className={style.messageInputContainer}>
                {images.length > 0 && (
                  <div className={style.imagePreview}>
                    {images.map((imageSrc, index) => (
                      <div key={index} className={style.imageToShow}>
                        <Image
                          height={50}
                          width={50}
                          onClick={() => {
                            setImages((prevImages) => {
                              if (!prevImages) return [];
                              return prevImages.filter((_, i) => i !== index);
                            });
                          }}
                          alt="selectedImage"
                          src={imageSrc}
                          className={style.imagePreviewElement}
                        />
                      </div>
                    ))}
                  </div>
                )}
                <div className={style.topInput}>
                  <div
                    id={"mainInput"}
                    onPaste={(e) => {
                      e.preventDefault();
                      const text = e.clipboardData.getData("text/plain");
                      document.execCommand("insertText", false, text);
                    }}
                    onInputCapture={(e) => {
                      console.log(e.target);

                      setPrompt(
                        e.currentTarget.textContent !== null
                          ? e.currentTarget.textContent
                          : "",
                      );
                    }}
                    contentEditable={true}
                    className={style.editableContainer}
                  >
                    <p className={style.messageInput}></p>
                  </div>

                  <button
                    onClick={handleButtonClick}
                    disabled={isDisabled()}
                    style={{
                      backgroundColor: `${prompt ? "white" : "gray"}`,
                    }}
                    className={style.sendButton}
                  >
                    {!isGeneratingResponse ? (
                      <FaArrowUp />
                    ) : (
                      <FaPause className={style.spinner} size={20} />
                    )}
                  </button>
                </div>

                <div className={style.options}>
                  <FaPaperclip onClick={uploadImage} className={style.icon2} />
                  <FaMicrophone
                    onClick={!isListing ? startListening : stopListening}
                    color={!isListing ? "white" : "red"}
                    className={style.icon2}
                  />
                  <IconCode className={style.icon2} />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
      <Notification />

    </div>
  );
}

type chatProps = {
  role: "assistant" | "user" | "system" | "thinking_loader";
  content: string;
  index: number;
  msgLength: number;
};

const MessageDisplayer = ({ role, content, index, msgLength }: chatProps) => {
  if (role === "system") {
    return;
  }
  if (role === "assistant") {
    return (
      <div className={style.messageText}>
        <MarkdownRenderer
          index={index}
          messagesLength={msgLength}
          content={content}
        />
      </div>
    );
  } else {
    return <div className={style.userText}> {content} </div>;
  }
};