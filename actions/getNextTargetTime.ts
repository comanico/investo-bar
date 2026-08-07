export function getNextTargetTime(now: Date = new Date()) {
  const currentMinutes = now.getMinutes();
  let targetMinutes = Math.ceil(currentMinutes / 15) * 15;
  const target = new Date(now);
  target.setMinutes(targetMinutes, 0, 0);

  if (targetMinutes >= 60) {
    target.setHours(now.getHours() + 1);
    target.setMinutes(0);
    targetMinutes = 0;
  }

  if (target.getTime() <= now.getTime()) {
    target.setMinutes(targetMinutes + 15, 0, 0);
    if (targetMinutes + 15 >= 60) {
      target.setHours(now.getHours() + 1);
      target.setMinutes(0);
    }
  }

  return target;
}