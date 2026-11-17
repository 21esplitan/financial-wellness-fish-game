// Game settings. Edit freely.
window.FWC_CONFIG = {
  ROUND_SECONDS: 20,        // length of one round (the yellow bar)
  POINTS_CORRECT: 100,
  POINTS_WRONG: -50,
  STREAK_BONUS: 20,         // extra points per consecutive correct answer (max 5 in a row)
  FISH_STEP: 20,            // % of river the fish gains per right answer (5 right = top of river)
  FISH_SLIP: 10,            // % the current pushes the fish back on a wrong answer
  FINISH_BONUS: 300,        // bonus for reaching the top of the river

  // Shared leaderboard. Leave empty to keep scores on this device only.
  // To share scores across every device at the fair, paste a Firebase Realtime Database URL here,
  // for example: "https://my-project-default-rtdb.firebaseio.com" (see README.md).
  SHARED_DB_URL: ""
};
