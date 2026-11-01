# NutriTrack - Vanilla Calorie & Macro Tracker

A lightweight, responsive, and persistent Calorie and Macronutrient Tracker built using **pure HTML, CSS, and JavaScript**. Zero build steps, zero external dependencies, zero CSS variables, zero frameworks, and zero backend required.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Vanilla JS](https://img.shields.io/badge/Vanilla-HTML%20%7C%20CSS%20%7C%20JS-yellow.svg)

---

## ✨ Features

- **Daily Calorie & Macro Tracking**:
  - Automatically calculates consumed, remaining, and target calories.
  - Visual color-coded progress bars (Normal, Warning, and Over Budget).
  - Tracks macronutrients: **Protein**, **Carbohydrates**, and **Fats** against daily goals.
- **Categorized Meals**:
  - Separate logging for **Breakfast**, **Lunch**, **Dinner**, and **Snacks**.
  - Subtotals of calories and macro breakdown for each meal category.
  - Edit and delete items directly from the list.
- **Fast Logging**:
  - Detailed food modal with macronutrient inputs.
  - One-click quick calorie entry without typing names.
  - Pre-configured quick-add chips for common snacks (Apple, Boiled Egg, Greek Yogurt, etc.).
- **Interactive Water Intake Tracker**:
  - Clickable visual cup icons and quick +/- controls to log daily water intake.
- **Multi-Day Navigation & 7-Day History**:
  - View, edit, or log meals on any date using calendar controls.
  - Built-in 7-day intake chart comparing daily calories to your target.
- **Browser Persistence & Portability**:
  - All logs and settings persist in the browser via `localStorage`.
  - JSON **Export / Backup** and **Import / Restore** features.
  - Option to clear individual days or reset all data.

---

## 🚀 Getting Started

No installation, build tools, or web server setup needed!

1. Clone or download this repository:
   ```bash
   git clone https://github.com/Inemford/test-1.git
   cd test-1
   ```
2. Open `index.html` in any web browser:
   - On Windows: double-click `index.html` or run `start index.html` in PowerShell/CMD.
   - On Mac: `open index.html`
   - On Linux: `xdg-open index.html`

---

## 🛠️ Tech Stack

- **HTML5**: Semantic markup, accessible modal dialogs, and SVG icons.
- **CSS3**: Pure vanilla CSS (no preprocessors, no Tailwind, no CSS variables). Fully responsive layout across mobile and desktop.
- **JavaScript (ES6+)**: Pure vanilla JS handling state management, calculations, local storage persistence, and dynamic DOM rendering.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
