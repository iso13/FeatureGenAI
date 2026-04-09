--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8
-- Dumped by pg_dump version 16.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: analytics; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.analytics (
    id integer NOT NULL,
    event_type text NOT NULL,
    scenario_count integer,
    successful boolean NOT NULL,
    error_message text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    user_id integer
);


ALTER TABLE public.analytics OWNER TO neondb_owner;

--
-- Name: analytics_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.analytics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.analytics_id_seq OWNER TO neondb_owner;

--
-- Name: analytics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.analytics_id_seq OWNED BY public.analytics.id;


--
-- Name: features; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.features (
    id integer NOT NULL,
    title text NOT NULL,
    story text NOT NULL,
    scenario_count integer NOT NULL,
    generated_content text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    manually_edited boolean DEFAULT false NOT NULL,
    deleted boolean DEFAULT false NOT NULL,
    user_id integer,
    analysis jsonb
);


ALTER TABLE public.features OWNER TO neondb_owner;

--
-- Name: features_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.features_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.features_id_seq OWNER TO neondb_owner;

--
-- Name: features_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.features_id_seq OWNED BY public.features.id;


--
-- Name: session; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.session OWNER TO neondb_owner;

--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    is_admin boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: analytics id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.analytics ALTER COLUMN id SET DEFAULT nextval('public.analytics_id_seq'::regclass);


--
-- Name: features id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.features ALTER COLUMN id SET DEFAULT nextval('public.features_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: analytics; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.analytics (id, event_type, scenario_count, successful, error_message, created_at, user_id) FROM stdin;
1	feature_generation	3	t	\N	2025-03-09 06:21:12.88924	\N
2	feature_generation	3	t	\N	2025-03-09 06:30:46.970917	\N
3	feature_generation	4	t	\N	2025-03-09 06:32:15.846261	\N
4	feature_generation	3	t	\N	2025-03-09 06:51:44.947943	\N
5	feature_generation	2	t	\N	2025-03-09 16:32:08.3057	\N
6	feature_generation	4	t	\N	2025-03-09 16:35:38.216669	\N
7	feature_generation	5	t	\N	2025-03-09 16:51:54.862783	\N
8	feature_generation	3	t	\N	2025-03-09 17:18:20.110836	\N
9	feature_generation	4	t	\N	2025-03-09 17:53:11.497574	\N
10	feature_generation	5	t	\N	2025-03-09 18:01:52.207212	\N
11	feature_generation	10	t	\N	2025-03-09 18:11:42.715759	\N
12	feature_generation	8	t	\N	2025-03-10 05:10:22.867964	\N
13	feature_generation	7	t	\N	2025-03-10 05:44:05.767716	\N
14	feature_generation	4	t	\N	2025-03-10 05:48:28.857825	\N
15	feature_generation	4	t	\N	2025-03-10 05:54:12.329742	\N
16	feature_generation	4	t	\N	2025-03-10 05:59:03.200308	\N
17	feature_generation	4	t	\N	2025-03-10 06:04:44.709772	\N
18	feature_generation	3	t	\N	2025-03-10 06:08:38.689691	\N
19	feature_generation	4	t	\N	2025-03-10 22:54:11.913426	\N
20	feature_generation	3	t	\N	2025-03-10 23:40:58.529991	\N
21	feature_generation	9	t	\N	2025-03-11 01:51:13.402439	\N
22	feature_generation	1	t	\N	2025-03-11 02:18:56.774572	\N
23	feature_generation	7	t	\N	2025-03-11 02:22:42.334367	\N
24	feature_generation	1	t	\N	2025-03-11 02:31:59.108455	\N
25	feature_generation	10	t	\N	2025-03-11 02:36:44.57918	\N
26	feature_generation	6	t	\N	2025-03-11 02:42:39.242638	\N
27	feature_generation	4	t	\N	2025-03-11 02:48:03.089824	\N
28	feature_generation	6	t	\N	2025-03-11 02:50:49.280067	\N
29	feature_generation	8	t	\N	2025-03-11 02:53:50.921199	\N
30	feature_generation	4	t	\N	2025-03-11 04:00:25.482919	\N
31	feature_generation	1	t	\N	2025-03-11 04:05:04.670854	\N
32	feature_generation	4	t	\N	2025-03-11 04:08:41.001755	\N
33	feature_generation	1	t	\N	2025-03-11 04:11:49.140308	\N
34	feature_generation	1	t	\N	2025-03-11 04:15:29.859716	\N
35	feature_generation	3	t	\N	2025-03-11 04:41:04.500774	\N
36	feature_generation	3	t	\N	2025-03-11 12:22:57.351029	\N
37	feature_generation	10	t	\N	2025-03-11 12:27:57.576678	\N
38	feature_generation	1	t	\N	2025-03-11 13:24:44.231979	\N
39	feature_generation	8	t	\N	2025-03-12 14:05:45.443983	\N
40	feature_generation	5	t	\N	2025-03-12 14:12:39.723584	\N
41	feature_generation	6	t	\N	2025-03-12 14:18:42.485545	\N
42	feature_generation	6	t	\N	2025-03-12 14:29:07.855855	\N
43	feature_generation	5	t	\N	2025-03-12 15:41:11.770112	\N
44	feature_generation	4	t	\N	2025-03-15 17:38:07.9	2
45	feature_generation	4	t	\N	2025-03-15 17:46:59.335	2
46	feature_generation	3	t	\N	2025-03-15 17:51:45.814	2
47	feature_generation	4	t	\N	2025-03-15 18:03:43.557	2
48	feature_generation	3	t	\N	2025-03-15 18:14:00.004	2
49	feature_generation	4	t	\N	2025-03-15 18:23:01.79	2
50	feature_view	\N	t	\N	2025-03-15 18:38:20.514	2
51	feature_generation	5	t	\N	2025-03-15 21:54:27.511	2
52	feature_generation	5	t	\N	2025-03-15 22:01:48.2	2
53	feature_generation	4	t	\N	2025-03-15 22:10:45.65	2
54	feature_generation	2	t	\N	2025-03-15 22:17:00.533	2
55	feature_generation	3	t	\N	2025-03-15 22:25:36.41	2
56	feature_generation	3	t	\N	2025-03-15 22:33:36.258	2
57	feature_generation	10	t	\N	2025-03-16 00:37:08.822	2
58	feature_generation	5	t	\N	2025-03-16 00:42:50.168	2
59	feature_generation	6	t	\N	2025-03-16 01:30:37.72	2
60	feature_generation	5	t	\N	2025-03-16 01:34:17.984	2
61	feature_generation	7	t	\N	2025-03-16 01:49:00.279	2
62	feature_generation	4	t	\N	2025-03-16 05:11:11.098	2
63	feature_generation	4	t	\N	2025-03-16 05:11:17.045	2
64	feature_generation	4	t	\N	2025-03-16 05:11:21.43	2
65	feature_generation	4	t	\N	2025-03-16 05:11:23.16	2
66	feature_generation	4	t	\N	2025-03-16 05:11:23.968	2
67	feature_generation	4	t	\N	2025-03-16 05:11:24.954	2
68	feature_generation	4	t	\N	2025-03-16 05:11:30.221	2
69	feature_generation	4	t	\N	2025-03-16 05:11:35.707	2
70	feature_generation	3	t	\N	2025-03-16 05:15:55.557	2
71	feature_generation	4	t	\N	2025-03-16 05:25:22.097	2
72	feature_generation	5	t	\N	2025-03-16 05:33:07.826	2
73	feature_generation	5	t	\N	2025-03-16 05:38:54.73	2
74	feature_generation	6	t	\N	2025-03-16 14:33:15.897	2
75	feature_generation	4	t	\N	2025-03-21 22:24:21.071257	\N
76	feature_generation	6	t	\N	2025-03-21 22:35:31.408	1
77	feature_generation	5	t	\N	2025-03-21 22:44:25.665	1
78	feature_generation	7	t	\N	2025-03-21 22:47:20.618	1
79	feature_generation	8	t	\N	2025-03-21 23:51:32.851938	\N
80	feature_generation	6	t	\N	2025-03-22 04:40:26.514804	\N
81	feature_generation	5	t	\N	2025-03-22 05:29:46.789242	\N
82	feature_generation	5	t	\N	2025-03-22 13:47:07.579361	\N
83	feature_generation	6	t	\N	2025-03-25 18:09:20.510922	\N
84	feature_generation	8	t	\N	2025-03-26 16:45:30.642326	\N
\.


--
-- Data for Name: features; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.features (id, title, story, scenario_count, generated_content, created_at, manually_edited, deleted, user_id, analysis) FROM stdin;
84	Update Status	As a User\nI want to update my daily status\nSo we can track my work	4	@updateStatus\nFeature: Update Status\nAs a User\nI want to update my daily status\nSo we can track my work\n\nScenario: Successfully update status with valid information\n  Given a user has valid credentials\n  When the user submits a status update with valid information\n  Then the status should be updated successfully\n  And the updated status should be visible in the user's profile\n\nScenario: Fail to update status with missing information\n  Given a user has valid credentials\n  When the user submits a status update with missing information\n  Then the status update should be rejected\n  And the user should receive an error message indicating missing information\n\nScenario: Prevent status update when user is not authenticated\n  Given a user is not logged in\n  When the user attempts to update their status\n  Then the status update should be denied\n  And the user should be prompted to log in\n\nScenario: Notify team members of a status update\n  Given a user has successfully updated their status\n  When the status update is completed\n  Then team members should be notified of the new status\n  And the status should be reflected in the team dashboard	2025-03-21 22:24:20.922087	f	f	\N	\N
85	Delete User	As an Admin\nI want to remove users who are no longer at the company\nSo they cannot have access	6	@deleteUser\nFeature: Delete User\nAs an Admin\nI want to remove users who are no longer at the company\nSo they cannot have access\n\nBackground:\n  Given I am logged in as an Admin\n  And I have necessary permissions to manage user accounts\n\nScenario: Successfully delete a user who has left the company\n  When I attempt to delete a user who is no longer employed\n  Then the user should be removed from the system\n  And the user's access should be revoked immediately\n\nScenario: Prevent deletion of an active user\n  When I attempt to delete a user who is still employed\n  Then the system should prevent the deletion\n  And notify me that the user is still active\n\nScenario: Log deletion action for audit purposes\n  When I delete a user\n  Then the deletion action should be recorded in the audit log\n  And the log should include the admin's ID and timestamp\n\nScenario: Notify relevant departments after user deletion\n  When a user is deleted\n  Then the HR and IT departments should be notified\n  And the notification should include the user's details and deletion reason\n\nScenario: Handle deletion of a user with pending tasks\n  When I attempt to delete a user with pending tasks\n  Then the system should prompt to reassign or complete the tasks\n  And prevent deletion until tasks are addressed\n\nScenario: Ensure data retention policies are followed\n  When a user is deleted\n  Then the system should retain the user's data as per company policy\n  And ensure compliance with data retention regulations	2025-03-21 22:35:31.31494	f	f	1	\N
86	Add User	As an Admin\nI want to add users to the system\nSo they can do their work	5	@addUser\nFeature: Add User\nAs an Admin\nI want to add users to the system\nSo they can do their work\n\nBackground:\n  Given I am logged in as an Admin\n  And I have the necessary permissions to manage users\n\nScenario: Successfully add a new user\n  When I add a new user with valid details\n  Then the user should be added to the system\n  And the user should receive a welcome notification\n\nScenario: Prevent adding a user with duplicate email\n  When I attempt to add a user with an email that already exists\n  Then the system should prevent the addition\n  And I should receive a notification about the duplicate email\n\nScenario: Add user with role assignment\n  When I add a new user and assign them a specific role\n  Then the user should be added with the assigned role\n  And they should have access to role-specific features\n\nScenario: Notify admin on successful user addition\n  When a new user is added successfully\n  Then I should receive a confirmation notification\n  And the user should be listed in the user management section\n\nScenario: Validate mandatory fields during user addition\n  When I attempt to add a user without filling mandatory fields\n  Then the system should prevent the addition\n  And I should be informed about the missing mandatory fields	2025-03-21 22:44:25.561603	f	f	1	\N
87	Update User	As an Admin\nI want to update user credentials\nSo they can have an accurate profile	7	@updateUser\nFeature: Update User\nAs an Admin\nI want to update user credentials\nSo they can have an accurate profile\n\nBackground:\n  Given I am logged in as an Admin\n  And I have necessary permissions to update user profiles\n\nScenario: Update user email address\n  When I update the user's email address\n  Then the user's profile should reflect the new email address\n\nScenario: Update user phone number\n  When I update the user's phone number\n  Then the user's profile should display the updated phone number\n\nScenario: Update user role\n  When I change the user's role\n  Then the user should have access to functionalities associated with the new role\n\nScenario: Update user status to inactive\n  When I set the user's status to inactive\n  Then the user should not be able to access the system\n\nScenario: Update user department\n  When I change the user's department\n  Then the user's profile should show the new department\n\nScenario: Update user address\n  When I update the user's address\n  Then the user's profile should reflect the new address\n\nScenario: Update user name\n  When I update the user's name\n  Then the user's profile should display the updated name	2025-03-21 22:47:20.524122	f	f	1	\N
89	Fix Tire	As an Owner of a vehicle\nI should learn how to change a tire\nSo I am not stranded on the roadside	6	@fixTire\nFeature: Fix Tire\nAs an Owner of a vehicle\nI should learn how to change a tire\nSo I am not stranded on the roadside\n\nBackground:\n  Given I have a flat tire\n  And I have a spare tire and necessary tools\n\nScenario: Ensure Safety Before Tire Change\n  When I prepare to change the tire\n  Then I should ensure the vehicle is parked on a stable surface\n  And I should engage the parking brake\n\nScenario: Proper Use of Tools\n  When I use the jack to lift the vehicle\n  Then I should place the jack at the correct lifting point\n  And I should lift the vehicle to a safe height\n\nScenario: Removing the Flat Tire\n  When I loosen the lug nuts\n  Then I should remove the flat tire safely\n  And I should place it aside\n\nScenario: Installing the Spare Tire\n  When I position the spare tire onto the hub\n  Then I should align the holes with the lug bolts\n  And I should hand-tighten the lug nuts\n\nScenario: Securing the Spare Tire\n  When I lower the vehicle back to the ground\n  Then I should tighten the lug nuts in a crisscross pattern\n  And I should ensure they are securely fastened\n\nScenario: Storing Tools and Flat Tire\n  When I finish changing the tire\n  Then I should store the flat tire and tools in the vehicle\n  And I should verify that all items are secured	2025-03-22 04:40:26.453271	f	f	\N	\N
88	Review Genghis Khans History	As a Historian\nI want to research the life of Genghis Khan\nSo I can get a better understanding of his drive for power	8	@reviewGenghisKhansHistory\nFeature: Review Genghis Khans History\nAs a Historian\nI want to research the life of Genghis Khan\nSo I can get a better understanding of his drive for power\n\nBackground:\n  Given I have access to historical archives\n  And I am familiar with the Mongol Empire's timeline\n\nScenario: Analyze Genghis Khan's rise to power\n  When I study the early conquests of Genghis Khan\n  Then I should understand the strategic decisions that led to his rise\n\nScenario: Evaluate the impact of Genghis Khan's leadership style\n  When I examine the leadership tactics used by Genghis Khan\n  Then I should identify how his style influenced his followers and enemies\n\nScenario: Assess the role of Genghis Khan's military innovations\n  When I review the military strategies implemented by Genghis Khan\n  Then I should recognize the innovations that contributed to his success\n\nScenario: Understand the cultural integration under Genghis Khan's rule\n  When I investigate the policies Genghis Khan used to manage diverse cultures\n  Then I should see how these policies affected the stability of his empire\n\nScenario: Examine the legacy of Genghis Khan in modern times\n  When I explore the historical narratives about Genghis Khan\n  Then I should evaluate his lasting impact on contemporary societies\n\nScenario: Investigate the economic policies during Genghis Khan's reign\n  When I analyze the economic strategies employed by Genghis Khan\n  Then I should determine their effectiveness in sustaining his empire\n\nScenario: Explore the diplomatic relations established by Genghis Khan\n  When I look into the alliances and treaties formed by Genghis Khan\n  Then I should understand their role in expanding his influence\n\nScenario: Study the succession planning after Genghis Khan's death\n  When I review the succession plans put in place by Genghis Khan\n  Then I should assess their impact on the continuity of the Mongol Empire	2025-03-21 23:51:32.692718	f	f	\N	\N
90	Review Customer Feedback	As a Marketer\nI want to be able to view customer feedback on a dashboard\nSo I can make informed decisions for my customers	6	@reviewCustomerFeedback\nFeature: Review Customer Feedback\nAs a Marketer\nI want to be able to view customer feedback on a dashboard\nSo I can make informed decisions for my customers\n\nBackground:\n  Given I am logged in as a marketer\n  And I have access to the customer feedback dashboard\n\nScenario: Display feedback for a specific product\n  When I select a specific product\n  Then I should see all customer feedback related to that product\n\nScenario: Filter feedback by date range\n  When I apply a date range filter\n  Then I should see feedback submitted within that date range\n\nScenario: Analyze feedback sentiment\n  When I view the feedback sentiment analysis\n  Then I should see a summary of positive, neutral, and negative feedback\n\nScenario: Identify top customer concerns\n  When I review the feedback dashboard\n  Then I should see the top three concerns raised by customers\n\nScenario: Track feedback trends over time\n  When I view the feedback trend analysis\n  Then I should see a graphical representation of feedback trends over time\n\nScenario: Export feedback data for further analysis\n  When I choose to export the feedback data\n  Then I should receive a downloadable report of the feedback	2025-03-22 04:52:12.811051	f	f	\N	\N
91	How to Plant Snap Dragon	As a Gardener\nI want detail on how to grow Snap Dragon from seed to full grown\nSo I don't make any mistakes growing it	5	@howToPlantSnapDragon\nFeature: How to Plant Snap Dragon\nAs a Gardener\nI want detail on how to grow Snap Dragon from seed to full grown\nSo I don't make any mistakes growing it\n\nBackground:\n  Given I have a packet of Snap Dragon seeds\n  And I have access to a suitable gardening space\n\nScenario: Preparing the Soil for Snap Dragon\n  When I prepare the soil for planting\n  Then the soil should be well-drained and rich in organic matter\n\nScenario: Sowing Snap Dragon Seeds\n  When I sow the Snap Dragon seeds\n  Then the seeds should be planted 1/8 inch deep in the soil\n\nScenario: Watering Snap Dragon Plants\n  When I water the Snap Dragon plants\n  Then the soil should remain consistently moist but not waterlogged\n\nScenario: Providing Adequate Sunlight\n  When I ensure the Snap Dragon plants receive sunlight\n  Then the plants should receive at least 6 hours of sunlight daily\n\nScenario: Fertilizing Snap Dragon Plants\n  When I fertilize the Snap Dragon plants\n  Then a balanced fertilizer should be applied every 4-6 weeks	2025-03-22 05:29:46.7396	f	f	\N	\N
92	Deliver Food	As a Volunteer\nI want to support my community by providing my services\nSo people can have shelter and food	5	@deliverFood\nFeature: Deliver Food\nAs a Volunteer\nI want to support my community by providing my services\nSo people can have shelter and food\n\nBackground:\n  Given I am a registered volunteer\n  And I have access to the community service platform\n\nScenario: Deliver food to a registered family\n  When I receive a request from a registered family\n  Then I should confirm the delivery details\n  And ensure the food is delivered within the scheduled time\n\nScenario: Handle food delivery for an emergency case\n  When there is an emergency food request\n  Then I should prioritize the request\n  And ensure the food is delivered immediately\n\nScenario: Record delivery completion\n  When I complete a food delivery\n  Then I should update the delivery status\n  And notify the family of the successful delivery\n\nScenario: Manage food inventory for deliveries\n  When I check the food inventory\n  Then I should ensure there is sufficient stock for upcoming deliveries\n  And report any shortages to the supply manager\n\nScenario: Provide feedback on delivery process\n  When I finish a delivery\n  Then I should provide feedback on the delivery process\n  And suggest any improvements for future deliveries	2025-03-22 13:47:07.52176	f	f	\N	\N
93	Modify User	Given I am an admin\nI want to modify the user credentials\nSo it can be updated correctly	6	@modifyUser\nFeature: Modify User\nGiven I am an admin\nI want to modify the user credentials\nSo it can be updated correctly\n\nBackground:\n  Given I am logged in as an admin\n  And I have access to the user management system\n\nScenario: Update user email address\n  When I change the user's email address\n  Then the user's email address should be updated in the system\n  And a confirmation notification should be sent to the new email\n\nScenario: Modify user role\n  When I update the user's role\n  Then the user should have the new role permissions\n  And the change should be logged for auditing\n\nScenario: Deactivate a user account\n  When I deactivate a user account\n  Then the user should no longer have access to the system\n  And an email notification should be sent to the user about the deactivation\n\nScenario: Reset user password\n  When I reset the user's password\n  Then the user should receive a temporary password via email\n  And the user should be prompted to change the password on next login\n\nScenario: Update user contact information\n  When I update the user's contact information\n  Then the new contact information should be reflected in the user's profile\n  And the system should maintain a history of changes\n\nScenario: Reactivate a deactivated user account\n  When I reactivate a previously deactivated user account\n  Then the user should regain access to the system with previous permissions\n  And a reactivation confirmation should be sent to the user	2025-03-25 18:09:20.365543	f	f	\N	\N
94	Get Email from Critical Issues	As a Engineer\nI want to receive these emails at least once a day\nSo I can be aware of the issues my users have	8	@getEmailFromCriticalIssues\nFeature: Get Email from Critical Issues\nAs an Engineer\nI want to receive these emails at least once a day\nSo I can be aware of the issues my users have\n\nBackground:\n  Given I am logged in as an Engineer\n  And I have necessary permissions to receive critical issue emails\n\nScenario: Receive daily email summary of critical issues\n  When the system compiles critical issues\n  Then I should receive an email summary of these issues daily\n\nScenario: Email includes issue severity and impact\n  When a critical issue is identified\n  Then the email should include the severity and potential impact of the issue\n\nScenario: Email contains actionable insights\n  When a critical issue is reported\n  Then the email should provide actionable insights to resolve the issue\n\nScenario: Ensure email delivery even if no new issues\n  When there are no new critical issues\n  Then I should still receive a confirmation email indicating no new issues\n\nScenario: Email includes historical issue trends\n  When the system sends a critical issue email\n  Then it should include trends of similar past issues for context\n\nScenario: Email supports risk management\n  When a critical issue poses a significant risk\n  Then the email should highlight risk management strategies\n\nScenario: Email facilitates continuous improvement\n  When recurring issues are detected\n  Then the email should suggest continuous improvement actions\n\nScenario: Email aids in project management decisions\n  When critical issues affect project timelines\n  Then the email should provide information to aid project management decisions	2025-03-26 16:45:30.574193	f	f	\N	\N
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.session (sid, sess, expire) FROM stdin;
ufhDequHXPZFAXtkW2noi3PH3TmCJWwl	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-04-22T21:26:31.136Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"user":{"username":"admin","email":"admin@cucumber-gen.com"}}	2025-04-22 21:26:32
V5JOJbIf8eUElzsVPxCf1FPkNkX1U8_z	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-04-22T22:08:17.617Z","secure":false,"httpOnly":true,"domain":"localhost","path":"/","sameSite":"lax"},"user":{"username":"admin","email":"admin@cucumber-gen.com"}}	2025-04-22 22:08:18
L5WENEhOVu9kcuguQdoTSRjxLCtR2PcK	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-04-24T18:08:15.993Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":1}	2025-04-25 18:07:16
2aJ--NCm8mE8ptOnLlAd7I0WywVSh_Yb	{"cookie":{"originalMaxAge":2591999999,"expires":"2025-04-22T22:12:58.712Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":1,"user":{"username":"admin","email":"admin@cucumber-gen.com"}}	2025-04-24 03:24:50
yrj_wm7sq1c4Ez6pbrjFHw32rNv-6Da6	{"cookie":{"originalMaxAge":2592000000,"expires":"2025-04-25T00:35:03.545Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":1}	2025-04-25 18:32:37
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, email, password_hash, is_admin, created_at) FROM stdin;
2	davettran13@gmail.com	$2b$10$.8fpe2WFwQ8joeLxOVFzb.vcdMGzAScUMG5VWkUl1cyJrxxb5BFne	f	2025-03-11 03:52:47.56612
1	admin@cucumber-gen.com	$2b$10$J/HzC0ITYL86vef9kc0nfOfaAtN3vhyTsiqTdvYt1Ihy7Xn.ME2AG	t	2025-03-11 03:38:11.263478
3	admin@cucumber-gen.com	$2b$10$J/HzC0ITYL86vef9kc0nfOfaAtN3vhyTsiqTdvYt1Ihy7Xn.ME2AG	t	2025-03-17 03:32:07.338455
4	admin@cucumber-gen.com	$2b$10$J/HzC0ITYL86vef9kc0nfOfaAtN3vhyTsiqTdvYt1Ihy7Xn.ME2AG	t	2025-03-17 22:07:34.223045
\.


--
-- Name: analytics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.analytics_id_seq', 84, true);


--
-- Name: features_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.features_id_seq', 94, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.users_id_seq', 4, true);


--
-- Name: analytics analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.analytics
    ADD CONSTRAINT analytics_pkey PRIMARY KEY (id);


--
-- Name: features features_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.features
    ADD CONSTRAINT features_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: analytics analytics_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.analytics
    ADD CONSTRAINT analytics_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: features features_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.features
    ADD CONSTRAINT features_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

