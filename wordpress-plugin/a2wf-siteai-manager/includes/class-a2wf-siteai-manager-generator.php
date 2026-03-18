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
        $core = $settings['core'];
        $extensions = $settings['extensions'];

        $document = array(
            '@context' => 'https://schema.org',
            'specVersion' => '1.0',
            'identity' => array(
                '@type' => 'WebSite',
                'domain' => $core['identity']['domain'],
                'name' => $core['identity']['name'],
                'description' => $core['identity']['description'],
                'purpose' => $core['identity']['purpose'],
                'inLanguage' => $core['identity']['inLanguage'],
                'category' => $core['identity']['category'],
                'jurisdiction' => $core['identity']['jurisdiction'],
                'applicableLaw' => $core['identity']['applicableLaw'],
                'contact' => $core['identity']['contact'],
            ),
            'defaults' => $core['defaults'],
            'permissions' => array(
                'read' => $this->filter_permissions($core['permissions']['read']),
                'action' => $this->filter_permissions($core['permissions']['action']),
                'data' => $this->filter_permissions($core['permissions']['data']),
            ),
            'agentIdentification' => array(
                'requireUserAgent' => $core['agentIdentification']['requireUserAgent'],
                'requiredFields' => $core['agentIdentification']['requiredFields'],
                'allowAnonymousAgents' => $core['agentIdentification']['allowAnonymousAgents'],
            ),
            'scraping' => array(
                'bulkDataExtraction' => $core['scraping']['bulkDataExtraction'],
                'priceMonitoring' => $core['scraping']['priceMonitoring'],
                'contentReproduction' => $core['scraping']['contentReproduction'],
                'competitiveAnalysis' => $core['scraping']['competitiveAnalysis'],
                'trainingDataUsage' => $core['scraping']['trainingDataUsage'],
                'note' => $core['scraping']['note'],
            ),
            'humanVerification' => array(
                'methods' => $core['humanVerification']['methods'],
                'requiredFor' => $core['humanVerification']['requiredFor'],
                'note' => $core['humanVerification']['note'],
            ),
            'legal' => array(
                'termsUrl' => $core['legal']['termsUrl'],
                'complianceNote' => $core['legal']['complianceNote'],
                'dataRetention' => $core['legal']['dataRetention'],
                'euAiActCompliance' => $core['legal']['euAiActCompliance'],
            ),
            'discovery' => $core['discovery'],
            'metadata' => array(
                '$schema' => 'https://a2wf.org/schema/siteai-1.0.json',
                'schemaVersion' => '1.0',
                'generatedAt' => gmdate('c'),
                'author' => $core['metadata']['author'],
                'lastUpdated' => $core['metadata']['lastUpdated'],
                'expiresAt' => $core['metadata']['expiresAt'],
                'changelogUrl' => $core['metadata']['changelogUrl'],
            ),
        );

        $trustedAgents = $this->decode_json($core['agentIdentification']['trustedAgents']);
        $blockedAgents = $this->decode_json($core['agentIdentification']['blockedAgents']);
        if (! empty($trustedAgents)) {
            $document['agentIdentification']['trustedAgents'] = $trustedAgents;
        }
        if (! empty($blockedAgents)) {
            $document['agentIdentification']['blockedAgents'] = $blockedAgents;
        }

        if (! empty($extensions['enabled'])) {
            foreach (array(
                'keySections', 'mainContact', 'publisher', 'company', 'services', 'forms', 'apiEndpoints', 'search',
                'faq', 'navigation', 'ecommerce', 'media', 'careers', 'innovations', 'securityDefinitions', 'alternateVersions'
            ) as $field) {
                $decoded = $this->decode_json($extensions[$field]);
                if (null !== $decoded && '' !== $extensions[$field]) {
                    $document[$field] = $decoded;
                }
            }
        }

        return $this->clean_document($document);
    }

    public function get_pretty_json() {
        return wp_json_encode($this->generate_document(), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    private function filter_permissions($permissions) {
        $result = array();
        foreach ($permissions as $key => $permission) {
            $row = array('allowed' => ! empty($permission['allowed']));
            if ($permission['rateLimit'] !== '') {
                $row['rateLimit'] = (int) $permission['rateLimit'];
            }
            if (! empty($permission['humanVerification'])) {
                $row['humanVerification'] = true;
            }
            if (! empty($permission['note'])) {
                $row['note'] = $permission['note'];
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
