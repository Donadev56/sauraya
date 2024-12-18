export const GetDate = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0"); // Mois de 0 à 11, donc +1
  const day = String(now.getDate()).padStart(2, "0"); // Ajoute un 0 si le jour est < 10

  const formattedDate = `${year}-${month}-${day}`;
  return formattedDate;
};

export const FormatedDate = (date: string) => {
  const currentDate = GetDate();
  const lastDayNumber = Number(date.split("-")[2]);
  const todayNumber = Number(currentDate.split("-")[2]);
  if (currentDate === date) {
    return "Today";
  } else if (todayNumber === lastDayNumber + 1) {
    return "Yesterday";
  } else {
    return date.replace("-", " ");
  }
};
