import { UserData } from "../api/send-otp/database";
import { SaveDataToLocalStorage } from "../databaseManager/dataSaver";

export const saveDataToLocal = async (userData : UserData)=> {
  try {

    await SaveDataToLocalStorage("lastConnectionData", JSON.stringify(userData));
    console.log("User data saved successfully to local storage");
    return {success : true, response: "User data saved successfully to local storage"};
    
  } catch (error) {
    console.error("An error occurred while saving user data to local storage:", error);
    return {success : false, response: "An error occurred while saving user data to local storage"};
    
  }
}