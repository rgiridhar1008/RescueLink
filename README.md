# RescueLink

## Project Layout
- `backend/rescuelink-backend` (Spring Boot + MySQL)
- `frontend/rescuelink-ui` (React + Bootstrap)

## Prerequisites
- Java 17+
- Maven
- Node.js LTS
- MySQL

## Phase 1: Environment Setup
1. Create DB:
   ```sql
   CREATE DATABASE rescuelink;
   ```
2. Create DB user:
   ```sql
   CREATE USER IF NOT EXISTS 'rescuelink_user'@'localhost' IDENTIFIED BY 'Rescue@123';
   GRANT ALL PRIVILEGES ON rescuelink.* TO 'rescuelink_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

## Phase 2: Run Backend
```bash
cd backend/rescuelink-backend
mvn spring-boot:run
```

Optional environment overrides:
```powershell
$env:DB_URL="jdbc:mysql://localhost:3306/rescuelink?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
$env:DB_USERNAME="rescuelink_user"
$env:DB_PASSWORD="Rescue@123"
```

Core endpoints:
- `POST /auth/register`
- `POST /auth/login`
- `GET /hospitals?city=`
- `GET /donors?bloodGroup=`
- `POST /sos/trigger`
- `POST /admin/hospitals`
- `PUT /admin/hospitals/{id}`
- `DELETE /admin/hospitals/{id}`
- `POST /admin/donors`
- `PUT /admin/donors/{id}/verify?verified=true`
- `GET /admin/alerts`

## Phase 3: Run Frontend
```bash
cd frontend/rescuelink-ui
npm install
npm start
```

App URL:
- `http://localhost:3000`

## Demo Flow
1. Register user
2. Login
3. Open dashboard
4. Trigger SOS
5. Search hospitals
6. Search donors
7. Open admin dashboard (`/admin`) and manage data

## Emergency Access Design
The system allows SOS triggering without user authentication to ensure immediate assistance during critical situations, thereby eliminating delays caused by login procedures.

## Limitations and Future Enhancements
1. Limitation: No real-time ambulance integration  
   Solution: Integrate third-party emergency service APIs or GPS tracking systems in future versions to enable real-time ambulance availability and tracking. Collaboration with local emergency providers can further enhance accuracy.

2. Limitation: Dependence on internet connectivity  
   Solution: Implement an offline emergency mode where SOS can be sent via SMS gateway or stored locally and automatically transmitted once connectivity is restored.

3. Limitation: Limited location accuracy  
   Solution: Use enhanced location services such as Google Maps Geolocation API with fallback options like Wi-Fi positioning and manual map pin selection for improved accuracy.

4. Limitation: No government or hospital database integration  
   Solution: In future deployment, integrate official healthcare databases or public APIs to fetch verified hospital and emergency resource information dynamically.

5. Limitation: Notification simulation only  
   Solution: Integrate real communication services such as Twilio (SMS), SendGrid (email), or Firebase Cloud Messaging to enable actual alerts and push notifications.

6. Limitation: Manual verification of donors  
   Solution: Introduce identity verification using document uploads, medical certificates, or OTP-based verification to ensure authenticity of donor information.

7. Limitation: No robust offline emergency mode  
   Solution: Implement local caching and SMS-based SOS triggers so users can send alerts even without internet access.

8. Limitation: Limited security features  
   Solution: Enhance security by implementing JWT authentication, role-based access control, password hashing (BCrypt), and optional multi-factor authentication.

9. Limitation: Not a replacement for official emergency services  
   Solution: Position the platform as a supplementary support system and integrate direct dial buttons for official emergency helplines (for example, 108) within the app.

10. Limitation: Scalability constraints  
    Solution: Adopt scalable architecture using cloud deployment, load balancing, microservices (future scope), and optimized database indexing.

## Top Limitations With Practical Integration Solutions
1. Problem: Users may not log in during emergencies  
   Solution: Guest SOS mode (implementable now).  
   What to add: SOS button works without login; save SOS with `userId = null`.  
   Integration: Backend allow nullable `userId`; frontend show SOS on home page.

2. Problem: No real notification when SOS is triggered  
   Solution: Email alert integration.  
   What to add: Send email to admin/emergency contacts.  
   Integration: Use Spring Boot Mail Sender; trigger email on SOS API.

3. Problem: Admin cannot prioritize emergencies  
   Solution: SOS status management.  
   What to add: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CRITICAL`.  
   Integration: Add status column in SOS table; admin dropdown to update status.

4. Problem: Hard to find data in admin dashboard  
   Solution: Search and filters.  
   What to add: Search bars for users, hospitals, and SOS.  
   Integration: Backend query methods (`findByName`, `findByStatus`); frontend filter inputs.

5. Problem: No quick overview of system activity  
   Solution: Analytics cards.  
   What to add: Total users, SOS today, active donors, hospitals.  
   Integration: Backend count queries; frontend dashboard cards.

6. Problem: No history tracking for SOS  
   Solution: SOS history section.  
   What to add: Date, location, status.  
   Integration: API such as `/sos/user/{id}` (or equivalent user-specific SOS endpoint) and table UI.

7. Problem: No real-time feel  
   Solution: Auto refresh/polling.  
   Integration: Refresh SOS list every 5 to 10 seconds using React `setInterval`.

8. Problem: Donor authenticity unclear  
   Solution: Verified badge.  
   Integration: Add `verified` boolean and show badge in UI.

9. Problem: Location not always clear  
   Solution: Map preview (optional but easy).  
   Integration: Google Maps iframe and coordinate display.
