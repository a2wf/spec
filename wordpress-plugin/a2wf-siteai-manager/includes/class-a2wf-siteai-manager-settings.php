<?php

if (! defined('ABSPATH')) {
    exit;
}

class A2WF_SiteAI_Manager_Settings {
    const OPTION_KEY = 'a2wf_siteai_manager_settings';
    const NOTICE_TRANSIENT_KEY = 'a2wf_siteai_manager_admin_notice';

    private $last_errors = array();

    public function get_all() {
        $stored = get_option(self::OPTION_KEY, array());
        $defaults = $this->get_defaults();

        return $this->merge_recursive($defaults, is_array($stored) ? $stored : array());
    }

    public function update($data) {
        $sanitized = $this->sanitize($data);
        update_option(self::OPTION_KEY, $sanitized);

        return array(
            'settings' => $sanitized,
            'errors'   => $this->get_last_errors(),
        );
    }

    public function sanitize($data) {
        $this->last_errors = array();

        $defaults = $this->get_defaults();
        $data = is_array($data) ? $data : array();
        $merged = $this->merge_recursive($defaults, $data);

        $core = isset($merged['core']) && is_array($merged['core']) ? $merged['core'] : array();
        $extensions = isset($merged['extensions']) && is_array($merged['extensions']) ? $merged['extensions'] : array();

        $core['identity']['domain'] = $this->sanitize_url($core['identity']['domain'], home_url('/'));
        $core['identity']['name'] = sanitize_text_field($core['identity']['name']);
        $core['identity']['description'] = sanitize_textarea_field($core['identity']['description']);
        $core['identity']['purpose'] = sanitize_textarea_field($core['identity']['purpose']);
        $core['identity']['inLanguage'] = sanitize_text_field($core['identity']['inLanguage']);
        $core['identity']['category'] = sanitize_text_field($core['identity']['category']);
        $core['identity']['jurisdiction'] = sanitize_text_field($core['identity']['jurisdiction']);
        $core['identity']['contact'] = sanitize_email($core['identity']['contact']);
        $core['identity']['applicableLaw'] = $this->sanitize_lines($core['identity']['applicableLaw']);

        $core['defaults']['agentAccess'] = $this->sanitize_enum($core['defaults']['agentAccess'], array('open', 'restricted', 'closed'), 'restricted');
        $core['defaults']['requireIdentification'] = ! empty($core['defaults']['requireIdentification']);
        $core['defaults']['humanVerificationRequired'] = ! empty($core['defaults']['humanVerificationRequired']);
        $core['defaults']['respectRobotsTxt'] = ! empty($core['defaults']['respectRobotsTxt']);
        $core['defaults']['maxRequestsPerMinute'] = $this->sanitize_int($core['defaults']['maxRequestsPerMinute']);
        $core['defaults']['maxRequestsPerHour'] = $this->sanitize_int($core['defaults']['maxRequestsPerHour']);

        foreach (array('read', 'action', 'data') as $group) {
            if (! isset($core['permissions'][$group]) || ! is_array($core['permissions'][$group])) {
                $core['permissions'][$group] = array();
            }

            foreach ($core['permissions'][$group] as $key => $permission) {
                $core['permissions'][$group][$key] = array(
                    'allowed' => ! empty($permission['allowed']),
                    'rateLimit' => $this->sanitize_int(isset($permission['rateLimit']) ? $permission['rateLimit'] : ''),
                    'humanVerification' => ! empty($permission['humanVerification']),
                    'note' => sanitize_text_field(isset($permission['note']) ? $permission['note'] : ''),
                );
            }
        }

        $core['agentIdentification']['requireUserAgent'] = ! empty($core['agentIdentification']['requireUserAgent']);
        $core['agentIdentification']['allowAnonymousAgents'] = ! empty($core['agentIdentification']['allowAnonymousAgents']);
        $core['agentIdentification']['requiredFields'] = $this->sanitize_lines($core['agentIdentification']['requiredFields']);
        $core['agentIdentification']['trustedAgents'] = $this->sanitize_json_textarea($core['agentIdentification']['trustedAgents'], 'Trusted Agents');
        $core['agentIdentification']['blockedAgents'] = $this->sanitize_json_textarea($core['agentIdentification']['blockedAgents'], 'Blocked Agents');

        foreach (array('bulkDataExtraction', 'priceMonitoring', 'contentReproduction', 'competitiveAnalysis', 'trainingDataUsage') as $flag) {
            $core['scraping'][$flag] = ! empty($core['scraping'][$flag]);
        }
        $core['scraping']['note'] = sanitize_textarea_field($core['scraping']['note']);

        $core['humanVerification']['methods'] = $this->sanitize_lines($core['humanVerification']['methods']);
        $core['humanVerification']['requiredFor'] = $this->sanitize_lines($core['humanVerification']['requiredFor']);
        $core['humanVerification']['note'] = sanitize_textarea_field($core['humanVerification']['note']);

        $core['legal']['termsUrl'] = $this->sanitize_url($core['legal']['termsUrl']);
        $core['legal']['complianceNote'] = sanitize_textarea_field($core['legal']['complianceNote']);
        $core['legal']['dataRetention'] = sanitize_text_field($core['legal']['dataRetention']);
        $core['legal']['euAiActCompliance']['transparencyRequired'] = ! empty($core['legal']['euAiActCompliance']['transparencyRequired']);
        $core['legal']['euAiActCompliance']['riskClassification'] = $this->sanitize_enum(
            $core['legal']['euAiActCompliance']['riskClassification'],
            array('minimal', 'limited', 'high', 'unacceptable', 'unknown'),
            'limited'
        );
        $core['legal']['euAiActCompliance']['humanOversightMandatory'] = ! empty($core['legal']['euAiActCompliance']['humanOversightMandatory']);

        foreach (array('mcpEndpoint', 'a2aAgentCard', 'robotsTxt', 'llmsTxt', 'openApi') as $field) {
            $core['discovery'][$field] = $this->sanitize_url($core['discovery'][$field]);
        }
        $core['discovery']['schemaOrg'] = ! empty($core['discovery']['schemaOrg']);

        $core['metadata']['author'] = sanitize_text_field($core['metadata']['author']);
        $core['metadata']['lastUpdated'] = $this->sanitize_date_string($core['metadata']['lastUpdated']);
        $core['metadata']['expiresAt'] = $this->sanitize_datetime_string($core['metadata']['expiresAt']);
        $core['metadata']['changelogUrl'] = $this->sanitize_url($core['metadata']['changelogUrl']);

        $extensions['enabled'] = ! empty($extensions['enabled']);
        $extensions['keySections'] = $this->sanitize_json_textarea($extensions['keySections'], 'Key Sections');
        $extensions['mainContact'] = $this->sanitize_json_textarea($extensions['mainContact'], 'Main Contact');
        $extensions['publisher'] = $this->sanitize_json_textarea($extensions['publisher'], 'Publisher');
        $extensions['company'] = $this->sanitize_json_textarea($extensions['company'], 'Company');
        $extensions['services'] = $this->sanitize_json_textarea($extensions['services'], 'Services');
        $extensions['forms'] = $this->sanitize_json_textarea($extensions['forms'], 'Forms');
        $extensions['apiEndpoints'] = $this->sanitize_json_textarea($extensions['apiEndpoints'], 'API Endpoints');
        $extensions['search'] = $this->sanitize_json_textarea($extensions['search'], 'Search');
        $extensions['faq'] = $this->sanitize_json_textarea($extensions['faq'], 'FAQ');
        $extensions['navigation'] = $this->sanitize_json_textarea($extensions['navigation'], 'Navigation');
        $extensions['ecommerce'] = $this->sanitize_json_textarea($extensions['ecommerce'], 'Ecommerce');
        $extensions['media'] = $this->sanitize_json_textarea($extensions['media'], 'Media');
        $extensions['careers'] = $this->sanitize_json_textarea($extensions['careers'], 'Careers');
        $extensions['innovations'] = $this->sanitize_json_textarea($extensions['innovations'], 'Innovations');
        $extensions['securityDefinitions'] = $this->sanitize_json_textarea($extensions['securityDefinitions'], 'Security Definitions');
        $extensions['alternateVersions'] = $this->sanitize_json_textarea($extensions['alternateVersions'], 'Alternate Versions');

        return array(
            'core' => $core,
            'extensions' => $extensions,
        );
    }

    public function get_last_errors() {
        return $this->last_errors;
    }

    public function set_admin_notice($type, $message, $details = array()) {
        set_transient(
            self::NOTICE_TRANSIENT_KEY,
            array(
                'type'    => sanitize_key($type),
                'message' => sanitize_text_field($message),
                'details' => array_values(array_filter(array_map('sanitize_text_field', (array) $details))),
            ),
            MINUTE_IN_SECONDS
        );
    }

    public function get_admin_notice() {
        $notice = get_transient(self::NOTICE_TRANSIENT_KEY);
        if (false !== $notice) {
            delete_transient(self::NOTICE_TRANSIENT_KEY);
        }

        return is_array($notice) ? $notice : null;
    }

    public function get_defaults() {
        return array(
            'core' => array(
                'identity' => array(
                    'domain' => home_url('/'),
                    'name' => get_bloginfo('name'),
                    'description' => get_bloginfo('description'),
                    'purpose' => '',
                    'inLanguage' => get_locale(),
                    'category' => '',
                    'jurisdiction' => '',
                    'contact' => get_option('admin_email'),
                    'applicableLaw' => array(),
                ),
                'defaults' => array(
                    'agentAccess' => 'restricted',
                    'requireIdentification' => false,
                    'humanVerificationRequired' => false,
                    'maxRequestsPerMinute' => 30,
                    'maxRequestsPerHour' => '',
                    'respectRobotsTxt' => true,
                ),
                'permissions' => array(
                    'read' => array(
                        'productCatalog' => array('allowed' => false, 'rateLimit' => '', 'humanVerification' => false, 'note' => ''),
                        'pricing' => array('allowed' => false, 'rateLimit' => '', 'humanVerification' => false, 'note' => ''),
                        'availability' => array('allowed' => false, 'rateLimit' => '', 'humanVerification' => false, 'note' => ''),
                        'openingHours' => array('allowed' => false, 'rateLimit' => '', 'humanVerification' => false, 'note' => ''),
                        'contactInfo' => array('allowed' => true, 'rateLimit' => '', 'humanVerification' => false, 'note' => ''),
                        'reviews' => array('allowed' => false, 'rateLimit' => '', 'humanVerification' => false, 'note' => ''),
                        'faq' => array('allowed' => true, 'rateLimit' => '', 'humanVerification' => false, 'note' => ''),
                        'companyInfo' => array('allowed' => true, 'rateLimit' => '', 'humanVerification' => false, 'note' => ''),
                    ),
                    'action' => array(
                        'search' => array('allowed' => true, 'rateLimit' => 20, 'humanVerification' => false, 'note' => ''),
                        'addToCart' => array('allowed' => false, 'rateLimit' => '', 'humanVerification' => false, 'note' => ''),
                        'checkout' => array('allowed' => false, 'rateLimit' => '', 'humanVerification' => true, 'note' => ''),
                        'createAccount' => array('allowed' => false, 'rateLimit' => '', 'humanVerification' => false, 'note' => ''),
                        'submitReview' => array('allowed' => false, 'rateLimit' => '', 'humanVerification' => false, 'note' => ''),
                        'submitContactForm' => array('allowed' => false, 'rateLimit' => '', 'humanVerification' => false, 'note' => ''),
                        'bookAppointment' => array('allowed' => false, 'rateLimit' => '', 'humanVerification' => true, 'note' => ''),
                        'cancelOrder' => array('allowed' => false, 'rateLimit' => '', 'humanVerification' => false, 'note' => ''),
                        'requestRefund' => array('allowed' => false, 'rateLimit' => '', 'humanVerification' => false, 'note' => ''),
                    ),
                    'data' => array(
                        'customerRecords' => array('allowed' => false, 'rateLimit' => '', 'humanVerification' => false, 'note' => ''),
                        'orderHistory' => array('allowed' => false, 'rateLimit' => '', 'humanVerification' => false, 'note' => ''),
                        'paymentInfo' => array('allowed' => false, 'rateLimit' => '', 'humanVerification' => false, 'note' => ''),
                        'internalAnalytics' => array('allowed' => false, 'rateLimit' => '', 'humanVerification' => false, 'note' => ''),
                        'employeeData' => array('allowed' => false, 'rateLimit' => '', 'humanVerification' => false, 'note' => ''),
                    ),
                ),
                'agentIdentification' => array(
                    'requireUserAgent' => true,
                    'allowAnonymousAgents' => true,
                    'requiredFields' => array(),
                    'trustedAgents' => '',
                    'blockedAgents' => '',
                ),
                'scraping' => array(
                    'bulkDataExtraction' => false,
                    'priceMonitoring' => false,
                    'contentReproduction' => false,
                    'competitiveAnalysis' => false,
                    'trainingDataUsage' => false,
                    'note' => '',
                ),
                'humanVerification' => array(
                    'methods' => array('redirect-to-browser'),
                    'requiredFor' => array(),
                    'note' => '',
                ),
                'legal' => array(
                    'termsUrl' => '',
                    'complianceNote' => '',
                    'dataRetention' => '',
                    'euAiActCompliance' => array(
                        'transparencyRequired' => false,
                        'riskClassification' => 'limited',
                        'humanOversightMandatory' => false,
                    ),
                ),
                'discovery' => array(
                    'mcpEndpoint' => '',
                    'a2aAgentCard' => '',
                    'robotsTxt' => home_url('/robots.txt'),
                    'llmsTxt' => home_url('/llms.txt'),
                    'openApi' => '',
                    'schemaOrg' => true,
                ),
                'metadata' => array(
                    'author' => get_bloginfo('name'),
                    'lastUpdated' => gmdate('Y-m-d'),
                    'expiresAt' => '',
                    'changelogUrl' => '',
                ),
            ),
            'extensions' => array(
                'enabled' => false,
                'keySections' => "[\n  {\n    \"name\": \"Kontakt\",\n    \"entryPoint\": \"" . esc_url(home_url('/kontakt/')) . "\"\n  }\n]",
                'mainContact' => "{\n  \"@type\": \"ContactPoint\",\n  \"url\": \"" . esc_url(home_url('/kontakt/')) . "\",\n  \"contactType\": \"customer support\",\n  \"email\": \"" . sanitize_email(get_option('admin_email')) . "\"\n}",
                'publisher' => "{\n  \"@type\": \"Organization\",\n  \"name\": \"" . wp_strip_all_tags(get_bloginfo('name')) . "\",\n  \"url\": \"" . esc_url(home_url('/')) . "\"\n}",
                'company' => '',
                'services' => '',
                'forms' => '',
                'apiEndpoints' => '',
                'search' => '',
                'faq' => '',
                'navigation' => '',
                'ecommerce' => '',
                'media' => '',
                'careers' => '',
                'innovations' => '',
                'securityDefinitions' => '',
                'alternateVersions' => '',
            ),
        );
    }

    private function sanitize_lines($value) {
        if (is_array($value)) {
            $lines = $value;
        } else {
            $lines = preg_split('/\r\n|\r|\n/', (string) $value);
        }

        $lines = array_map('sanitize_text_field', $lines);
        $lines = array_values(array_filter(array_map('trim', $lines)));

        return $lines;
    }

    private function sanitize_json_textarea($value, $label = '') {
        if (! is_string($value)) {
            return '';
        }

        $value = trim($value);

        if ('' === $value) {
            return '';
        }

        $decoded = json_decode($value, true);
        if (JSON_ERROR_NONE !== json_last_error()) {
            $this->last_errors[] = $label ? sprintf('%s: ungültiges JSON verworfen.', $label) : 'Ungültiges JSON verworfen.';
            return '';
        }

        return wp_json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    private function sanitize_int($value) {
        if ($value === '' || $value === null) {
            return '';
        }

        return absint($value);
    }

    private function sanitize_enum($value, $allowed, $fallback) {
        $value = sanitize_key($value);

        return in_array($value, $allowed, true) ? $value : $fallback;
    }

    private function sanitize_url($value, $fallback = '') {
        $value = esc_url_raw($value);

        if ('' === $value) {
            return $fallback;
        }

        return $value;
    }

    private function sanitize_date_string($value) {
        $value = trim(sanitize_text_field($value));

        if ('' === $value) {
            return '';
        }

        $timestamp = strtotime($value);
        if (false === $timestamp) {
            return '';
        }

        return gmdate('Y-m-d', $timestamp);
    }

    private function sanitize_datetime_string($value) {
        $value = trim(sanitize_text_field($value));

        if ('' === $value) {
            return '';
        }

        $timestamp = strtotime($value);
        if (false === $timestamp) {
            return '';
        }

        return gmdate('c', $timestamp);
    }

    private function merge_recursive($defaults, $data) {
        foreach ($data as $key => $value) {
            if (is_array($value) && isset($defaults[$key]) && is_array($defaults[$key])) {
                $defaults[$key] = $this->merge_recursive($defaults[$key], $value);
            } else {
                $defaults[$key] = $value;
            }
        }

        return $defaults;
    }
}
