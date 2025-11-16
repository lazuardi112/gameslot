# WhatsApp Flutter Web App Builder

This is a full-stack web application that allows users to create Flutter-based webview applications for Android. Users can register and log in using their WhatsApp number, create new apps, and download the generated APK and AAB files. The application also includes an admin panel for managing WhatsApp API settings and user app creation limits.

## Features

- **User Authentication:** WhatsApp OTP-based registration and login.
- **User Dashboard:**
    - Create new webview applications.
    - View app creation limits.
    - Track the progress of app builds.
    - Download generated APK and AAB files.
- **Admin Panel:**
    - Secure admin login.
    - Configure WhatsApp API key and device ID.
    - Manage user app creation limits.
- **Automated App Builder:**
    - Automatically generates a new Flutter project.
    - Customizes the project to create a webview pointing to a specified URL.
    - Replaces the default app icon with a user-provided one.
    - Builds the final APK and AAB files.

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or later)
- [Flutter SDK](https://flutter.dev/docs/get-started/install)
- An account with a WhatsApp API provider that supports sending text messages.

## Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/whatsapp-flutter-webapp-builder.git
    cd whatsapp-flutter-webapp-builder
    ```

2.  **Install dependencies:**
    Run the following command in the root directory. This will install the necessary dependencies for both the `server` and `flutter_builder` directories.
    ```bash
    npm install
    ```

## Usage

1.  **Start the server:**
    ```bash
    npm start
    ```
    The server will be running at `http://localhost:3000`.

2.  **Access the Admin Panel:**
    - Open your browser and navigate to the admin login page (you will need to serve the `client` directory, e.g., using a live server extension in your code editor, or a simple python server `python3 -m http.server 8000` in the client directory). The admin login page is `admin.html`.
    - Log in with the following credentials:
        - **Username:** `admin`
        - **Password:** `admin123`
    - In the admin dashboard, configure your WhatsApp API key and device ID. You can also manage user app limits.

3.  **Register and Log In as a User:**
    - Navigate to the user registration/login page (`index.html` in the `client` directory).
    - Register using your WhatsApp number. You will receive an OTP on WhatsApp.
    - Use the OTP to log in.

4.  **Create an App:**
    - After logging in, you will be redirected to the user dashboard.
    - Fill out the "Create New App" form with your app's name, package name, URL, and a PNG icon.
    - Click "Create App" to start the build process.
    - The status of your app will be displayed in the "My Apps" table.
    - Once the build is complete, you can download the APK and AAB files from the dashboard.

## Project Structure

-   `client/`: Contains the frontend HTML, CSS, and JavaScript files for the user and admin panels.
-   `server/`: Contains the Node.js/Express backend, which handles API requests, user authentication, and database interactions.
-   `flutter_builder/`: Contains the Node.js script that automates the creation and building of the Flutter applications.
-   `package.json`: Simplifies the installation and startup process.

## Notes

-   The SQLite database file (`db.sqlite`) is created in the `server` directory. In some environments, you may encounter file permission issues. Ensure that the server process has write access to the `server` directory.
-   This application is a proof of concept and is not intended for production use without further security and stability enhancements.
