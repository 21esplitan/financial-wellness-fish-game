# Swim Upstream: Time Value of Money Challenge

A 20-second retro arcade fish game for the Utah Tech University Financial Wellness Center. Players pick the better of two
time-value-of-money scenarios. Right answers send the fish upriver; wrong answers let the current push it back.

- 30 plain-language questions, shuffled every round, with A/B sides randomized so the answer isn't always the same button
- 20-second rounds. +100 per right answer (+20 streak bonus, up to 5 in a row), -50 per wrong answer, +300 for reaching the top
- Every answer is computed from formulas in `questions.js`, and each answer has a one-line explanation
- Works on phones and laptops, no install; keyboard: A / B or arrow keys

## Change settings
Edit `config.js` (round length, points, fish speed). Add or edit questions in `questions.js`.

## Shared leaderboard (optional)
By default scores are stored on each device. To share one leaderboard across everyone at the fair:

1. Create a free Firebase project and add a **Realtime Database** (start in test mode).
2. Set the database rules to:
   ```json
   { "rules": { "scores": { ".indexOn": ["score"], ".read": true, ".write": true,
       "$id": { ".validate": "newData.hasChildren(['name','score']) && newData.child('score').isNumber() && newData.child('score').val() < 5000" } } } }
   ```
3. Paste the database URL into `SHARED_DB_URL` in `config.js` and push.

To clear the board before the event, delete the `scores` node in the Firebase console.
