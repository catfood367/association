# 🚀 Spaced Repetition Association Trainer (FSRS)

This is a single-file, browser-based web application for association training (e.g., vocabulary, facts) that implements the **FSRS (Free Spaced Repetition Scheduler)** algorithm.

It's designed to be simple, portable, and powerful. Since it's a single `index.html` file, you can save it and run it entirely offline in your browser. All your decks and learning progress are saved directly in your browser's `localStorage`.

---

## ✨ Key Features

* **True Spaced Repetition:** Implements the modern FSRS algorithm to schedule cards based on your performance, calculating card **Stability (s)** and **Difficulty (d)**.
* **Two Learning Modes:**
    * **Evaluative Mode (FSRS):** A serious study mode that grades your performance (Again, Hard, Good, Easy) based on typing accuracy (Levenshtein distance) and response time. This mode updates your card's FSRS data.
    * **Free Mode:** A low-pressure practice mode with helpful hints (letter, color, and position) that does *not* affect your FSRS progress.
* **Full Deck Management:** Create, edit, and delete multiple decks.
* **JSON Import/Export:** Easily import your learning data from a `.json` file. The app also supports merging new JSON files with existing deck content.
* **Smart FSRS Data Preservation:** When you edit a deck's JSON, the app only shows you the `question` and `answer` fields. It intelligently preserves, updates, or resets the hidden FSRS data (`s`, `d`, etc.) when you save, ensuring your progress is never accidentally overwritten.
* **Audio Prompts:** Utilizes your browser's built-in Text-to-Speech (TTS) to read the "question" aloud.
* **No Dependencies:** Just one `index.html` file. No server, no build step, no internet connection required.
* **Dark Mode:** Toggles for comfortable viewing.

---

## 🚀 How to Use

1.  **Download:** Save the `index.html` file to your computer.
2.  **Open:** Open the `index.html` file in any modern web browser (like Chrome, Firefox, or Edge).
3.  **Create a Deck:** You will see the "Selecione um Deck" (Select a Deck) screen.
    * Click the `+` button to create a new deck.
    * Give your deck a name (e.g., "Japanese Vocabulary").
4.  **Add Content (JSON):**
    * Click the **"Editar/Importar JSON"** (Edit/Import JSON) button.
    * You can either **Import a File** or paste your content directly into the text editor.
    * The JSON content must be an **array of objects**, with each object having a `question` and `answer` key:
      

    ```json
    [
        {
            "question": "palavra1",
            "answer": "word1"
        },
        {
            "question": "palavra2",
            "answer": "word2"
        }
    ]
    ```
5.  **Save and Play:**
    * Click **"Salvar"** (Save) in the JSON editor.
    * Click **"Salvar"** (Save) in the Settings modal.
    * Your new deck will appear. Click it to start learning!

---

## 🎮 The Two Learning Modes

You can toggle between modes in the settings panel (`⚙️` icon).

### 1. Modo Avaliativo (Evaluative Mode)

This is the primary **FSRS study mode**.

* **No Hints:** You are presented with the "question" in the center of the screen.
* **Grading:** You must type the "answer" correctly. When you press `Enter`, the app grades you based on:
    * **Accuracy:** Uses Levenshtein distance for typos.
    * **Time:** Measures your reaction time and typing time.
* **Progress:** Based on your grade (Again, Hard, Good, Easy), the app updates the card's FSRS data and schedules it for a future review. This progress is saved automatically.
* **Goal:** To move all cards from "New" to "Mature" by reviewing them at optimal intervals.

### 2. Modo Livre (Free Mode)

This is a **practice or "cram" mode** that does **not** affect your FSRS schedule.

* **Hints:** This mode provides several hints to aid in recall:
    * **Letter Hint:** Shows the first `N` letters of the answer (configurable in settings).
    * **Color Hint:** Each card has its own unique, consistent color.
    * **Position Hint:** Each card appears in a unique, consistent position on the screen.
* **No Grading:** The app simply checks if your answer is correct or incorrect.
* **No Progress:** Your FSRS data (`s`, `d`, `dueDate`) is **not** changed in this mode. It's purely for practice.

---

## 🛠️ Technical Details

* **Persistence:** All deck and card data is stored in the browser's `localStorage` under the key `association_game_decks_fsrs`.
* **Card Data Structure:**
    * When you import a JSON, you only provide `{ "question": "...", "answer": "..." }`.
    * Internally, the app expands this to the full FSRS card format:
        ```json
        {
            "question": "...",
            "answer": "...",
            "s": 0.1,  // Stability
            "d": 0.5,  // Difficulty
            "lastReview": null,
            "dueDate": null
        }
        ```
* **FSRS Logic:** The app uses `calculateRetention`, `calculateGrade`, and `updateFsrsData` functions to manage the card scheduling, closely following the FSRS algorithm principles.
