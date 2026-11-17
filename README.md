# RecruitAI

## Project Overview
RecruitAI is a full-stack application designed to streamline the recruitment process. This project encompasses both frontend and backend components, offering a seamless user experience for job seekers and recruiters alike.

[CURRENTLY IN DEVELOPMENT PHASE...CHANGES WILL BE MADE]

## Setup Instructions
### Prerequisites
Ensure that you have the following installed on your machine:
- Node.js (for the frontend)
- Python (for the backend)
- Supabase/PostgreSQL (for the database)

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
   DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
   JWT_SECRET_KEY=<your_jwt_secret_key>
   NVIDIA_API_KEY=<your_nvidia_api_key>
   CORS_ORIGINS=http://localhost:3000
   ```
3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
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
- `DATABASE_URL`
- `JWT_SECRET_KEY`
- `NVIDIA_API_KEY`
- `CORS_ORIGINS`

## Note
Supabase (PostgreSQL) is supported through `DATABASE_URL`. The existing resume/profile files remain Render-local and should be moved to object storage for permanent file retention.
