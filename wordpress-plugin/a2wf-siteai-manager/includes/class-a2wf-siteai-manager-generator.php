<?php

if (! defined('ABSPATH')) {
    exit;
}

class A2WF_SiteAI_Manager_Generator {
    private $settings;

    public function __construct($settings) {
        $this->settings = $settings;
    }

    public function generate_document() {
        $settings = $this->settings->get_all();
        $core = isset($settings['core']) && is_array($settings['core']) ? $settings['core'] : array();
        $extensions = isset($settings['extensions']) && is_array($settings['extensions']) ? $settings['extensions'] : array();

        $document = array(
            '@context' => 'https://schema.org',
            'specVersion' => '1.0',
            'identity' => array(
                '@type' => 'WebSite',
                'domain' => isset($core['identity']['domain']) ? $core['identity']['domain'] : '',
                'name' => isset($core['identity']['name']) ? $core['identity']['name'] : '',
                'description' => isset($core['identity']['description']) ? $core['identity']['description'] : '',
                'purpose' => isset($core['identity']['purpose']) ? $core['identity']['purpose'] : '',
                'inLanguage' => isset($core['identity']['inLanguage']) ? $core['identity']['inLanguage'] : '',
                'category' => isset($core['identity']['category']) ? $core['identity']['category'] : '',
                'jurisdiction' => isset($core['identity']['jurisdiction']) ? $core['identity']['jurisdiction'] : '',
                'applicableLaw' => isset($core['identity']['applicableLaw']) ? (array) $core['identity']['applicableLaw'] : array(),
                'contact' => isset($core['identity']['contact']) ? $core['identity']['contact'] : '',
            ),
            'defaults' => isset($core['defaults']) && is_array($core['defaults']) ? $core['defaults'] : array(),
            'permissions' => array(
                'read' => $this->filter_permissions(isset($core['permissions']['read']) ? $core['permissions']['read'] : array()),
                'action' => $this->filter_permissions(isset($core['permissions']['action']) ? $core['permissions']['action'] : array()),
                'data' => $this->filter_permissions(isset($core['permissions']['data']) ? $core['permissions']['data'] : array()),
            ),
            'agentIdentification' => array(
                'requireUserAgent' => ! empty($core['agentIdentification']['requireUserAgent']),
                'requiredFields' => isset($core['agentIdentification']['requiredFields']) ? (array) $core['agentIdentification']['requiredFields'] : array(),
                'allowAnonymousAgents' => ! empty($core['agentIdentification']['allowAnonymousAgents']),
            ),
            'scraping' => array(
                'bulkDataExtraction' => ! empty($core['scraping']['bulkDataExtraction']),
                'priceMonitoring' => ! empty($core['scraping']['priceMonitoring']),
                'contentReproduction' => ! empty($core['scraping']['contentReproduction']),
                'competitiveAnalysis' => ! empty($core['scraping']['competitiveAnalysis']),
                'trainingDataUsage' => ! empty($core['scraping']['trainingDataUsage']),
                'note' => isset($core['scraping']['note']) ? $core['scraping']['note'] : '',
            ),
            'humanVerification' => array(
                'methods' => isset($core['humanVerification']['methods']) ? (array) $core['humanVerification']['methods'] : array(),
                'requiredFor' => isset($core['humanVerification']['requiredFor']) ? (array) $core['humanVerification']['requiredFor'] : array(),
                'note' => isset($core['humanVerification']['note']) ? $core['humanVerification']['note'] : '',
            ),
            'legal' => array(
                'termsUrl' => isset($core['legal']['termsUrl']) ? $core['legal']['termsUrl'] : '',
                'complianceNote' => isset($core['legal']['complianceNote']) ? $core['legal']['complianceNote'] : '',
                'dataRetention' => isset($core['legal']['dataRetention']) ? $core['legal']['dataRetention'] : '',
                'euAiActCompliance' => isset($core['legal']['euAiActCompliance']) && is_array($core['legal']['euAiActCompliance']) ? $core['legal']['euAiActCompliance'] : array(),
            ),
            'discovery' => isset($core['discovery']) && is_array($core['discovery']) ? $core['discovery'] : array(),
            'metadata' => array(
                '$schema' => 'https://a2wf.org/schema/siteai-1.0.json',
                'schemaVersion' => '1.0',
                'generatedAt' => gmdate('c'),
                'author' => isset($core['metadata']['author']) ? $core['metadata']['author'] : '',
                'lastUpdated' => isset($core['metadata']['lastUpdated']) ? $core['metadata']['lastUpdated'] : '',
                'expiresAt' => isset($core['metadata']['expiresAt']) ? $core['metadata']['expiresAt'] : '',
                'changelogUrl' => isset($core['metadata']['changelogUrl']) ? $core['metadata']['changelogUrl'] : '',
            ),
        );

        $trusted_agents = $this->decode_json(isset($core['agentIdentification']['trustedAgents']) ? $core['agentIdentification']['trustedAgents'] : '');
        $blocked_agents = $this->decode_json(isset($core['agentIdentification']['blockedAgents']) ? $core['agentIdentification']['blockedAgents'] : '');

        if (! empty($trusted_agents)) {
            $document['agentIdentification']['trustedAgents'] = $trusted_agents;
        }

        if (! empty($blocked_agents)) {
            $document['agentIdentification']['blockedAgents'] = $blocked_agents;
        }

        if (! empty($extensions['enabled'])) {
            foreach (array(
                'keySections', 'mainContact', 'publisher', 'company', 'services', 'forms', 'apiEndpoints', 'search',
                'faq', 'navigation', 'ecommerce', 'media', 'careers', 'innovations', 'securityDefinitions', 'alternateVersions'
            ) as $field) {
                $raw_value = isset($extensions[$field]) ? $extensions[$field] : '';
                $decoded = $this->decode_json($raw_value);

                if (null !== $decoded && '' !== trim((string) $raw_value)) {
                    $document[$field] = $decoded;
                }
            }
        }

        return $this->clean_document($document);
    }

    public function get_pretty_json() {
        $json = wp_json_encode($this->generate_document(), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        return false === $json ? '{}' : $json;
    }

    private function filter_permissions($permissions) {
        $result = array();

        if (! is_array($permissions)) {
            return $result;
        }

        foreach ($permissions as $key => $permission) {
            if (! is_array($permission)) {
                continue;
            }

            $row = array('allowed' => ! empty($permission['allowed']));

            if (isset($permission['rateLimit']) && '' !== $permission['rateLimit']) {
                $row['rateLimit'] = (int) $permission['rateLimit'];
            }

            if (! empty($permission['humanVerification'])) {
                $row['humanVerification'] = true;
            }

            if (! empty($permission['note'])) {
                $row['note'] = (string) $permission['note'];
            }

            $result[$key] = $row;
        }

        return $result;
    }

    private function decode_json($value) {
        if (! is_string($value) || trim($value) === '') {
            return null;
        }

        $decoded = json_decode($value, true);
        if (JSON_ERROR_NONE !== json_last_error()) {
            return null;
        }

        return $decoded;
    }

    private function clean_document($value) {
        if (is_array($value)) {
            $is_assoc = $this->is_assoc($value);
            $clean = array();

            foreach ($value as $key => $item) {
                $item = $this->clean_document($item);

                if ($item === '' || $item === array() || $item === null) {
                    continue;
                }

                $clean[$key] = $item;
            }

            if (! $is_assoc) {
                $clean = array_values($clean);
            }

            return $clean;
        }

        return $value;
    }

    private function is_assoc($array) {
        if (! is_array($array)) {
            return false;
        }

        return array_keys($array) !== range(0, count($array) - 1);
    }
}
