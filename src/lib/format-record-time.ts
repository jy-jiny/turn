function sameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function formatClock(date: Date) {
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours < 12 ? "오전" : "오후"} ${hours % 12 || 12}:${minutes}`;
}

/**
 * Labels a record so the day is always clear: "오늘 오후 2:35", "어제 오전 9:05",
 * "11월 3일 오후 2:35", or with the year when it is not this year.
 */
export function formatRecordTime(date: Date, now: Date) {
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  let day: string;

  if (sameDay(date, now)) {
    day = "오늘";
  } else if (sameDay(date, yesterday)) {
    day = "어제";
  } else if (date.getFullYear() === now.getFullYear()) {
    day = `${date.getMonth() + 1}월 ${date.getDate()}일`;
  } else {
    day = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  }

  return `${day} ${formatClock(date)}`;
}
