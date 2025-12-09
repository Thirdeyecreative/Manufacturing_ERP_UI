export const formatDateDDMMYYYY = (dateInput) => {
  // Use the provided date or default to the current date
  const date = dateInput ? new Date(dateInput) : new Date();

  // Get day, month (0-indexed), and year
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Add 1 to month
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};