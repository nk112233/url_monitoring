

Installing the dependencies for backend (not to be done when using docker setup) :
> cd backend
> npm install

Installing the dependencies for frontend (not to be done when using docker setup) :
> cd frontend
> npm install

Commands to run Frontend :
> cd frotnend
> npm run dev

Note : Before running the frontend, go to frontend/src/util and update the getBaseURL() function. Add this url http://localhost:5000 (do this if you want to test it locally on your device)

Commands to run Backend :
> cd backend
> npm start

For running via Docker, run the command in main project directory (make sure the Docker Desktop is installed and Docker Engine is running) :
> docker-compose up --build

Then go to the http://localhost:5173 on your browser and enjoy!