// Game settings. Edit freely.
window.FWC_CONFIG = {
  ROUND_SECONDS: 30,        // length of one round (the yellow bar)
  POINTS_CORRECT: 100,
  POINTS_WRONG: -50,
  STREAK_BONUS: 20,         // extra points per consecutive correct answer (max 5 in a row)
  FISH_STEP: 14,            // % of river the fish gains per right answer
  FISH_SLIP: 9,             // % the current pushes the fish back on a wrong answer
  FINISH_BONUS: 300,        // bonus for reaching the top of the river

  // Shared leaderboard. Leave empty to keep scores on this device only.
  // To share scores across every device at the fair, paste a Firebase Realtime Database URL here,
  // for example: "https://my-project-default-rtdb.firebaseio.com" (see README.md).
  SHARED_DB_URL: ""
};
