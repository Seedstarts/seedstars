SEEDSTARS – Centre of Excellence Website
======================================

Structure
---------
- index.html and service pages (about, homeschooling-nios, human-skills, career-global-education, educator-excellence, reviews, contact)
- admin.html – private content dashboard
- css/style.css
- js/app.js, js/admin.js, js/brand-data.js (embedded brand images)
- images/avenix-logo.png (official Avenix Overseas logo)
- supabase-setup.sql (run once in your Supabase project)

Quick setup
-----------
1. Upload the entire seedstars folder to your host.
2. Run supabase-setup.sql in the Supabase SQL Editor.
3. In Supabase Auth, create user: seedstars.in@gmail.com (with a strong password).
4. Insert that user's UUID into public.admin_profiles (see comments in supabase-setup.sql).
5. Open admin.html and sign in. Use Account → Change password anytime from the panel.

Notes
-----
- Brand logo and director photo are embedded in js/brand-data.js.
- Avenix Overseas logo uses the supplied circular mark; footer links to https://avenixoverseas.com
- Consultation forms submit via Forminit (form ID configured in HTML/JS). On success visitors see a thank-you message only.
- The small “Admin” control appears only on the Reviews page.
- UDYAM registration text has been removed from the public site.
