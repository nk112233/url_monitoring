# UptimeDock Project Analysis Prompt

## Project Overview

UptimeDock is a comprehensive website and service monitoring application designed to track the uptime, performance, and status of websites and web services. The application allows users to monitor multiple aspects of web services including:

1. Website availability/uptime
2. SSL certificate expiration
3. Domain name expiration
4. Response time metrics

The application features a modern React frontend with a Node.js/Express backend, using MongoDB as the database. The system is structured to provide automated alerts through Slack integration and email notifications.

## Technical Architecture

### Backend (API)

The backend is built using Node.js with Express.js framework and follows a RESTful API architecture. Key components include:

1. **Database**: MongoDB with Mongoose ORM (v6.13.8) for schema validation and data modeling
2. **Authentication**: JWT-based authentication system using jsonwebtoken (v8.5.1) and bcryptjs (v2.4.3) for password hashing
3. **Cron Jobs**: Scheduled tasks using node-cron (v3.0.3) for regular monitoring checks
4. **External Service Integration**: 
   - Slack notifications via Slack API using axios (v1.7.9)
   - Email alerts using nodemailer (v6.10.0) and @sendgrid/mail (v7.7.0)
5. **Monitoring Services**: Various services implemented with axios for HTTP requests and specialized packages

#### Key Backend Files and Components:

- **Models**: 
  - `monitorModel.js` - Stores information about monitored URLs and their statuses
  - `incidentModel.js` - Tracks downtime incidents
  - `userModel.js` - User information and authentication data
  - `slackIntegrationModel.js` - Slack integration configuration
  - `sslCheckModel.js` - SSL certificate information and expiry tracking
  - `domainNameCheckModel.js` - Domain name expiration tracking
  - `responseTimeModel.js` - Response time metrics storage

- **Controllers**:
  - `authController.js` - Handles user authentication and registration
  - `monitorController.js` - Manages monitor creation, retrieval, and deletion
  - `incidentController.js` - Manages incident tracking and resolution
  - `integrationController.js` - Handles Slack integration

- **Services**:
  - `availabilityCheck.js` - Scheduled service for checking website availability
  - `sslCheck.js` - Checks SSL certificate validity and expiration
  - `domainNameCheck.js` - Checks domain name expiration dates
  - `puppeteer.js` - Headless browser implementation for advanced checks

- **Routes**:
  - REST API routes for all major functions (authentication, monitors, incidents, Slack integration, etc.)

### Frontend

The frontend is built using React (v18.2.0) with Vite (v3.2.3) as the build tool and follows a modern architecture with Redux Toolkit (v1.9.1) for state management. The UI includes dark/light theme support, responsive design, and data updates via polling.

#### Key Frontend Files and Components:

- **Features** (Redux Toolkit slices):
  - `auth` - Authentication state management
  - `monitors` - Monitor data and operations
  - `incidents` - Incident tracking and management
  - `theme` - UI theme management

- **Pages**:
  - `monitors` - Dashboard showing all monitored websites
  - `monitor-details` - Detailed view of a specific monitor with metrics
  - `incidents` - View of all downtime incidents
  - `analytics` - Performance analytics and reporting
  - `login/register` - User authentication
  - `integrations` - Slack integration management

- **Components**:
  - `Header` - Navigation header with user info and theme toggle
  - `Sidebar` - Main navigation
  - `Monitor` - Individual monitor display component
  - `Chart components` - For analytics visualizations using Chart.js (v4.4.9)
  - Various utility components for loading states, notifications, etc.

### Deployment

The application is configured for deployment using Docker, with separate containers for frontend and backend services. The docker-compose.yml file defines the multi-container Docker application with appropriate networking and volume mounting.

## Key Features Implemented

1. **Real-time Monitoring**:
   - Availability checks running every minute using node-cron schedules and axios HTTP requests
   - SSL certificate monitoring using the tls module (v0.0.1) and custom implementation through puppeteer
   - Domain expiration monitoring with whois (v2.14.2) package for retrieving domain information
   - Response time tracking with performance metrics using high-resolution timing

2. **Incident Management**:
   - Automated incident creation on downtime using mongoose transactions
   - Incident resolution tracking with timestamps and duration calculation
   - Historical incident data with aggregation pipelines for statistical analysis

3. **Alerts and Notifications**:
   - Email notifications for downtime using nodemailer with handlebars (v4.7.8) templating
   - Slack integration for real-time alerts using Slack's Webhook API

4. **Slack Integration** (Featured Integration):
   - Webhook-based integration with Slack channels
   - Customizable channel selection for different alerts
   - Test functionality to verify connection
   - Real-time incident alerts sent to configured Slack channels
   - Support for multiple integrations with different channels
   - Dedicated UI for managing integrations

5. **Analytics and Reporting**:
   - Uptime percentage calculation using aggregation pipelines on incident data
   - Response time metrics (avg, min, max, 90th percentile) using Chart.js with date-fns (v4.1.0) adapter 
   - Response time analysis in the Analytics tab showing performance trends over time
   - Visual charts and graphs using react-chartjs-2 (v5.3.0) with chartjs-plugin-annotation (v3.1.0) and chartjs-plugin-datalabels (v2.2.0)

6. **Security**:
   - JWT-based authentication with token refresh mechanisms
   - Password encryption using bcryptjs with 10 rounds of salting
   - Email verification with cryptographically secure tokens

7. **User Experience**:
   - Dark/light theme support using CSS variables and React context
   - Responsive design with SASS (v1.56.1) and CSS modules
   - Polling mechanism for data updates with Redux Toolkit's createAsyncThunk
   - Loading states and skeleton screens for better perceived performance

## Technical Implementation Details

### Monitoring Implementation

1. **Availability Monitoring**:
   - **Implementation**: HTTP requests using axios to check website response with configurable timeouts
   - **Response Analysis**: Custom status code processing with allowable ranges (2xx, 3xx)
   - **Downtime Confirmation**: Multiple retries (3 by default) with exponential backoff algorithm
   - **Process Flow**:
     1. Cron job runs every minute via `node-cron`
     2. Retrieves all active monitors from MongoDB
     3. For each monitor, sends HTTP GET request with axios
     4. If failed, retries 3 times with increasing intervals
     5. On confirmed failure, creates incident using `incidentController.js`
     6. Sends notifications through email and Slack if configured

2. **SSL Certificate Monitoring**:
   - **Implementation**: Uses both native `tls` module and puppeteer for comprehensive checking
   - **Certificate Analysis**: Extracts valid-from/valid-to dates, issuer information, and encryption details
   - **Storage**: Persists in `sslCheckModel.js` with references to monitors
   - **Alert System**: Configurable thresholds (30, 14, 7, 3, 1 days) for expiration warnings
   - **Process Flow**:
     1. Scheduled job runs daily via `node-cron`
     2. For each SSL monitor, connects to domain using TLS
     3. Extracts certificate details including expiration date
     4. Compares current date with expiration to determine remaining days
     5. If within threshold, triggers notifications

3. **Domain Name Monitoring**:
   - **Implementation**: Uses `whois` package to retrieve domain registration information
   - **Parsing**: Custom regex patterns to extract expiration dates from various WHOIS formats
   - **Storage**: Saved in `domainNameCheckModel.js` with calculated days remaining
   - **Process Flow**:
     1. Daily cron job retrieves all domain monitors
     2. For each domain, performs WHOIS lookup
     3. Parses response with regex to extract expiration date
     4. Calculates days remaining and stores result
     5. Triggers notifications based on configurable thresholds

4. **Response Time Tracking**:
   - **Implementation**: Performance measurement using Node.js `performance.now()` and request timing
   - **Data Collection**: Records response time with each availability check
   - **Storage**: Time-series data in `responseTimeModel.js`
   - **Analysis**: Statistical calculations including percentiles and rolling averages
   - **Process Flow**:
     1. During availability check, measures request duration
     2. Stores measurement with timestamp and monitor reference
     3. Background job calculates statistics on collected data
     4. Analytics tab visualizes time-series data using Chart.js with time-based X-axis

### Authentication System

1. **User Registration**:
   - **Implementation**: Express routes with async handlers and Mongoose
   - **Password Security**: bcryptjs for hashing with 10 salt rounds
   - **Email Verification**: Generates secure random token stored in `tokenModel.js`
   - **Process Flow**:
     1. Validates input using custom middleware
     2. Checks for existing users to prevent duplicates
     3. Hashes password using bcryptjs
     4. Creates user document in MongoDB
     5. Generates verification token and sends email
     6. Returns success response without sensitive data

2. **Login System**:
   - **Implementation**: JWT-based authentication with refresh tokens
   - **Token Management**: Access tokens (15 min) and refresh tokens (7 days)
   - **Security**: HTTP-only cookies for token storage with secure flag in production
   - **Process Flow**:
     1. Validates credentials against stored hash
     2. Generates JWT tokens with user ID payload
     3. Sets HTTP-only cookies with appropriate expiration
     4. Returns user data and success status
     5. Implements automatic token refresh mechanism

### Slack Integration System (Featured Integration)

1. **Integration Setup**:
   - **Implementation**: Dedicated UI for adding and managing Slack webhooks
   - **Webhook Verification**: Tests webhook validity before saving
   - **Storage**: Persists in `slackIntegrationModel.js`
   - **Process Flow**:
     1. User enters Slack webhook URL and channel name
     2. System validates webhook by sending test message
     3. On successful test, integration is saved to database
     4. User can test or remove integrations after setup

2. **Alert Delivery**:
   - **Implementation**: HTTP POST requests to webhook URLs
   - **Message Formatting**: Customized messages based on alert type
   - **Delivery Logic**: Checks for active integrations before sending
   - **Process Flow**:
     1. When incident is detected or resolved, alert is triggered
     2. System retrieves Slack integration for the affected monitor
     3. If integration exists, formatted message is sent to Slack
     4. Error handling captures and logs any delivery failures

3. **Robust Error Handling**:
   - **Retry Logic**: Implements exponential backoff for failed deliveries
   - **Logging**: Comprehensive error logging for debugging
   - **Validation**: Pre-checks webhook URL format and reachability
   - **Implementation Example**:
     ```javascript
     try {
       // Test the webhook by sending a test message
       await axios.post(webhookUrl, {
         text: `🔔 UptimeDock has been successfully connected to this channel. You will receive notifications here for your monitoring alerts.`,
       });
     } catch (error) {
       return res.status(400).json({ 
         message: 'Failed to send test message to Slack. Please verify your webhook URL.' 
       });
     }
     ```

### State Management

1. **Redux Implementation**:
   - **Core Structure**: Redux Toolkit with slice pattern
   - **API Integration**: createAsyncThunk for handling async operations
   - **Reducers**: Organized by feature with standardized loading/error states
   - **Implementation Details**:
     ```javascript
     // Example slice pattern used throughout the application
     export const monitorSlice = createSlice({
       name: "monitor",
       initialState,
       reducers: {
         reset: (state) => initialState,
       },
       extraReducers: (builder) => {
         builder
           .addCase(getMonitors.pending, (state) => {
             state.isLoading = true;
           })
           .addCase(getMonitors.fulfilled, (state, action) => {
             state.isLoading = false;
             state.isSuccess = true;
             state.monitors = action.payload;
           })
           .addCase(getMonitors.rejected, (state, action) => {
             state.isLoading = false;
             state.isError = true;
             state.message = action.payload;
           })
       },
     });
     ```

2. **Data Flow**:
   - **HTTP Client**: axios with interceptors for token handling
   - **Caching Strategy**: Local Redux state with configurable polling intervals
   - **Implementation Details**:
     ```javascript
     // Example of polling implementation in React component
     useEffect(() => {
       dispatch(getMonitors());
       
       // Poll every 30 seconds for fresh data
       const pollInterval = setInterval(() => {
         dispatch(getMonitors());
       }, 30000);
       
       return () => clearInterval(pollInterval);
     }, [dispatch]);
     ```

### API Structure

1. **RESTful Endpoints**:
   - **Framework**: Express.js with express-async-handler (v1.2.0) for error handling
   - **Authentication**: Custom middleware using JWT verification
   - **Error Handling**: Centralized error handler middleware with appropriate status codes
   - **Implementation Example**:
     ```javascript
     // Route implementation pattern for Slack integration
     router.post("/slack", protect, createSlackIntegration);
     router.get("/team/:teamId", protect, getTeamIntegrations);
     router.post("/slack/:integrationId/test", protect, testSlackIntegration);
     router.delete("/slack/:integrationId", protect, deleteSlackIntegration);
     ```

2. **Security Middleware**:
   - **CORS**: Implemented using cors (v2.8.5) package with whitelist approach
   - **Request Parsing**: Body parsing with size limits and type restrictions
   - **Implementation Example**:
     ```javascript
     // CORS configuration
     app.use(cors({
       origin: ["http://localhost:5173", "https://upguard.onrender.com"],
       credentials: true,
     }));
     ```

## Database Schema

The MongoDB database includes the following key collections with detailed schema implementation:

1. **Users**:
   ```javascript
   const UserSchema = new mongoose.Schema(
     {
       firstName: { type: String, required: true },
       lastName: { type: String, required: true },
       email: { type: String, required: true, unique: true },
       password: { type: String, required: true },
       isVerified: { type: Boolean, default: false },
     },
     { timestamps: true }
   );
   ```

2. **Monitors**:
   ```javascript
   const MonitorSchema = new mongoose.Schema(
     {
       url: { type: String, required: true },
       user: { type: Schema.Types.ObjectId, ref: "User", required: true },
       active: { type: Boolean, default: true },
       availability: { type: Boolean, default: true },
       lastIncidentAt: { type: Date, default: Date.now },
       alertEmails: { type: Array },
       alertsTriggeredOn: { type: Number, default: 1 },
       lastError: { type: String, default: null }
     },
     { timestamps: true }
   );
   ```

3. **Incidents**:
   ```javascript
   const IncidentSchema = new mongoose.Schema(
     {
       monitor: { type: Schema.Types.ObjectId, ref: "Monitor", required: true },
       status: { type: String, default: "ongoing" },
       startedAt: { type: Date, default: Date.now },
       resolvedAt: { type: Date },
       duration: { type: Number },
       errorMessage: { type: String }
     },
     { timestamps: true }
   );
   ```

4. **SSLChecks**:
   ```javascript
   const SSLCheckSchema = new mongoose.Schema(
     {
       monitor: { type: Schema.Types.ObjectId, ref: "Monitor", required: true },
       validFrom: { type: Date, required: true },
       validTo: { type: Date, required: true },
       issuer: { type: String },
       daysRemaining: { type: Number },
       lastChecked: { type: Date, default: Date.now }
     },
     { timestamps: true }
   );
   ```

5. **DomainNameChecks**:
   ```javascript
   const DomainNameCheckSchema = new mongoose.Schema(
     {
       monitor: { type: Schema.Types.ObjectId, ref: "Monitor", required: true },
       expiryDate: { type: Date, required: true },
       daysRemaining: { type: Number },
       notificationDays: { type: Number, default: 30 } // notification days before expiry
     },
     { timestamps: true }
   );
   ```

6. **ResponseTimes**:
   ```javascript
   const ResponseTimeSchema = new mongoose.Schema(
     {
       monitor: { type: Schema.Types.ObjectId, ref: "Monitor", required: true },
       responseTime: { type: Number, required: true }, // in milliseconds
       timestamp: { type: Date, default: Date.now }
     },
     { timestamps: true }
   );
   ```

7. **SlackIntegrations**:
   ```javascript
   const SlackIntegrationSchema = new mongoose.Schema(
     {
       webhookUrl: { type: String, required: true },
       channelName: { type: String },
       createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
       isActive: { type: Boolean, default: true }
     },
     { timestamps: true }
   );
   ```

## Integration Capabilities

1. **Slack Integration** (Featured Integration):
   - **Implementation**: HTTP POST requests to Slack Webhook URLs
   - **Message Formatting**: JSON payloads with custom formatting using Slack's Block Kit
   - **Error Handling**: Retry mechanism with exponential backoff
   - **Management UI**: Dedicated page for adding, testing, and removing integrations
   - **Custom Alert Types**: Different message formats for different alert types
   - **Implementation Example**:
     ```javascript
     const sendSlackNotification = async (id, message) => {
       try {
         const integration = await SlackIntegration.findOne({ 
           _id: id, 
           isActive: true 
         });
         
         if (!integration) return false;
         
         const response = await axios.post(integration.webhookUrl, {
           text: message,
           blocks: [
             {
               type: "section",
               text: {
                 type: "mrkdwn",
                 text: message
               }
             }
           ]
         });
         
         return true;
       } catch (error) {
         console.error('Error sending Slack notification:', error);
         return false;
       }
     };
     ```

2. **Email Notifications**:
   - **Implementation**: nodemailer with SMTP or SendGrid API
   - **Templating**: Handlebars for email template rendering
   - **Delivery Tracking**: Logging of email dispatch status
   - **Implementation Example**:
     ```javascript
     const sendEmail = async (to, subject, template, context) => {
       // Compile email template with Handlebars
       const source = fs.readFileSync(
         path.join(__dirname, `../views/${template}.handlebars`),
         'utf8'
       );
       const compiledTemplate = handlebars.compile(source);
       
       // Set up transporter - SendGrid or SMTP
       const transporter = nodemailer.createTransport({
         service: process.env.EMAIL_SERVICE,
         auth: {
           user: process.env.EMAIL_USERNAME,
           pass: process.env.EMAIL_PASSWORD,
         },
       });
       
       // Send email
       await transporter.sendMail({
         from: `"UptimeDock" <${process.env.EMAIL_FROM}>`,
         to,
         subject,
         html: compiledTemplate(context),
       });
     };
     ```

## Development and Deployment Workflow

1. **Local Development**:
   - **Frontend**: Vite dev server with hot module replacement
   - **Backend**: Nodemon for automatic restarts during development
   - **Environment Management**: dotenv (v16.4.7) for configuration
   - **Setup Commands**:
     ```bash
     # Backend setup
     cd api
     npm install
     npm run dev
     
     # Frontend setup
     cd frontend
     npm install
     npm run dev
     ```

2. **Docker Deployment**:
   - **Containerization**: Multi-stage Docker builds for optimization
   - **Orchestration**: Docker Compose for local deployment
   - **Volume Management**: Persistent storage for MongoDB data
   - **Deployment Command**:
     ```bash
     docker-compose up --build
     ```
   - **Docker Compose Implementation**:
     ```yaml
     services:
       backend:
         build: ./backend
         image: upguard-backend
         container_name: backend-container
         ports:
           - "5000:5000"
         env_file:
           - ./backend/.env
         restart: unless-stopped

       frontend:
         build: ./frontend
         image: upguard-frontend
         container_name: frontend-container
         ports:
           - "5173:5173"
         restart: unless-stopped
         depends_on:
           - backend
     ```

## User Interface Design

1. **Dashboard**:
   - **Implementation**: React components with Redux data
   - **Status Visualization**: Color-coded indicators (green for up, red for down)
   - **Auto-Refresh**: Polling mechanism with 30-second intervals
   - **Implementation Example**:
     ```jsx
     // Monitor status display pattern
     <div className={styles.monitor_status}>
       <span className={monitor.availability ? styles.online : styles.offline}>
         {monitor.availability ? "Online" : "Offline"}
       </span>
     </div>
     ```

2. **Monitor Details**:
   - **Charts**: Chart.js with time-based data visualization
   - **Historical Data**: Time-series display with customizable ranges
   - **Event Timeline**: Chronological incident display
   - **Implementation Example**:
     ```jsx
     // Response time chart implementation
     <Line
       data={{
         labels: responseTimeDates,
         datasets: [{
           label: 'Response Time (ms)',
           data: responseTimeValues,
           borderColor: 'rgba(75, 192, 192, 1)',
           fill: false,
         }]
       }}
       options={{
         scales: {
           x: {
             type: 'time',
             time: {
               unit: 'hour',
               displayFormats: { hour: 'MMM D, HH:mm' }
             },
             adapters: { date: dateFnsAdapter }
           }
         },
         plugins: {
           annotation: {
             annotations: {
               threshold: {
                 type: 'line',
                 yMin: slowThreshold,
                 yMax: slowThreshold,
                 borderColor: 'rgb(255, 99, 132)',
                 borderWidth: 2,
               }
             }
           }
         }
       }}
     />
     ```

3. **Analytics**:
   - **Dashboard**: Summary metrics with visual indicators
   - **Response Time Analysis**: Dedicated section showing response time trends across all monitors
   - **Performance Metrics**: Statistical analysis including min, max, average, and percentile calculations
   - **Charts**: Multiple chart types (line, bar, doughnut) for visualizing performance data
   - **Filtering**: Date range selectors and category filters
   - **Implementation Example**:
     ```jsx
     // Uptime percentage visualization
     <Doughnut
       data={{
         labels: ['Uptime', 'Downtime'],
         datasets: [{
           data: [uptimePercentage, 100 - uptimePercentage],
           backgroundColor: ['#4caf50', '#f44336'],
           borderWidth: 0
         }]
       }}
       options={{
         cutout: '70%',
         plugins: {
           datalabels: {
             formatter: (value) => value.toFixed(2) + '%',
             color: '#fff',
             font: { weight: 'bold' }
           }
         }
       }}
     />
     ```
   - **Response Time Analysis Implementation**:
     ```jsx
     // Response time comparison chart for multiple monitors
     <Bar
       data={{
         labels: monitorNames,
         datasets: [{
           label: 'Average Response Time (ms)',
           data: avgResponseTimes,
           backgroundColor: 'rgba(54, 162, 235, 0.5)',
           borderColor: 'rgba(54, 162, 235, 1)',
           borderWidth: 1
         }, {
           label: '90th Percentile (ms)',
           data: percentile90Times,
           backgroundColor: 'rgba(255, 99, 132, 0.5)',
           borderColor: 'rgba(255, 99, 132, 1)',
           borderWidth: 1
         }]
       }}
       options={{
         scales: {
           y: {
             beginAtZero: true,
             title: {
               display: true,
               text: 'Response Time (ms)'
             }
           }
         },
         plugins: {
           tooltip: {
             callbacks: {
               afterLabel: function(context) {
                 const monitorIndex = context.dataIndex;
                 return `Min: ${minResponseTimes[monitorIndex]}ms, Max: ${maxResponseTimes[monitorIndex]}ms`;
               }
             }
           }
         }
       }}
     />
     ```

4. **Integrations Page** (Featured UI):
   - **Implementation**: Dedicated UI for managing Slack integrations
   - **Features**: Add, test, and remove Slack webhooks
   - **Error Handling**: Validation and error reporting for webhook setup
   - **User-Friendly Interface**: Clear instructions and visual feedback
   - **Implementation Example**:
     ```jsx
     // Slack integration card
     <div className={styles.integrations__card}>
       <div className={styles.content}>
         <div className={styles.logo}>
           <img src={slackIcon} alt="slack" />
         </div>
         <div className={styles.text}>
           <h5>Slack</h5>
           <p>Channel: {integration.channelName}</p>
           <p className={styles.status}>
             Status: <span className={integration.isEnabled ? styles.active : styles.inactive}>
               {integration.isEnabled ? "Active" : "Disabled"}
             </span>
           </p>
         </div>
       </div>
       <div className={styles.actions}>
         <button 
           onClick={() => testIntegration(integration._id)}
           className={styles.testButton}
         >
           Test
         </button>
         <button 
           onClick={() => deleteIntegration(integration._id)}
           className={styles.deleteButton}
         >
           Remove
         </button>
       </div>
     </div>
     ```

5. **Responsive Design**:
   - **Implementation**: CSS Modules with SASS for component-scoped styling
   - **Grid System**: Custom CSS Grid and Flexbox layouts
   - **Media Queries**: Breakpoints for mobile, tablet, and desktop
   - **Implementation Example**:
     ```scss
     // Responsive grid implementation example
     .monitors {
       display: grid;
       grid-template-columns: repeat(1, 1fr);
       gap: 20px;
       
       @media (min-width: 768px) {
         grid-template-columns: repeat(2, 1fr);
       }
       
       @media (min-width: 1200px) {
         grid-template-columns: repeat(3, 1fr);
       }
     }
     ```

## Conclusion

UptimeDock is a comprehensive website monitoring solution with robust features for tracking website availability, performance, and security certificates. The application's standout feature is its Slack integration, which provides real-time alerts about incidents, delivering immediate notifications when monitored services experience issues. This integration is fully customizable, with a dedicated UI for managing webhook connections, and supports testing to ensure reliable alert delivery. The combination of seamless Slack notifications with detailed monitoring capabilities makes UptimeDock an indispensable tool for maintaining website reliability and quickly responding to downtime events. 