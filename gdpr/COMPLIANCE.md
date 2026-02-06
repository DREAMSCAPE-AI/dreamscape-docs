# GDPR Compliance Registry

**Document Type**: Data Processing Registry (Article 30 GDPR)
**Version**: 1.0
**Last Updated**: 2025-01-15
**Next Review**: 2026-01-15

## Registre des Traitements (Data Processing Registry)

### Organization Information

| Field | Value |
|-------|-------|
| Service Name | DreamScape Travel Platform |
| Data Controller | DreamScape SAS |
| Business Address | 123 Avenue des Champs-Élysées, 75008 Paris, France |
| DPO Contact | dpo@dreamscape.ai |
| DPO Phone | +33 1 XX XX XX XX |
| Registration Number | SIRET: XXX XXX XXX XXXXX |
| Supervisory Authority | CNIL (Commission Nationale de l'Informatique et des Libertés) |

## Données Collectées (Data Processing Activities)

### 1. User Identity Data

| Attribute | Details |
|-----------|---------|
| **Data Category** | User Identity |
| **Data Elements** | Name, email address, phone number, profile avatar, date of birth, nationality |
| **Purpose** | User account management, service execution, authentication |
| **Legal Basis** | Contract (Article 6(1)(b) GDPR) - Necessary for service delivery |
| **Retention Period** | Account lifetime + 30 days after deletion request |
| **Storage Location** | PostgreSQL `dreamscape` database (EU region) |
| **Database Models** | `User`, `UserProfile` |
| **Processing Services** | auth-service, user-service |
| **Access Control** | Role-based access, JWT authentication required |

### 2. Travel Preferences and Onboarding Data

| Attribute | Details |
|-----------|---------|
| **Data Category** | Travel Preferences |
| **Data Elements** | Preferred destinations, budget ranges, travel types (adventure/luxury/family), accommodation preferences, dietary restrictions, accessibility needs, travel pace, sustainability preferences |
| **Purpose** | Service personalization, AI-driven recommendations, user experience optimization |
| **Legal Basis** | Legitimate interest (Article 6(1)(f) GDPR) - Enhancing user experience |
| **Retention Period** | Account lifetime (editable by user) |
| **Storage Location** | PostgreSQL `dreamscape` database |
| **Database Models** | `TravelOnboardingProfile`, `UserPreferences` |
| **Processing Services** | user-service, ai-service |
| **Access Control** | User can view/edit at any time via settings |

### 3. Search and Browsing History

| Attribute | Details |
|-----------|---------|
| **Data Category** | Search History and User Behavior |
| **Data Elements** | Search queries, filters applied, clicked results, viewed destinations, page views, session duration, interaction patterns |
| **Purpose** | Analytics, AI recommendations, service improvement, fraud detection |
| **Legal Basis** | Consent (Article 6(1)(a) GDPR) - User must opt-in for analytics |
| **Retention Period** | 2 years from last activity, or until consent withdrawal |
| **Storage Location** | PostgreSQL `dreamscape` database, Redis cache (temporary) |
| **Database Models** | `SearchHistory`, `UserHistory`, `UserBehavior` |
| **Processing Services** | voyage-service, ai-service, user-service |
| **Access Control** | User can view and delete via privacy dashboard |

### 4. Payment and Transaction Data

| Attribute | Details |
|-----------|---------|
| **Data Category** | Payment Information |
| **Data Elements** | Transaction IDs, amounts, currency, payment method (tokenized), billing address, Stripe customer ID, invoice data |
| **Purpose** | Payment processing, transaction records, invoicing, refunds, legal compliance |
| **Legal Basis** | Contract (Article 6(1)(b) GDPR) + Legal obligation (Article 6(1)(c) GDPR) - Tax and accounting laws |
| **Retention Period** | 5 years from transaction date (French accounting law requirement) |
| **Storage Location** | PostgreSQL `dreamscape` database; Card data stored by Stripe (PCI-DSS compliant, not stored by DreamScape) |
| **Database Models** | `PaymentTransaction`, `ProcessedWebhookEvent` |
| **Processing Services** | payment-service |
| **Third-Party Processors** | Stripe (Data Processing Agreement in place) |
| **Access Control** | Encrypted storage, admin-only access, audit logging required |

### 5. Booking and Travel Data

| Attribute | Details |
|-----------|---------|
| **Data Category** | Booking and Itinerary Data |
| **Data Elements** | Flight bookings, hotel reservations, itineraries, traveler details (passport info if required), trip dates, destinations |
| **Purpose** | Service delivery, booking management, trip planning |
| **Legal Basis** | Contract (Article 6(1)(b) GDPR) - Fulfillment of service |
| **Retention Period** | 3 years after trip completion (customer service, disputes) |
| **Storage Location** | PostgreSQL `dreamscape` database |
| **Database Models** | `BookingData`, `FlightData`, `HotelData`, `Itinerary`, `ItineraryItem`, `CartData`, `CartItem` |
| **Processing Services** | voyage-service |
| **Third-Party Processors** | Amadeus API (flight/hotel data), OpenAI (itinerary generation) |
| **Access Control** | User owns data, can export/delete via data portability tools |

### 6. Location and Device Data

| Attribute | Details |
|-----------|---------|
| **Data Category** | Location and Technical Data |
| **Data Elements** | IP address, device type, browser info, operating system, geolocation (if granted), cookies, session tokens |
| **Purpose** | Security, fraud detection, UX improvement, location-based search results |
| **Legal Basis** | Consent (Article 6(1)(a) GDPR) for geolocation; Legitimate interest (Article 6(1)(f) GDPR) for security |
| **Retention Period** | 1 year for analytics; 90 days for security logs |
| **Storage Location** | PostgreSQL `dreamscape` database, Redis cache |
| **Database Models** | `UserBehavior`, `DataAccessLog`, `Session` |
| **Processing Services** | All services (logging), user-service |
| **Access Control** | Encrypted logs, admin-only access |

### 7. Cookie and Consent Data

| Attribute | Details |
|-----------|---------|
| **Data Category** | Consent and Cookie Management |
| **Data Elements** | Consent status (analytics, marketing, functional), cookie preferences, consent timestamps, IP address at consent |
| **Purpose** | GDPR compliance, cookie consent management, audit trail |
| **Legal Basis** | Legal obligation (Article 6(1)(c) GDPR) - GDPR Article 7 compliance |
| **Retention Period** | 3 years (proof of consent) |
| **Storage Location** | PostgreSQL `dreamscape` database, localStorage (client-side) |
| **Database Models** | `UserConsent`, `ConsentHistory` |
| **Processing Services** | user-service |
| **Access Control** | User can view and modify via cookie settings banner |

### 8. AI and ML Processing Data

| Attribute | Details |
|-----------|---------|
| **Data Category** | AI/ML Vectors and Recommendations |
| **Data Elements** | User preference vectors, item similarity vectors, recommendation scores, prediction data, model analytics |
| **Purpose** | AI-driven recommendations, personalization, service improvement |
| **Legal Basis** | Legitimate interest (Article 6(1)(f) GDPR) - Service enhancement with opt-out available |
| **Retention Period** | Account lifetime; anonymized after account deletion |
| **Storage Location** | PostgreSQL `dreamscape` database |
| **Database Models** | `UserVector`, `ItemVector`, `Recommendation`, `PredictionData`, `Analytics` |
| **Processing Services** | ai-service |
| **Third-Party Processors** | OpenAI API (Data Processing Agreement in place) |
| **Access Control** | User can opt-out of AI recommendations via settings |

## Mesures Techniques et Organisationnelles (Technical and Organizational Measures)

### 1. Encryption

| Layer | Implementation |
|-------|----------------|
| **Transport Security** | HTTPS with TLS 1.3 for all client-server communication |
| **Password Storage** | bcrypt with salt rounds (cost factor 12) |
| **Authentication** | JWT tokens with HS256 signing, 7-day expiration |
| **Database** | PostgreSQL with encrypted connections (SSL/TLS) |
| **Backups** | AES-256 encrypted backups stored in secure EU region |

### 2. Access Control

| Control Type | Implementation |
|--------------|----------------|
| **Authentication** | JWT-based authentication with token blacklist for revocation |
| **Authorization** | Role-based access control (RBAC) per service |
| **Service Communication** | API Gateway with JWT validation middleware |
| **Database Access** | Principle of least privilege, service-specific credentials |
| **Admin Access** | Multi-factor authentication (MFA) required for admin roles |
| **API Rate Limiting** | Redis-backed rate limiting to prevent abuse |

### 3. Audit Logging

| Log Type | Details |
|----------|---------|
| **Data Access Logs** | All data access logged to `DataAccessLog` model with timestamp, user ID, resource accessed |
| **Consent Changes** | All consent modifications logged to `ConsentHistory` |
| **Authentication Events** | Login attempts, token generation, session creation logged |
| **Admin Actions** | All administrative actions logged with user ID and action type |
| **Data Export/Deletion** | All GDPR requests logged to `DataRequestLog` |
| **Audit Middleware** | Express middleware `auditLogger` logs all API requests |
| **Retention** | Audit logs retained for 3 years |

### 4. Data Minimization

| Principle | Implementation |
|-----------|----------------|
| **Collection** | Only collect data necessary for stated purposes |
| **Forms** | Optional fields clearly marked; no hidden data collection |
| **Third Parties** | Share only minimum data required with external processors |
| **Anonymization** | Analytics data anonymized after 2 years |
| **Deletion** | Automated data deletion workflows when retention periods expire |

### 5. Pseudonymization

| Data Type | Method |
|-----------|--------|
| **User IDs** | UUIDs (v4) instead of sequential integers |
| **Transaction IDs** | Random UUIDs to prevent enumeration |
| **Session Tokens** | Cryptographically secure random tokens |
| **Analytics** | IP addresses hashed for analytics after 90 days |
| **Database Keys** | No personally identifiable information in primary keys |

### 6. Incident Response

| Phase | Process |
|-------|---------|
| **Detection** | Automated monitoring, anomaly detection, security alerts |
| **Assessment** | Severity classification within 1 hour of detection |
| **Containment** | Immediate isolation of affected systems |
| **Notification** | Users notified within 72 hours if high-risk breach (Article 33 GDPR) |
| **Supervisory Authority** | CNIL notified within 72 hours if required (Article 33 GDPR) |
| **Documentation** | All incidents logged in security incident register |

## Droits des Utilisateurs (User Rights Implementation)

### Article 15: Right of Access

**Implementation**:
- **Endpoint**: `GET /api/v1/user/consent` - View all consent records
- **Endpoint**: `GET /api/v1/user/data-requests` - View status of data requests
- **Endpoint**: `GET /api/v1/user/profile` - View personal data
- **Response Time**: Immediate for structured data; within 30 days for full data export
- **Format**: JSON via API, or PDF report via email

### Article 16: Right to Rectification

**Implementation**:
- **Endpoint**: `PUT /api/v1/user/profile` - Update profile information
- **Endpoint**: `PUT /api/v1/user/preferences` - Update travel preferences
- **Endpoint**: `PUT /api/v1/user/consent` - Update consent preferences
- **Validation**: Real-time validation, changes reflected immediately
- **Audit**: All changes logged to `ConsentHistory` and `UserHistory`

### Article 17: Right to Erasure ("Right to be Forgotten")

**Implementation**:
- **Endpoint**: `POST /api/v1/user/data-deletion` - Request account deletion
- **Process**:
  1. User submits deletion request with reason (optional)
  2. Request logged to `DataRequestLog` with status `PENDING`
  3. Payment transactions retained for 5 years (legal obligation override)
  4. Personal data anonymized within 30 days
  5. User notified via email when deletion complete
  6. Status updated to `COMPLETED` in `DataRequestLog`
- **Exceptions**: Legal retention requirements (payment data, tax records)
- **Cascade**: All related data deleted via Prisma `onDelete: Cascade`

### Article 18: Right to Restriction of Processing

**Implementation**:
- **Endpoint**: `PUT /api/v1/user/consent` - Set processing restrictions
- **Options**: Disable analytics, disable AI recommendations, disable marketing
- **Effect**: Services respect `UserConsent` flags; restricted data not processed
- **Audit**: Restriction events logged to `ConsentHistory`

### Article 20: Right to Data Portability

**Implementation**:
- **Endpoint**: `POST /api/v1/user/data-export` - Request data export
- **Format**: JSON (machine-readable), includes all user data
- **Delivery**: Download link sent via email (expires in 7 days)
- **Contents**: Profile, preferences, search history, bookings, consents, recommendations
- **Response Time**: Generated within 24 hours
- **Status Tracking**: Request status in `DataRequestLog`

### Article 21: Right to Object

**Implementation**:
- **Endpoint**: `PUT /api/v1/user/consent` - Object to specific processing
- **Granular Controls**:
  - Object to analytics: Set `analytics` consent to `false`
  - Object to marketing: Set `marketing` consent to `false`
  - Object to AI recommendations: Set `aiRecommendations` consent to `false`
- **Effect**: Services check consent before processing; objected activities immediately stopped
- **Notice**: Users informed of consequences (e.g., less personalized experience)

### Article 22: Automated Decision-Making

**Implementation**:
- **AI Recommendations**: Users can opt-out via `aiRecommendations` consent flag
- **Transparency**: Explanation provided for how recommendations are generated
- **Human Review**: Users can request human review of AI-generated itineraries
- **No Critical Decisions**: No automated decisions with legal/significant effects without human intervention

## API Endpoints - GDPR Compliance

### User Consent Management

| Method | Endpoint | Description | Response Time |
|--------|----------|-------------|---------------|
| `GET` | `/api/v1/user/consent` | Retrieve current consent settings | < 1 second |
| `PUT` | `/api/v1/user/consent` | Update consent preferences | < 1 second |
| `GET` | `/api/v1/user/consent/history` | View consent change history | < 1 second |

### Data Access and Portability

| Method | Endpoint | Description | Response Time |
|--------|----------|-------------|---------------|
| `GET` | `/api/v1/user/profile` | Access personal data | < 1 second |
| `GET` | `/api/v1/user/preferences` | Access travel preferences | < 1 second |
| `GET` | `/api/v1/user/history` | Access activity history | < 2 seconds |
| `POST` | `/api/v1/user/data-export` | Request full data export (Article 20) | 24 hours |

### Data Rectification

| Method | Endpoint | Description | Response Time |
|--------|----------|-------------|---------------|
| `PUT` | `/api/v1/user/profile` | Update personal information | < 1 second |
| `PUT` | `/api/v1/user/preferences` | Update travel preferences | < 1 second |
| `PUT` | `/api/v1/user/settings` | Update account settings | < 1 second |

### Data Deletion and Restriction

| Method | Endpoint | Description | Response Time |
|--------|----------|-------------|---------------|
| `POST` | `/api/v1/user/data-deletion` | Request account deletion (Article 17) | 30 days |
| `DELETE` | `/api/v1/user/history` | Delete browsing history | < 2 seconds |
| `DELETE` | `/api/v1/user/search-history` | Delete search history | < 2 seconds |

### Data Request Tracking

| Method | Endpoint | Description | Response Time |
|--------|----------|-------------|---------------|
| `GET` | `/api/v1/user/data-requests` | View status of data requests | < 1 second |
| `GET` | `/api/v1/user/data-requests/:id` | View specific request details | < 1 second |

## Data Processors and Sub-Processors

### Third-Party Services

| Service | Purpose | Data Shared | DPA in Place | Location |
|---------|---------|-------------|--------------|----------|
| **Stripe** | Payment processing | Transaction amounts, billing address, tokenized card data | Yes | EU/US (adequate safeguards) |
| **Amadeus** | Flight/hotel search | Search queries, destinations, dates (no personal identifiers) | Yes | EU |
| **OpenAI** | AI recommendations, itinerary generation | Anonymized travel preferences, search patterns | Yes | US (Standard Contractual Clauses) |
| **Mapbox** | Map rendering | Geolocation (if granted), map interactions | Yes | US (Standard Contractual Clauses) |
| **AWS** | Infrastructure hosting | All platform data (encrypted at rest) | Yes | EU (Frankfurt region) |
| **SendGrid** | Email delivery | Email addresses, user names | Yes | US (Standard Contractual Clauses) |

### International Transfers

**Mechanism**: EU Standard Contractual Clauses (SCCs) approved by European Commission Decision 2021/914.

**US Transfers**: Following Schrems II decision, additional safeguards implemented:
- Encryption in transit and at rest
- Access controls and audit logging
- Contractual restrictions on government access
- Regular compliance audits

**Data Localization**: Primary data storage in EU region (AWS Frankfurt); backups in EU-only regions.

## Data Breach Notification Procedure

### Detection and Assessment (0-1 hour)

1. Security monitoring detects potential breach
2. Incident response team activated
3. Severity assessment: Low / Medium / High / Critical
4. Affected data categories and users identified

### Containment (1-6 hours)

1. Isolate affected systems
2. Prevent further unauthorized access
3. Preserve evidence for investigation
4. Document all actions taken

### Notification (within 72 hours)

**Supervisory Authority (CNIL)**:
- Notify within 72 hours if high risk to user rights (Article 33 GDPR)
- Include: nature of breach, categories/number of users affected, consequences, measures taken

**Affected Users**:
- Notify without undue delay if high risk to rights and freedoms (Article 34 GDPR)
- Include: description of breach, contact point, likely consequences, measures taken/recommended

**Internal Documentation**:
- All breaches documented in security incident register
- Root cause analysis conducted
- Preventive measures implemented

## Data Retention Schedule

| Data Category | Retention Period | Deletion Method |
|---------------|------------------|-----------------|
| User account data | Account lifetime + 30 days | Hard delete from database |
| Travel preferences | Account lifetime | Hard delete from database |
| Search history | 2 years or consent withdrawal | Hard delete from database |
| Booking data | 3 years after trip completion | Anonymization, then deletion |
| Payment transactions | 5 years (legal requirement) | Anonymization after legal period |
| Consent records | 3 years (proof requirement) | Hard delete after 3 years |
| Audit logs | 3 years | Secure deletion |
| Session data | 7 days (JWT expiration) or logout | Hard delete from Redis/DB |
| Backups | 90 days | Encrypted deletion |

## Regular Compliance Reviews

| Activity | Frequency | Responsible |
|----------|-----------|-------------|
| Data Processing Registry update | Quarterly | DPO |
| Privacy Policy review | Annually | Legal + DPO |
| Third-party DPA audit | Annually | DPO + Procurement |
| Security audit | Bi-annually | Security Team |
| Staff GDPR training | Annually | HR + DPO |
| Data retention cleanup | Monthly (automated) | Engineering |
| Consent mechanism testing | Quarterly | Engineering + DPO |

## Contact Information

**Data Protection Officer (DPO)**:
- Email: dpo@dreamscape.ai
- Phone: +33 1 XX XX XX XX
- Postal: DreamScape SAS, 123 Avenue des Champs-Élysées, 75008 Paris, France

**Supervisory Authority**:
- CNIL (Commission Nationale de l'Informatique et des Libertés)
- Address: 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07, France
- Website: https://www.cnil.fr
- Phone: +33 1 53 73 22 22

## Document History

| Version | Date | Changes | Approved By |
|---------|------|---------|-------------|
| 1.0 | 2025-01-15 | Initial GDPR compliance registry | DPO |

---

**Next Review Date**: 2026-01-15
**Document Owner**: Data Protection Officer (DPO)
**Classification**: Internal - Compliance Documentation
