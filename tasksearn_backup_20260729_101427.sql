--
-- PostgreSQL database dump
--

\restrict Viy9T1dXeySdvph4zNSsSAbOtc84vsLO8sAzNytqXfQvPIAuHmlTBfmcB2h2rcH

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

-- Started on 2026-07-29 10:14:27 UTC

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

--
-- TOC entry 4 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- TOC entry 3679 (class 0 OID 0)
-- Dependencies: 4
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 237 (class 1259 OID 16623)
-- Name: admin_action_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_action_logs (
    id character varying(50) NOT NULL,
    admin_id character varying(50) NOT NULL,
    admin_name character varying(150) NOT NULL,
    action character varying(50) NOT NULL,
    target_user_id character varying(50) NOT NULL,
    target_user_name character varying(150) NOT NULL,
    target_user_email character varying(150) NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.admin_action_logs OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 16535)
-- Name: admin_commissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_commissions (
    id character varying(50) NOT NULL,
    type character varying(50) NOT NULL,
    amount numeric(15,2) NOT NULL,
    description character varying(500) NOT NULL,
    reference character varying(150) NOT NULL,
    user_id character varying(50),
    user_name character varying(150),
    related_transaction_ref character varying(100),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.admin_commissions OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 16584)
-- Name: admin_push_subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_push_subscriptions (
    id text NOT NULL,
    user_id text NOT NULL,
    endpoint text NOT NULL,
    p256dh_key text NOT NULL,
    auth_key text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.admin_push_subscriptions OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16434)
-- Name: announcements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.announcements (
    id character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    type character varying(50) DEFAULT 'info'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    enabled boolean DEFAULT true NOT NULL,
    dismissible boolean DEFAULT true NOT NULL,
    updated_at timestamp without time zone,
    link_url text,
    button_text text
);


ALTER TABLE public.announcements OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16443)
-- Name: banners; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.banners (
    id character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    image_url character varying(500) NOT NULL,
    link character varying(255),
    active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.banners OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 16632)
-- Name: broadcast_email_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.broadcast_email_logs (
    id integer NOT NULL,
    admin_id character varying(50) NOT NULL,
    subject text NOT NULL,
    target character varying(50) NOT NULL,
    total_recipients integer DEFAULT 0 NOT NULL,
    sent_count integer DEFAULT 0 NOT NULL,
    failed_count integer DEFAULT 0 NOT NULL,
    retried_count integer DEFAULT 0 NOT NULL,
    failed_emails jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    html_content text DEFAULT ''::text NOT NULL,
    sent_emails jsonb DEFAULT '[]'::jsonb NOT NULL,
    viewed boolean DEFAULT false NOT NULL,
    status character varying(20) DEFAULT 'Completed'::character varying NOT NULL
);


ALTER TABLE public.broadcast_email_logs OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 16631)
-- Name: broadcast_email_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.broadcast_email_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.broadcast_email_logs_id_seq OWNER TO postgres;

--
-- TOC entry 3680 (class 0 OID 0)
-- Dependencies: 238
-- Name: broadcast_email_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.broadcast_email_logs_id_seq OWNED BY public.broadcast_email_logs.id;


--
-- TOC entry 230 (class 1259 OID 16523)
-- Name: earner_notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.earner_notifications (
    id character varying(50) NOT NULL,
    earner_id character varying(50) NOT NULL,
    task_id character varying(50) NOT NULL,
    task_title character varying(500) NOT NULL,
    platform character varying(100) NOT NULL,
    category character varying(200) NOT NULL,
    reward numeric(10,2) DEFAULT 0 NOT NULL,
    message text NOT NULL,
    read boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.earner_notifications OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 16601)
-- Name: hidden_tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hidden_tasks (
    id text NOT NULL,
    earner_id text NOT NULL,
    task_id text NOT NULL,
    hidden_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.hidden_tasks OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 16567)
-- Name: notification_subscriptions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notification_subscriptions (
    id character varying(50) NOT NULL,
    user_id character varying(50) NOT NULL,
    endpoint text NOT NULL,
    p256dh_key text NOT NULL,
    auth_key text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notification_subscriptions OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 16513)
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id character varying(50) NOT NULL,
    type character varying(50) NOT NULL,
    message text NOT NULL,
    reference_id character varying(50) NOT NULL,
    dedupe_key character varying(150),
    earner_name character varying(150),
    task_title character varying(255),
    submitted_at timestamp without time zone,
    review_url text,
    read boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16493)
-- Name: owner_bank_accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.owner_bank_accounts (
    id character varying(50) NOT NULL,
    bank_name character varying(150) NOT NULL,
    account_number character varying(50) NOT NULL,
    account_name character varying(150) NOT NULL,
    is_default boolean DEFAULT false NOT NULL
);


ALTER TABLE public.owner_bank_accounts OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 16499)
-- Name: owner_withdrawals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.owner_withdrawals (
    id character varying(50) NOT NULL,
    amount numeric(15,2) NOT NULL,
    bank_account_id character varying(50) DEFAULT ''::character varying NOT NULL,
    bank_name character varying(150) DEFAULT ''::character varying NOT NULL,
    account_number character varying(50) DEFAULT ''::character varying NOT NULL,
    account_name character varying(150) DEFAULT ''::character varying NOT NULL,
    reference character varying(100) DEFAULT ''::character varying NOT NULL,
    status character varying(50) DEFAULT 'Pending'::character varying NOT NULL,
    submitted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.owner_withdrawals OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16451)
-- Name: pages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pages (
    id character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL
);


ALTER TABLE public.pages OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16428)
-- Name: referrals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.referrals (
    id character varying(50) NOT NULL,
    referrer_id character varying(50) NOT NULL,
    referee_id character varying(50) NOT NULL,
    referee_name character varying(150) NOT NULL,
    referee_email character varying(150) NOT NULL,
    reward_earned numeric(10,2) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.referrals OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16459)
-- Name: settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settings (
    id integer NOT NULL,
    platform_name character varying(100) DEFAULT 'TasksEarn'::character varying NOT NULL,
    referral_reward numeric(10,2) DEFAULT 0.00 NOT NULL,
    withdrawal_fee numeric(10,2) DEFAULT 50.00 NOT NULL,
    min_withdrawal numeric(10,2) DEFAULT 200.00 NOT NULL,
    min_deposit numeric(10,2) DEFAULT 100.00 NOT NULL,
    contact_email character varying(150) DEFAULT 'support@tasksearn.com'::character varying NOT NULL,
    contact_phone character varying(50) DEFAULT '09164444315'::character varying NOT NULL,
    telegram_channel character varying(255),
    whatsapp_group character varying(255),
    deposit_stat_offset numeric(12,2) DEFAULT 0.00 NOT NULL
);


ALTER TABLE public.settings OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16458)
-- Name: settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.settings_id_seq OWNER TO postgres;

--
-- TOC entry 3681 (class 0 OID 0)
-- Dependencies: 223
-- Name: settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.settings_id_seq OWNED BY public.settings.id;


--
-- TOC entry 226 (class 1259 OID 16480)
-- Name: social_platforms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.social_platforms (
    id character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    icon character varying(100) DEFAULT ''::character varying NOT NULL,
    logo_url text,
    description text,
    status character varying(20) DEFAULT 'Active'::character varying NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone
);


ALTER TABLE public.social_platforms OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 16650)
-- Name: staged_proofs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.staged_proofs (
    token text NOT NULL,
    user_id text NOT NULL,
    data_url text NOT NULL,
    expires_at timestamp with time zone NOT NULL
);


ALTER TABLE public.staged_proofs OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 16551)
-- Name: submission_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.submission_history (
    id character varying(50) NOT NULL,
    submission_id character varying(50) NOT NULL,
    task_id character varying(50) NOT NULL,
    task_title character varying(255) NOT NULL,
    earner_id character varying(50) NOT NULL,
    earner_name character varying(150) NOT NULL,
    event_type character varying(50) NOT NULL,
    feedback text,
    reviewed_by character varying(150),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.submission_history OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 16408)
-- Name: submissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.submissions (
    id character varying(50) NOT NULL,
    task_id character varying(50) NOT NULL,
    task_title character varying(255) NOT NULL,
    category character varying(100) NOT NULL,
    earner_id character varying(50) NOT NULL,
    earner_name character varying(150) NOT NULL,
    proof_text text NOT NULL,
    proof_screenshot text,
    status character varying(50) DEFAULT 'Pending'::character varying NOT NULL,
    feedback text,
    reward numeric(10,2) NOT NULL,
    approved_at timestamp without time zone,
    submitted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    rejected_at timestamp without time zone
);


ALTER TABLE public.submissions OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16475)
-- Name: task_pricing; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task_pricing (
    id character varying(50) NOT NULL,
    platform character varying(100) NOT NULL,
    cost_per_slot numeric(10,2) NOT NULL,
    earning_per_slot numeric(10,2) NOT NULL
);


ALTER TABLE public.task_pricing OWNER TO postgres;

--
-- TOC entry 216 (class 1259 OID 16398)
-- Name: tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tasks (
    id character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    category character varying(100) NOT NULL,
    proof_requirements text NOT NULL,
    link character varying(255) NOT NULL,
    cost_per_slot numeric(10,2) NOT NULL,
    earning_per_slot numeric(10,2) NOT NULL,
    total_slots integer NOT NULL,
    filled_slots integer DEFAULT 0 NOT NULL,
    status character varying(50) DEFAULT 'Active'::character varying NOT NULL,
    advertiser_id character varying(50) NOT NULL,
    advertiser_name character varying(150) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_admin_task boolean DEFAULT false NOT NULL
);


ALTER TABLE public.tasks OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 16417)
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions (
    id character varying(50) NOT NULL,
    user_id character varying(50) NOT NULL,
    user_name character varying(150) NOT NULL,
    user_role character varying(50) NOT NULL,
    amount numeric(15,2) NOT NULL,
    type character varying(50) NOT NULL,
    status character varying(50) DEFAULT 'Pending'::character varying NOT NULL,
    description character varying(500) NOT NULL,
    reference character varying(100) NOT NULL,
    gateway character varying(50),
    bank_details jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    paystack_transfer_ref character varying(150),
    rejection_reason text,
    withdrawal_fee numeric(10,2),
    completed_at timestamp with time zone,
    marked_by_admin_id character varying(50)
);


ALTER TABLE public.transactions OWNER TO postgres;

--
-- TOC entry 215 (class 1259 OID 16385)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id character varying(50) NOT NULL,
    name character varying(150) NOT NULL,
    email character varying(150) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(50) DEFAULT 'Earner'::character varying NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    wallet_balance numeric(15,2) DEFAULT 0.00 NOT NULL,
    referral_code character varying(50),
    referred_by character varying(50),
    verification_code character varying(10),
    verification_code_expires timestamp without time zone,
    verification_code_last_sent timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_activated boolean DEFAULT true NOT NULL,
    username character varying(100),
    phone character varying(30),
    country character varying(100),
    business_name character varying(200),
    photo_url text,
    two_factor_enabled boolean DEFAULT false NOT NULL,
    notification_prefs jsonb,
    is_banned boolean DEFAULT false NOT NULL,
    ad_balance numeric(15,2) DEFAULT 0.00 NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 16559)
-- Name: vapid_keys; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vapid_keys (
    key character varying(20) NOT NULL,
    value text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.vapid_keys OWNER TO postgres;

--
-- TOC entry 3417 (class 2604 OID 16635)
-- Name: broadcast_email_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.broadcast_email_logs ALTER COLUMN id SET DEFAULT nextval('public.broadcast_email_logs_id_seq'::regclass);


--
-- TOC entry 3380 (class 2604 OID 16462)
-- Name: settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings ALTER COLUMN id SET DEFAULT nextval('public.settings_id_seq'::regclass);


--
-- TOC entry 3670 (class 0 OID 16623)
-- Dependencies: 237
-- Data for Name: admin_action_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin_action_logs (id, admin_id, admin_name, action, target_user_id, target_user_name, target_user_email, notes, created_at) FROM stdin;
\.


--
-- TOC entry 3664 (class 0 OID 16535)
-- Dependencies: 231
-- Data for Name: admin_commissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin_commissions (id, type, amount, description, reference, user_id, user_name, related_transaction_ref, created_at) FROM stdin;
com-seed-sub-1	task_commission	5.00	Task commission: "YouTube Subscribe - TechNaija Channel" — Tunde Bakare	COMM-SEED-sub-1	u-earner-1	Tunde Bakare	sub-1	2026-07-27 06:01:10.825
\.


--
-- TOC entry 3668 (class 0 OID 16584)
-- Dependencies: 235
-- Data for Name: admin_push_subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin_push_subscriptions (id, user_id, endpoint, p256dh_key, auth_key, active, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3653 (class 0 OID 16434)
-- Dependencies: 220
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.announcements (id, title, content, type, created_at, enabled, dismissible, updated_at, link_url, button_text) FROM stdin;
ann-1	Welcome to TasksEarn Platform	Welcome Nigerians to the most trusted social media microtask exchange platform! Advertisers can publish tasks, and Earners can complete simple tasks and earn directly in Naira (₦) paid to their local bank accounts.	success	2026-07-19 06:01:10.83	t	t	\N	\N	\N
ann-2	Withdrawal Process Audits	Withdrawal requests are processed every Friday at 12:00 PM. Please ensure your submitted bank details are accurate and your name matches your verification profile to avoid rejections.	info	2026-07-27 06:01:10.83	t	t	\N	\N	\N
\.


--
-- TOC entry 3654 (class 0 OID 16443)
-- Dependencies: 221
-- Data for Name: banners; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.banners (id, title, image_url, link, active) FROM stdin;
ban-1	Boost Your Social Media Reach Instantly	https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=1200&auto=format&fit=crop&q=80	/advertiser/dashboard	t
ban-2	Earn Up to ₦5,000 Daily From Home	https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1200&auto=format&fit=crop&q=80	/dashboard	t
\.


--
-- TOC entry 3672 (class 0 OID 16632)
-- Dependencies: 239
-- Data for Name: broadcast_email_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.broadcast_email_logs (id, admin_id, subject, target, total_recipients, sent_count, failed_count, retried_count, failed_emails, created_at, html_content, sent_emails, viewed, status) FROM stdin;
\.


--
-- TOC entry 3663 (class 0 OID 16523)
-- Dependencies: 230
-- Data for Name: earner_notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.earner_notifications (id, earner_id, task_id, task_title, platform, category, reward, message, read, created_at) FROM stdin;
\.


--
-- TOC entry 3669 (class 0 OID 16601)
-- Dependencies: 236
-- Data for Name: hidden_tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hidden_tasks (id, earner_id, task_id, hidden_at) FROM stdin;
\.


--
-- TOC entry 3667 (class 0 OID 16567)
-- Dependencies: 234
-- Data for Name: notification_subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notification_subscriptions (id, user_id, endpoint, p256dh_key, auth_key, active, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3662 (class 0 OID 16513)
-- Dependencies: 229
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, type, message, reference_id, dedupe_key, earner_name, task_title, submitted_at, review_url, read, created_at) FROM stdin;
\.


--
-- TOC entry 3660 (class 0 OID 16493)
-- Dependencies: 227
-- Data for Name: owner_bank_accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.owner_bank_accounts (id, bank_name, account_number, account_name, is_default) FROM stdin;
\.


--
-- TOC entry 3661 (class 0 OID 16499)
-- Dependencies: 228
-- Data for Name: owner_withdrawals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.owner_withdrawals (id, amount, bank_account_id, bank_name, account_number, account_name, reference, status, submitted_at) FROM stdin;
\.


--
-- TOC entry 3655 (class 0 OID 16451)
-- Dependencies: 222
-- Data for Name: pages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pages (id, title, content) FROM stdin;
about	About TasksEarn	TasksEarn is Nigeria's premier microtask marketplace designed to bridge the gap between digital content advertisers and micro-job earners. Built to support digital marketers, small business owners, and online earners across Nigeria, we enable seamless social media engagements on platforms like Facebook, Instagram, TikTok, YouTube, WhatsApp, and Telegram.\n\nOur mission is to empower thousands of young Nigerians to monetize their spare social media screen-time, while providing advertisers with cost-effective, organic, and highly targeted growth.\n\nWhy Choose TasksEarn?\n- Instant Wallet Funding: Easily fund your advertising wallet using local cards, bank transfers, OPay, Moniepoint, and PalmPay.\n- Quality Auditing: Our advanced screenshot & link proof engine allows advertisers and administrators to verify proof with ultimate precision before release of payouts.\n- Swift Withdrawals: Withdraw your earnings straight into any Nigerian bank, with payouts processed seamlessly.\n- Robust Referral Network: Earn generous referral bonuses for every friend you introduce to the platform who completes tasks or creates campaigns.
contact	Contact Us	Have questions, disputes, or looking to discuss custom high-volume ad packages? Our friendly support team is here to assist you 24/7.\n\n- Email Support: support@tasksearn.com\n- Phone Contact: 09164444315\n- WhatsApp Support: 09164444315\n- Telegram Support: @TasksEarnSupport\n- Office Address: 12, Herbert Macaulay Way, Yaba, Lagos State, Nigeria.\n\nAlternatively, you can join our Telegram announcements channel and WhatsApp support chat using the quick links on your dashboard.
faq	Frequently Asked Questions	### 1. What is TasksEarn?\nTasksEarn is a digital engagement community where advertisers pay everyday social media users (Earners) to perform small online tasks such as liking a Facebook page, subscribing to a YouTube channel, following an Instagram profile, or joining a Telegram community.\n\n### 2. How much can I earn as an Earner?\nThere is no fixed limit! Your earnings depend on how many tasks you successfully complete. Tasks are rewarded between ₦10 and ₦500 depending on complexity. Active earners can withdraw thousands of Naira weekly.\n\n### 3. What is the minimum withdrawal and deposit?\n- Minimum Withdrawal: ₦2,000 (with a standard flat fee of ₦100 per transaction).\n- Minimum Deposit for Advertisers: ₦1,000.\n\n### 4. How long does deposit and withdrawal validation take?\n- Deposits via Paystack card payment are credited instantly. Bank transfer deposits are confirmed by our system inside 1 hour.\n- Withdrawals are processed on our payout cycles every week, usually within 24 to 48 hours of approval.\n\n### 5. Why was my task submission rejected?\nA submission is rejected if you did not follow the instructions, if you did not complete the social media action, or if you submitted fake/unrelated screenshots. Submitting fraudulent proofs repeatedly will lead to permanent account suspension.
terms	Terms of Service	Welcome to TasksEarn ("the Platform"). By registering an account and using our services, you agree to comply with and be bound by the following Terms and Conditions:\n\n1. Account Eligibility & Authenticity\n- You must be at least 18 years of age or have parental consent.\n- You are strictly prohibited from opening multiple Earner accounts. Users caught using bots, multi-accounts, or automation scripts to complete tasks will have all their accounts permanently terminated and wallets forfeited.\n\n2. Social Media Action Integrity\n- Once you complete a task (e.g., following a page or subscribing), you must maintain that follow/subscription for a minimum of 6 months.\n- Our automatic auditing crawlers periodically check for drop-offs. If you unsubscribe or unfollow, the system will retract the earnings and apply a penalty fee to your balance.\n\n3. Advertiser Refund Policy\n- Advertisers are purchasing real user actions. Once a task slot is completed and approved, payments are final and non-refundable.\n- If an advertiser terminates a campaign prematurely, any remaining unallocated funds for uncompleted slots will be instantly returned to their advertiser wallet.\n\n4. Platform Fees\n- TasksEarn reserves the right to charge transaction fees on deposits (payment gateway charge) and withdrawals (₦100 flat fee). Fees are clearly stated at checkout.
privacy	Privacy Policy	Your privacy is incredibly important to us at TasksEarn. This Privacy Policy outlines the types of personal information we collect and how we safeguard it:\n\n1. Information We Collect\n- Contact Details: Name, email address, telephone number, and Nigerian bank details (for withdrawal processing).\n- Verification Proofs: Text usernames, social media handle names, and screenshots submitted as proof of task completion.\n- Network Data: IP addresses and browser details to protect our community against automated bot attacks and multi-account fraud.\n\n2. How We Use Your Data\n- To manage your secure login, calculate referral bonuses, process deposits, and credit bank payouts.\n- Verification proofs are made visible ONLY to the advertiser of that specific campaign and the platform administrators for auditing purposes. We do not sell or trade your visual data to third parties.\n\n3. Cookies and Browser Cache\n- We use temporary cookies and local session identifiers to keep you logged in securely while navigating the app dashboard.
\.


--
-- TOC entry 3652 (class 0 OID 16428)
-- Dependencies: 219
-- Data for Name: referrals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.referrals (id, referrer_id, referee_id, referee_name, referee_email, reward_earned, created_at) FROM stdin;
ref-1	u-earner-1	u-referee-1	Sola Alabi	sola@example.com	0.00	2026-07-24 06:01:10.826
\.


--
-- TOC entry 3657 (class 0 OID 16459)
-- Dependencies: 224
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.settings (id, platform_name, referral_reward, withdrawal_fee, min_withdrawal, min_deposit, contact_email, contact_phone, telegram_channel, whatsapp_group, deposit_stat_offset) FROM stdin;
1	TasksEarn	0.00	50.00	200.00	100.00	support@tasksearn.com	09164444315	https://t.me/tasksearn_ng	https://wa.me/2349164444315	0.00
\.


--
-- TOC entry 3659 (class 0 OID 16480)
-- Dependencies: 226
-- Data for Name: social_platforms; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.social_platforms (id, name, icon, logo_url, description, status, sort_order, created_at, updated_at) FROM stdin;
plat-instagram	Instagram	Instagram	\N	Migrated automatically from default platform list.	Active	1	2026-07-29 06:01:10.848042	\N
plat-facebook	Facebook	Facebook	\N	Migrated automatically from default platform list.	Active	2	2026-07-29 06:01:10.854129	\N
plat-tiktok	TikTok	TikTok	\N	Migrated automatically from default platform list.	Active	3	2026-07-29 06:01:10.859445	\N
plat-youtube	YouTube	YouTube	\N	Migrated automatically from default platform list.	Active	4	2026-07-29 06:01:10.863413	\N
plat-x-twitter	X (Twitter)	X (Twitter)	\N	Migrated automatically from default platform list.	Active	5	2026-07-29 06:01:10.870308	\N
plat-telegram	Telegram	Telegram	\N	Migrated automatically from default platform list.	Active	6	2026-07-29 06:01:10.87721	\N
plat-whatsapp	WhatsApp	WhatsApp	\N	Migrated automatically from default platform list.	Active	7	2026-07-29 06:01:10.882032	\N
plat-snapchat	Snapchat	Snapchat	\N	Migrated automatically from default platform list.	Active	8	2026-07-29 06:01:10.890516	\N
plat-linkedin	LinkedIn	LinkedIn	\N	Migrated automatically from default platform list.	Active	9	2026-07-29 06:01:10.896307	\N
plat-threads	Threads	Threads	\N	Migrated automatically from default platform list.	Active	10	2026-07-29 06:01:10.900681	\N
plat-pinterest	Pinterest	Pinterest	\N	Migrated automatically from default platform list.	Active	11	2026-07-29 06:01:10.905293	\N
plat-reddit	Reddit	Reddit	\N	Migrated automatically from default platform list.	Active	12	2026-07-29 06:01:10.909707	\N
plat-discord	Discord	Discord	\N	Migrated automatically from default platform list.	Active	13	2026-07-29 06:01:10.914538	\N
plat-messenger-facebook-messenger	Messenger (Facebook Messenger)	Messenger (Facebook Messenger)	\N	Migrated automatically from default platform list.	Active	14	2026-07-29 06:01:10.919171	\N
plat-kwai	Kwai	Kwai	\N	Migrated automatically from default platform list.	Active	15	2026-07-29 06:01:10.924118	\N
plat-likee	Likee	Likee	\N	Migrated automatically from default platform list.	Active	16	2026-07-29 06:01:10.928272	\N
plat-custom-tasks	Custom Tasks	Custom Tasks	\N	Migrated automatically from default platform list.	Active	17	2026-07-29 06:01:10.935905	\N
\.


--
-- TOC entry 3673 (class 0 OID 16650)
-- Dependencies: 240
-- Data for Name: staged_proofs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.staged_proofs (token, user_id, data_url, expires_at) FROM stdin;
\.


--
-- TOC entry 3665 (class 0 OID 16551)
-- Dependencies: 232
-- Data for Name: submission_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.submission_history (id, submission_id, task_id, task_title, earner_id, earner_name, event_type, feedback, reviewed_by, created_at) FROM stdin;
\.


--
-- TOC entry 3650 (class 0 OID 16408)
-- Dependencies: 217
-- Data for Name: submissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.submissions (id, task_id, task_title, category, earner_id, earner_name, proof_text, proof_screenshot, status, feedback, reward, approved_at, submitted_at, rejected_at) FROM stdin;
sub-2	task-2	Instagram Follow @gossipmill_ng	Instagram Follow	u-earner-1	Tunde Bakare	Username: @tunde_bakare_official	https://images.unsplash.com/photo-1611224885990-ab7363d1f2a9?w=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3	Pending	\N	10.00	\N	2026-07-29 03:01:10.817	\N
sub-1	task-1	YouTube Subscribe - TechNaija Channel	YouTube Subscribe	u-earner-1	Tunde Bakare	My YouTube username: @tunde_tech_99	\N	Approved	\N	15.00	\N	2026-07-27 06:01:10.817	\N
\.


--
-- TOC entry 3658 (class 0 OID 16475)
-- Dependencies: 225
-- Data for Name: task_pricing; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.task_pricing (id, platform, cost_per_slot, earning_per_slot) FROM stdin;
prc-1	Instagram	20.00	13.00
prc-2	Facebook	20.00	13.00
prc-3	TikTok	25.00	17.00
prc-4	YouTube	30.00	20.00
prc-5	X (Twitter)	20.00	13.00
prc-6	Telegram	15.00	10.00
prc-7	WhatsApp	15.00	10.00
prc-8	Snapchat	25.00	17.00
prc-9	LinkedIn	30.00	20.00
prc-10	Threads	20.00	13.00
prc-11	Pinterest	20.00	13.00
prc-12	Reddit	25.00	17.00
prc-13	Discord	20.00	13.00
prc-14	Messenger (Facebook Messenger)	15.00	10.00
prc-15	Kwai	20.00	13.00
prc-16	Likee	20.00	13.00
prc-17	Custom Tasks	30.00	20.00
\.


--
-- TOC entry 3649 (class 0 OID 16398)
-- Dependencies: 216
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tasks (id, title, description, category, proof_requirements, link, cost_per_slot, earning_per_slot, total_slots, filled_slots, status, advertiser_id, advertiser_name, created_at, is_admin_task) FROM stdin;
task-1	YouTube Subscribe - TechNaija Channel	Go to the YouTube channel link, click Subscribe, and upload a screenshot proving you subscribed. No unsubscribing later, we audit accounts daily.	YouTube Subscribe	Your YouTube account username and a screenshot showing the Subscribe button clicked.	https://youtube.com/c/technaija	20.00	15.00	200	87	Active	u-advertiser-1	Chinedu Okafor	2026-07-26 06:01:10.816	f
task-2	Instagram Follow @gossipmill_ng	Follow GossipMill Nigeria on Instagram, like the latest 3 posts, and submit a screenshot showing the Followed status.	Instagram Follow	Your Instagram profile handle (@username) and follow screenshot.	https://instagram.com/gossipmill_ng	15.00	10.00	150	142	Active	u-advertiser-1	Chinedu Okafor	2026-07-25 06:01:10.816	f
task-3	Telegram Group Join - Crypto Signals NG	Join our active Telegram channel and group. Do not leave, users who leave will be permanently banned.	Telegram Join	Telegram username (e.g. @username) and screenshot showing you joined.	https://t.me/cryptosignalsng	18.00	12.00	100	98	Active	u-advertiser-1	Chinedu Okafor	2026-07-27 06:01:10.816	f
task-4	Facebook Follow - TasksEarn Platform	Follow our official Facebook page to stay updated on high-paying campaigns.	Facebook Follow	Your Facebook profile link or name, and follow screenshot.	https://facebook.com/tasksearn	15.00	10.00	500	500	Completed	u-admin-1	Super Admin	2026-07-21 06:01:10.816	f
\.


--
-- TOC entry 3651 (class 0 OID 16417)
-- Dependencies: 218
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transactions (id, user_id, user_name, user_role, amount, type, status, description, reference, gateway, bank_details, created_at, paystack_transfer_ref, rejection_reason, withdrawal_fee, completed_at, marked_by_admin_id) FROM stdin;
tx-1	u-advertiser-1	Chinedu Okafor	Advertiser	50000.00	Deposit	Success	Wallet Funding via Paystack Card Payment	T-PAYSTACK-5884930294	Paystack	\N	2026-07-14 06:01:10.811	\N	\N	\N	\N	\N
tx-2	u-advertiser-1	Chinedu Okafor	Advertiser	15000.00	Campaign Spend	Success	Created Campaign: YouTube Subscribe - TechNaija Channel	T-SPEND-992384910	\N	\N	2026-07-26 06:01:10.82	\N	\N	\N	\N	\N
tx-3	u-earner-1	Tunde Bakare	Earner	2500.00	Withdrawal	Pending	Withdrawal request to Guaranty Trust Bank (GTB)	W-GTB-48203949	\N	{"bankName": "Guaranty Trust Bank (GTB)", "accountName": "Tunde Bakare", "accountNumber": "0123456789"}	2026-07-28 06:01:10.82	\N	\N	\N	\N	\N
\.


--
-- TOC entry 3648 (class 0 OID 16385)
-- Dependencies: 215
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, password, role, is_verified, wallet_balance, referral_code, referred_by, verification_code, verification_code_expires, verification_code_last_sent, created_at, is_activated, username, phone, country, business_name, photo_url, two_factor_enabled, notification_prefs, is_banned, ad_balance) FROM stdin;
u-admin-1	Super Admin	admin@tasksearn.com	ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f	Admin	t	0.00	\N	\N	\N	\N	\N	2026-07-29 06:01:10.811	t	\N	\N	\N	\N	\N	f	\N	f	0.00
u-earner-1	Tunde Bakare	earner@tasksearn.com	ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f	User	t	2500.00	TUNDE887	\N	\N	\N	\N	2026-07-19 06:01:10.811	t	\N	\N	\N	\N	\N	f	\N	f	0.00
u-advertiser-1	Chinedu Okafor	advertiser@tasksearn.com	ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f	User	t	0.00	CHIN427	\N	\N	\N	\N	2026-07-14 06:01:10.811	t	\N	\N	\N	\N	\N	f	\N	f	35000.00
\.


--
-- TOC entry 3666 (class 0 OID 16559)
-- Dependencies: 233
-- Data for Name: vapid_keys; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vapid_keys (key, value, created_at) FROM stdin;
public	BIMIFtVug00CTesYrbP1kUu2EMphTKvJTna3ETSPmbEw-xpfSdaQoG8sdwnbaKzi6DdvoKG25yi0RIcyPi4GqC8	2026-07-29 06:01:10.941637
private	GxlB4b8f2swADjHThvnfUo19Y5sgkpyOtuvjKM1490w	2026-07-29 06:01:10.941637
\.


--
-- TOC entry 3682 (class 0 OID 0)
-- Dependencies: 238
-- Name: broadcast_email_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.broadcast_email_logs_id_seq', 1, false);


--
-- TOC entry 3683 (class 0 OID 0)
-- Dependencies: 223
-- Name: settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.settings_id_seq', 1, true);


--
-- TOC entry 3495 (class 2606 OID 16630)
-- Name: admin_action_logs admin_action_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_action_logs
    ADD CONSTRAINT admin_action_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 3475 (class 2606 OID 16542)
-- Name: admin_commissions admin_commissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_commissions
    ADD CONSTRAINT admin_commissions_pkey PRIMARY KEY (id);


--
-- TOC entry 3477 (class 2606 OID 16544)
-- Name: admin_commissions admin_commissions_reference_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_commissions
    ADD CONSTRAINT admin_commissions_reference_key UNIQUE (reference);


--
-- TOC entry 3487 (class 2606 OID 16593)
-- Name: admin_push_subscriptions admin_push_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_push_subscriptions
    ADD CONSTRAINT admin_push_subscriptions_pkey PRIMARY KEY (id);


--
-- TOC entry 3489 (class 2606 OID 16595)
-- Name: admin_push_subscriptions admin_push_subscriptions_user_id_endpoint_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_push_subscriptions
    ADD CONSTRAINT admin_push_subscriptions_user_id_endpoint_key UNIQUE (user_id, endpoint);


--
-- TOC entry 3449 (class 2606 OID 16442)
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- TOC entry 3451 (class 2606 OID 16450)
-- Name: banners banners_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.banners
    ADD CONSTRAINT banners_pkey PRIMARY KEY (id);


--
-- TOC entry 3497 (class 2606 OID 16645)
-- Name: broadcast_email_logs broadcast_email_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.broadcast_email_logs
    ADD CONSTRAINT broadcast_email_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 3470 (class 2606 OID 16534)
-- Name: earner_notifications earner_notifications_earner_id_task_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.earner_notifications
    ADD CONSTRAINT earner_notifications_earner_id_task_id_key UNIQUE (earner_id, task_id);


--
-- TOC entry 3472 (class 2606 OID 16532)
-- Name: earner_notifications earner_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.earner_notifications
    ADD CONSTRAINT earner_notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 3491 (class 2606 OID 16610)
-- Name: hidden_tasks hidden_tasks_earner_id_task_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hidden_tasks
    ADD CONSTRAINT hidden_tasks_earner_id_task_id_key UNIQUE (earner_id, task_id);


--
-- TOC entry 3493 (class 2606 OID 16608)
-- Name: hidden_tasks hidden_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hidden_tasks
    ADD CONSTRAINT hidden_tasks_pkey PRIMARY KEY (id);


--
-- TOC entry 3483 (class 2606 OID 16576)
-- Name: notification_subscriptions notification_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_subscriptions
    ADD CONSTRAINT notification_subscriptions_pkey PRIMARY KEY (id);


--
-- TOC entry 3485 (class 2606 OID 16578)
-- Name: notification_subscriptions notification_subscriptions_user_id_endpoint_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_subscriptions
    ADD CONSTRAINT notification_subscriptions_user_id_endpoint_key UNIQUE (user_id, endpoint);


--
-- TOC entry 3468 (class 2606 OID 16521)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 3463 (class 2606 OID 16498)
-- Name: owner_bank_accounts owner_bank_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.owner_bank_accounts
    ADD CONSTRAINT owner_bank_accounts_pkey PRIMARY KEY (id);


--
-- TOC entry 3465 (class 2606 OID 16512)
-- Name: owner_withdrawals owner_withdrawals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.owner_withdrawals
    ADD CONSTRAINT owner_withdrawals_pkey PRIMARY KEY (id);


--
-- TOC entry 3453 (class 2606 OID 16457)
-- Name: pages pages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pages
    ADD CONSTRAINT pages_pkey PRIMARY KEY (id);


--
-- TOC entry 3447 (class 2606 OID 16433)
-- Name: referrals referrals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);


--
-- TOC entry 3455 (class 2606 OID 16474)
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- TOC entry 3459 (class 2606 OID 16492)
-- Name: social_platforms social_platforms_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.social_platforms
    ADD CONSTRAINT social_platforms_name_key UNIQUE (name);


--
-- TOC entry 3461 (class 2606 OID 16490)
-- Name: social_platforms social_platforms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.social_platforms
    ADD CONSTRAINT social_platforms_pkey PRIMARY KEY (id);


--
-- TOC entry 3500 (class 2606 OID 16656)
-- Name: staged_proofs staged_proofs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.staged_proofs
    ADD CONSTRAINT staged_proofs_pkey PRIMARY KEY (token);


--
-- TOC entry 3479 (class 2606 OID 16558)
-- Name: submission_history submission_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submission_history
    ADD CONSTRAINT submission_history_pkey PRIMARY KEY (id);


--
-- TOC entry 3440 (class 2606 OID 16416)
-- Name: submissions submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_pkey PRIMARY KEY (id);


--
-- TOC entry 3457 (class 2606 OID 16479)
-- Name: task_pricing task_pricing_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_pricing
    ADD CONSTRAINT task_pricing_pkey PRIMARY KEY (id);


--
-- TOC entry 3434 (class 2606 OID 16407)
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- TOC entry 3443 (class 2606 OID 16425)
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- TOC entry 3445 (class 2606 OID 16427)
-- Name: transactions transactions_reference_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_reference_key UNIQUE (reference);


--
-- TOC entry 3429 (class 2606 OID 16397)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 3431 (class 2606 OID 16395)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3481 (class 2606 OID 16566)
-- Name: vapid_keys vapid_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vapid_keys
    ADD CONSTRAINT vapid_keys_pkey PRIMARY KEY (key);


--
-- TOC entry 3473 (class 1259 OID 16664)
-- Name: idx_earner_notif_earner_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_earner_notif_earner_id ON public.earner_notifications USING btree (earner_id);


--
-- TOC entry 3498 (class 1259 OID 16657)
-- Name: idx_staged_proofs_expires_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_staged_proofs_expires_at ON public.staged_proofs USING btree (expires_at);


--
-- TOC entry 3435 (class 1259 OID 16658)
-- Name: idx_submissions_earner_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_submissions_earner_id ON public.submissions USING btree (earner_id);


--
-- TOC entry 3436 (class 1259 OID 16661)
-- Name: idx_submissions_earner_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_submissions_earner_status ON public.submissions USING btree (earner_id, status);


--
-- TOC entry 3437 (class 1259 OID 16660)
-- Name: idx_submissions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_submissions_status ON public.submissions USING btree (status);


--
-- TOC entry 3438 (class 1259 OID 16659)
-- Name: idx_submissions_task_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_submissions_task_id ON public.submissions USING btree (task_id);


--
-- TOC entry 3432 (class 1259 OID 16662)
-- Name: idx_tasks_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_status ON public.tasks USING btree (status);


--
-- TOC entry 3441 (class 1259 OID 16663)
-- Name: idx_transactions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_transactions_user_id ON public.transactions USING btree (user_id);


--
-- TOC entry 3466 (class 1259 OID 16665)
-- Name: notifications_dedupe_key_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX notifications_dedupe_key_idx ON public.notifications USING btree (dedupe_key);


--
-- TOC entry 3502 (class 2606 OID 16596)
-- Name: admin_push_subscriptions admin_push_subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_push_subscriptions
    ADD CONSTRAINT admin_push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3503 (class 2606 OID 16611)
-- Name: hidden_tasks hidden_tasks_earner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hidden_tasks
    ADD CONSTRAINT hidden_tasks_earner_id_fkey FOREIGN KEY (earner_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 3504 (class 2606 OID 16616)
-- Name: hidden_tasks hidden_tasks_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hidden_tasks
    ADD CONSTRAINT hidden_tasks_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON DELETE CASCADE;


--
-- TOC entry 3501 (class 2606 OID 16579)
-- Name: notification_subscriptions notification_subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notification_subscriptions
    ADD CONSTRAINT notification_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


-- Completed on 2026-07-29 10:14:28 UTC

--
-- PostgreSQL database dump complete
--

\unrestrict Viy9T1dXeySdvph4zNSsSAbOtc84vsLO8sAzNytqXfQvPIAuHmlTBfmcB2h2rcH

