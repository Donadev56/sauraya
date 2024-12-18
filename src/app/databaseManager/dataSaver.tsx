import localforage from "localforage";

localforage.config({
  name: "myApp",
});

export const SaveDataToLocalStorage = async (name: string, data: string) => {
  await localforage.setItem(name, data);
};

export const GetDataFromLocalStorage = async (name: string) => {
  return await localforage.getItem<string>(name);
};


export const DeleteDataFromLocalStorage = async (name: string) => { 
  await localforage.removeItem(name, (err)=> {
    if (err) {
    console.error(`Error deleting ${name}:`, err);
    }

  });
}