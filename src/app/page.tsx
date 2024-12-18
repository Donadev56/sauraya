"use client";

import Image from "next/image";
import google from "./assets/img.icons8.png";
import styles from "./styles/pages.module.scss";
import logo from "./assets/logo/2.png";
import image1 from "./assets/im12.jpg";
import image2 from "./assets/im16.jpg";
import image3 from "./assets/ima2.jpg";
import image9 from "./assets/im13.jpg";
import image4 from "./assets/im4.jpg";
import image13 from "./assets/im9.jpg";
import { useRouter } from 'next/navigation';


import { useCallback, useEffect, useState } from "react";
import { SendOtp, VerifyOtp } from "./api/send-otp/opt";
import Notification, {
  NotificationStatus,
  showNotification,
} from "./components/notification";
import { saveDataToLocal } from "./utils/saveDataToLocal";
import { GetDataFromLocalStorage } from "./databaseManager/dataSaver";

export default function Home() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [images , setImages] = useState( [image3, image2, image1])
  const [email, setEmail] = useState("");
  const [step, setStep ] = useState(0);
  const [lastSentDate , setLastSentdate] = useState(0)
  const [otp, setOtp] = useState<string | undefined >();
  const [isLoading , setIsloading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(true);
  const router = useRouter();

  const navigateToDashboard = useCallback(() => {
    router.push('/pages/chat');
  }, [router]);
  useEffect(()=> {
    const checkIsRegistered = async () => {
      setIsloading(true);
      try {
        const savedStringData =  await GetDataFromLocalStorage("lastConnectionData")
        if (!savedStringData) {
          setIsRegistered(false);
          setIsloading(false);
          return;

        }
        

        if (savedStringData) {
           setIsRegistered(true);
           setIsloading(false);
           navigateToDashboard();
         }

      } catch (error) {
        setIsloading(false);

        console.error("Error while checking registration:", error);
        showMessage("An error occurred", "error");
        
      }
     }

     checkIsRegistered()

  }, [navigateToDashboard])

  useEffect(() => {
    const changeBackground = () => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    };

    const interval = setInterval(changeBackground, 20000);

    return () => {
      clearInterval(interval);
    };
  }, [images.length]);

  const showMessage = (text: string, status: NotificationStatus) => {
    showNotification({ message: text, status: status });
  };

  const handleSendEmail = async () => {
    setIsloading(true);
    try {

      const response = await SendOtp(email);
      if (!response.success) { 
        showMessage(response.response, "error");
        setIsloading(false)

        return;
      }
      showMessage("Email sent successfully", "success");
      setStep(1);
      setImages (
        [image13 , image9 , image4]
      )
      setLastSentdate(Date.now() / 1000)
      setIsloading(false);
      
    } catch (error) {
      console.error("An error occurred:", error);
      showMessage("An error occurred while trying to send the email", "error");
      
    }
   }

   const submitOpt = async  ()=> {
    setIsloading(true);

    try {
      const response = await VerifyOtp(email, otp!);
      console.log("OTP verification successful", response);
      if (response.success) {
        showMessage(response.response as string, "success");
        console.log("User logged in successfully");
        if (response.success) {
          if (typeof response.response !== "string") {
            const saved =  saveDataToLocal(response.response );
            if ((await saved).success) {
              showMessage("Data saved successfully to local storage", "success");
              navigateToDashboard()
            } else {
              setIsloading(false);

              showMessage("An error occurred while saving user data to local storage", "error");
            }

          }

        }

       
      } else {
        showMessage(response.response as string, "error");
        setIsloading(false);
      }
      
    } catch (error) {
      console.error("An error occurred:", error);
      showMessage(error as string, "error");
      setIsloading(false);

      
    }

   }


   const handleResend = async ()=> {
    setIsloading(true);
    try {
      const lasTtime = lastSentDate 
      const timeDiff = Date.now() / 1000 - lasTtime;
      if (timeDiff < 60) {
        setIsloading(false)

        showMessage("You can only resend the email after 1 minute", "warning");
        return;
      }

      const response = await SendOtp(email);
      if (!response.success) { 
        setIsloading(false)

        showMessage(response.response, "error");
        return;
      }
      showMessage(response.response, "success");
      setIsloading(false)
      
    } catch (error) {
      console.error("An error occurred:", error);
      showMessage("An error occurred while trying to resend the email", "error");
      
    }
   }

if (isRegistered) {
  return (
    <div className={styles.loaderContainer}> <div  className={styles.loader} /></div>
  )
}
  return (
    <div
      id={styles.customBg}
      style={{
        backgroundImage: `url(${images[currentImageIndex].src})`,
      }}
      className={styles.customBg}
    >
      <div className={styles.toptext}>
        <div className={styles.learnMore}>Learn more</div>
      </div>
      <div className={styles.middleText}>
        <div className={styles.weltext}>Welcome to</div>
        <div className={styles.titleText}>Sauraya AI</div>
      </div>

  {step  === 0 ?    <div className={styles.container}>
        <div className={styles.textCenter}>
          <Image width={120} alt="logo sauraya" src={logo} />

          <p className={styles.subtitle}>Log in to continue</p>
        </div>

        {/* Login Form */}
        <form onSubmit={(e)=> {
          e.preventDefault()
          handleSendEmail ()
        }} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input onChange={(e)=> setEmail(e.target.value)} value={email} type="email" id="email" placeholder="Your email" required />
          </div>

          <button  type="submit" className={styles.submitButton}>
            Connect
          </button>
        </form>

        {/* Authentication with Google */}
        <div className={styles.divider}>
          <hr />
          <span>OR</span>
          <hr />
        </div>

        <button className={styles.googleButton}>
          <Image
            src={google}
            alt="Google Logo"
            width={20}
            height={20}
            className={styles.googleIcon}
          />
          Sign in with Google
        </button>
      </div> : <Step2 submit={submitOpt} setOtp={setOtp} otp={otp} handleResend={handleResend} />}
      <Notification />

{isLoading &&   <div className={styles.loaderContainer}> <div  className={styles.loader} /></div>
}
    </div>
  );
}

interface Step2Props {
  handleResend: () => void;
  otp: string | undefined;
  setOtp: (value: string) => void;
  submit: () => void;
  
 }

const Step2 = ({handleResend , otp , setOtp , submit} : Step2Props)=> {
  return (
    <div className={styles.container}>

         <div className={styles.textCenter}>
          <Image width={120} alt="logo sauraya" src={logo} />

          <p className={styles.subtitle}>Log in to continue</p>
        </div>

      <div className={styles.otpContainer}>
        <div className={styles.otpTitle}>
          Enter the OTP :

        </div>

          <input value={otp}  onChange={(e)=> setOtp(e.target.value)} placeholder='Enter the OTP' className={styles.optInputs} type="number" />
          <div className={styles.buttons}>

          <button onClick={handleResend}  className={styles.resend}>Re-send</button>
          <button onClick={submit}>Submit</button>

          </div>


      </div>


    </div>
  )
}





function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
 
  useEffect(() => {
    setIsIOS(
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    )
 
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches)
  }, [])
 
  if (isStandalone) {
    return null // Don't show install button if already installed
  }
 
  return (
    <div>
      <h3>Install App</h3>
      <button>Add to Home Screen</button>
      {isIOS && (
        <p>
          To install this app on your iOS device, tap the share button
          <span role="img" aria-label="share icon">
            {' '}
            ⎋{' '}
          </span>
          and then "Add to Home Screen"
          <span role="img" aria-label="plus icon">
            {' '}
            ➕{' '}
          </span>.
        </p>
      )}
    </div>
  )
}
 
