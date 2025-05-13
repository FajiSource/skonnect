-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 13, 2025 at 07:06 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `skonnect_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `accounts`
--

CREATE TABLE `accounts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `middle_name` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) NOT NULL,
  `gender` enum('male','female','rather not say') NOT NULL,
  `dob` date NOT NULL,
  `age` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `address` varchar(255) NOT NULL,
  `phone_number` varchar(255) NOT NULL,
  `baranggay` enum('Dela Paz','Manggahan','Maybunga','Pinagbuhatan','Rosario','San Miguel','Santa Lucia','Santolan') NOT NULL,
  `verification_status` enum('not_verified','verified') NOT NULL DEFAULT 'not_verified' COMMENT 'Account verification status',
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `profile_status` enum('not_profiled','profiled') NOT NULL DEFAULT 'not_profiled' COMMENT 'Status of account profiling',
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `announcements`
--

CREATE TABLE `announcements` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `visibility` enum('public','sk_only') NOT NULL DEFAULT 'public',
  `barangay` varchar(255) NOT NULL DEFAULT 'all',
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `is_archived` tinyint(1) NOT NULL DEFAULT 0,
  `archive_reason` varchar(255) DEFAULT NULL,
  `archived_at` timestamp NULL DEFAULT NULL,
  `skaccount_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `archived_events`
--

CREATE TABLE `archived_events` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `event_id` bigint(20) UNSIGNED NOT NULL,
  `archive_reason` text DEFAULT NULL,
  `archived_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `archived_profiles`
--

CREATE TABLE `archived_profiles` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `profile_id` bigint(20) UNSIGNED NOT NULL,
  `archive_reason` text DEFAULT NULL,
  `archived_date` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `authentication_logs`
--

CREATE TABLE `authentication_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `authenticator_id` bigint(20) UNSIGNED NOT NULL,
  `log_type` enum('authentication','deauthentication','bulk_authentication','bulk_deauthentication','note') NOT NULL DEFAULT 'authentication',
  `action` varchar(255) NOT NULL,
  `details` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `awards`
--

CREATE TABLE `awards` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `category` varchar(255) NOT NULL,
  `recipients` varchar(255) NOT NULL,
  `date_awarded` date NOT NULL,
  `main_image` varchar(255) NOT NULL,
  `gallery` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`gallery`)),
  `year` int(11) NOT NULL,
  `status` enum('published','archived') NOT NULL DEFAULT 'published',
  `sk_station` enum('Federation','Dela Paz','Manggahan','Maybunga','Pinagbuhatan','Rosario','San Miguel','Santa Lucia','Santolan') NOT NULL,
  `created_by` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `barangay_policies`
--

CREATE TABLE `barangay_policies` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `category` enum('Barangay Resolution') NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `year` int(11) NOT NULL,
  `barangay` varchar(255) NOT NULL,
  `archived` tinyint(1) NOT NULL DEFAULT 0,
  `archive_reason` text DEFAULT NULL,
  `archived_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `canned_responses`
--

CREATE TABLE `canned_responses` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `category` enum('greeting','inquiry','complaint','suggestion','technical','closing','other') NOT NULL,
  `created_by` bigint(20) UNSIGNED NOT NULL,
  `is_public` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chat_bot_responses`
--

CREATE TABLE `chat_bot_responses` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `trigger_keyword` varchar(255) NOT NULL,
  `response` text NOT NULL,
  `category` enum('faq','greeting','help','event','program','policy','contact','other') NOT NULL,
  `priority` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `chat_bot_responses`
--

INSERT INTO `chat_bot_responses` (`id`, `trigger_keyword`, `response`, `category`, `priority`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'hello,hi,hey,greetings,good morning,good afternoon,good evening', 'Hello! I\'m SK Assist, the virtual assistant for the Sangguniang Kabataan of Pasig City. How can I help you today?', 'greeting', 100, 1, '2025-05-12 21:05:46', '2025-05-12 21:05:46'),
(2, 'thank you,thanks,thank,appreciate', 'You\'re welcome! Is there anything else I can help you with?', 'greeting', 90, 1, '2025-05-12 21:05:46', '2025-05-12 21:05:46'),
(3, 'event,events,program,programs,activities,calendar', 'We have several youth programs and events coming up. You can check the calendar in the Programs & Events section for more details. Is there a specific type of event you\'re interested in?', 'event', 80, 1, '2025-05-12 21:05:46', '2025-05-12 21:05:46'),
(4, 'scholarship,school,education', 'The SK Scholarship Program provides financial assistance to deserving students. Applications typically open in April-May each year. Would you like specific information about eligibility requirements?', 'program', 75, 1, '2025-05-12 21:05:46', '2025-05-12 21:05:46'),
(5, 'help,assistance,support,problem', 'I\'m here to help! You can ask about SK programs, events, policies, or submit feedback. If you need to speak with an SK officer directly, please let me know what your concern is about.', 'help', 70, 1, '2025-05-12 21:05:46', '2025-05-12 21:05:46'),
(6, 'contact,phone,email,address,reach', 'You can contact the SK Federation Office at (02) 8643-1111 local 1700 or email sk@pasigcity.gov.ph. The office is located at the 7th Floor, Pasig City Hall, Caruncho Avenue, Pasig City.', 'contact', 65, 1, '2025-05-12 21:05:46', '2025-05-12 21:05:46'),
(7, 'policy,policies,resolution,ordinance', 'You can find all SK policies and resolutions in the Youth Development Policies section. If you\'re looking for a specific policy, please provide more details.', 'policy', 60, 1, '2025-05-12 21:05:46', '2025-05-12 21:05:46'),
(8, 'template,form,format,document', 'SK templates and forms are available in the Templates section. These include official forms, reports, and presentation templates. Do you need a specific type of document?', 'faq', 55, 1, '2025-05-12 21:05:46', '2025-05-12 21:05:46'),
(9, 'sk,sangguniang kabataan,what is,about', 'The Sangguniang Kabataan (SK) is the youth council in the Philippines, representing young people aged 15-24 in each barangay. It implements programs addressing youth concerns and promotes youth development through various initiatives.', 'faq', 50, 1, '2025-05-12 21:05:46', '2025-05-12 21:05:46'),
(10, 'age,requirement,qualify,join,member', 'To qualify for SK programs, you must be between 15-30 years old and a resident of Pasig City. Specific programs may have additional requirements. Would you like information about a particular program?', 'faq', 45, 1, '2025-05-12 21:05:46', '2025-05-12 21:05:46'),
(11, 'agent,human,person,officer,speak,talk,real person', 'I understand you\'d like to speak with an SK officer. Please describe your concern or question, and an available officer will respond as soon as possible.', 'other', 95, 1, '2025-05-12 21:05:46', '2025-05-12 21:05:46'),
(12, 'complain,complaint,report,issue,problem', 'I\'m sorry to hear you\'re experiencing an issue. To properly address your concern, please provide more details. An SK officer will review your complaint and respond shortly.', 'other', 40, 1, '2025-05-12 21:05:46', '2025-05-12 21:05:46'),
(13, 'suggestion,idea,propose,recommendation', 'Thank you for your interest in contributing ideas! We value your suggestions. Please share your recommendation, and an SK officer will review it soon.', 'other', 35, 1, '2025-05-12 21:05:46', '2025-05-12 21:05:46');

-- --------------------------------------------------------

--
-- Table structure for table `chat_conversations`
--

CREATE TABLE `chat_conversations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `account_id` bigint(20) UNSIGNED DEFAULT NULL,
  `is_anonymous` tinyint(1) NOT NULL DEFAULT 0,
  `status` enum('active','pending','resolved','closed') NOT NULL DEFAULT 'active',
  `category` enum('inquiry','complaint','suggestion','technical','other') NOT NULL DEFAULT 'inquiry',
  `subject` varchar(255) DEFAULT NULL,
  `assigned_sk_id` bigint(20) UNSIGNED DEFAULT NULL,
  `last_activity_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chat_messages`
--

CREATE TABLE `chat_messages` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `conversation_id` bigint(20) UNSIGNED NOT NULL,
  `message` text NOT NULL,
  `sender_type` enum('user','bot','agent') NOT NULL,
  `sender_id` bigint(20) UNSIGNED DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `attachments` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`attachments`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `directories`
--

CREATE TABLE `directories` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `role` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `category` varchar(255) NOT NULL,
  `created_by` bigint(20) UNSIGNED NOT NULL,
  `sk_station` enum('Federation','Dela Paz','Manggahan','Maybunga','Pinagbuhatan','Rosario','San Miguel','Santa Lucia','Santolan') NOT NULL,
  `status` enum('published','archived') NOT NULL DEFAULT 'published',
  `position_order` int(11) NOT NULL DEFAULT 999,
  `reports_to` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `eventmanage`
--

CREATE TABLE `eventmanage` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `event` varchar(255) NOT NULL,
  `timeframe` datetime NOT NULL,
  `location` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `created_on` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('ongoing','upcoming','completed') NOT NULL DEFAULT 'upcoming',
  `event_type` varchar(255) NOT NULL DEFAULT 'sk',
  `barangay` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `event_attendees`
--

CREATE TABLE `event_attendees` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `publish_event_id` bigint(20) UNSIGNED NOT NULL,
  `profile_id` bigint(20) UNSIGNED NOT NULL,
  `first_name` varchar(255) DEFAULT NULL,
  `middle_name` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `attendees_email` varchar(255) NOT NULL,
  `is_volunteer` enum('yes','no') NOT NULL DEFAULT 'no',
  `status` varchar(255) NOT NULL DEFAULT 'invited',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `feedback_analytics`
--

CREATE TABLE `feedback_analytics` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `metric_name` varchar(255) NOT NULL,
  `period` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`data`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '2025_03_28_091303_create_project_monitoring_table', 1),
(2, '2025_03_29_000001_create_publish_programs_table', 1),
(3, '2025_03_29_000002_create_program_applicants_table', 1),
(4, '2025_03_29_000004_create_eventmanage_table', 1),
(5, '2025_03_29_000005_create_publish_events_table', 1),
(6, '2025_04_23_050426_create_laravel_base_tables', 1),
(7, '2025_04_23_050456_create_accounts_base_tables', 1),
(8, '2025_04_24_022040_create_personal_access_tokens_table', 1),
(9, '2025_04_24_050744_create_verification_codes_table', 1),
(10, '2025_04_28_235827_create_profiles_table', 1),
(11, '2025_04_30_022603_create_archived_profiles_table', 1),
(12, '2025_05_01_114150_create_policy_table', 1),
(13, '2025_05_01_114229_create_barangay_policies_table', 1),
(14, '2025_05_03_040457_create_authentication_logs_table', 1),
(15, '2025_05_04_130903_create_templates_table', 1),
(16, '2025_05_05_003512_create_announcement_table', 1),
(17, '2025_05_08_022840_create_feedbacks_table', 1),
(18, '2025_05_08_111229_archived_event', 1),
(19, '2025_05_08_111801_eventattendees', 1),
(20, '2025_05_08_234807_add_event_type_to_eventmanage_table', 1),
(21, '2025_05_10_000000_create_registered_attendees_table', 1),
(22, '2025_05_10_000650_create_program_attendees_table', 1),
(23, '2025_05_10_092513_create_directories_table', 1),
(24, '2025_05_11_000000_add_attended_column_to_registered_attendees', 1),
(25, '2025_05_11_070107_create_awards_table', 1),
(26, '2025_05_12_000000_modify_attended_column_in_registered_attendees', 1),
(27, '2025_05_13_035624_create_prof_volunteer', 1);

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `policies`
--

CREATE TABLE `policies` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `category` enum('City Ordinance','City Resolution') NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `year` int(11) NOT NULL,
  `archived` tinyint(1) NOT NULL DEFAULT 0,
  `archive_reason` text DEFAULT NULL,
  `archived_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `profiles`
--

CREATE TABLE `profiles` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `account_id` bigint(20) UNSIGNED DEFAULT NULL,
  `first_name` varchar(255) NOT NULL,
  `middle_name` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) NOT NULL,
  `gender` varchar(255) NOT NULL,
  `birthdate` date NOT NULL,
  `age` int(11) NOT NULL,
  `address` varchar(255) NOT NULL,
  `barangay` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `phone_number` varchar(255) NOT NULL,
  `civil_status` varchar(255) NOT NULL,
  `youth_classification` varchar(255) NOT NULL,
  `youth_age_group` varchar(255) NOT NULL,
  `educational_background` varchar(255) NOT NULL,
  `work_status` varchar(255) NOT NULL,
  `sk_voter` varchar(255) NOT NULL,
  `national_voter` varchar(255) NOT NULL,
  `kk_assembly_attendance` varchar(255) NOT NULL,
  `did_vote_last_election` varchar(255) DEFAULT NULL,
  `kk_assembly_attendance_times` varchar(255) DEFAULT NULL,
  `reason_for_not_attending` varchar(255) DEFAULT NULL,
  `soloparent` varchar(255) DEFAULT NULL,
  `num_of_children` int(11) DEFAULT NULL,
  `pwd` varchar(255) DEFAULT NULL,
  `pwd_years` int(11) DEFAULT NULL,
  `athlete` varchar(255) DEFAULT NULL,
  `sport_name` varchar(255) DEFAULT NULL,
  `scholar` varchar(255) DEFAULT NULL,
  `pasigscholar` varchar(255) DEFAULT NULL,
  `scholarship_name` varchar(255) DEFAULT NULL,
  `studying_level` varchar(255) DEFAULT NULL,
  `yearlevel` varchar(255) DEFAULT NULL,
  `school_name` varchar(255) DEFAULT NULL,
  `working_status` varchar(255) DEFAULT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `position_name` varchar(255) DEFAULT NULL,
  `licensed_professional` varchar(255) DEFAULT NULL,
  `employment_yrs` int(11) DEFAULT NULL,
  `monthly_income` varchar(255) DEFAULT NULL,
  `youth_org` varchar(255) DEFAULT NULL,
  `org_name` varchar(255) DEFAULT NULL,
  `org_position` varchar(255) DEFAULT NULL,
  `lgbtqia_member` varchar(255) DEFAULT NULL,
  `osyranking` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `profvolunteer`
--

CREATE TABLE `profvolunteer` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `account_id` bigint(20) UNSIGNED NOT NULL,
  `is_volunteer` varchar(255) NOT NULL DEFAULT 'no',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `program_applicants`
--

CREATE TABLE `program_applicants` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `publish_program_id` bigint(20) UNSIGNED NOT NULL,
  `firstname` varchar(255) NOT NULL,
  `middlename` varchar(255) DEFAULT NULL,
  `lastname` varchar(255) NOT NULL,
  `barangay` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `program_attendees`
--

CREATE TABLE `program_attendees` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `publish_program_id` bigint(20) UNSIGNED NOT NULL,
  `account_id` bigint(20) UNSIGNED NOT NULL,
  `firstname` varchar(255) NOT NULL,
  `middlename` varchar(255) DEFAULT NULL,
  `lastname` varchar(255) NOT NULL,
  `barangay` varchar(255) NOT NULL,
  `reason_for_applying` text NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `project_monitoring`
--

CREATE TABLE `project_monitoring` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `ppas` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `expected_output` text NOT NULL,
  `performance_target` varchar(255) NOT NULL,
  `period_implementation_start` varchar(255) NOT NULL,
  `period_implementation_end` varchar(255) NOT NULL,
  `total_budget` decimal(10,2) NOT NULL,
  `person_responsible` varchar(255) NOT NULL,
  `center_of_participation` varchar(255) NOT NULL,
  `barangay` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `publish_events`
--

CREATE TABLE `publish_events` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `event_id` bigint(20) UNSIGNED NOT NULL,
  `selected_tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`selected_tags`)),
  `description` text DEFAULT NULL,
  `need_volunteers` enum('yes','no') NOT NULL DEFAULT 'no',
  `status` enum('ongoing','upcoming','completed') NOT NULL DEFAULT 'upcoming',
  `event_type` enum('sk','youth') DEFAULT 'sk',
  `barangay` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `publish_programs`
--

CREATE TABLE `publish_programs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `project_id` bigint(20) UNSIGNED NOT NULL,
  `barangay` varchar(255) NOT NULL,
  `time_start` datetime NOT NULL,
  `time_end` datetime NOT NULL,
  `description` text NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `registered_attendees`
--

CREATE TABLE `registered_attendees` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `publish_event_id` bigint(20) UNSIGNED NOT NULL,
  `account_id` bigint(20) UNSIGNED NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `middle_name` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) NOT NULL,
  `barangay` varchar(255) NOT NULL,
  `attendee_type` enum('participant','volunteer') NOT NULL,
  `attended` enum('yes','no') NOT NULL DEFAULT 'no',
  `eventmanage_id` bigint(20) UNSIGNED DEFAULT NULL,
  `event_name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `skaccounts`
--

CREATE TABLE `skaccounts` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `middle_name` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) NOT NULL,
  `gender` enum('male','female') NOT NULL,
  `birthdate` date NOT NULL,
  `age` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone_number` varchar(255) DEFAULT NULL,
  `address` varchar(255) NOT NULL,
  `sk_station` enum('Dela Paz','Manggahan','Maybunga','Pinagbuhatan','Rosario','San Miguel','Santa Lucia','Santolan') NOT NULL COMMENT 'Barangay where the SK officer is stationed',
  `sk_role` enum('Federasyon','Chairman','Kagawad') NOT NULL COMMENT 'Role in the Sangguniang Kabataan',
  `verification_status` enum('not_verified','verified') NOT NULL DEFAULT 'not_verified' COMMENT 'Account verification status',
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `authentication_status` enum('active','not_active') NOT NULL DEFAULT 'not_active' COMMENT 'Account authentication status',
  `authenticated_at` timestamp NULL DEFAULT NULL,
  `valid_id` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `templates`
--

CREATE TABLE `templates` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `category` enum('reports','forms','letters','budget','events') NOT NULL,
  `file_type` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `file_size` varchar(255) NOT NULL,
  `download_count` int(11) NOT NULL DEFAULT 0,
  `status` enum('active','archived') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `verification_codes`
--

CREATE TABLE `verification_codes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `email` varchar(255) NOT NULL,
  `code` varchar(255) NOT NULL,
  `type` enum('youth','sk','youth_reset','sk_reset','sk_2fa') NOT NULL COMMENT 'User type: youth or sk',
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `accounts`
--
ALTER TABLE `accounts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `accounts_email_unique` (`email`);

--
-- Indexes for table `announcements`
--
ALTER TABLE `announcements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `announcements_skaccount_id_foreign` (`skaccount_id`);

--
-- Indexes for table `archived_events`
--
ALTER TABLE `archived_events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `archived_events_event_id_foreign` (`event_id`);

--
-- Indexes for table `archived_profiles`
--
ALTER TABLE `archived_profiles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `archived_profiles_profile_id_foreign` (`profile_id`);

--
-- Indexes for table `authentication_logs`
--
ALTER TABLE `authentication_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `authentication_logs_user_id_foreign` (`user_id`),
  ADD KEY `authentication_logs_authenticator_id_foreign` (`authenticator_id`);

--
-- Indexes for table `awards`
--
ALTER TABLE `awards`
  ADD PRIMARY KEY (`id`),
  ADD KEY `awards_created_by_foreign` (`created_by`);

--
-- Indexes for table `barangay_policies`
--
ALTER TABLE `barangay_policies`
  ADD PRIMARY KEY (`id`),
  ADD KEY `barangay_policies_barangay_index` (`barangay`);

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `canned_responses`
--
ALTER TABLE `canned_responses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `canned_responses_created_by_foreign` (`created_by`);

--
-- Indexes for table `chat_bot_responses`
--
ALTER TABLE `chat_bot_responses`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `chat_conversations`
--
ALTER TABLE `chat_conversations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `chat_conversations_account_id_foreign` (`account_id`),
  ADD KEY `chat_conversations_assigned_sk_id_foreign` (`assigned_sk_id`);

--
-- Indexes for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `chat_messages_conversation_id_foreign` (`conversation_id`);

--
-- Indexes for table `directories`
--
ALTER TABLE `directories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `directories_created_by_foreign` (`created_by`);

--
-- Indexes for table `eventmanage`
--
ALTER TABLE `eventmanage`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `event_attendees`
--
ALTER TABLE `event_attendees`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `event_attendees_publish_event_id_profile_id_unique` (`publish_event_id`,`profile_id`),
  ADD KEY `event_attendees_profile_id_foreign` (`profile_id`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `feedback_analytics`
--
ALTER TABLE `feedback_analytics`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`);

--
-- Indexes for table `policies`
--
ALTER TABLE `policies`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `profiles`
--
ALTER TABLE `profiles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `profiles_email_unique` (`email`),
  ADD KEY `profiles_account_id_foreign` (`account_id`);

--
-- Indexes for table `profvolunteer`
--
ALTER TABLE `profvolunteer`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `profvolunteer_account_id_unique` (`account_id`);

--
-- Indexes for table `program_applicants`
--
ALTER TABLE `program_applicants`
  ADD PRIMARY KEY (`id`),
  ADD KEY `program_applicants_publish_program_id_foreign` (`publish_program_id`);

--
-- Indexes for table `program_attendees`
--
ALTER TABLE `program_attendees`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `program_attendees_publish_program_id_account_id_unique` (`publish_program_id`,`account_id`),
  ADD KEY `program_attendees_account_id_foreign` (`account_id`);

--
-- Indexes for table `project_monitoring`
--
ALTER TABLE `project_monitoring`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `publish_events`
--
ALTER TABLE `publish_events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `publish_events_event_id_foreign` (`event_id`);

--
-- Indexes for table `publish_programs`
--
ALTER TABLE `publish_programs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `publish_programs_project_id_foreign` (`project_id`);

--
-- Indexes for table `registered_attendees`
--
ALTER TABLE `registered_attendees`
  ADD PRIMARY KEY (`id`),
  ADD KEY `registered_attendees_publish_event_id_foreign` (`publish_event_id`),
  ADD KEY `registered_attendees_account_id_foreign` (`account_id`),
  ADD KEY `registered_attendees_eventmanage_id_foreign` (`eventmanage_id`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `skaccounts`
--
ALTER TABLE `skaccounts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `skaccounts_email_unique` (`email`);

--
-- Indexes for table `templates`
--
ALTER TABLE `templates`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`);

--
-- Indexes for table `verification_codes`
--
ALTER TABLE `verification_codes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `verification_codes_email_type_unique` (`email`,`type`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `accounts`
--
ALTER TABLE `accounts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `announcements`
--
ALTER TABLE `announcements`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `archived_events`
--
ALTER TABLE `archived_events`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `archived_profiles`
--
ALTER TABLE `archived_profiles`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `authentication_logs`
--
ALTER TABLE `authentication_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `awards`
--
ALTER TABLE `awards`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `barangay_policies`
--
ALTER TABLE `barangay_policies`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `canned_responses`
--
ALTER TABLE `canned_responses`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `chat_bot_responses`
--
ALTER TABLE `chat_bot_responses`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `chat_conversations`
--
ALTER TABLE `chat_conversations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `chat_messages`
--
ALTER TABLE `chat_messages`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `directories`
--
ALTER TABLE `directories`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `eventmanage`
--
ALTER TABLE `eventmanage`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `event_attendees`
--
ALTER TABLE `event_attendees`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `feedback_analytics`
--
ALTER TABLE `feedback_analytics`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `policies`
--
ALTER TABLE `policies`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `profiles`
--
ALTER TABLE `profiles`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `profvolunteer`
--
ALTER TABLE `profvolunteer`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `program_applicants`
--
ALTER TABLE `program_applicants`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `program_attendees`
--
ALTER TABLE `program_attendees`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `project_monitoring`
--
ALTER TABLE `project_monitoring`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `publish_events`
--
ALTER TABLE `publish_events`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `publish_programs`
--
ALTER TABLE `publish_programs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `registered_attendees`
--
ALTER TABLE `registered_attendees`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `skaccounts`
--
ALTER TABLE `skaccounts`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `templates`
--
ALTER TABLE `templates`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `verification_codes`
--
ALTER TABLE `verification_codes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `announcements`
--
ALTER TABLE `announcements`
  ADD CONSTRAINT `announcements_skaccount_id_foreign` FOREIGN KEY (`skaccount_id`) REFERENCES `skaccounts` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `archived_events`
--
ALTER TABLE `archived_events`
  ADD CONSTRAINT `archived_events_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `eventmanage` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `archived_profiles`
--
ALTER TABLE `archived_profiles`
  ADD CONSTRAINT `archived_profiles_profile_id_foreign` FOREIGN KEY (`profile_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `authentication_logs`
--
ALTER TABLE `authentication_logs`
  ADD CONSTRAINT `authentication_logs_authenticator_id_foreign` FOREIGN KEY (`authenticator_id`) REFERENCES `skaccounts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `authentication_logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `skaccounts` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `awards`
--
ALTER TABLE `awards`
  ADD CONSTRAINT `awards_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `skaccounts` (`id`);

--
-- Constraints for table `canned_responses`
--
ALTER TABLE `canned_responses`
  ADD CONSTRAINT `canned_responses_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `skaccounts` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `chat_conversations`
--
ALTER TABLE `chat_conversations`
  ADD CONSTRAINT `chat_conversations_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `chat_conversations_assigned_sk_id_foreign` FOREIGN KEY (`assigned_sk_id`) REFERENCES `skaccounts` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD CONSTRAINT `chat_messages_conversation_id_foreign` FOREIGN KEY (`conversation_id`) REFERENCES `chat_conversations` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `directories`
--
ALTER TABLE `directories`
  ADD CONSTRAINT `directories_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `skaccounts` (`id`);

--
-- Constraints for table `event_attendees`
--
ALTER TABLE `event_attendees`
  ADD CONSTRAINT `event_attendees_profile_id_foreign` FOREIGN KEY (`profile_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `event_attendees_publish_event_id_foreign` FOREIGN KEY (`publish_event_id`) REFERENCES `publish_events` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `profiles`
--
ALTER TABLE `profiles`
  ADD CONSTRAINT `profiles_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `profvolunteer`
--
ALTER TABLE `profvolunteer`
  ADD CONSTRAINT `profvolunteer_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `program_applicants`
--
ALTER TABLE `program_applicants`
  ADD CONSTRAINT `program_applicants_publish_program_id_foreign` FOREIGN KEY (`publish_program_id`) REFERENCES `publish_programs` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `program_attendees`
--
ALTER TABLE `program_attendees`
  ADD CONSTRAINT `program_attendees_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `program_attendees_publish_program_id_foreign` FOREIGN KEY (`publish_program_id`) REFERENCES `publish_programs` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `publish_events`
--
ALTER TABLE `publish_events`
  ADD CONSTRAINT `publish_events_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `eventmanage` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `publish_programs`
--
ALTER TABLE `publish_programs`
  ADD CONSTRAINT `publish_programs_project_id_foreign` FOREIGN KEY (`project_id`) REFERENCES `project_monitoring` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `registered_attendees`
--
ALTER TABLE `registered_attendees`
  ADD CONSTRAINT `registered_attendees_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `registered_attendees_eventmanage_id_foreign` FOREIGN KEY (`eventmanage_id`) REFERENCES `eventmanage` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `registered_attendees_publish_event_id_foreign` FOREIGN KEY (`publish_event_id`) REFERENCES `publish_events` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
