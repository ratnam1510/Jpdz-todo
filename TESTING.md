# Testing the Extension

## Prerequisites
- Node.js installed.
- VS Code installed.

## Setup
1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Build the Angular App**:
   ```bash
   npm run build
   ```
   This generates the `dist/` folder which the extension loads.

## Running the Extension
1. Open this project in VS Code.
2. Go to the **Run and Debug** view (Cmd+Shift+D / Ctrl+Shift+D).
3. Select **"Run Extension"** from the dropdown.
4. Press **F5** (or click the Green Play button).
5. A new "Extension Development Host" window will open.
6. **Wait a few seconds**. The "Project Tasks" panel should open automatically.
7. You should also see a notification: "Project Tasks Extension Activated!".

## Troubleshooting
- **Nothing shows up?**
  - Check the **Output Panel**: `View -> Output`, then select **"Project Tasks"** from the dropdown.
  - You should see logs like:
    ```
    Extension activating...
    Command 'vs-code-style-project-tasks.start' triggered.
    index.html found...
    ```
- If you see "Build Required", run `npm run build` in the terminal.
- If styles are missing, ensure `npm run build` completed successfully.
