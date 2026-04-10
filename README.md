# RecruitAI

## Project Overview
RecruitAI is a full-stack application designed to streamline the recruitment process. This project encompasses both frontend and backend components, offering a seamless user experience for job seekers and recruiters alike.

## Setup Instructions
### Prerequisites
Ensure that you have the following installed on your machine:
- Node.js (for the frontend)
- Python (for the backend)
- MySQL (for the database)

### Frontend Setup
1. Clone the repository and navigate to the frontend directory:
   ```bash
   cd recruitai-frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the frontend application:
   ```bash
   npm run dev
   ```

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd recruitai-backend
   ```
2. Set up your environment variables in a `.env` file:
   ```bash
   DB_HOST=<your_db_host>
   DB_PORT=<your_db_port>
   DB_USER=<your_db_user>
   DB_PASSWORD=<your_db_password>
   DB_NAME=<your_db_name>
   JWT_SECRET_KEY=<your_jwt_secret_key>
   ANTHROPIC_API_KEY=<your_anthropic_api_key>
   ```
3. Install required Python packages:
   ```bash
   pip install Flask Flask-CORS Flask-JWT-Extended Flask-SQLAlchemy python-dotenv pymysql
   ```
4. Run the backend application:
   ```bash
   python app.py
   ```
   *or if applicable*
   ```bash
   flask run
   ```

## Environment Variables
The application requires the following environment variables:
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `JWT_SECRET_KEY`
- `ANTHROPIC_API_KEY`

## Note
Make sure to have a MySQL database set up and running before starting the application.