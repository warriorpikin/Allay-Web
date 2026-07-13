# Allay House GA4 Setup

This project uses consent-aware Google Analytics 4 tracking on the React frontend and backend-only GA4 Data API reporting for the protected admin Analytics page.

## Environment Variables

Frontend host:

```env
VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_GA4_ENABLED=true
VITE_GA4_DEBUG=false
```

Backend host:

```env
GA4_PROPERTY_ID=123456789
GA4_SERVICE_ACCOUNT_BASE64=
GA4_ANALYTICS_ENABLED=true
GA4_CACHE_TTL_SECONDS=600
GA4_REALTIME_CACHE_TTL_SECONDS=60
```

Alternative backend credential mode:

```env
GA4_CLIENT_EMAIL=
GA4_PRIVATE_KEY=
```

Use `GA4_SERVICE_ACCOUNT_BASE64` for deployments when possible. Base64-encode the full service-account JSON and paste that value into the backend environment only. Do not put service-account JSON files or private keys in the repository, and do not expose them through `VITE_` variables.

After changing frontend variables, rebuild and redeploy the frontend. After changing backend variables, restart or redeploy the backend.

## Google Cloud and GA4 Access

1. Create or choose a Google Cloud project.
2. Enable the Google Analytics Data API.
3. Create a service account.
4. Generate a service-account JSON key.
5. In GA4, open Admin -> Property access management.
6. Add the service-account email with Viewer access.
7. Copy the numeric GA4 property ID into `GA4_PROPERTY_ID`.
8. Encode the JSON key as base64 and set it as `GA4_SERVICE_ACCOUNT_BASE64`, or set `GA4_CLIENT_EMAIL` and `GA4_PRIVATE_KEY`.

## Key Events to Mark

Mark only these as key events in GA4:

```text
booking_complete
generate_lead
```

Do not mark every booking-step or click event as a key event.

## Event-Scoped Custom Dimensions

Create these GA4 event-scoped custom dimensions where reporting needs them. The Event parameter field must exactly match the parameter sent by the code.

```text
service_name
service_slug
service_category
booking_step
result
error_type
source_section
lead_type
link_type
category_name
```

Custom definitions are not retroactive and can take time to appear in reports. The admin Analytics page still renders standard reports without these definitions and shows setup guidance when service dimensions are missing.

## Events Sent by the Site

Service discovery:

```text
view_service
select_service
category_view
service_search
```

Booking journey:

```text
booking_start
booking_step_view
booking_date_selected
booking_time_selected
booking_details_completed
booking_submit
booking_complete
booking_error
```

Waitlist:

```text
waitlist_start
generate_lead
waitlist_error
```

Authentication and contact:

```text
login
sign_up
contact_click
```

The implementation avoids sending names, emails, phone numbers, booking notes, booking references, admin emails, tokens, passwords, database IDs, exact booking date/time, and raw error text to GA4.

## Verification Checklist

1. Accept analytics in the public consent banner.
2. Load the homepage and confirm one page view in DebugView.
3. Navigate to another public route and confirm one route-change page view.
4. Visit a service detail page and confirm `view_service`.
5. Select a service and confirm `select_service`.
6. Begin booking and progress through service, date, time, and details steps.
7. Confirm `booking_complete` fires only after a successful booking API response.
8. Submit a waitlist entry and confirm `generate_lead` fires only after the backend saves it.
9. Reject analytics and confirm new analytics events stop.
10. Visit `/allay-admin` and confirm admin routes are not reported as customer traffic.
11. Inspect event parameters and confirm no personally identifiable information is present.
12. Open the admin Analytics page and confirm standard reports load once backend credentials are configured.
