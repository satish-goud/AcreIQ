# acreIQ — AI-Powered Real Estate Price Prediction & Locality Intelligence

**acreIQ** is an AI-powered real-estate platform designed to help users explore properties, estimate property prices, compare localities, and make more informed real-estate decisions.

The platform combines machine learning, property search, interactive maps, and locality-level price information in a single web application. It currently uses demo property data focused on Hyderabad.

## Live Demo

- **Frontend:** https://acre-iq.vercel.app
- **Backend API:** https://acreiq.onrender.com
- **API Documentation:** https://acreiq.onrender.com/docs
- **GitHub Repository:** https://github.com/satish-goud/AcreIQ

## Problem Statement

Real-estate buyers and investors often find it difficult to compare property prices across localities and understand whether a property's estimated price is reasonable. Property information can be spread across multiple platforms, making it challenging to evaluate different options efficiently.

acreIQ aims to simplify this process by bringing property discovery, machine-learning-based price estimation, locality exploration, and property comparison into one platform.

## Key Features

### 1. AI-Powered Price Prediction
- Estimates property prices using a trained machine learning model.
- Uses property and location-related features supported by the prediction model.
- Provides estimated prices to help users explore potential property values.

### 2. Property Search and Filtering
- Browse available property listings.
- Explore properties by locality and property type.
- Filter results using available search criteria, such as budget and area.

### 3. Interactive Hyderabad Map
- Explore Hyderabad using an interactive map.
- View price-colored markers for property or locality information.
- Click markers to view locality and demo price information.
- Use approximate locality coordinates when precise property coordinates are unavailable.

### 4. Locality Intelligence
- Explore supported Hyderabad localities.
- View available locality-level property and price information.
- Access locality trend information through the backend API.

### 5. Property Comparison
- Compare property options to support real-estate decision-making.

### 6. Property Listing
- Submit property information through the application.
- Store and retrieve listings through the backend where supported.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React |
| Frontend build tool | Vite |
| Styling | CSS |
| Interactive maps | Leaflet and OpenStreetMap |
| Backend | Python, FastAPI |
| Machine learning | Scikit-learn |
| ML model storage | Joblib |
| API communication | Axios |
| Frontend deployment | Vercel |
| Backend deployment | Render |
| Version control | Git and GitHub |

## System Architecture

```text
                 User
                  |
                  v
       React + Vite Frontend
                  |
                  | HTTP requests
                  v
           FastAPI Backend
                  |
          +-------+--------+
          |                |
          v                v
   ML Price Model     Property Data
          |                |
          +-------+--------+
                  |
                  v
       API Responses to Frontend
                  |
                  v
     Price Results, Listings,
       Comparisons and Map
```

## Project Structure

```text
AcreIQ/
├── backend/
│   ├── main.py
│   ├── acre_iq_model.joblib
│   ├── acre_iq_encoders.joblib
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── api.js
│   │   ├── components/
│   │   │   └── LocalityMap.jsx
│   │   └── App.css
│   ├── package.json
│   └── ...
│
└── README.md
```

*Note: This structure highlights the main project files; additional files and folders may exist in the repository.*

## Getting Started

### Prerequisites

Install the following software:

- Python
- Node.js and npm
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/satish-goud/AcreIQ.git
cd AcreIQ
```

### 2. Set Up the Backend

Open a terminal in the project directory.

On Windows PowerShell:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Start the backend:

```powershell
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
```

The local API will be available at:

- API: http://127.0.0.1:8000
- Interactive API documentation: http://127.0.0.1:8000/docs

### 3. Set Up the Frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm.cmd run dev
```

Open the local frontend URL printed by Vite, typically:

http://localhost:5173

The frontend is configured to use the local API during development and the deployed Render API in production by default. If an environment variable named `VITE_API_URL` is configured, ensure it points to the intended backend.

Example production API URL:

```text
VITE_API_URL=https://acreiq.onrender.com
```

Vite environment variables are public when bundled into frontend code; do not store secrets in them.

## Backend API Endpoints

The deployed backend provides the following endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check API health |
| GET | `/api/localities` | Retrieve supported localities |
| GET | `/api/properties` | Retrieve and filter property listings |
| POST | `/api/properties` | Submit a property listing |
| GET | `/api/properties/{property_id}` | Retrieve a property by ID |
| POST | `/api/predict-price` | Request a property price prediction |
| GET | `/api/localities/{locality}/trend` | Retrieve locality trend information |

For request parameters and schemas, visit the interactive API documentation:

https://acreiq.onrender.com/docs

## Machine Learning

acreIQ uses a Scikit-learn-based machine learning model to estimate property prices from supported input features.

The saved model and associated encoders are stored in the backend as Joblib artifacts:

- `acre_iq_model.joblib`
- `acre_iq_encoders.joblib`

The backend loads these artifacts to serve prediction requests.

Machine learning provides data-driven estimates rather than guaranteed market prices. Prediction quality depends on the training data, selected features, and model evaluation.

## Deployment

### Frontend — Vercel

The React/Vite frontend is deployed on Vercel:

https://acre-iq.vercel.app

### Backend — Render

The FastAPI backend is deployed on Render:

https://acreiq.onrender.com

The frontend communicates with the deployed backend through HTTP API requests. The backend CORS configuration permits the deployed frontend origin.

## Current Limitations

- The current demonstration uses sample property data and should not be considered a complete live real-estate marketplace.
- Price predictions are estimates and are not official valuations or financial advice.
- Approximate locality coordinates may represent a locality center rather than an individual property's exact position.
- Locality trends and predictions depend on the available dataset and implemented model.
- The accuracy of predictions for real-world transactions requires evaluation using reliable, representative property data.

## Future Enhancements

- Integrate verified real-estate datasets and regularly updated market information.
- Improve model accuracy using broader historical transaction data.
- Add more detailed locality analytics and historical price visualizations.
- Expand coverage to additional cities.
- Improve property comparison with more investment-related indicators.
- Add user accounts, saved properties, and personalized recommendations.
- Introduce model evaluation reports and prediction confidence indicators.

## Learning Outcomes

This project demonstrates the integration of:

- Python backend development with FastAPI.
- Machine learning model training and inference.
- React-based frontend development.
- REST API integration.
- Interactive map visualization.
- Model artifact management.
- GitHub version control and cloud deployment.

## Conclusion

acreIQ demonstrates how machine learning and interactive web technologies can be combined to simplify property discovery and real-estate price exploration. By bringing estimated property prices, locality information, search, comparison, and mapping together, the project provides a foundation for a more data-driven real-estate decision-support platform.

## Author

**Project:** acreIQ — AI-Powered Real Estate Price Prediction & Locality Intelligence

**Repository:** https://github.com/satish-goud/AcreIQ

**Live Application:** https://acre-iq.vercel.app

---

*Disclaimer: acreIQ is an educational and demonstration project. Its sample data and machine learning predictions should not be used as substitutes for verified market data or professional property valuation.*
