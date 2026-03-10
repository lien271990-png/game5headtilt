# Head Tilt Quiz Challenge

A fun, interactive quiz game where you answer by tilting your head left or right!

## Features
- **AI-Powered Tracking**: Uses MediaPipe Face Landmarker to detect head tilt in real-time.
- **Customizable Questions**: Built-in question editor to add, edit, or delete your own quiz questions.
- **Immersive Audio**: Background music, sound effects for correct/wrong answers, and countdown ticks.
- **Responsive Design**: Modern, dark-themed UI built with Tailwind CSS and Framer Motion.

## How to Play
1. Allow camera access when prompted.
2. Tilt your head to the **Left** to select **Option A**.
3. Tilt your head to the **Right** to select **Option B**.
4. Hold the tilt for a moment to confirm your selection.
5. Try to get the highest score before time runs out!

## Deployment
This project is ready to be deployed on **Netlify**, **Vercel**, or **GitHub Pages**.
Simply run:
```bash
npm install
npm run build
```
Then upload the `dist` folder to your hosting provider.

## Tech Stack
- React
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- MediaPipe Tasks Vision
- Canvas Confetti
- Lucide React
